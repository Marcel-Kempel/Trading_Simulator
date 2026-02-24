import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────

export type AssetCategory = "stock" | "crypto" | "etf" | "derivative";
export type OrderType = "buy" | "sell" | "short" | "cover";
export type OrderMode = "market" | "limit";
export type OrderStatus = "executed" | "rejected" | "margin_call";
export type PortfolioRange = "1D" | "1W" | "1M" | "1Y" | "ALL";

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  volatility: number;
  category: AssetCategory;
  marketCap: string;
  volume: string;
}

interface PositionEntry {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
}

interface OrderEntry {
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

interface CashTransaction {
  id: string;
  date: string;
  time: string;
  type: "receive" | "send";
  counterparty: string;
  amount: number;
}

interface PlaceOrderParams {
  symbol: string;
  type: OrderType;
  orderMode: OrderMode;
  quantity: number;
  limitPrice?: number;
}

interface PortfolioContextValue {
  assets: Asset[];
  cash: number;
  positions: PositionEntry[];
  orders: OrderEntry[];
  cashTransactions: CashTransaction[];
  totalValue: number;
  todayChange: number;
  todayPercent: number;
  investmentGainLoss: number;
  investmentReturnPercent: number;
  placeOrder: (params: PlaceOrderParams) => { ok: boolean; message: string };
  receiveCash: (amount: number, counterparty: string) => { ok: boolean; message: string };
  sendCash: (amount: number, counterparty: string) => { ok: boolean; message: string };
  getInvestmentPerformanceSeries: (range: PortfolioRange) => { label: string; value: number; gainLoss: number }[];
}

// ─── Seed Data ───────────────────────────────────────────

const INITIAL_ASSETS: Asset[] = [
  // Stocks
  { symbol: "SAP", name: "SAP SE", price: 237.15, previousClose: 234.80, volatility: 0.018, category: "stock", marketCap: "€275B", volume: "2.1M" },
  { symbol: "SIE", name: "Siemens AG", price: 192.44, previousClose: 190.10, volatility: 0.022, category: "stock", marketCap: "€153B", volume: "1.8M" },
  { symbol: "ALV", name: "Allianz SE", price: 284.30, previousClose: 281.50, volatility: 0.016, category: "stock", marketCap: "€114B", volume: "980K" },
  { symbol: "DTE", name: "Deutsche Telekom", price: 28.96, previousClose: 28.55, volatility: 0.014, category: "stock", marketCap: "€144B", volume: "5.2M" },
  { symbol: "BAS", name: "BASF SE", price: 47.82, previousClose: 48.20, volatility: 0.025, category: "stock", marketCap: "€42B", volume: "3.1M" },
  { symbol: "MBG", name: "Mercedes-Benz Group", price: 56.70, previousClose: 57.40, volatility: 0.028, category: "stock", marketCap: "€60B", volume: "2.4M" },
  { symbol: "BMW", name: "BMW AG", price: 78.54, previousClose: 79.10, volatility: 0.024, category: "stock", marketCap: "€49B", volume: "1.5M" },
  { symbol: "ADS", name: "adidas AG", price: 235.60, previousClose: 232.80, volatility: 0.026, category: "stock", marketCap: "€42B", volume: "1.2M" },
  // Crypto
  { symbol: "BTC", name: "Bitcoin", price: 97420.00, previousClose: 96100.00, volatility: 0.035, category: "crypto", marketCap: "€1.9T", volume: "28.5B" },
  { symbol: "ETH", name: "Ethereum", price: 3645.80, previousClose: 3580.00, volatility: 0.04, category: "crypto", marketCap: "€438B", volume: "14.2B" },
  { symbol: "SOL", name: "Solana", price: 198.30, previousClose: 192.50, volatility: 0.055, category: "crypto", marketCap: "€92B", volume: "3.8B" },
  { symbol: "ADA", name: "Cardano", price: 1.08, previousClose: 1.04, volatility: 0.06, category: "crypto", marketCap: "€38B", volume: "1.2B" },
  // ETFs
  { symbol: "IWDA", name: "iShares Core MSCI World", price: 94.32, previousClose: 93.80, volatility: 0.01, category: "etf", marketCap: "€72B", volume: "4.5M" },
  { symbol: "VWCE", name: "Vanguard FTSE All-World", price: 118.46, previousClose: 117.90, volatility: 0.011, category: "etf", marketCap: "€18B", volume: "890K" },
  { symbol: "EUNL", name: "iShares Core MSCI Europe", price: 78.15, previousClose: 77.90, volatility: 0.012, category: "etf", marketCap: "€8.5B", volume: "520K" },
  { symbol: "XDWD", name: "Xtrackers MSCI World", price: 102.80, previousClose: 102.30, volatility: 0.01, category: "etf", marketCap: "€12B", volume: "310K" },
  // Derivatives
  { symbol: "DAX-C", name: "DAX Call 19500 Jun25", price: 340.00, previousClose: 320.00, volatility: 0.12, category: "derivative", marketCap: "—", volume: "12K" },
  { symbol: "DAX-P", name: "DAX Put 18500 Jun25", price: 180.00, previousClose: 195.00, volatility: 0.14, category: "derivative", marketCap: "—", volume: "8K" },
  { symbol: "SAP-C", name: "SAP Call 240 Mar25", price: 5.80, previousClose: 5.20, volatility: 0.18, category: "derivative", marketCap: "—", volume: "3.5K" },
];

const INITIAL_POSITIONS: PositionEntry[] = [
  { symbol: "SAP", name: "SAP SE", quantity: 25, avgPrice: 220.40 },
  { symbol: "SIE", name: "Siemens AG", quantity: 15, avgPrice: 185.60 },
  { symbol: "BTC", name: "Bitcoin", quantity: 0.5, avgPrice: 82000.00 },
  { symbol: "IWDA", name: "iShares Core MSCI World", quantity: 100, avgPrice: 88.50 },
  { symbol: "ETH", name: "Ethereum", quantity: 3, avgPrice: 3200.00 },
];

const INITIAL_ORDERS: OrderEntry[] = [
  { id: "ORD-001", date: "2025-02-20", time: "09:32:15", symbol: "SAP", type: "buy", orderMode: "market", quantity: 25, price: 220.40, total: 5510.00, status: "executed" },
  { id: "ORD-002", date: "2025-02-20", time: "10:15:42", symbol: "SIE", type: "buy", orderMode: "market", quantity: 15, price: 185.60, total: 2784.00, status: "executed" },
  { id: "ORD-003", date: "2025-02-21", time: "08:45:30", symbol: "BTC", type: "buy", orderMode: "limit", quantity: 0.5, price: 82000.00, total: 41000.00, status: "executed" },
  { id: "ORD-004", date: "2025-02-21", time: "11:20:05", symbol: "IWDA", type: "buy", orderMode: "market", quantity: 100, price: 88.50, total: 8850.00, status: "executed" },
  { id: "ORD-005", date: "2025-02-22", time: "14:05:18", symbol: "ETH", type: "buy", orderMode: "market", quantity: 3, price: 3200.00, total: 9600.00, status: "executed" },
  { id: "ORD-006", date: "2025-02-22", time: "15:30:00", symbol: "MBG", type: "buy", orderMode: "limit", quantity: 50, price: 52.00, total: 2600.00, status: "rejected" },
];

const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [
  { id: "CT-001", date: "2025-02-18", time: "08:00:00", type: "receive", counterparty: "Main Bank Account", amount: 100000 },
];

// ─── Context ─────────────────────────────────────────────

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [assets] = useState<Asset[]>(INITIAL_ASSETS);
  const [cash, setCash] = useState(32256.00);
  const [positions, setPositions] = useState<PositionEntry[]>(INITIAL_POSITIONS);
  const [orders, setOrders] = useState<OrderEntry[]>(INITIAL_ORDERS);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(INITIAL_CASH_TRANSACTIONS);
  const [orderCounter, setOrderCounter] = useState(7);
  const [txCounter, setTxCounter] = useState(2);

