import { MarketDataService } from "./MarketDataService.js";

function computeVolatilityProxy(series, index) {
  const window = [];
  const start = Math.max(0, index - 4);
  for (let i = start; i <= index; i += 1) {
    window.push(series[i]);
  }
  if (window.length < 2) {
    return 0.001;
  }
  const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
  const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / window.length;
  return Math.max(Math.sqrt(variance) / mean, 0.001);
}

export class ReplayMarketDataService extends MarketDataService {
  constructor(dataset, defaultSpreadBps = 8) {
    super();
    this.defaultSpreadBps = defaultSpreadBps;
    this.symbols = new Map();

    Object.entries(dataset).forEach(([symbol, config]) => {
      this.symbols.set(symbol, {
        spreadBps: config.spreadBps ?? defaultSpreadBps,
        series: config.series,
        index: 0,
      });
    });
  }

  getSymbols() {
    return [...this.symbols.keys()];
  }

  async getQuote(symbol) {
    return this.#quote(symbol, true);
  }

  async peekQuote(symbol) {
    return this.#quote(symbol, false);
  }

  async #quote(symbol, advance) {
    const entry = this.symbols.get(symbol);
    if (!entry) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }

    const mid = entry.series[entry.index];
    const spreadBps = entry.spreadBps ?? this.defaultSpreadBps;
    const halfSpread = (mid * spreadBps) / 10000 / 2;
    const bid = Number((mid - halfSpread).toFixed(6));
    const ask = Number((mid + halfSpread).toFixed(6));
    const quote = {
      symbol,
      bid,
      ask,
      mid: Number(mid.toFixed(6)),
      timestamp: new Date().toISOString(),
      spreadBps,
      volatilityProxy: computeVolatilityProxy(entry.series, entry.index),
    };

    if (advance) {
      entry.index = (entry.index + 1) % entry.series.length;
    }
    return quote;
  }
}
