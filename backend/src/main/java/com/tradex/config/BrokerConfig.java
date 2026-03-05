package com.tradex.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "broker")
public class BrokerConfig {

    private double commissionPerTrade = 1.50;
    private double feeRateBps = 1;
    private double baseSpreadBps = 8;
    private double baseSlippageBps = 2;
    private double randomSlippageBps = 4;
    private double sizeImpactBps = 0.3;
    private String marketDataMode = "replay";

    public double getCommissionPerTrade() { return commissionPerTrade; }
    public void setCommissionPerTrade(double v) { this.commissionPerTrade = v; }

    public double getFeeRateBps() { return feeRateBps; }
    public void setFeeRateBps(double v) { this.feeRateBps = v; }

    public double getBaseSpreadBps() { return baseSpreadBps; }
    public void setBaseSpreadBps(double v) { this.baseSpreadBps = v; }

    public double getBaseSlippageBps() { return baseSlippageBps; }
    public void setBaseSlippageBps(double v) { this.baseSlippageBps = v; }

    public double getRandomSlippageBps() { return randomSlippageBps; }
    public void setRandomSlippageBps(double v) { this.randomSlippageBps = v; }

    public double getSizeImpactBps() { return sizeImpactBps; }
    public void setSizeImpactBps(double v) { this.sizeImpactBps = v; }

    public String getMarketDataMode() { return marketDataMode; }
    public void setMarketDataMode(String v) { this.marketDataMode = v; }
}
