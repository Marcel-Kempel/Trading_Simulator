package com.tradex.model;

public class Quote {

    private String symbol;
    private double bid;
    private double ask;
    private double mid;
    private String ts;

    public Quote() {}

    public Quote(String symbol, double bid, double ask, double mid, String ts) {
        this.symbol = symbol;
        this.bid = bid;
        this.ask = ask;
        this.mid = mid;
        this.ts = ts;
    }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public double getBid() { return bid; }
    public void setBid(double bid) { this.bid = bid; }

    public double getAsk() { return ask; }
    public void setAsk(double ask) { this.ask = ask; }

    public double getMid() { return mid; }
    public void setMid(double mid) { this.mid = mid; }

    public String getTs() { return ts; }
    public void setTs(String ts) { this.ts = ts; }
}
