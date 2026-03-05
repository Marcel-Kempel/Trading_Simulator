package com.tradex.model;

public class Fill {

    private String id;
    private String orderId;
    private String symbol;
    private String side;
    private int quantity;
    private double fillPrice;
    private double grossAmount;
    private double commission;
    private double fee;
    private double realizedPnl;
    private String filledAt;

    public Fill() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getSide() { return side; }
    public void setSide(String side) { this.side = side; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getFillPrice() { return fillPrice; }
    public void setFillPrice(double fillPrice) { this.fillPrice = fillPrice; }

    public double getGrossAmount() { return grossAmount; }
    public void setGrossAmount(double grossAmount) { this.grossAmount = grossAmount; }

    public double getCommission() { return commission; }
    public void setCommission(double commission) { this.commission = commission; }

    public double getFee() { return fee; }
    public void setFee(double fee) { this.fee = fee; }

    public double getRealizedPnl() { return realizedPnl; }
    public void setRealizedPnl(double realizedPnl) { this.realizedPnl = realizedPnl; }

    public String getFilledAt() { return filledAt; }
    public void setFilledAt(String filledAt) { this.filledAt = filledAt; }
}
