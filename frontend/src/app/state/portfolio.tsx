import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AssetCategory = "stock" | "crypto" | "etf" | "derivative";
export type OrderType = "buy" | "sell" | "short" | "cover";
export type OrderMode = "market" | "limit";
export type OrderStatus = "executed" | "rejected" | "margin_call";
export type PortfolioRange = "1D" | "1W" | "1M" | "1Y" | "ALL";
export type CashTransactionType = "receive" | "send";

export interface Asset {
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  previousClose: number;
  marketCap?: string;
  volume?: string;
  volatility: number;
}

export interface Position {
  symbol: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  avgPrice: number;
}

export interface Order {
  id: string;
  date: string;
  time: string;
  symbol: string;
  type: OrderType;
  orderMode: OrderMode;
  quantity: number;
  price: number;
  total: number;
  status: OrderStatus;
}

export interface PortfolioPoint {
  label: string;
  value: number;
  gainLoss?: number;
}

export interface CashTransaction {
  id: string;
  date: string;
  time: string;
  type: CashTransactionType;
  counterparty: string;
  amount: number;
}

interface PlaceOrderInput {
  symbol: string;
  type: OrderType;
  orderMode: OrderMode;
  quantity: number;
  limitPrice?: number;
}

interface ActionResult {
  ok: boolean;
  message: string;
}

interface EquitySnapshot {
  timestamp: number;
  value: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  gainLoss: number;
  pct: number;
}

interface PortfolioContextValue {
  assets: Asset[];
  cash: number;
  positions: Position[];
  orders: Order[];
  holdingsValue: number;
  totalValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  investmentGainLoss: number;
  investmentReturnPercent: number;
  unrealizedPnLPercent: number;
  todayChange: number;
  todayPercent: number;
  cashTransactions: CashTransaction[];
  getPortfolioSeries: (range: PortfolioRange) => PortfolioPoint[];
  getInvestmentPerformanceSeries: (range: PortfolioRange) => PortfolioPoint[];
  placeOrder: (input: PlaceOrderInput) => ActionResult;
  receiveCash: (amount: number, from: string) => ActionResult;
  sendCash: (amount: number, to: string) => ActionResult;
}

const initialAssets: Asset[] = [
  { symbol: "AAPL", name: "Apple Inc.", category: "stock", price: 182.3, previousClose: 179.85, marketCap: "€2.8T", volume: "52.3M", volatility: 0.003 },
  { symbol: "TSLA", name: "Tesla Inc.", category: "stock", price: 255.8, previousClose: 259.0, marketCap: "€812B", volume: "98.5M", volatility: 0.006 },
  { symbol: "NVDA", name: "NVIDIA Corp.", category: "stock", price: 812.5, previousClose: 797.2, marketCap: "€2.0T", volume: "45.2M", volatility: 0.007 },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "stock", price: 418.9, previousClose: 413.3, marketCap: "€3.1T", volume: "28.7M", volatility: 0.003 },
  { symbol: "GOOGL", name: "Alphabet Inc.", category: "stock", price: 142.5, previousClose: 140.7, marketCap: "€1.8T", volume: "31.4M", volatility: 0.004 },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "stock", price: 178.25, previousClose: 180.4, marketCap: "€1.9T", volume: "42.1M", volatility: 0.004 },
  { symbol: "BTC", name: "Bitcoin", category: "crypto", price: 51500, previousClose: 50250, marketCap: "€1.0T", volume: "€28.5B", volatility: 0.01 },
  { symbol: "ETH", name: "Ethereum", category: "crypto", price: 2850, previousClose: 2895, marketCap: "€342B", volume: "€15.2B", volatility: 0.012 },
  { symbol: "SOL", name: "Solana", category: "crypto", price: 108.5, previousClose: 103.2, marketCap: "€48B", volume: "€2.8B", volatility: 0.015 },
  { symbol: "ADA", name: "Cardano", category: "crypto", price: 0.58, previousClose: 0.56, marketCap: "€20B", volume: "€850M", volatility: 0.014 },
  { symbol: "AVAX", name: "Avalanche", category: "crypto", price: 38.2, previousClose: 40.0, marketCap: "€14B", volume: "€650M", volatility: 0.015 },
  { symbol: "SPY", name: "S&P 500 ETF", category: "etf", price: 498.5, previousClose: 495.3, marketCap: "€485B", volume: "68.5M", volatility: 0.002 },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", category: "etf", price: 428.75, previousClose: 423.35, marketCap: "€238B", volume: "38.2M", volatility: 0.003 },
  { symbol: "VOO", name: "Vanguard S&P 500", category: "etf", price: 458.3, previousClose: 455.4, marketCap: "€425B", volume: "5.2M", volatility: 0.002 },
  { symbol: "VTI", name: "Vanguard Total Market", category: "etf", price: 245.6, previousClose: 243.75, marketCap: "€392B", volume: "4.8M", volatility: 0.002 },
  { symbol: "IWM", name: "Russell 2000 ETF", category: "etf", price: 198.4, previousClose: 199.6, marketCap: "€72B", volume: "28.3M", volatility: 0.003 },
  { symbol: "AAPL-CALL-200", name: "Apple Call 200 (Jun 2026)", category: "derivative", price: 5.3, previousClose: 5.1, marketCap: "€-", volume: "92K", volatility: 0.025 },
  { symbol: "TSLA-PUT-220", name: "Tesla Put 220 (Jun 2026)", category: "derivative", price: 8.8, previousClose: 9.2, marketCap: "€-", volume: "58K", volatility: 0.03 },
  { symbol: "NVDA-FUT", name: "NVIDIA Future (Quarterly)", category: "derivative", price: 818.4, previousClose: 812.2, marketCap: "€-", volume: "31K", volatility: 0.015 },
];

