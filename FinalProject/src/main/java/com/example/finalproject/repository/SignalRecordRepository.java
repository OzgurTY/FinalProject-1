package com.example.finalproject.repository;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.finalproject.entity.SignalRecord;

public interface SignalRecordRepository extends MongoRepository<SignalRecord, String> {
    Page<SignalRecord> findBySymbolIgnoreCaseAndModelNameIgnoreCaseAndTsBetween(
        String symbol, String modelName, Instant from, Instant to, Pageable pageable);

    Page<SignalRecord> findBySymbolIgnoreCaseAndTsBetween(
        String symbol, Instant from, Instant to, Pageable pageable);

    Page<SignalRecord> findByModelNameIgnoreCaseAndTsBetween(
        String modelName, Instant from, Instant to, Pageable pageable);

    Page<SignalRecord> findByTsBetween(Instant from, Instant to, Pageable pageable);
}
