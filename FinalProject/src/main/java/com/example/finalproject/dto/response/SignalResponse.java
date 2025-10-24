package com.example.finalproject.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

import com.example.finalproject.entity.AssetType;
import com.example.finalproject.entity.SignalType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SignalResponse {
    private String id;
    private String symbol;
    private String modelName;
    private AssetType assetType;
    private SignalType signal;
    private BigDecimal price;
    private Double confidence;
    private Instant ts;
}
