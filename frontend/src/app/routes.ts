import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Trading } from "./pages/Trading";
import { OrderHistory } from "./pages/OrderHistory";
import { RiskStats } from "./pages/RiskStats";
import { Cash } from "./pages/Cash";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "trading", Component: Trading },
      { path: "cash", Component: Cash },
      { path: "orders", Component: OrderHistory },
      { path: "risk", Component: RiskStats },
    ],
  },
]);