const initialPositions: Position[] = [
  { symbol: "AAPL", name: "Apple Inc.", category: "stock", quantity: 50, avgPrice: 175.5 },
  { symbol: "TSLA", name: "Tesla Inc.", category: "stock", quantity: 30, avgPrice: 248.2 },
  { symbol: "BTC", name: "Bitcoin", category: "crypto", quantity: 0.5, avgPrice: 48200 },
  { symbol: "NVDA", name: "NVIDIA Corp.", category: "stock", quantity: 25, avgPrice: 785 },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "stock", quantity: 40, avgPrice: 410.2 },
];

const initialCash = 25340;

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function roundPrice(price: number) {
  return price >= 10 ? Number(price.toFixed(2)) : Number(price.toFixed(4));
}

function nearestSnapshotValue(snapshots: EquitySnapshot[], targetTimestamp: number) {
  const point = [...snapshots]
    .reverse()
    .find((snapshot) => snapshot.timestamp <= targetTimestamp);
  return point ? point.value : snapshots[0]?.value ?? 0;
}

function buildInitialSnapshots(initialValue: number) {
  const now = Date.now();
  const start = now - 540 * 24 * 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;
  const oneHour = 60 * 60 * 1000;
  const snapshots: EquitySnapshot[] = [];
  let value = initialValue * 0.74;

  for (let timestamp = start; timestamp < now - 3 * oneDay; timestamp += oneDay) {
    const drift = (Math.random() - 0.46) * 0.018;
    value = Math.max(2000, value * (1 + drift));
    snapshots.push({ timestamp, value: Number(value.toFixed(2)) });
  }

  for (let timestamp = now - 3 * oneDay; timestamp <= now; timestamp += oneHour) {
    const drift = (Math.random() - 0.49) * 0.01;
    value = Math.max(2000, value * (1 + drift));
    snapshots.push({ timestamp, value: Number(value.toFixed(2)) });
  }

  snapshots.push({ timestamp: now, value: Number(initialValue.toFixed(2)) });
  return snapshots;
}

function buildInitialPerformanceSnapshots() {
  const now = Date.now();
  const snapshots: PerformanceSnapshot[] = [];
  for (let i = 24; i >= 1; i -= 1) {
    const timestamp = now - i * 60 * 60 * 1000;
    snapshots.push({
      timestamp,
      gainLoss: 0,
      pct: 0,
    });
  }
  snapshots.push({ timestamp: now, gainLoss: 0, pct: 0 });
  return snapshots;
}

function sampleSeries(
  snapshots: EquitySnapshot[],
  startTimestamp: number,
  targetPoints: number,
  labelFormatter: (timestamp: number) => string,
) {
  const relevant = snapshots.filter((snapshot) => snapshot.timestamp >= startTimestamp);
  if (relevant.length === 0) {
    return [];
  }

  if (relevant.length === 1) {
    return [{ label: labelFormatter(relevant[0].timestamp), value: relevant[0].value }];
  }

  const points = Math.min(targetPoints, relevant.length);
  return Array.from({ length: points }, (_, index) => {
    const position = points === 1 ? 0 : (index / (points - 1)) * (relevant.length - 1);
    const snapshot = relevant[Math.round(position)];
    return {
      label: labelFormatter(snapshot.timestamp),
      value: Number(snapshot.value.toFixed(2)),
    };
  });
}

