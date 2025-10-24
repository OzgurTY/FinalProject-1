package com.example.finalproject.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.domain.Sort;

@Configuration
@RequiredArgsConstructor
public class StartupMongoInitializer implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) {
        // DB zaten seçili (application.yml -> spring.data.mongodb.database)
        if (!mongoTemplate.collectionExists("signals")) {
            mongoTemplate.createCollection("signals");
        }
        // Index (koleksiyonu yoksa yaratılmasına da sebep olabilir)
        mongoTemplate.indexOps("signals").ensureIndex(
            new Index().on("symbol", Sort.Direction.ASC)
                       .on("modelName", Sort.Direction.ASC)
                       .on("ts", Sort.Direction.DESC)
                       .named("sym_model_ts_idx")
        );
    }
}
