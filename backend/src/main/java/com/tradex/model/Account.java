package com.tradex.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Internal account entity holding all mutable trading state.
 * Not exposed directly via REST — AccountSummary is the DTO.
 */
public class Account {

    private String id;
    private double initialCapital;
    private double cashBalance;
    private String createdAt;

    private final List<PositionEntry> positions = new ArrayList<>();
    private final List<Order> orders = new ArrayList<>();
    private final List<Fill> fills = new ArrayList<>();

    public Account() {}

    public Account(String id, double initialCapital, String createdAt) {
        this.id = id;
        this.initialCapital = initialCapital;
        this.cashBalance = initialCapital;
        this.createdAt = createdAt;
    }

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public double getInitialCapital() { return initialCapital; }
    public void setInitialCapital(double initialCapital) { this.initialCapital = initialCapital; }

    public double getCashBalance() { return cashBalance; }
    public void setCashBalance(double cashBalance) { this.cashBalance = cashBalance; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public List<PositionEntry> getPositions() { return positions; }
    public List<Order> getOrders() { return orders; }
    public List<Fill> getFills() { return fills; }

    // ── Position helpers ──

    public int getPositionQty(String symbol) {
        return positions.stream()
                .filter(p -> p.getSymbol().equals(symbol))
                .mapToInt(PositionEntry::getQuantity)
                .sum();
    }

    public double getAvgCostBasis(String symbol) {
        int totalQty = 0;
        double totalCost = 0;
        for (PositionEntry p : positions) {
            if (p.getSymbol().equals(symbol)) {
                totalQty += p.getQuantity();
                totalCost += p.getQuantity() * p.getAvgPrice();
            }
        }
        return totalQty == 0 ? 0 : totalCost / totalQty;
    }

    public void updatePosition(String symbol, String side, int quantity, double price) {
        PositionEntry existing = positions.stream()
                .filter(p -> p.getSymbol().equals(symbol))
                .findFirst()
                .orElse(null);

        if ("BUY".equals(side)) {
            if (existing != null) {
                int totalQty = existing.getQuantity() + quantity;
                double newAvg = (existing.getQuantity() * existing.getAvgPrice() + quantity * price) / totalQty;
                existing.setAvgPrice(round4(newAvg));
                existing.setQuantity(totalQty);
            } else {
                positions.add(new PositionEntry(symbol, quantity, price));
            }
        } else {
            // SELL
            if (existing != null) {
                existing.setQuantity(existing.getQuantity() - quantity);
                if (existing.getQuantity() == 0) {
                    positions.removeIf(p -> p.getSymbol().equals(symbol));
                }
            }
        }
    }

    private static double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    /**
     * Internal position entry for tracking cost basis.
     */
    public static class PositionEntry {
        private String symbol;
        private int quantity;
        private double avgPrice;

        public PositionEntry() {}

        public PositionEntry(String symbol, int quantity, double avgPrice) {
            this.symbol = symbol;
            this.quantity = quantity;
            this.avgPrice = avgPrice;
        }

        public String getSymbol() { return symbol; }
        public void setSymbol(String s) { this.symbol = s; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int q) { this.quantity = q; }

        public double getAvgPrice() { return avgPrice; }
        public void setAvgPrice(double p) { this.avgPrice = p; }
    }
}