function createCashTransaction(type: CashTransactionType, amount: number, counterparty: string): CashTransaction {
  const now = new Date();
  return {
    id: `CASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: now.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }),
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type,
    counterparty,
    amount: Number(amount.toFixed(2)),
  };
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState(initialAssets);
  const [cash, setCash] = useState(initialCash);
  const [positions, setPositions] = useState(initialPositions);
  const [orders, setOrders] = useState<Order[]>([]);
  const [realizedPnL, setRealizedPnL] = useState(0);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([
    {
      id: "CASH-INITIAL",
      date: "Feb 16, 2026",
      time: "09:00 AM",
      type: "receive",
      counterparty: "Initial Balance",
      amount: initialCash,
    },
  ]);

  const assetBySymbol = useMemo(() => new Map(assets.map((asset) => [asset.symbol, asset])), [assets]);

  const holdingsValue = useMemo(() => {
    return positions.reduce((sum, position) => {
      const asset = assetBySymbol.get(position.symbol);
      return sum + (asset ? asset.price * position.quantity : 0);
    }, 0);
  }, [assetBySymbol, positions]);

  const totalValue = cash + holdingsValue;

  const costBasis = useMemo(() => {
    return positions.reduce((sum, position) => sum + position.avgPrice * position.quantity, 0);
  }, [positions]);

  const unrealizedPnL = holdingsValue - costBasis;
  const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
  const investmentGainLoss = realizedPnL + unrealizedPnL;
  const performanceBaseCapital = Math.max(initialCash, 1);
  const investmentReturnPercent = (investmentGainLoss / performanceBaseCapital) * 100;

  const [equitySnapshots, setEquitySnapshots] = useState<EquitySnapshot[]>(() => buildInitialSnapshots(totalValue));
  const [performanceSnapshots, setPerformanceSnapshots] = useState<PerformanceSnapshot[]>(() => buildInitialPerformanceSnapshots());

  const todayStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  const todayBaseValue = nearestSnapshotValue(equitySnapshots, todayStart);
  const todayChange = totalValue - todayBaseValue;
  const todayPercent = todayBaseValue > 0 ? (todayChange / todayBaseValue) * 100 : 0;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAssets((currentAssets) =>
        currentAssets.map((asset) => {
          const drift = (Math.random() - 0.5) * 2 * asset.volatility;
          const next = Math.max(0.01, asset.price * (1 + drift));
          return { ...asset, price: roundPrice(next) };
        }),
      );
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setEquitySnapshots((current) => {
      const next = [...current, { timestamp: Date.now(), value: Number(totalValue.toFixed(2)) }];
      if (next.length <= 3000) {
        return next;
      }
      return next.slice(next.length - 3000);
    });
  }, [totalValue]);

  useEffect(() => {
    setPerformanceSnapshots((current) => {
      const next = [
        ...current,
        {
          timestamp: Date.now(),
          gainLoss: Number(investmentGainLoss.toFixed(2)),
          pct: Number(investmentReturnPercent.toFixed(4)),
        },
      ];
      if (next.length <= 3000) {
        return next;
      }
      return next.slice(next.length - 3000);
    });
  }, [investmentGainLoss, investmentReturnPercent]);

  const getPortfolioSeries = useCallback(
    (range: PortfolioRange): PortfolioPoint[] => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      const config: Record<
        PortfolioRange,
        {
          start: number;
          points: number;
          label: (timestamp: number) => string;
        }
      > = {
        "1D": {
          start: now - oneDay,
          points: 36,
          label: (timestamp) => `${new Date(timestamp).getHours().toString().padStart(2, "0")}h`,
        },
        "1W": {
          start: now - 7 * oneDay,
          points: 28,
          label: (timestamp) => new Date(timestamp).toLocaleDateString([], { weekday: "short" }),
        },
        "1M": {
          start: now - 30 * oneDay,
          points: 30,
          label: (timestamp) => new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
        },
        "1Y": {
          start: now - 365 * oneDay,
          points: 36,
          label: (timestamp) => new Date(timestamp).toLocaleDateString([], { month: "short" }),
        },
        ALL: {
          start: equitySnapshots[0]?.timestamp ?? now,
          points: 64,
          label: (timestamp) => new Date(timestamp).toLocaleDateString([], { month: "short", year: "2-digit" }),
        },
      };

      const selected = config[range];
      return sampleSeries(equitySnapshots, selected.start, selected.points, selected.label);
    },
    [equitySnapshots],
  );

  const getInvestmentPerformanceSeries = useCallback(
    (range: PortfolioRange): PortfolioPoint[] => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      const config: Record<
        PortfolioRange,
        {
          start: number;
          points: number;
          label: (timestamp: number) => string;
        }
      > = {
        "1D": {
          start: now - oneDay,
          points: 36,
          label: (timestamp) => `${new Date(timestamp).getHours().toString().padStart(2, "0")}h`,
        },
        "1W": {
          start: now - 7 * oneDay,
          points: 28,
          label: (timestamp) => new Date(timestamp).toLocaleDateString([], { weekday: "short" }),
        },
        "1M": {
          start: now - 30 * oneDay,
          points: 30,
          label: (timestamp) => new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
        },
        "1Y": {
          start: now - 365 * oneDay,
          points: 36,
          label: (timestamp) => new Date(timestamp).toLocaleDateString([], { month: "short" }),
        },
        ALL: {
          start: performanceSnapshots[0]?.timestamp ?? now,
          points: 64,
          label: (timestamp) => new Date(timestamp).toLocaleDateString([], { month: "short", year: "2-digit" }),
        },
      };

      const selected = config[range];
      const relevant = performanceSnapshots.filter((snapshot) => snapshot.timestamp >= selected.start);
      if (relevant.length === 0) {
        return [];
      }

      const points = Math.min(selected.points, relevant.length);
      return Array.from({ length: points }, (_, index) => {
        const position = points === 1 ? 0 : (index / (points - 1)) * (relevant.length - 1);
        const snapshot = relevant[Math.round(position)];
        return {
          label: selected.label(snapshot.timestamp),
          value: Number(snapshot.pct.toFixed(3)),
          gainLoss: Number(snapshot.gainLoss.toFixed(2)),
        };
      });
    },
    [performanceSnapshots],
  );

  const placeOrder = useCallback(
    (input: PlaceOrderInput): ActionResult => {
      const asset = assetBySymbol.get(input.symbol);
      if (!asset) {
        return { ok: false, message: "Asset not found." };
      }
      if (input.quantity <= 0 || !Number.isFinite(input.quantity)) {
        return { ok: false, message: "Quantity must be greater than 0." };
      }

      const executionPrice = input.orderMode === "limit" && input.limitPrice ? input.limitPrice : asset.price;
      const total = executionPrice * input.quantity;

      if (input.type === "buy") {
        const existing = positions.find((position) => position.symbol === input.symbol);
        if (existing && existing.quantity < 0) {
          return { ok: false, message: "You have a short position. Use cover first." };
        }
        if (total > cash) {
          return { ok: false, message: "Insufficient cash for this order." };
        }

        setCash((current) => Number((current - total).toFixed(2)));
        setPositions((current) => {
          const existing = current.find((position) => position.symbol === input.symbol);
          if (!existing) {
            return [
              ...current,
              {
                symbol: asset.symbol,
                name: asset.name,
                category: asset.category,
                quantity: input.quantity,
                avgPrice: Number(executionPrice.toFixed(2)),
              },
            ];
          }

          const nextQuantity = existing.quantity + input.quantity;
          const weightedAvg = (existing.avgPrice * existing.quantity + executionPrice * input.quantity) / nextQuantity;
          return current.map((position) =>
            position.symbol === input.symbol
              ? { ...position, quantity: nextQuantity, avgPrice: Number(weightedAvg.toFixed(2)) }
              : position,
          );
        });
      }

      if (input.type === "sell") {
        const existing = positions.find((position) => position.symbol === input.symbol);
        if (!existing || existing.quantity <= 0) {
          return { ok: false, message: "No open position to sell." };
        }
        if (input.quantity > existing.quantity) {
          return { ok: false, message: "Sell quantity is larger than your position." };
        }
        const realized = (executionPrice - existing.avgPrice) * input.quantity;

        setCash((current) => Number((current + total).toFixed(2)));
        setRealizedPnL((current) => Number((current + realized).toFixed(2)));
        setPositions((current) =>
          current
            .map((position) =>
              position.symbol === input.symbol
                ? { ...position, quantity: Number((position.quantity - input.quantity).toFixed(6)) }
                : position,
            )
            .filter((position) => position.quantity > 0),
        );
      }

      if (input.type === "short") {
        if (asset.category !== "stock") {
          return { ok: false, message: "Shorting is only enabled for stocks." };
        }
        const existing = positions.find((position) => position.symbol === input.symbol);
        if (existing && existing.quantity > 0) {
          return { ok: false, message: "You have a long position. Sell first before shorting." };
        }

        setCash((current) => Number((current + total).toFixed(2)));
        setPositions((current) => {
          const currentPosition = current.find((position) => position.symbol === input.symbol);

          if (!currentPosition) {
            return [
              ...current,
              {
                symbol: asset.symbol,
                name: asset.name,
                category: asset.category,
                quantity: -input.quantity,
                avgPrice: Number(executionPrice.toFixed(2)),
              },
            ];
          }

          const nextQuantity = Math.abs(currentPosition.quantity) + input.quantity;
          const weightedAvg = (currentPosition.avgPrice * Math.abs(currentPosition.quantity) + executionPrice * input.quantity) / nextQuantity;

          return current.map((position) =>
            position.symbol === input.symbol
              ? { ...position, quantity: -nextQuantity, avgPrice: Number(weightedAvg.toFixed(2)) }
              : position,
          );
        });
      }

      if (input.type === "cover") {
        const existing = positions.find((position) => position.symbol === input.symbol);
        if (!existing || existing.quantity >= 0) {
          return { ok: false, message: "No short position to cover." };
        }
        if (input.quantity > Math.abs(existing.quantity)) {
          return { ok: false, message: "Cover quantity is larger than your short position." };
        }
        if (total > cash) {
          return { ok: false, message: "Insufficient cash to cover this position." };
        }
        const realized = (existing.avgPrice - executionPrice) * input.quantity;

        setCash((current) => Number((current - total).toFixed(2)));
        setRealizedPnL((current) => Number((current + realized).toFixed(2)));
        setPositions((current) =>
          current
            .map((position) =>
              position.symbol === input.symbol
                ? { ...position, quantity: Number((position.quantity + input.quantity).toFixed(6)) }
                : position,
            )
            .filter((position) => position.quantity !== 0),
        );
      }

      const now = new Date();
      const nextOrder: Order = {
        id: `ORD-${Date.now()}`,
        date: now.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }),
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        symbol: asset.symbol,
        type: input.type,
        orderMode: input.orderMode,
        quantity: input.quantity,
        price: Number(executionPrice.toFixed(2)),
        total: Number(total.toFixed(2)),
        status: "executed",
      };
      setOrders((current) => [nextOrder, ...current]);

      return { ok: true, message: `${input.type.toUpperCase()} order executed for ${input.symbol}.` };
    },
    [assetBySymbol, cash, positions],
  );

  const receiveCash = useCallback((amount: number, from: string): ActionResult => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, message: "Amount must be greater than 0." };
    }

    setCash((current) => Number((current + amount).toFixed(2)));
    setCashTransactions((current) => [createCashTransaction("receive", amount, from || "External Account"), ...current]);
    return { ok: true, message: "Cash received successfully." };
  }, []);

  const sendCash = useCallback(
    (amount: number, to: string): ActionResult => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, message: "Amount must be greater than 0." };
      }
      if (amount > cash) {
        return { ok: false, message: "Insufficient cash for this transfer." };
      }

      setCash((current) => Number((current - amount).toFixed(2)));
      setCashTransactions((current) => [createCashTransaction("send", amount, to || "External Account"), ...current]);
      return { ok: true, message: "Cash sent successfully." };
    },
    [cash],
  );

  const value: PortfolioContextValue = {
    assets,
    cash,
    positions,
    orders,
    holdingsValue,
    totalValue,
    unrealizedPnL,
    realizedPnL,
    investmentGainLoss,
    investmentReturnPercent,
    unrealizedPnLPercent,
    todayChange,
    todayPercent,
    cashTransactions,
    getPortfolioSeries,
    getInvestmentPerformanceSeries,
    placeOrder,
    receiveCash,
    sendCash,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider.");
  }
  return context;
}
