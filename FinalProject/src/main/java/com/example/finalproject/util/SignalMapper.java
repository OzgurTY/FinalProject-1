package com.example.finalproject.util;

import com.example.finalproject.dto.response.SignalResponse;
import com.example.finalproject.entity.SignalRecord;

public final class SignalMapper {
    private SignalMapper() {}

    public static SignalResponse toResponse(SignalRecord e) {
        return SignalResponse.builder()
            .id(e.getId())
            .symbol(e.getSymbol())
            .modelName(e.getModelName())
            .assetType(e.getAssetType())
            .signal(e.getSignal())
            .price(e.getPrice())
            .confidence(e.getConfidence())
            .ts(e.getTs())
            .build();
    }
}
