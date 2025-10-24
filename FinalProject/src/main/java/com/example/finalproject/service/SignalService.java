package com.example.finalproject.service;

import java.util.List;

import org.springframework.data.domain.Page;

import com.example.finalproject.dto.request.SignalQueryRequest;
import com.example.finalproject.dto.request.SummaryRequest;
import com.example.finalproject.dto.response.SignalResponse;
import com.example.finalproject.dto.response.SummaryBucket;

public interface SignalService {
    Page<SignalResponse> search(SignalQueryRequest req);

    List<String> distinctSymbols();
    List<String> distinctModels();
    List<SummaryBucket> summary(SummaryRequest req);
}
