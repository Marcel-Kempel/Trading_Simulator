import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./components/ThemeProvider";
import { PortfolioProvider } from "./state/portfolio";

export default function App() {
  return (
    <ThemeProvider>
      <PortfolioProvider>
        <div className="size-full">
          <RouterProvider router={router} />
        </div>
      </PortfolioProvider>
    </ThemeProvider>
  );
}
