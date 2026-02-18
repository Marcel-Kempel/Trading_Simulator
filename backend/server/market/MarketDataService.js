export class MarketDataService {
  async getQuote(_symbol) {
    throw new Error("getQuote(symbol) must be implemented.");
  }

  async peekQuote(_symbol) {
    throw new Error("peekQuote(symbol) must be implemented.");
  }
}
