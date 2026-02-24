import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Target, Activity, AlertCircle, Trophy, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatEur, formatEurCompact } from "../lib/currency";
import { usePortfolio } from "../state/portfolio";

// Mock data
const monthlyPnL = [
  { month: "Sep", net: 1600 },
  { month: "Oct", net: 2000 },
  { month: "Nov", net: -300 },
  { month: "Dec", net: 3200 },
  { month: "Jan", net: 2200 },
  { month: "Feb", net: 4250 },
];

type RiskLevel = "low" | "medium" | "high";
type AllocationKey = "stock" | "crypto" | "etf" | "derivative" | "cash";

export function RiskStats() {
  const { assets, positions, cash, totalValue } = usePortfolio();
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationKey>("stock");

  const assetBySymbol = useMemo(() => new Map(assets.map((asset) => [asset.symbol, asset])), [assets]);

  const categoryValues = useMemo(() => {
    const sums: Record<AllocationKey, number> = {
      stock: 0,
      crypto: 0,
      etf: 0,
      derivative: 0,
      cash,
    };

    positions.forEach((position) => {
      const asset = assetBySymbol.get(position.symbol);
      if (!asset) {
        return;
      }
      sums[asset.category] += Math.abs(position.quantity * asset.price);
    });
    return sums;
  }, [assetBySymbol, cash, positions]);

  const portfolioAllocation = useMemo(() => {
    const palette: Record<AllocationKey, string> = {
      stock: "#818cf8",
      crypto: "#22d3ee",
      etf: "#f59e0b",
      derivative: "#ef4444",
      cash: "#34d399",
    };
    const labels: Record<AllocationKey, string> = {
      stock: "Stocks",
      crypto: "Crypto",
      etf: "ETFs",
      derivative: "Derivatives",
      cash: "Cash",
    };
    const base = (Object.keys(categoryValues) as AllocationKey[]).map((key) => {
      const raw = categoryValues[key];
      const percent = totalValue > 0 ? (raw / totalValue) * 100 : 0;
      return {
        key,
        name: labels[key],
        value: Number(percent.toFixed(2)),
        color: palette[key],
        amount: raw,
      };
    });

    return base.filter((item) => item.value > 0.01 || item.key === "cash");
  }, [categoryValues, totalValue]);

  const allocationDetails = useMemo(() => {
    if (selectedAllocation === "cash") {
      return [];
    }
    return positions
      .filter((position) => {
        const asset = assetBySymbol.get(position.symbol);
        return asset?.category === selectedAllocation;
      })
      .map((position) => {
        const asset = assetBySymbol.get(position.symbol);
        if (!asset) {
          return null;
        }
        const marketValue = position.quantity * asset.price;
        const pnl = (asset.price - position.avgPrice) * position.quantity;
        return {
          symbol: position.symbol,
          name: position.name,
          quantity: position.quantity,
          avgPrice: position.avgPrice,
          marketValue,
          pnl,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [assetBySymbol, positions, selectedAllocation]);

  const selectedAllocationName = portfolioAllocation.find((item) => item.key === selectedAllocation)?.name ?? "Category";

  const stats = {
    totalTrades: 127,
    winningTrades: 82,
    losingTrades: 45,
    winRate: 64.57,
    profitFactor: 2.34,
    maxDrawdown: -8.5,
    avgWin: 285.50,
    avgLoss: -125.30,
    sharpeRatio: 1.85,
    totalProfit: 23410,
    totalLoss: -10015,
  };

  const riskLevel: RiskLevel = "medium";

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case "low": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "medium": return "text-warning bg-warning/10 border-warning/20";
      case "high": return "text-red-500 bg-red-500/10 border-red-500/20";
    }
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(2)}%`}
          icon={<Trophy className="w-5 h-5" />}
          subtitle={`${stats.winningTrades}/${stats.totalTrades} trades`}
          color="emerald"
        />
        <MetricCard
          title="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          icon={<Target className="w-5 h-5" />}
          subtitle="Risk/Reward ratio"
          color="indigo"
        />
        <MetricCard
          title="Max Drawdown"
          value={`${stats.maxDrawdown.toFixed(2)}%`}
          icon={<TrendingDown className="w-5 h-5" />}
          subtitle="Largest peak to trough"
          color="red"
        />
        <MetricCard
          title="Sharpe Ratio"
          value={stats.sharpeRatio.toFixed(2)}
          icon={<Activity className="w-5 h-5" />}
          subtitle="Risk-adjusted return"
          color="cyan"
        />
      </div>

      {/* Risk Level & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Indicator */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[18px] font-semibold text-foreground mb-6 tracking-tight">Risk Level</h3>
          
          <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center mb-6 ${getRiskLevelColor(riskLevel)}`}>
            <AlertCircle className="w-12 h-12 mb-3" />
            <div className="text-[36px] font-semibold capitalize tracking-tight">{riskLevel}</div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[14px]">
              <span className="text-muted-foreground font-medium">Portfolio Volatility</span>
              <span className="text-foreground font-semibold">Moderate</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-muted-foreground font-medium">Leverage Used</span>
              <span className="text-foreground font-semibold">1.5x</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-muted-foreground font-medium">Margin Utilization</span>
              <span className="text-foreground font-semibold">32%</span>
            </div>
          </div>
        </div>

        {/* Trading Statistics */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[18px] font-semibold text-foreground mb-8 tracking-tight">Trading Statistics</h3>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-2">Total Trades</div>
              <div className="text-[32px] font-semibold text-foreground tracking-tight">{stats.totalTrades}</div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-2">Winning Trades</div>
              <div className="text-[32px] font-semibold text-emerald-500 tracking-tight">{stats.winningTrades}</div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-2">Losing Trades</div>
              <div className="text-[32px] font-semibold text-red-500 tracking-tight">{stats.losingTrades}</div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-2">Win Rate</div>
              <div className="text-[32px] font-semibold text-foreground tracking-tight">{stats.winRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-2">Avg Win</div>
              <div className="text-[32px] font-semibold text-emerald-500 tracking-tight">{formatEur(stats.avgWin, 0)}</div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-2">Avg Loss</div>
              <div className="text-[32px] font-semibold text-red-500 tracking-tight">{formatEur(Math.abs(stats.avgLoss), 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly P&L Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[18px] font-semibold text-foreground mb-8 tracking-tight">Monthly Net P&L</h3>
          
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyPnL}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.5} />
              <XAxis 
                dataKey="month" 
                stroke="currentColor"
                className="text-muted-foreground"
                style={{ fontSize: '13px', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="currentColor"
                className="text-muted-foreground"
                style={{ fontSize: '13px', fontWeight: 500 }}
                tickFormatter={(value) => formatEurCompact(value)}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--foreground)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [formatEur(value), value >= 0 ? 'Net Profit' : 'Net Loss']}
                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
              />
              <Bar dataKey="net" radius={[12, 12, 0, 0]}>
                {monthlyPnL.map((entry, index) => (
                  <Cell key={`net-cell-${index}`} fill={entry.net >= 0 ? "#34d399" : "#f87171"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio Allocation */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-[18px] font-semibold text-foreground mb-8 tracking-tight">Portfolio Allocation</h3>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={portfolioAllocation}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {portfolioAllocation.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{ cursor: "pointer", opacity: selectedAllocation === entry.key ? 1 : 0.7 }}
                    onClick={() => setSelectedAllocation(entry.key)}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: "#ffffff" }}
                labelStyle={{ color: "#ffffff", fontWeight: 600 }}
                formatter={(value: number) => [`${value}%`, 'Allocation']}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-8 space-y-4">
            {portfolioAllocation.map((item) => (
              <button
                key={item.name}
                onClick={() => setSelectedAllocation(item.key)}
                className={`w-full flex items-center justify-between rounded-xl px-2 py-1.5 transition-colors ${
                  selectedAllocation === item.key ? "bg-accent" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-lg" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[14px] font-medium text-foreground">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-semibold text-foreground">{item.value}%</div>
                  <div className="text-[12px] text-muted-foreground">{formatEur(item.amount)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
        <h3 className="text-[18px] font-semibold text-foreground tracking-tight">{selectedAllocationName} Holdings</h3>
        {selectedAllocation === "cash" ? (
          <div className="mt-5 text-[15px] text-muted-foreground">
            Cash balance: <span className="font-semibold text-foreground">{formatEur(cash)}</span>
          </div>
        ) : allocationDetails.length === 0 ? (
          <div className="mt-5 text-[15px] text-muted-foreground">No open positions in this category.</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Symbol</th>
                  <th className="px-4 py-3 text-left text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Quantity</th>
                  <th className="px-4 py-3 text-left text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Avg Buy</th>
                  <th className="px-4 py-3 text-right text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Value</th>
                  <th className="px-4 py-3 text-right text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allocationDetails.map((item) => (
                  <tr key={item.symbol} className="hover:bg-muted/20">
                    <td className="px-4 py-4">
                      <div className="text-[14px] font-semibold text-foreground">{item.symbol}</div>
                      <div className="text-[12px] text-muted-foreground">{item.name}</div>
                    </td>
                    <td className="px-4 py-4 text-[14px] text-foreground">{item.quantity}</td>
                    <td className="px-4 py-4 text-[14px] text-foreground">{formatEur(item.avgPrice)}</td>
                    <td className="px-4 py-4 text-right text-[14px] text-foreground">{formatEur(item.marketValue)}</td>
                    <td className={`px-4 py-4 text-right text-[14px] font-semibold ${item.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {item.pnl >= 0 ? "+" : ""}
                      {formatEur(item.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 shadow-sm">
        <h3 className="text-[18px] font-semibold text-foreground mb-6 tracking-tight">Performance Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <ArrowUpRight className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-1">Total Profit</div>
              <div className="text-[26px] font-semibold text-emerald-500 tracking-tight">
                {formatEur(stats.totalProfit)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <ArrowDownRight className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-1">Total Loss</div>
              <div className="text-[26px] font-semibold text-red-500 tracking-tight">
                {formatEur(Math.abs(stats.totalLoss))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-muted-foreground mb-1">Net P&L</div>
              <div className="text-[26px] font-semibold text-primary tracking-tight">
                {formatEur(stats.totalProfit + stats.totalLoss)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle: string;
  color: "emerald" | "red" | "cyan" | "indigo";
}

function MetricCard({ title, value, icon, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    cyan: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  };

  return (
    <div className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-5">
        <span className="text-[14px] font-medium text-muted-foreground">{title}</span>
        <div className={`p-2.5 rounded-xl border ${colorClasses[color]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-[32px] font-semibold text-foreground tracking-tight">{value}</div>
        <div className="text-[13px] text-muted-foreground font-medium">{subtitle}</div>
      </div>
    </div>
  );
}
