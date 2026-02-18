import request from "supertest";
import { describe, it, expect } from "vitest";
import { createApp } from "../app.js";
import { createTestBroker } from "./testUtils.js";

describe("Broker API integration", () => {
  it("creates account and executes happy path order flow", async () => {
    const broker = createTestBroker();
    const app = createApp({ brokerService: broker });

    const createRes = await request(app).post("/accounts").send({ initialCapital: 100000 });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const health = await request(app).get("/actuator/health");
    expect(health.status).toBe(200);
    expect(health.body.status).toBe("UP");

    const quote = await request(app).get("/quotes").query({ symbol: "AAPL" });
    expect(quote.status).toBe(200);
    expect(quote.body.symbol).toBe("AAPL");

    const orderRes = await request(app).post(`/accounts/${id}/orders`).send({
      symbol: "AAPL",
      type: "MARKET",
      side: "BUY",
      quantity: 5,
      tif: "DAY",
    });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.status).toBe("FILLED");

    const accountRes = await request(app).get(`/accounts/${id}`);
    expect(accountRes.status).toBe(200);
    expect(accountRes.body.balances).toHaveProperty("settledCash");
    expect(accountRes.body.margin).toHaveProperty("maintenanceRequired");

    const fillsRes = await request(app).get(`/accounts/${id}/fills`);
    expect(fillsRes.status).toBe(200);
    expect(Array.isArray(fillsRes.body)).toBe(true);
    expect(fillsRes.body.length).toBeGreaterThan(0);
  });

  it("returns broker-like reject reasons", async () => {
    const broker = createTestBroker();
    const app = createApp({ brokerService: broker });
    const createRes = await request(app).post("/accounts").send({ initialCapital: 500 });
    const id = createRes.body.id;

    const badQty = await request(app).post(`/accounts/${id}/orders`).send({
      symbol: "AAPL",
      type: "MARKET",
      side: "BUY",
      quantity: 0,
      tif: "DAY",
    });
    expect(badQty.status).toBe(400);
    expect(badQty.body.reason).toContain("invalid quantity");

    const unknownSymbol = await request(app).post(`/accounts/${id}/orders`).send({
      symbol: "UNKNOWN",
      type: "MARKET",
      side: "BUY",
      quantity: 1,
      tif: "DAY",
    });
    expect(unknownSymbol.status).toBe(400);
    expect(unknownSymbol.body.reason).toContain("unknown symbol");

    const buyingPower = await request(app).post(`/accounts/${id}/orders`).send({
      symbol: "AAPL",
      type: "MARKET",
      side: "BUY",
      quantity: 10000,
      tif: "DAY",
    });
    expect(buyingPower.status).toBe(400);
    expect(buyingPower.body.reason).toContain("insufficient available buying power");
  });
});
