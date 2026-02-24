import express from "express";

export function createApp({ brokerService }) {
  const app = express();
  app.use(express.json());

  app.get("/actuator/health", (_req, res) => {
    res.json({ status: "UP" });
  });

  app.post("/accounts", (req, res) => {
    const initialCapital = Number(req.body?.initialCapital ?? 100000);
    if (!Number.isFinite(initialCapital) || initialCapital <= 0) {
      return res.status(400).json({ error: "invalid initialCapital" });
    }
    const account = brokerService.createAccount(initialCapital);
    return res.status(201).json({ id: account.id });
  });

  app.get("/accounts/:id", async (req, res) => {
    try {
      const account = await brokerService.getAccount(req.params.id);
      res.json(account);
    } catch (error) {
      res.status(error.message.startsWith("account_not_found") ? 404 : 500).json({ error: error.message });
    }
  });

  app.get("/accounts/:id/positions", async (req, res) => {
    try {
      const positions = await brokerService.getPositions(req.params.id);
      res.json(positions);
    } catch (error) {
      res.status(error.message.startsWith("account_not_found") ? 404 : 500).json({ error: error.message });
    }
  });

  app.post("/accounts/:id/orders", async (req, res) => {
    try {
      const order = await brokerService.placeOrder(req.params.id, req.body ?? {});
      const status = order.status === "REJECTED" ? 400 : 201;
      res.status(status).json(order);
    } catch (error) {
      res.status(error.message.startsWith("account_not_found") ? 404 : 500).json({ error: error.message });
    }
  });

  app.get("/accounts/:id/orders", async (req, res) => {
    try {
      const orders = await brokerService.getOrders(req.params.id, req.query.status);
      res.json(orders);
    } catch (error) {
      res.status(error.message.startsWith("account_not_found") ? 404 : 500).json({ error: error.message });
    }
  });

  app.get("/accounts/:id/fills", async (req, res) => {
    try {
      const fills = await brokerService.getFills(req.params.id);
      res.json(fills);
    } catch (error) {
      res.status(error.message.startsWith("account_not_found") ? 404 : 500).json({ error: error.message });
    }
  });

  app.get("/quotes", async (req, res) => {
    const symbol = String(req.query.symbol ?? "").toUpperCase();
    if (!symbol) {
      return res.status(400).json({ error: "symbol is required" });
    }
    try {
      const quote = await brokerService.getQuote(symbol);
      return res.json(quote);
    } catch {
      return res.status(404).json({ error: "unknown symbol" });
    }
  });

  return app;
}
