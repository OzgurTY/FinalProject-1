package com.example.finalproject.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SummaryBucket {
    private String bucket;
    private long buy;
    private long sell;
    private long hold;
    public long getNet() { return buy - sell; };
    public long getTotal() { return buy + sell + hold; }
}
