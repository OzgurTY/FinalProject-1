package com.example.finalproject.dto.request;

import lombok.Data;

@Data
public class SummaryRequest {
    private String symbol;
    private String modelName;
    private String from;
    private String to;
    private String groupBy = "day";
}
