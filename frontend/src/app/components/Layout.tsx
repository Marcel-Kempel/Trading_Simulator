import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, TrendingUp, History, Target, User, Bell, Landmark, Wifi, WifiOff, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../state/auth";

type ConnectionStatus = "checking" | "connected" | "disconnected";

function useBackendStatus(intervalMs = 5000) {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const check = async () => {
      const start = performance.now();
      try {
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(4000) });
        if (!mountedRef.current) return;
        if (res.ok) { setStatus("connected"); setLatency(Math.round(performance.now() - start)); }
        else { setStatus("disconnected"); setLatency(null); }
      } catch {
        if (!mountedRef.current) return;
        setStatus("disconnected"); setLatency(null);
      }
    };
    check();
    const id = setInterval(check, intervalMs);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [intervalMs]);

  return { status, latency };
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/trading", label: "Trading", icon: TrendingUp },
  { path: "/cash", label: "Cash", icon: Landmark },
  { path: "/orders", label: "Order History", icon: History },
  { path: "/risk", label: "Risk & Stats", icon: Target },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { status, latency } = useBackendStatus();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-semibold text-sidebar-foreground tracking-tight">TradeSimX</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}>
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                <span className="text-[15px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-md flex items-center justify-center text-white text-[14px] font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-sidebar-foreground truncate">{user?.name || "Guest"}</p>
              <p className="text-[12px] text-sidebar-foreground/60 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/60 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200">
            <LogOut className="w-5 h-5" />
            <span className="text-[15px] font-medium">Abmelden</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 backdrop-blur-sm">
          <h1 className="text-[20px] font-semibold text-foreground tracking-tight">
            {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
          </h1>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-300 ${
              status === "connected" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : status === "disconnected" ? "bg-red-500/10 text-red-500 border border-red-500/20"
              : "bg-muted text-muted-foreground border border-border"
            }`}>
              {status === "connected" ? <Wifi className="w-3.5 h-3.5" />
               : status === "disconnected" ? <WifiOff className="w-3.5 h-3.5" />
               : <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              <span>{status === "connected" ? `API Connected${latency ? ` · ${latency}ms` : ""}` : status === "disconnected" ? "API Offline" : "Connecting..."}</span>
            </div>
            <ThemeToggle />
            <button className="relative p-2.5 hover:bg-accent rounded-xl transition-all duration-200 group">
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
            </button>
            <button className="p-2.5 hover:bg-accent rounded-xl transition-all duration-200 group">
              <User className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-background p-8"><Outlet /></main>
      </div>
    </div>
  );
}
