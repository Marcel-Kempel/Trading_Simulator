import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { AuthLayout } from "./components/AuthLayout";
import { Dashboard } from "./pages/Dashboard";
import { Trading } from "./pages/Trading";
import { OrderHistory } from "./pages/OrderHistory";
import { RiskStats } from "./pages/RiskStats";
import { Cash } from "./pages/Cash";
import { Login } from "./pages/Login";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  {
    path: "/",
    Component: AuthLayout,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "trading", Component: Trading },
          { path: "cash", Component: Cash },
          { path: "orders", Component: OrderHistory },
          { path: "risk", Component: RiskStats },
        ],
      },
    ],
  },
]);
