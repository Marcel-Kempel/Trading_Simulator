import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { defaultBrokerConfig } from "./config.js";
import { ReplayMarketDataService } from "./market/ReplayMarketDataService.js";
import { LiveMarketDataService } from "./market/LiveMarketDataService.js";
import { BrokerService } from "./core/BrokerService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadReplayDataset() {
  const replayPath = path.join(__dirname, "data", "replay-quotes.json");
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
  return createApp({ brokerService: createBrokerService() });
}

if (process.env.NODE_ENV !== "test") {
  const app = createServerApp();
  const port = Number(process.env.PORT ?? 8080);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Broker API running on http://localhost:${port}`);
  });
}
