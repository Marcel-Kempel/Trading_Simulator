# TradeSimX – Trading Simulator

Full-Stack Paper-Trading-Simulator mit **Spring Boot 3.4** REST API, **React + TypeScript** Frontend und vollständiger **DevOps-Pipeline**.

## Tech Stack

| Bereich | Technologien |
|---------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Spring Boot 3.4, Java 17, Maven, JPA/Hibernate |
| Datenbank | MariaDB 11 (lokal), MySQL 8.0 (Cloud) |
| Infrastruktur | Docker Compose, Google Cloud Run, Cloud SQL |
| CI/CD | GitHub Actions (3-Job-Pipeline) |
| Code-Qualität | SonarCloud (Automatic Analysis) |

## Schnellstart

### Option 1: Docker Compose (empfohlen)

```bash
git clone https://github.com/Marcel-Kempel/Trading_Simulator.git
cd Trading_Simulator
docker compose up
```

Die App startet 4 Container:

| Container | Beschreibung | Port |
|-----------|-------------|------|
| `mariadb_init` | Entwicklungs-Datenbank | 3307 |
| `mariadb_persistent` | Persistente Datenbank | 3308 |
| `backend` | Spring Boot REST API | 8080 |
| `frontend` | Vite Dev Server | 5173 |

Öffne **http://localhost:5173** im Browser.

### Option 2: Manuell mit VS Code

**Terminal 1 – Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Cloud Deployment

Die Anwendung läuft produktiv auf **Google Cloud Run**:
https://tradesimx-frontend-246532816778.europe-west10.run.app

### Architektur

```
Browser → Frontend (Cloud Run, Nginx) → Backend (Cloud Run, Spring Boot) → Cloud SQL (MySQL 8.0)
                                         ↕ Cloud SQL Proxy (Unix Socket)
```

- **Frontend:** Nginx serviert statische Dateien und leitet `/api/*` an das Backend weiter
- **Backend:** Spring Boot verbindet sich über Cloud SQL Proxy zur Datenbank
- **Datenbank:** Cloud SQL MySQL 8.0 in `europe-west10` (Berlin)

## CI/CD Pipeline

Die Pipeline wird bei jedem Push und Pull Request automatisch ausgeführt:

```
Push/PR → Backend CI ──┐
                       ├──→ Deploy (nur auf main)
Push/PR → Frontend CI ─┘
```

**Job 1 – Backend CI:** MariaDB Service-Container, Java 17, Maven Build + Tests
**Job 2 – Frontend CI:** Node.js 20, TypeScript Type-Check, Vite Build
**Job 3 – Deploy:** Docker Images bauen, in Artifact Registry pushen, auf Cloud Run deployen

- Backend und Frontend CI laufen **parallel**
- Deploy läuft **nur auf main** und erst nach erfolgreichem CI
- Authentifizierung bei Google Cloud via **Workload Identity Federation**

## Qualitätssicherung

**SonarCloud** analysiert den Code automatisch bei jedem Push:

- Statische Codeanalyse (Bugs, Code Smells, Vulnerabilities)
- Security Hotspots
- Quality Gate als Check im Pull Request

Konfiguration: `sonar-project.properties` im Projektroot.

## REST API

| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| POST | `/api/auth/register` | Benutzer registrieren |
| POST | `/api/auth/login` | Benutzer anmelden |
| GET | `/actuator/health` | Health Check |
| GET | `/symbols` | Verfügbare Aktien |
| GET | `/quotes?symbol=AAPL` | Aktienkurs abfragen |
| POST | `/accounts` | Trading-Konto erstellen |
| GET | `/accounts/{id}` | Konto-Übersicht |
| GET | `/accounts/{id}/positions` | Offene Positionen |
| POST | `/accounts/{id}/orders` | Order aufgeben |
| GET | `/accounts/{id}/orders` | Order-Historie |
| GET | `/accounts/{id}/fills` | Ausgeführte Trades |

**Verfügbare Symbole:** AAPL · MSFT · GOOGL · AMZN · TSLA · NVDA · META · JPM

## Projektstruktur

```
Trading_Simulator/
├── .github/workflows/
│   └── ci-cd.yml                  CI/CD Pipeline
├── backend/                       Spring Boot 3.4 + Java 17
│   ├── Dockerfile                 Container-Image für Backend
│   ├── pom.xml                    Maven Dependencies
│   └── src/
│       ├── main/java/com/tradex/
│       │   ├── controller/        REST Controller (Auth, Account, Market)
│       │   ├── model/             JPA Entities + DTOs
│       │   ├── service/           Business Logic (Broker, MarketData)
│       │   └── config/            CORS, Broker-Konfiguration
│       └── test/                  Integration Tests
├── frontend/                      React + TypeScript + Vite
│   ├── Dockerfile                 Dev Container-Image
│   ├── Dockerfile.prod            Produktions-Image (Nginx)
│   ├── nginx.conf                 Nginx Reverse Proxy Config
│   └── src/
│       ├── app/                   Login, Dashboard, Routing
│       ├── components/            UI-Komponenten (Orders, Quotes, Positions)
│       ├── state/                 Auth State Management
│       └── styles/                Dark Trading Terminal Theme
├── docker-compose.yml             4-Container Setup (lokal)
├── init.sql                       Datenbank-Schema + Testdaten
└── sonar-project.properties       SonarCloud Konfiguration
```

## Tests ausführen

```bash
cd backend
./mvnw test
```

## Contributors

Marcel · Yash · Moritz · Sandra · Justus
