package com.tradex.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradex.model.Quote;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class ReplayMarketDataService implements MarketDataService {

    private final Map<String, List<QuoteEntry>> dataset;
    private final Map<String, Integer> cursors = new ConcurrentHashMap<>();
    private final double baseSpreadBps;

    public ReplayMarketDataService(double baseSpreadBps) {
        this.baseSpreadBps = baseSpreadBps;
        this.dataset = loadDataset();
    }

    private Map<String, List<QuoteEntry>> loadDataset() {
        try {
            InputStream is = new ClassPathResource("replay-quotes.json").getInputStream();
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(is, new TypeReference<>() {});
        } catch (IOException e) {
            throw new RuntimeException("Failed to load replay-quotes.json", e);
        }
    }

    @Override
    public List<String> getSymbols() {
        return new ArrayList<>(dataset.keySet());
    }

    @Override
    public Quote getQuote(String symbol) {
        String upper = symbol.toUpperCase();
        List<QuoteEntry> entries = dataset.get(upper);
        if (entries == null || entries.isEmpty()) {
            throw new IllegalArgumentException("unknown_symbol: " + upper);
        }

        int cursor = cursors.getOrDefault(upper, 0);
        QuoteEntry entry = entries.get(cursor % entries.size());
        cursors.put(upper, cursor + 1);

        double mid = entry.price;
        double halfSpread = mid * (baseSpreadBps / 10000.0 / 2.0);

        return new Quote(
                upper,
                round4(mid - halfSpread),
                round4(mid + halfSpread),
                round4(mid),
                entry.ts != null ? entry.ts : new Date().toString()
        );
    }

    @Override
    public double peekPrice(String symbol) {
        String upper = symbol.toUpperCase();
        List<QuoteEntry> entries = dataset.get(upper);
        if (entries == null || entries.isEmpty()) {
            throw new IllegalArgumentException("unknown_symbol: " + upper);
        }
        int cursor = cursors.getOrDefault(upper, 0);
        return entries.get(cursor % entries.size()).price;
    }

    private static double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    /** Inner class matching the JSON structure */
    public static class QuoteEntry {
        public double price;
        public String ts;
    }
}
