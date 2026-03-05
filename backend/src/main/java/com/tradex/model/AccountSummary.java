package com.tradex.model;

public class AccountSummary {

    private String id;
    private double initialCapital;
    private double cashBalance;
    private double equity;
    private double unrealizedPnl;
    private double realizedPnl;
    private double totalFees;
    private int positionCount;
    private String createdAt;

    public AccountSummary() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public double getInitialCapital() { return initialCapital; }
    public void setInitialCapital(double initialCapital) { this.initialCapital = initialCapital; }

    public double getCashBalance() { return cashBalance; }
    public void setCashBalance(double cashBalance) { this.cashBalance = cashBalance; }

    public double getEquity() { return equity; }
    public void setEquity(double equity) { this.equity = equity; }

    public double getUnrealizedPnl() { return unrealizedPnl; }
    public void setUnrealizedPnl(double unrealizedPnl) { this.unrealizedPnl = unrealizedPnl; }

    public double getRealizedPnl() { return realizedPnl; }
    public void setRealizedPnl(double realizedPnl) { this.realizedPnl = realizedPnl; }

    public double getTotalFees() { return totalFees; }
    public void setTotalFees(double totalFees) { this.totalFees = totalFees; }

    public int getPositionCount() { return positionCount; }
    public void setPositionCount(int positionCount) { this.positionCount = positionCount; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
