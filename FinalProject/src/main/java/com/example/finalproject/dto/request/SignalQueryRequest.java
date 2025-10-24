package com.example.finalproject.dto.request;

import lombok.Data;

@Data
public class SignalQueryRequest {
    private String symbol;
    private String modelName;
    private String from;
    private String to;
    private Integer page = 0;
    private Integer size = 50;
}
