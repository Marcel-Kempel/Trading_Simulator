package com.tradex.controller;

import com.tradex.model.Quote;
import com.tradex.service.BrokerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class MarketController {

    private final BrokerService brokerService;

    public MarketController(BrokerService brokerService) {
        this.brokerService = brokerService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @GetMapping("/symbols")
    public ResponseEntity<List<String>> getSymbols() {
        return ResponseEntity.ok(brokerService.getSymbols());
    }

    @GetMapping("/quotes")
    public ResponseEntity<?> getQuote(@RequestParam(required = false) String symbol) {
        if (symbol == null || symbol.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "symbol is required"));
        }
        try {
            Quote quote = brokerService.getQuote(symbol.toUpperCase());
            return ResponseEntity.ok(quote);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", "unknown symbol"));
        }
    }
}
