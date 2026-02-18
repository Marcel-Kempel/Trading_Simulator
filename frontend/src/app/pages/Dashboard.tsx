import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Euro, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { usePortfolio } from "../state/portfolio";
import type { PortfolioRange } from "../state/portfolio";
import { formatEur } from "../lib/currency";

const ranges: PortfolioRange[] = ["1D", "1W", "1M", "1Y", "ALL"];

export function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState<PortfolioRange>("1W");
  const { assets, positions, getInvestmentPerformanceSeries, totalValue, todayChange, todayPercent, investmentGainLoss, investmentReturnPercent } = usePortfolio();
  const isTodayPositive = todayChange >= 0;
  const isInvestmentPositive = investmentGainLoss >= 0;
  const series = getInvestmentPerformanceSeries(range);

  const rangeSubtitle = {
    "1D": "Last 24 hours",
    "1W": "Last 7 days",
    "1M": "Last 30 days",
    "1Y": "Last 12 months",
    ALL: "All available history",
  }[range];

  const positionsWithPrice = useMemo(
    () =>
      positions
        .map((position) => {
          const asset = assets.find((item) => item.symbol === position.symbol);
          if (!asset) {
            return null;
          }
          const pnl = (asset.price - position.avgPrice) * position.quantity;
          const pnlPercent = position.avgPrice > 0
            ? position.quantity >= 0
              ? ((asset.price - position.avgPrice) / position.avgPrice) * 100
              : ((position.avgPrice - asset.price) / position.avgPrice) * 100
            : 0;
          return {
            ...position,
            currentPrice: asset.price,
            pnl,
            pnlPercent,
          };
        })
        .filter((position): position is NonNullable<typeof position> => position !== null),
    [assets, positions],
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Portfolio Value"
          value={formatEur(totalValue)}
          icon={<Euro className="w-5 h-5" />}
          subtitle="Cash + holdings"
          trend={todayPercent}
          isPositive={isTodayPositive}
        />
        <StatCard
          title="Today's Change"
          value={formatEur(todayChange)}
          icon={isTodayPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          subtitle="Since midnight"
          trend={todayPercent}
          isPositive={isTodayPositive}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[19px] font-semibold text-foreground tracking-tight">Portfolio Performance</h2>
              <p className="text-[14px] text-muted-foreground mt-0.5">
                {rangeSubtitle} · {formatEur(investmentGainLoss)} ({investmentReturnPercent >= 0 ? "+" : ""}{investmentReturnPercent.toFixed(2)}%)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 bg-accent p-1 rounded-xl">
                {ranges.map((item) => (
                  <button
                    key={item}
                    onClick={() => setRange(item)}
                    className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                      range === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isInvestmentPositive ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {isInvestmentPositive ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                <span className={`text-[15px] font-semibold ${isInvestmentPositive ? "text-emerald-500" : "text-red-500"}`}>
                  {investmentReturnPercent >= 0 ? "+" : ""}
                  {investmentReturnPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          key={range}
          initial={{ opacity: 0.65, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={series}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.5} />
              <XAxis dataKey="label" stroke="currentColor" className="text-muted-foreground" style={{ fontSize: "13px", fontWeight: 500 }} tickLine={false} axisLine={false} />
              <YAxis
                stroke="currentColor"
                className="text-muted-foreground"
                style={{ fontSize: "13px", fontWeight: 500 }}
                tickFormatter={(value) => `${value >= 0 ? "+" : ""}${Number(value).toFixed(1)}%`}
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
                formatter={(value: number, _name, item) => {
                  const gainLoss = (item?.payload?.gainLoss as number | undefined) ?? 0;
                  return [`${value >= 0 ? "+" : ""}${value.toFixed(2)}% (${formatEur(gainLoss)})`, "Investment Return"];
                }}
                labelStyle={{ fontWeight: 600, marginBottom: "4px" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isInvestmentPositive ? "#34d399" : "#f87171"}
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={550}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-8 border-b border-border">
          <h2 className="text-[19px] font-semibold text-foreground tracking-tight">Open Positions</h2>
          <p className="text-[14px] text-muted-foreground mt-0.5">Click a row to open stock performance</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 backdrop-blur-sm">
              <tr>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Price</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Current Price</th>
                <th className="px-8 py-4 text-right text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {positionsWithPrice.map((position) => (
                <tr
                  key={position.symbol}
                  className="group hover:bg-muted/20 transition-colors duration-150 cursor-pointer"
                  onClick={() => navigate(`/trading?symbol=${position.symbol}`)}
                >
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div>
                      <div className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors">{position.symbol}</div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">{position.name}</div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[15px] font-medium text-foreground">{position.quantity}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[15px] font-medium text-foreground">{formatEur(position.avgPrice)}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[15px] font-medium text-foreground">{formatEur(position.currentPrice)}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <div className="inline-flex flex-col items-end">
                      <div className={`text-[15px] font-semibold ${position.pnl >= 0 ? "text-emerald-500" : "text-red-500"} flex items-center gap-1.5`}>
                        {position.pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {formatEur(Math.abs(position.pnl))}
                      </div>
                      <div className={`text-[13px] font-medium mt-0.5 ${position.pnl >= 0 ? "text-emerald-500/70" : "text-red-500/70"}`}>
                        {position.pnl >= 0 ? "+" : ""}
                        {position.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  isPositive?: boolean;
  subtitle?: string;
}

function StatCard({ title, value, icon, trend, isPositive = true, subtitle }: StatCardProps) {
  const bgClass = isPositive ? "bg-emerald-500/10" : "bg-red-500/10";
  const colorClass = isPositive ? "text-emerald-500" : "text-red-500";

  return (
    <div className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[14px] font-medium text-muted-foreground">{title}</span>
        <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform duration-200`}>{icon}</div>
      </div>
      <div className="space-y-2">
        <div className="text-[28px] font-semibold text-foreground tracking-tight">{value}</div>
        <div className="flex items-center justify-between">
          {subtitle && <span className="text-[13px] text-muted-foreground">{subtitle}</span>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1.5 text-[14px] font-medium ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>
                {isPositive ? "+" : ""}
                {trend.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
