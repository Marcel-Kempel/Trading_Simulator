import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { defaultBrokerConfig } from "./config.js";
import { ReplayMarketDataService } from "./server/market/ReplayMarketDataService.js";
import { LiveMarketDataService } from "./server/market/LiveMarketDataService.js";
import { BrokerService } from "./server/core/BrokerService.js";
import usersRouter from "./dbCon.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadReplayDataset() {
  // Dataset is shipped under backend/server/data
  const replayPath = path.join(__dirname, "server", "data", "replay-quotes.json");
  const raw = fs.readFileSync(replayPath, "utf8");
  return JSON.parse(raw);
}

export function createBrokerService(config = defaultBrokerConfig) {
  const dataMode = process.env.MARKET_DATA_MODE ?? "replay";
  const marketDataService =
    dataMode === "live"
      ? new LiveMarketDataService()
      : new ReplayMarketDataService(loadReplayDataset(), config.baseSpreadBps);

  return new BrokerService({ marketDataService, config });
}

export function createServerApp() {
  const app = createApp({ brokerService: createBrokerService() });

  // User/auth endpoints (MariaDB)
  app.use("/api", usersRouter);

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = createServerApp();
  // docker-compose maps 3000:3000
  const port = Number(process.env.PORT ?? 3000);

  app.listen(port, () => {
    console.log(`Broker API running on http://localhost:${port}`);
  });
}
