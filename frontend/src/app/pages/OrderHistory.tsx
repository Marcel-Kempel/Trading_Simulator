import { useState } from "react";
import { Filter, Download, CheckCircle, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { usePortfolio } from "../state/portfolio";
import type { OrderStatus } from "../state/portfolio";
import { formatEur } from "../lib/currency";

export function OrderHistory() {
  const { orders } = usePortfolio();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [filterSymbol, setFilterSymbol] = useState("");

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSymbol = !filterSymbol || order.symbol.toLowerCase().includes(filterSymbol.toLowerCase());
    return matchesStatus && matchesSymbol;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "executed":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[13px] font-semibold">
            <CheckCircle className="w-4 h-4" />
            Executed
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-[13px] font-semibold">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      case "margin_call":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning/10 text-warning text-[13px] font-semibold">
            <AlertTriangle className="w-4 h-4" />
            Margin Call
          </span>
        );
    }
  };

  const getOrderTypeColor = (type: string) => {
    if (type === "buy" || type === "cover") return "text-emerald-500";
    return "text-red-500";
  };

  const getOrderTypeIcon = (type: string) => {
    if (type === "buy" || type === "cover") return <ArrowUpRight className="w-4 h-4" />;
    return <ArrowDownRight className="w-4 h-4" />;
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
          <div className="text-[14px] font-medium text-muted-foreground mb-2">Total Orders</div>
          <div className="text-[32px] font-semibold text-foreground tracking-tight">{orders.length}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200">
          <div className="text-[14px] font-medium text-muted-foreground mb-2">Executed</div>
          <div className="text-[32px] font-semibold text-emerald-500 tracking-tight">
            {orders.filter(o => o.status === "executed").length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-200">
          <div className="text-[14px] font-medium text-muted-foreground mb-2">Rejected</div>
          <div className="text-[32px] font-semibold text-red-500 tracking-tight">
            {orders.filter(o => o.status === "rejected").length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-warning/5 transition-all duration-200">
          <div className="text-[14px] font-medium text-muted-foreground mb-2">Margin Calls</div>
          <div className="text-[32px] font-semibold text-warning tracking-tight">
            {orders.filter(o => o.status === "margin_call").length}
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header with Filters */}
        <div className="p-8 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-[19px] font-semibold text-foreground tracking-tight">Order History</h2>
              <p className="text-[14px] text-muted-foreground mt-0.5">View and filter all your orders</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as OrderStatus | "all")}
                  className="px-4 py-2.5 bg-accent border border-border rounded-xl text-foreground text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="executed">Executed</option>
                  <option value="rejected">Rejected</option>
                  <option value="margin_call">Margin Call</option>
                </select>
              </div>
              
              <input
                type="text"
                placeholder="Filter by symbol..."
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
                className="px-4 py-2.5 bg-accent border border-border rounded-xl text-foreground text-[14px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
              
              <button className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center gap-2 transition-all duration-200 font-semibold text-[14px] shadow-sm hover:shadow-md">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 backdrop-blur-sm">
              <tr>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Mode</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="px-8 py-4 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-muted/20 transition-colors duration-150">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[13px] font-mono text-muted-foreground group-hover:text-primary transition-colors">{order.id}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-[14px] font-medium text-foreground">{order.date}</div>
                    <div className="text-[13px] text-muted-foreground mt-0.5">{order.time}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[15px] font-semibold text-foreground">{order.symbol}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className={`font-semibold uppercase text-[14px] flex items-center gap-1.5 ${getOrderTypeColor(order.type)}`}>
                      {getOrderTypeIcon(order.type)}
                      {order.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[14px] font-medium text-foreground capitalize">{order.orderMode}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[14px] font-medium text-foreground">{order.quantity}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[14px] font-medium text-foreground">{formatEur(order.price)}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-[15px] font-semibold text-foreground">{formatEur(order.total)}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-[15px] text-muted-foreground">No orders found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
