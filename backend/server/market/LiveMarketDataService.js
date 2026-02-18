import { MarketDataService } from "./MarketDataService.js";

export class LiveMarketDataService extends MarketDataService {
  constructor() {
    super();
    this.enabled = process.env.ENABLE_LIVE_MARKET_DATA === "true";
  }

  async getQuote(symbol) {
    if (!this.enabled) {
      throw new Error(`Live market data is disabled. Symbol: ${symbol}`);
    }
    throw new Error("LiveMarketDataService is a placeholder. Wire your provider here.");
  }

  async peekQuote(symbol) {
    return this.getQuote(symbol);
  }
}
