import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, TrendingUp, History, Target, User, Bell, Landmark } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/trading", label: "Trading", icon: TrendingUp },
  { path: "/cash", label: "Cash", icon: Landmark },
  { path: "/orders", label: "Order History", icon: History },
  { path: "/risk", label: "Risk & Stats", icon: Target },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-semibold text-sidebar-foreground tracking-tight">TradeSimX</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                <span className="text-[15px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/50 transition-all duration-200 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-md" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-sidebar-foreground truncate">Demo Trader</p>
              <p className="text-[12px] text-sidebar-foreground/60 truncate">demo@tradesim.app</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 backdrop-blur-sm">
          <div>
            <h1 className="text-[20px] font-semibold text-foreground tracking-tight">
              {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
