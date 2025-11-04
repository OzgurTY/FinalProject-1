package com.example.finalproject.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.finalproject.dto.request.SignalQueryRequest;
import com.example.finalproject.dto.request.SummaryRequest;
import com.example.finalproject.dto.response.SignalResponse;
import com.example.finalproject.dto.response.SummaryBucket;
import com.example.finalproject.service.SignalService;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.RequestBody;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/signals")
@RequiredArgsConstructor
public class SignalController {
    private final SignalService signalService;

    @PostMapping("/search")
    @Operation(summary = "Filter and paginate signals")
    public Page<SignalResponse> search(@RequestBody SignalQueryRequest req) {
        return signalService.search(req);
    }

    @GetMapping("/health")
    public String health() { return "OK"; }

    @GetMapping("/symbols")
    public List<String> symbols() { return signalService.distinctSymbols(); }

    @GetMapping("/models")
    public List<String> models() { return signalService.distinctModels(); }

    @PostMapping("/summary")
    @Operation(summary = "Summary of BUY/SELL/HOLD based on selected dates")
    public List<SummaryBucket> summary(@RequestBody SummaryRequest req) {
        return signalService.summary(req);
    }
}
