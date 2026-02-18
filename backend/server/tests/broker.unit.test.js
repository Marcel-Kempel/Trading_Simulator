import { describe, it, expect } from "vitest";
import { calculateMarginRequirements, calculatePositionPnl } from "../core/BrokerService.js";
import { createTestBroker } from "./testUtils.js";

describe("PnL calculations", () => {
  it("calculates unrealized PnL for long positions", () => {
    const result = calculatePositionPnl({ symbol: "AAPL", quantity: 10, avgPrice: 100 }, 110);
    expect(result.unrealizedPnl).toBe(100);
    expect(result.marketValue).toBe(1100);
  });

  it("calculates unrealized PnL for short positions", () => {
    const result = calculatePositionPnl({ symbol: "AAPL", quantity: -10, avgPrice: 100 }, 90);
    expect(result.unrealizedPnl).toBe(100);
    expect(result.marketValue).toBe(-900);
  });
});

describe("Margin requirements", () => {
  it("computes long/short initial and maintenance requirements", () => {
    const req = calculateMarginRequirements(
      {
        initialMarginLong: 0.5,
        initialMarginShort: 1.5,
        maintenanceMarginLong: 0.25,
        maintenanceMarginShort: 0.3,
      },
      10000,
      2000,
    );
    expect(req.initialRequired).toBe(8000);
    expect(req.maintenanceRequired).toBe(3100);
  });
});

describe("Execution engine behavior", () => {
  it("fills market orders and rejects invalid tif/type combos", async () => {
    const broker = createTestBroker();
    const account = broker.createAccount(50000);

    const filled = await broker.placeOrder(account.id, {
      symbol: "AAPL",
      type: "MARKET",
      side: "BUY",
      quantity: 10,
      tif: "DAY",
    });
    expect(filled.status).toBe("FILLED");
    expect(filled.fillPrice).toBeGreaterThan(0);

    const rejected = await broker.placeOrder(account.id, {
      symbol: "AAPL",
      type: "MARKET",
      side: "BUY",
      quantity: 1,
      tif: "GTC",
    });
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.reason).toContain("unsupported order type/tif");
  });

  it("handles limit/stop/stop-limit trigger rules", async () => {
    const broker = createTestBroker();
    const account = broker.createAccount(80000);
    const q = await broker.getQuote("AAPL");

    const limitOpen = await broker.placeOrder(account.id, {
      symbol: "AAPL",
      type: "LIMIT",
      side: "BUY",
      quantity: 5,
      limitPrice: q.mid * 0.7,
      tif: "DAY",
    });
    expect(limitOpen.status).toBe("OPEN");

    const limitFilled = await broker.placeOrder(account.id, {
      symbol: "AAPL",
      type: "LIMIT",
      side: "BUY",
      quantity: 5,
      limitPrice: q.mid * 1.1,
      tif: "DAY",
    });
    expect(limitFilled.status).toBe("FILLED");

    const stopTriggered = await broker.placeOrder(account.id, {
      symbol: "AAPL",
      type: "STOP",
      side: "BUY",
      quantity: 1,
      stopPrice: q.mid * 0.9,
      tif: "DAY",
    });
    expect(stopTriggered.status).toBe("FILLED");

    const stopLimitPending = await broker.placeOrder(account.id, {
      symbol: "AAPL",
      type: "STOP_LIMIT",
      side: "BUY",
      quantity: 1,
      stopPrice: q.mid * 0.8,
      limitPrice: q.mid * 0.7,
      tif: "DAY",
    });
    expect(stopLimitPending.status).toBe("OPEN");
  });

  it("supports short selling and buy to cover", async () => {
    const broker = createTestBroker();
    const account = broker.createAccount(120000);

    const shortOrder = await broker.placeOrder(account.id, {
      symbol: "TSLA",
      type: "MARKET",
      side: "SELL_SHORT",
      quantity: 20,
      tif: "DAY",
    });
    expect(shortOrder.status).toBe("FILLED");

    const positions = await broker.getPositions(account.id);
    const shortPos = positions.find((item) => item.symbol === "TSLA");
    expect(shortPos.quantity).toBeLessThan(0);

    const cover = await broker.placeOrder(account.id, {
      symbol: "TSLA",
      type: "MARKET",
      side: "BUY_TO_COVER",
      quantity: 20,
      tif: "DAY",
    });
    expect(cover.status).toBe("FILLED");
  });
});

describe("Settlement and cash availability", () => {
  it("moves buy cash from reserved to settled on settlement date", async () => {
    const broker = createTestBroker();
    const account = broker.createAccount(50000);
    const before = await broker.getAccount(account.id);

    const buy = await broker.placeOrder(account.id, {
      symbol: "AAPL",
      type: "MARKET",
      side: "BUY",
      quantity: 10,
      tif: "DAY",
    });
    expect(buy.status).toBe("FILLED");

    const mid = await broker.getAccount(account.id);
    expect(mid.balances.availableCash).toBeLessThan(before.balances.availableCash);
    expect(mid.balances.reservedCash).toBeGreaterThan(0);

    const internal = broker.accounts.get(account.id);
    internal.pendingSettlements.forEach((entry) => {
      entry.settleAt = new Date(Date.now() - 86400000).toISOString();
    });

    const after = await broker.getAccount(account.id);
    expect(after.balances.reservedCash).toBe(0);
    expect(after.balances.settledCash).toBeLessThan(before.balances.settledCash);
  });
});
