import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./components/ThemeProvider";
import { PortfolioProvider } from "./state/portfolio";
import { AuthProvider } from "./state/auth";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortfolioProvider>
          <div className="size-full">
            <RouterProvider router={router} />
          </div>
        </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}