  // ── Derived values ──

  const holdingsValue = useMemo(() => {
    return positions.reduce((sum, pos) => {
      const asset = assets.find((a) => a.symbol === pos.symbol);
      if (!asset) return sum;
      return sum + pos.quantity * asset.price;
    }, 0);
  }, [assets, positions]);

  const totalValue = cash + holdingsValue;

  const holdingsValuePrevious = useMemo(() => {
    return positions.reduce((sum, pos) => {
      const asset = assets.find((a) => a.symbol === pos.symbol);
      if (!asset) return sum;
      return sum + pos.quantity * asset.previousClose;
    }, 0);
  }, [assets, positions]);

  const todayChange = holdingsValue - holdingsValuePrevious;
  const todayPercent = holdingsValuePrevious > 0 ? (todayChange / holdingsValuePrevious) * 100 : 0;

  const totalCostBasis = useMemo(() => {
    return positions.reduce((sum, pos) => sum + pos.quantity * pos.avgPrice, 0);
  }, [positions]);

  const investmentGainLoss = holdingsValue - totalCostBasis;
  const investmentReturnPercent = totalCostBasis > 0 ? (investmentGainLoss / totalCostBasis) * 100 : 0;

  // ── Performance series ──

  const getInvestmentPerformanceSeries = useCallback(
    (range: PortfolioRange) => {
      const pointsByRange: Record<PortfolioRange, number> = { "1D": 24, "1W": 7, "1M": 30, "1Y": 12, ALL: 24 };
      const labelsByRange: Record<PortfolioRange, (i: number) => string> = {
        "1D": (i) => `${i}:00`,
        "1W": (i) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7],
        "1M": (i) => `Day ${i + 1}`,
        "1Y": (i) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
        ALL: (i) => `${2023 + Math.floor(i / 6)}`,
      };

      const points = pointsByRange[range];
      const labels = labelsByRange[range];
      const endReturn = investmentReturnPercent;

      return Array.from({ length: points }, (_, i) => {
        const progress = points === 1 ? 1 : i / (points - 1);
        const base = endReturn * progress;
        const noise = Math.sin(i * 1.3 + 42) * Math.abs(endReturn) * 0.15 * (1 - progress * 0.4);
        const value = i === points - 1 ? endReturn : base + noise;
        const gainLoss = totalCostBasis > 0 ? (value / 100) * totalCostBasis : 0;
        return { label: labels(i), value: Number(value.toFixed(2)), gainLoss: Number(gainLoss.toFixed(2)) };
      });
    },
    [investmentReturnPercent, totalCostBasis],
  );

  // ── Trading ──

  const now = () => {
    const d = new Date();
    return {
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().split(" ")[0],
    };
  };

  const placeOrder = useCallback(
    (params: PlaceOrderParams): { ok: boolean; message: string } => {
      const { symbol, type, orderMode, quantity, limitPrice } = params;
      const asset = assets.find((a) => a.symbol === symbol);
      if (!asset) return { ok: false, message: "Asset not found." };

      const price = orderMode === "limit" && limitPrice && limitPrice > 0 ? limitPrice : asset.price;
      const total = quantity * price;
      const { date, time } = now();
      const id = `ORD-${String(orderCounter).padStart(3, "0")}`;
      setOrderCounter((c) => c + 1);

      // Validation
      const existingPosition = positions.find((p) => p.symbol === symbol);
      const heldQty = existingPosition?.quantity ?? 0;

      if (type === "buy" || type === "cover") {
        if (total > cash) {
          setOrders((prev) => [...prev, { id, date, time, symbol, type, orderMode, quantity, price, total, status: "rejected" }]);
          return { ok: false, message: "Insufficient cash." };
        }
      }

      if (type === "sell") {
        if (heldQty <= 0 || quantity > heldQty) {
          setOrders((prev) => [...prev, { id, date, time, symbol, type, orderMode, quantity, price, total, status: "rejected" }]);
          return { ok: false, message: `Cannot sell ${quantity} — you hold ${Math.max(0, heldQty)}.` };
        }
      }

      if (type === "cover") {
        if (heldQty >= 0) {
          setOrders((prev) => [...prev, { id, date, time, symbol, type, orderMode, quantity, price, total, status: "rejected" }]);
          return { ok: false, message: "No short position to cover." };
        }
        if (quantity > Math.abs(heldQty)) {
          setOrders((prev) => [...prev, { id, date, time, symbol, type, orderMode, quantity, price, total, status: "rejected" }]);
          return { ok: false, message: `Cannot cover ${quantity} — short position is ${Math.abs(heldQty)}.` };
        }
      }

      if (type === "short" && asset.category !== "stock") {
        setOrders((prev) => [...prev, { id, date, time, symbol, type, orderMode, quantity, price, total, status: "rejected" }]);
        return { ok: false, message: "Shorting is only available for stocks." };
      }

      // Execute
      setOrders((prev) => [...prev, { id, date, time, symbol, type, orderMode, quantity, price, total, status: "executed" }]);

      if (type === "buy") {
        setCash((c) => c - total);
        setPositions((prev) => {
          const existing = prev.find((p) => p.symbol === symbol);
          if (existing) {
            const newQty = existing.quantity + quantity;
            const newAvg = (existing.quantity * existing.avgPrice + quantity * price) / newQty;
            return prev.map((p) => (p.symbol === symbol ? { ...p, quantity: newQty, avgPrice: newAvg } : p));
          }
          return [...prev, { symbol, name: asset.name, quantity, avgPrice: price }];
        });
      } else if (type === "sell") {
        setCash((c) => c + total);
        setPositions((prev) => {
          const updated = prev.map((p) => (p.symbol === symbol ? { ...p, quantity: p.quantity - quantity } : p));
          return updated.filter((p) => p.quantity !== 0);
        });
      } else if (type === "short") {
        setCash((c) => c + total);
        setPositions((prev) => {
          const existing = prev.find((p) => p.symbol === symbol);
          if (existing) {
            const newQty = existing.quantity - quantity;
            return prev.map((p) => (p.symbol === symbol ? { ...p, quantity: newQty, avgPrice: price } : p));
          }
          return [...prev, { symbol, name: asset.name, quantity: -quantity, avgPrice: price }];
        });
      } else if (type === "cover") {
        setCash((c) => c - total);
        setPositions((prev) => {
          const updated = prev.map((p) => (p.symbol === symbol ? { ...p, quantity: p.quantity + quantity } : p));
          return updated.filter((p) => p.quantity !== 0);
        });
      }

      return { ok: true, message: `${type.toUpperCase()} order executed: ${quantity} × ${symbol} @ ${price.toFixed(2)} EUR` };
    },
    [assets, cash, positions, orderCounter],
  );

  // ── Cash management ──

  const receiveCash = useCallback(
    (amount: number, counterparty: string): { ok: boolean; message: string } => {
      if (!amount || amount <= 0) return { ok: false, message: "Enter a valid positive amount." };
      if (!counterparty.trim()) return { ok: false, message: "Please specify a counterparty." };

      const { date, time } = now();
      const id = `CT-${String(txCounter).padStart(3, "0")}`;
      setTxCounter((c) => c + 1);
      setCash((c) => c + amount);
      setCashTransactions((prev) => [...prev, { id, date, time, type: "receive", counterparty: counterparty.trim(), amount }]);
      return { ok: true, message: `Received €${amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} from ${counterparty}.` };
    },
    [txCounter],
  );

  const sendCash = useCallback(
    (amount: number, counterparty: string): { ok: boolean; message: string } => {
      if (!amount || amount <= 0) return { ok: false, message: "Enter a valid positive amount." };
      if (!counterparty.trim()) return { ok: false, message: "Please specify a counterparty." };
      if (amount > cash) return { ok: false, message: "Insufficient cash balance." };

      const { date, time } = now();
      const id = `CT-${String(txCounter).padStart(3, "0")}`;
      setTxCounter((c) => c + 1);
      setCash((c) => c - amount);
      setCashTransactions((prev) => [...prev, { id, date, time, type: "send", counterparty: counterparty.trim(), amount }]);
      return { ok: true, message: `Sent €${amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} to ${counterparty}.` };
    },
    [cash, txCounter],
  );

  // ── Context value ──

  const value: PortfolioContextValue = {
    assets,
    cash,
    positions,
    orders,
    cashTransactions,
    totalValue,
    todayChange,
    todayPercent,
    investmentGainLoss,
    investmentReturnPercent,
    placeOrder,
    receiveCash,
    sendCash,
    getInvestmentPerformanceSeries,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
