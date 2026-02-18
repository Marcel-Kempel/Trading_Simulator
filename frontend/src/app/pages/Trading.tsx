import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, X, ArrowLeft, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLocation, useNavigate } from "react-router";
import { usePortfolio } from "../state/portfolio";
import type { Asset, AssetCategory, OrderMode, OrderType } from "../state/portfolio";
import { formatEur } from "../lib/currency";

type TimeRange = "1D" | "1W" | "1M" | "1Y" | "ALL";
type CategoryTab = AssetCategory;

function categoryLabel(category: AssetCategory) {
  if (category === "etf") {
    return "ETF";
  }
  if (category === "crypto") {
    return "Crypto";
  }
  if (category === "derivative") {
    return "Derivatives";
  }
  return "Stocks";
}

function buildPriceData(asset: Asset, timeRange: TimeRange) {
  const pointsByRange: Record<TimeRange, number> = {
    "1D": 24,
    "1W": 7,
    "1M": 30,
    "1Y": 12,
    ALL: 24,
  };
  const labelsByRange: Record<TimeRange, (index: number) => string> = {
    "1D": (index) => `${index}h`,
    "1W": (index) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
    "1M": (index) => `Day ${index + 1}`,
    "1Y": (index) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index],
    ALL: (index) => `${2022 + Math.floor(index / 12)}`,
  };

  const points = pointsByRange[timeRange];
  const labels = labelsByRange[timeRange];
  const hash = asset.symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const startPrice = asset.previousClose;
  const endPrice = asset.price;
  const amplitude = Math.max(endPrice * asset.volatility * 4, 0.001);

  return Array.from({ length: points }, (_, index) => {
    const progress = points === 1 ? 1 : index / (points - 1);
    const base = startPrice + (endPrice - startPrice) * progress;
    const wave = Math.sin((index + hash) * 0.8) * amplitude * (1 - progress * 0.35);
    const price = index === points - 1 ? endPrice : Math.max(0.01, base + wave);
    return {
      label: labels(index),
      price: Number(price.toFixed(2)),
    };
  });
}

