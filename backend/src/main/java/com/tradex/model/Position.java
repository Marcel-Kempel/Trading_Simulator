package com.tradex.model;

public class Position {

    private String symbol;
    private int quantity;
    private double avgPrice;
    private double currentPrice;
    private double marketValue;
    private double unrealizedPnl;
    private String side;

    public Position() {}

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getAvgPrice() { return avgPrice; }
    public void setAvgPrice(double avgPrice) { this.avgPrice = avgPrice; }

    public double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(double currentPrice) { this.currentPrice = currentPrice; }

    public double getMarketValue() { return marketValue; }
    public void setMarketValue(double marketValue) { this.marketValue = marketValue; }

    public double getUnrealizedPnl() { return unrealizedPnl; }
    public void setUnrealizedPnl(double unrealizedPnl) { this.unrealizedPnl = unrealizedPnl; }

    public String getSide() { return side; }
    public void setSide(String side) { this.side = side; }
}
