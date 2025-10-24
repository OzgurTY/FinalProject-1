package com.example.finalproject.service.impl;

import com.example.finalproject.dto.request.SignalQueryRequest;
import com.example.finalproject.dto.request.SummaryRequest;
import com.example.finalproject.dto.response.SignalResponse;
import com.example.finalproject.dto.response.SummaryBucket;
import com.example.finalproject.entity.SignalRecord;
import com.example.finalproject.repository.SignalRecordRepository;
import com.example.finalproject.service.SignalService;
import com.example.finalproject.util.SignalMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Service
@RequiredArgsConstructor
public class SignalServiceImpl implements SignalService {

    private final SignalRecordRepository repo;
    private final MongoTemplate mongoTemplate;

    @Override
    public Page<SignalResponse> search(SignalQueryRequest req) {

        Instant from = req.getFrom() != null ? Instant.parse(req.getFrom()) : Instant.EPOCH;
        Instant to   = req.getTo()   != null ? Instant.parse(req.getTo())   : Instant.now();

        int page = req.getPage() != null ? req.getPage() : 0;
        int size = req.getSize() != null ? req.getSize() : 50;

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ts"));

        Page<SignalRecord> result;

        boolean hasSymbol = req.getSymbol() != null && !req.getSymbol().isBlank();
        boolean hasModel  = req.getModelName() != null && !req.getModelName().isBlank();

        if (hasSymbol && hasModel) {
            result = repo.findBySymbolIgnoreCaseAndModelNameIgnoreCaseAndTsBetween(
                    req.getSymbol(), req.getModelName(), from, to, pageable
            );
        } else if (hasSymbol) {
            result = repo.findBySymbolIgnoreCaseAndTsBetween(req.getSymbol(), from, to, pageable);
        } else if (hasModel) {
            result = repo.findByModelNameIgnoreCaseAndTsBetween(req.getModelName(), from, to, pageable);
        } else {
            result = repo.findByTsBetween(from, to, pageable);
        }

        return result.map(SignalMapper::toResponse);
    }

    @Override
    public List<String> distinctSymbols() {
        return mongoTemplate.query(SignalRecord.class)
            .distinct("symbol").as(String.class).all()
            .stream().sorted(String::compareToIgnoreCase).toList();
    }

    @Override
    public List<String> distinctModels() {
        return mongoTemplate.query(SignalRecord.class)
            .distinct("modelName").as(String.class).all()
            .stream().sorted(String::compareToIgnoreCase).toList();
    }

    @Override
    public List<SummaryBucket> summary(SummaryRequest req) {

        Instant from = req.getFrom() != null ? Instant.parse(req.getFrom()) : Instant.EPOCH;
        Instant to   = req.getTo()   != null ? Instant.parse(req.getTo())   : Instant.now();

        List<AggregationOperation> ops = new ArrayList<>();

        // MATCH
        Criteria c = Criteria.where("ts").gte(from).lte(to);
        if (req.getSymbol() != null && !req.getSymbol().isBlank()) {
            c = c.and("symbol").regex("^" + req.getSymbol() + "$", "i");
        }
        if (req.getModelName() != null && !req.getModelName().isBlank()) {
            c = c.and("modelName").regex("^" + req.getModelName() + "$", "i");
        }
        ops.add(match(c));

        // GROUP KEY (UTC)
        String groupBy = req.getGroupBy() == null ? "day" : req.getGroupBy().toLowerCase();
        ProjectionOperation project;
        switch (groupBy) {
            case "month" -> {
                project = project()
                        .andExpression("{$dateToString: {format: '%Y-%m', date: '$ts', timezone: 'UTC'}}").as("bucket")
                        .andInclude("signal");
            }
            case "week" -> {
                // 2025-W42 formatı: concat(isoWeekYear, '-W', isoWeek)
                project = project()
                        .andExpression("""
                        {$concat: [
                            {$toString: {$isoWeekYear: "$ts"}},
                            "-W",
                            {$toString: {$isoWeek: "$ts"}}
                        ]}
                        """).as("bucket")
                        .andInclude("signal");
            }
            default -> { // day
                project = project()
                        .andExpression("{$dateToString: {format: '%Y-%m-%d', date: '$ts', timezone: 'UTC'}}").as("bucket")
                        .andInclude("signal");
            }
        }
        ops.add(project);

        // GROUP: buy/sell/hold say
        ops.add(group("bucket")
                .sum(ConditionalOperators.when(Criteria.where("signal").is("BUY")).then(1).otherwise(0)).as("buy")
                .sum(ConditionalOperators.when(Criteria.where("signal").is("SELL")).then(1).otherwise(0)).as("sell")
                .sum(ConditionalOperators.when(Criteria.where("signal").is("HOLD")).then(1).otherwise(0)).as("hold")
        );

        // SORT by bucket
        ops.add(sort(Sort.by("_id").ascending()));

        Aggregation agg = newAggregation(ops);
        AggregationResults<org.bson.Document> res =
                mongoTemplate.aggregate(agg, "signals", org.bson.Document.class);

        // Map to DTO
        return res.getMappedResults().stream().map(d ->
                SummaryBucket.builder()
                        .bucket(d.getString("_id"))
                        .buy(((Number) d.get("buy")).longValue())
                        .sell(((Number) d.get("sell")).longValue())
                        .hold(((Number) d.get("hold")).longValue())
                        .build()
        ).toList();
    }

}
