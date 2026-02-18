import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultBrokerConfig } from "../config.js";
import { ReplayMarketDataService } from "../market/ReplayMarketDataService.js";
import { BrokerService } from "../core/BrokerService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createTestBroker(overrides = {}) {
  const raw = fs.readFileSync(path.join(__dirname, "..", "data", "replay-quotes.json"), "utf8");
  const dataset = JSON.parse(raw);
  const config = {
    ...defaultBrokerConfig,
    executionDelayMs: 0,
    seed: 42,
    enforceMarketHours: false,
    ...overrides,
  };
  const marketDataService = new ReplayMarketDataService(dataset, config.baseSpreadBps);
  return new BrokerService({ marketDataService, config });
}