export function Trading() {
  const navigate = useNavigate();
  const location = useLocation();
  const { assets, cash, positions, placeOrder } = usePortfolio();
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("stock");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [timeRange, setTimeRange] = useState<TimeRange>("1D");
  const [orderType, setOrderType] = useState<OrderType>("buy");
  const [orderMode, setOrderMode] = useState<OrderMode>("market");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFeedback, setOrderFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.symbol === selectedSymbol) ?? null,
    [assets, selectedSymbol],
  );

  useEffect(() => {
    const symbol = new URLSearchParams(location.search).get("symbol");
    if (!symbol) {
      return;
    }

    const asset = assets.find((item) => item.symbol === symbol.toUpperCase());
    if (!asset) {
      return;
    }

    setActiveCategory(asset.category);
    setSelectedSymbol(asset.symbol);
    setViewMode("detail");
  }, [assets, location.search]);

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory = asset.category === activeCategory;
    const matchesSearch =
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAssetClick = (asset: Asset) => {
    setSelectedSymbol(asset.symbol);
    setViewMode("detail");
    setOrderFeedback(null);
    navigate(`/trading?symbol=${asset.symbol}`, { replace: true });
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedSymbol(null);
    setOrderFeedback(null);
    navigate("/trading", { replace: true });
  };

  const effectivePrice = orderMode === "limit" && Number(limitPrice) > 0 ? Number(limitPrice) : selectedAsset?.price ?? 0;
  const numericQuantity = Number(quantity);
  const estimatedCost = numericQuantity > 0 ? numericQuantity * effectivePrice : 0;

  const selectedPosition = positions.find((position) => position.symbol === selectedAsset?.symbol);
  const heldQuantity = selectedPosition?.quantity ?? 0;
  const heldLongQuantity = selectedPosition && selectedPosition.quantity > 0 ? selectedPosition.quantity : 0;
  const heldShortQuantity = selectedPosition && selectedPosition.quantity < 0 ? Math.abs(selectedPosition.quantity) : 0;
  const selectedPositionPnl = selectedAsset && selectedPosition ? (selectedAsset.price - selectedPosition.avgPrice) * selectedPosition.quantity : 0;
  const selectedPositionPnlPercent =
    selectedAsset && selectedPosition && selectedPosition.avgPrice > 0
      ? selectedPosition.quantity >= 0
        ? ((selectedAsset.price - selectedPosition.avgPrice) / selectedPosition.avgPrice) * 100
        : ((selectedPosition.avgPrice - selectedAsset.price) / selectedPosition.avgPrice) * 100
      : 0;

  const projectedCashAfterTrade = (() => {
    if (orderType === "buy" || orderType === "cover") {
      return cash - estimatedCost;
    }
    return cash + estimatedCost;
  })();

  const priceData = useMemo(() => {
    if (!selectedAsset) {
      return [];
    }
    return buildPriceData(selectedAsset, timeRange);
  }, [selectedAsset, timeRange]);

  const oldPrice = selectedAsset?.previousClose ?? 0;
  const currentPrice = selectedAsset?.price ?? 0;
  const priceChange = currentPrice - oldPrice;
  const priceChangePercent = oldPrice > 0 ? (priceChange / oldPrice) * 100 : 0;

  const validationError = (() => {
    if (!selectedAsset) {
      return "Select an asset first.";
    }
    if (!numericQuantity || numericQuantity <= 0) {
      return "Quantity must be greater than 0.";
    }
    if ((orderType === "buy" || orderType === "cover") && estimatedCost > cash) {
      return "Insufficient cash for this order.";
    }
    if (orderType === "sell" && numericQuantity > heldLongQuantity) {
      return "You cannot sell more than you hold.";
    }
    if (orderType === "buy" && heldQuantity < 0) {
      return "You currently have a short position. Use cover first.";
    }
    if (orderType === "short" && selectedAsset.category !== "stock") {
      return "Shorting is only available for stocks.";
    }
    if (orderType === "short" && heldQuantity > 0) {
      return "You currently have a long position. Sell first.";
    }
    if (orderType === "cover" && heldShortQuantity <= 0) {
      return "No short position to cover.";
    }
    if (orderType === "cover" && numericQuantity > heldShortQuantity) {
      return "You cannot cover more than your short quantity.";
    }
    if (orderMode === "limit" && (!Number(limitPrice) || Number(limitPrice) <= 0)) {
      return "Enter a valid limit price.";
    }
    return null;
  })();

  const handleSubmitOrder = () => {
    if (validationError) {
      setOrderFeedback({ kind: "error", text: validationError });
      return;
    }
    setShowModal(true);
  };

  const confirmOrder = () => {
    if (!selectedAsset || validationError) {
      return;
    }

    const result = placeOrder({
      symbol: selectedAsset.symbol,
      type: orderType,
      orderMode,
      quantity: numericQuantity,
      limitPrice: orderMode === "limit" ? Number(limitPrice) : undefined,
    });

    setShowModal(false);
    setOrderFeedback({ kind: result.ok ? "success" : "error", text: result.message });
    if (result.ok) {
      setQuantity("");
      setLimitPrice("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-2 inline-flex gap-2 shadow-sm">
        {(["stock", "crypto", "etf", "derivative"] as CategoryTab[]).map((category) => (
          <button
            key={category}
            onClick={() => {
              setActiveCategory(category);
              handleBackToList();
            }}
            className={`px-6 py-2.5 rounded-xl font-semibold text-[15px] transition-all duration-200 capitalize ${
              activeCategory === category
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {category === "etf" ? "ETF" : category}
          </button>
        ))}
      </div>

      {viewMode === "list" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-[17px] font-semibold text-foreground mb-4 tracking-tight">
                Search {categoryLabel(activeCategory)}
              </h2>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search symbol or name..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-accent border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border bg-muted/30">
                <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                  Available {categoryLabel(activeCategory)}
                </h3>
              </div>
              <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                {filteredAssets.map((asset) => {
                  const change = asset.price - asset.previousClose;
                  const changePercent = asset.previousClose > 0 ? (change / asset.previousClose) * 100 : 0;
                  return (
                    <button
                      key={asset.symbol}
                      onClick={() => handleAssetClick(asset)}
                      className="w-full p-5 text-left hover:bg-accent transition-all duration-150 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors">{asset.symbol}</div>
                          <div className="text-[13px] text-muted-foreground mt-0.5">{asset.name}</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-[15px] font-semibold text-foreground">{formatEur(asset.price)}</div>
                          <div className={`text-[13px] font-medium flex items-center gap-1 justify-end mt-0.5 ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {change >= 0 ? "+" : ""}
                            {changePercent.toFixed(2)}%
                          </div>
                          {(() => {
                            const position = positions.find((item) => item.symbol === asset.symbol);
                            if (!position) {
                              return null;
                            }
                            const pnl = (asset.price - position.avgPrice) * position.quantity;
                            return (
                              <div className="mt-2 text-[12px] text-muted-foreground">
                                Avg: <span className="font-medium text-foreground">{formatEur(position.avgPrice)}</span>
                                {" · "}
                                P&L:{" "}
                                <span className={`font-semibold ${pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                  {pnl >= 0 ? "+" : "-"}
                                  {formatEur(Math.abs(pnl))}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm h-full flex items-center justify-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <TrendingUp className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-[20px] font-semibold text-foreground mb-2 tracking-tight">Select an Asset to Trade</h3>
                <p className="text-[15px] text-muted-foreground">
                  Click on any instrument from the list to view its performance and place orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={handleBackToList} className="p-2.5 hover:bg-accent rounded-xl transition-all duration-200 group">
                <ArrowLeft className="w-5 h-5 text-foreground group-hover:-translate-x-1 transition-transform duration-200" />
              </button>
              <div className="flex-1">
                <h2 className="text-[24px] font-semibold text-foreground tracking-tight">{selectedAsset?.symbol}</h2>
                <p className="text-[15px] text-muted-foreground mt-0.5">{selectedAsset?.name}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[14px] font-medium text-muted-foreground mb-2">Current Price</div>
                  <div className="text-[42px] font-semibold text-foreground tracking-tight leading-none">{selectedAsset ? formatEur(selectedAsset.price) : "€0,00"}</div>
                  <div className={`flex items-center gap-2 mt-3 ${priceChangePercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {priceChangePercent >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    <span className="text-[18px] font-semibold">
                      {priceChangePercent >= 0 ? "+" : ""}
                      {formatEur(priceChange)} ({priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                  {selectedPosition && (
                    <div className="mt-4 rounded-xl border border-border bg-card/70 px-4 py-3 text-[13px]">
                      <div className="text-muted-foreground">
                        Avg Buy-In: <span className="font-semibold text-foreground">{formatEur(selectedPosition.avgPrice)}</span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Position P&L:{" "}
                        <span className={`font-semibold ${selectedPositionPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {selectedPositionPnl >= 0 ? "+" : ""}
                          {formatEur(selectedPositionPnl)} ({selectedPositionPnlPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-4">
                    <div className="text-[13px] font-medium text-muted-foreground mb-1">Market Cap</div>
                    <div className="text-[17px] font-semibold text-foreground">{selectedAsset?.marketCap}</div>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-muted-foreground mb-1">Volume</div>
                    <div className="text-[17px] font-semibold text-foreground">{selectedAsset?.volume}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[18px] font-semibold text-foreground tracking-tight">Performance</h3>
                <div className="flex gap-2 bg-accent p-1 rounded-xl">
                  {(["1D", "1W", "1M", "1Y", "ALL"] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                        timeRange === range ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={priceData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={priceChangePercent >= 0 ? "#34d399" : "#f87171"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={priceChangePercent >= 0 ? "#34d399" : "#f87171"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.5} />
                  <XAxis dataKey="label" stroke="currentColor" className="text-muted-foreground" style={{ fontSize: "13px", fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="currentColor"
                    className="text-muted-foreground"
                    style={{ fontSize: "13px", fontWeight: 500 }}
                    domain={["auto", "auto"]}
                    tickFormatter={(value) => formatEur(value)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "var(--foreground)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number) => [formatEur(value), "Price"]}
                    labelStyle={{ fontWeight: 600, marginBottom: "4px" }}
                  />
                  <Line type="monotone" dataKey="price" stroke={priceChangePercent >= 0 ? "#34d399" : "#f87171"} strokeWidth={3} dot={false} fill="url(#colorPrice)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-6">
              <h3 className="text-[18px] font-semibold text-foreground mb-6 tracking-tight">Place Order</h3>

              <div className="mb-6">
                <label className="block text-[13px] font-medium text-muted-foreground mb-3">Order Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["buy", "sell", "short", "cover"] as OrderType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setOrderType(type);
                        setOrderFeedback(null);
                      }}
                      className={`py-3 rounded-xl font-semibold text-[14px] transition-all duration-200 ${
                        orderType === type
                          ? type === "buy" || type === "cover"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-red-500 text-white shadow-sm"
                          : "bg-accent text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[13px] font-medium text-muted-foreground mb-3">Order Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["market", "limit"] as OrderMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setOrderMode(mode)}
                      className={`py-3 rounded-xl font-semibold text-[14px] transition-all duration-200 ${
                        orderMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "bg-accent text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[13px] font-medium text-muted-foreground mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Enter quantity"
                  className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                />
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Held long: {heldLongQuantity.toLocaleString()} | Short: {heldShortQuantity.toLocaleString()}
                </p>
              </div>

              {orderMode === "limit" && (
                <div className="mb-6">
                  <label className="block text-[13px] font-medium text-muted-foreground mb-2">Limit Price</label>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(event) => setLimitPrice(event.target.value)}
                    placeholder="Enter limit price"
                    className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
              )}

              <div className="mb-6 p-4 bg-accent rounded-xl space-y-3">
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground font-medium">Estimated Cost</span>
                  <span className="text-foreground font-semibold">{formatEur(estimatedCost)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground font-medium">Available Cash</span>
                  <span className="text-foreground font-semibold">{formatEur(cash)}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between text-[14px]">
                  <span className="text-muted-foreground font-medium">After Trade</span>
                  <span className={`font-semibold ${projectedCashAfterTrade >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {formatEur(projectedCashAfterTrade)}
                  </span>
                </div>
              </div>

              {orderFeedback && (
                <div
                  className={`mb-4 p-3 rounded-xl text-[13px] font-medium flex items-start gap-2 ${
                    orderFeedback.kind === "success"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-500 border border-red-500/20"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{orderFeedback.text}</span>
                </div>
              )}

              <button
                onClick={handleSubmitOrder}
                disabled={!quantity || Number(quantity) <= 0}
                className={`w-full py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 ${
                  orderType === "buy" || orderType === "cover"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md"
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm`}
              >
                {orderType === "buy" && "Place Buy Order"}
                {orderType === "sell" && "Place Sell Order"}
                {orderType === "short" && "Place Short Order"}
                {orderType === "cover" && "Place Cover Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[20px] font-semibold text-foreground tracking-tight">Confirm Order</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-accent rounded-xl transition-all duration-200">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-5 bg-accent rounded-xl space-y-3">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-muted-foreground font-medium">Asset</span>
                    <span className="text-foreground font-semibold">{selectedAsset.symbol}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-muted-foreground font-medium">Order Type</span>
                    <span className={`font-semibold ${orderType === "buy" || orderType === "cover" ? "text-emerald-500" : "text-red-500"}`}>{orderType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-muted-foreground font-medium">Quantity</span>
                    <span className="text-foreground font-semibold">{quantity}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-muted-foreground font-medium">Price</span>
                    <span className="text-foreground font-semibold">
                      {formatEur(orderMode === "limit" ? Number(limitPrice || 0) : selectedAsset.price)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border text-[15px]">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className="text-foreground font-bold">{formatEur(estimatedCost)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-semibold text-[15px] bg-accent text-foreground hover:bg-muted transition-all duration-200">
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  className={`flex-1 py-3 rounded-xl font-semibold text-[15px] text-white transition-all duration-200 shadow-sm hover:shadow-md ${
                    orderType === "buy" || orderType === "cover" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
