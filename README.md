# Trading Simulator

Full-stack paper trading simulator — **Spring Boot 3.4** REST API + **React + TypeScript** frontend.

## Prerequisites

- **Java 17+** — [download](https://adoptium.net/)
- **Maven 3.9+** — [download](https://maven.apache.org/download.cgi) (or use the included `mvnw` wrapper)
- **Node.js 18+** — [download](https://nodejs.org/)

## Running in VS Code

### Step 1: Open the project

Open the `trading-simulator` folder in VS Code:

```
File → Open Folder → select trading-simulator/
```

VS Code will prompt you to install recommended extensions — click **Install All**.
The key extensions are:
- **Extension Pack for Java** (Red Hat)
- **Spring Boot Extension Pack** (VMware)

### Step 2: Start the backend (Terminal 1)

Open a terminal in VS Code (`Ctrl+`` ` or `Terminal → New Terminal`):

```bash
cd backend
./mvnw spring-boot:run
```

On **Windows** use:
```cmd
cd backend
mvnw.cmd spring-boot:run
```

Wait until you see:
```
Broker API running → Started TradingSimulatorApplication on port 8080
```

### Step 3: Start the frontend (Terminal 2)

Open a **second** terminal (`+` button in the terminal panel):

```bash
cd frontend
npm install
npm run dev
```

Wait until you see:
```
VITE v6.x  ready in xxx ms
➜  Local: http://localhost:5173/
```

### Step 4: Use the app

Open **http://localhost:5173** in your browser. That's it!

### Alternative: Use VS Code Tasks

Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac) to run the **Start Full Stack** task, which launches both backend and frontend in parallel.

---

## Project Structure

```
trading-simulator/
├── .vscode/                          VS Code workspace config
│   ├── launch.json                   Debug configurations
│   ├── tasks.json                    Build/run tasks
│   ├── settings.json                 Workspace settings
│   └── extensions.json               Recommended extensions
│
├── backend/                          Spring Boot 3.4 + Java 17
│   ├── pom.xml                       Maven build file
│   ├── mvnw / mvnw.cmd              Maven wrapper scripts
│   ├── .mvn/wrapper/                 Maven wrapper config
│   └── src/
│       ├── main/java/com/tradex/
│       │   ├── TradingSimulatorApplication.java   Entry point
│       │   ├── config/
│       │   │   ├── BrokerConfig.java              Broker settings
│       │   │   └── CorsConfig.java                CORS filter
│       │   ├── controller/
│       │   │   ├── AccountController.java         Account/order/fill endpoints
│       │   │   └── MarketController.java          Symbols/quotes endpoints
│       │   ├── model/
│       │   │   ├── Account.java                   Internal account entity
│       │   │   ├── AccountSummary.java            Account response DTO
│       │   │   ├── CreateAccountRequest.java      Request DTO
│       │   │   ├── Fill.java                      Trade execution record
│       │   │   ├── Order.java                     Order entity
│       │   │   ├── OrderRequest.java              Request DTO
│       │   │   ├── Position.java                  Position response DTO
│       │   │   └── Quote.java                     Market quote DTO
│       │   └── service/
│       │       ├── BrokerService.java             Trading engine
│       │       ├── MarketDataService.java         Interface
│       │       └── ReplayMarketDataService.java   Historical data replay
│       ├── main/resources/
│       │   ├── application.properties             Server + broker config
│       │   └── replay-quotes.json                 Stock price dataset
│       └── test/java/com/tradex/
│           └── TradingSimulatorApiTests.java      Integration tests
│
├── frontend/                          Vite + React 18 + TypeScript
│   ├── index.html                     HTML shell
│   ├── package.json                   Node dependencies
│   ├── tsconfig.json                  TypeScript config
│   ├── vite.config.ts                 Vite + proxy config
│   └── src/
│       ├── main.tsx                   Entry point
│       ├── app/App.tsx                Dashboard shell
│       ├── components/
│       │   ├── AccountSummary.tsx     Equity/P&L metrics bar
│       │   ├── OrderEntry.tsx         Buy/sell order form
│       │   ├── PositionsTable.tsx     Positions/orders/fills tabs
│       │   ├── QuotePanel.tsx         Stock watchlist
│       │   └── StatusBar.tsx          Header status
│       ├── lib/api.ts                 REST API client
│       └── styles/index.css           Dark trading terminal theme
│
├── package.json                       Root scripts
├── .gitignore
└── README.md
```

## REST API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/actuator/health`          | Spring Actuator health   |
| GET    | `/symbols`                  | List stock symbols       |
| GET    | `/quotes?symbol=AAPL`       | Get bid/ask/mid quote    |
| POST   | `/accounts`                 | Create trading account   |
| GET    | `/accounts/{id}`            | Account summary          |
| GET    | `/accounts/{id}/positions`  | Open positions           |
| POST   | `/accounts/{id}/orders`     | Place market order       |
| GET    | `/accounts/{id}/orders`     | Order history            |
| GET    | `/accounts/{id}/fills`      | Trade fills              |

### Quick API Test (with curl)

```bash
# Health check
curl http://localhost:8080/actuator/health

# Get quote
curl "http://localhost:8080/quotes?symbol=AAPL"

# Create account
curl -X POST http://localhost:8080/accounts \
  -H "Content-Type: application/json" \
  -d '{"initialCapital": 100000}'

# Buy 10 AAPL (replace YOUR_ACCOUNT_ID)
curl -X POST http://localhost:8080/accounts/YOUR_ACCOUNT_ID/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","side":"BUY","quantity":10}'
```

## Broker Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
server.port=8080
broker.commission-per-trade=1.50
broker.fee-rate-bps=1
broker.base-spread-bps=8
broker.base-slippage-bps=2
broker.random-slippage-bps=4
broker.size-impact-bps=0.3
```

## Running Tests

```bash
cd backend
./mvnw test
```

## Available Symbols

AAPL · MSFT · GOOGL · AMZN · TSLA · NVDA · META · JPM

## Contributors

Marcel · Yash · Moritz · Sandra · Justus
