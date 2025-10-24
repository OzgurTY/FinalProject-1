package com.example.finalproject.entity;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@CompoundIndexes({
    @CompoundIndex(name = "sym_model_ts_idx", def = "{'symbol':1,'modelName':1,'ts':-1}")
})
@Document(collection = "signals")
public class SignalRecord {
    @Id
    private String id;

    @Indexed
    private String symbol; // Örn: XAUUSD, WTI, BRENT

    @Indexed
    private String modelName; // Örn: u-mamba, lstm-v2

    private AssetType assetType; // GOLD, OIL, SILVER...

    private SignalType signal; // BUY, SELL, HOLD

    private BigDecimal price; // opsiyonel

    private Double confidence; // opsiyonel [0..1]

    @Indexed
    private Instant ts;
}
