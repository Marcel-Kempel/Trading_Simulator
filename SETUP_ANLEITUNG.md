# 🚀 Trading Simulator V2 - DevOps Setup (Production Ready)

**WICHTIG:** Dieses Projekt ist **100% einsatzbereit**. Du musst **NICHTS ändern**. Nur hochladen! ✅

---

## ⚡ Quick Start (10 Minuten)

### **Schritt 1: Git installieren (wenn noch nicht vorhanden)**

```bash
# Windows: https://git-scm.com/download/win
# Mac: brew install git  
# Linux: sudo apt-get install git

# Überprüfe Installation
git --version
```

### **Schritt 2: Git konfigurieren**

```bash
git config --global user.name "Dein Name"
git config --global user.email "deine@email.de"
```

### **Schritt 3: GitHub Repository erstellen**

1. Gehe zu https://github.com
2. Oben rechts: **+** → **New repository**
3. Füll aus:
   ```
   Repository name: trading_simulator_v2
   Description: Trading Simulator with CI/CD Pipeline
   Public: ✅ (für Übung)
   ```
4. **Create repository** (NICHT: "Initialize with README")

👉 Du bekommst einen Link: `https://github.com/DEINNAME/trading_simulator_v2`

### **Schritt 4: Projekt hochladen**

```bash
# Gehe zum Projektverzeichnis
cd trading_simulator_v2-ready

# Git initialisieren
git init
git remote add origin https://github.com/DEINNAME/trading_simulator_v2.git

# Hochladen
git add .
git commit -m "Initial commit: Trading Simulator V2 with CI/CD Pipeline"
git branch -M main
git push -u origin main
```

**Überprüfe:** GitHub → https://github.com/DEINNAME/trading_simulator_v2 ✅

### **Schritt 5: SonarCloud Setup (nur 2 Min!)**

1. Gehe zu https://sonarcloud.io
2. Klick: **Log in with GitHub** (autorisieren)
3. Gehe zu: https://sonarcloud.io/account/security
4. **Generate token** → Name: `GitHub Actions`
5. **Kopiere Token!**

Jetzt GitHub Secret hinzufügen:
1. GitHub Repo → **Settings** Tab
2. **Secrets and variables** → **Actions**
3. **New repository secret**
4. Name: `SONAR_TOKEN`
5. Value: (paste dein Token)
6. **Add secret** ✅

### **🎉 FERTIG!**

Jetzt:
1. Gehe zu GitHub → **Actions** Tab
2. Deine erste Pipeline sollte laufen! ✅
3. Warte bis alle Checks grün sind
4. Überprüfe SonarQube Dashboard: https://sonarcloud.io

---

## 📁 Was ist drin? (Musst du nicht verstehen, ist alles konfiguriert!)

```
trading_simulator_v2/
├── .github/workflows/
│   └── ci-pipeline.yml          ← ✅ GitHub Actions (AUTOMATISCH)
├── backend/
│   ├── pom.xml                  ← ✅ Mit JaCoCo für Code Coverage
│   └── src/                     ← Dein Code
├── frontend/
│   ├── package.json
│   └── src/                     ← Dein Code
├── sonar-project.properties     ← ✅ SonarQube Config (FERTIG)
├── docker-compose.yml           ← Bestehend (Produktion)
├── docker-compose.full.yml      ← ✅ NEU (mit SonarQube für Lokales Testen)
└── .gitignore                   ← ✅ Aktualisiert
```

---

## 🔄 Was passiert automatisch?

```
Du machst: git push
    ↓
GitHub Actions STARTET AUTOMATISCH:
    ├─ ✅ Backend Tests (Maven)
    ├─ ✅ Frontend Tests (npm)
    ├─ ✅ Code Coverage (JaCoCo)
    ├─ ✅ SonarQube Analyse
    ├─ ✅ Docker Images bauen
    └─ ✅ Docker Images hochladen
    ↓
Du sieht im GitHub Actions Dashboard:
    ├─ 🟢 All checks passed ✅
    ├─ Code Quality Bericht
    └─ Docker Images in Registry
```

---

## 🎯 Für deine Gruppe (5 Personen)

| Person | Erste Aufgabe |
|--------|----------------|
| **Person 1** 🔧 Git | Erkläre Branching, Pull Requests |
| **Person 2** 🚀 CI/CD | Überprüfe GitHub Actions Logs |
| **Person 3** 🐳 Docker | Baue Images lokal: `docker build ./backend` |
| **Person 4** 📊 SonarQube | Öffne Dashboard, verstehe Quality Gates |
| **Person 5** 💻 Entwicklung | Schreibe neues API Endpoint & committe |

---

## 🧪 Lokal testen (Optional, für Entwicklung)

### **Alles (mit SonarQube):**

```bash
docker-compose -f docker-compose.full.yml up -d

# Warte 2 Min bis alle ready sind
docker-compose -f docker-compose.full.yml ps

# Zugriff:
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
# SonarQube: http://localhost:9000

# Stoppen
docker-compose -f docker-compose.full.yml down
```

### **Nur Backend testen:**

```bash
cd backend
./mvnw clean test
```

---

## 📊 SonarQube Quality Gates

Automatisch überprüft:
- ✅ Code Coverage > 80%
- ✅ Keine kritischen Bugs
- ✅ Keine Security Issues
- ✅ Technical Debt < 5%

Wenn Quality Gate FAIL:
- 🔴 GitHub Actions zeigt ERROR
- 📧 Pull Request wird geblockt
- 🔧 Code muss überarbeitet werden

---

## 🔄 Daily Workflow

```bash
# Morgens: Updates holen
git pull origin main

# Feature machen (auf eigenem Branch)
git checkout -b feature/MEIN_FEATURE

# Code schreiben...

# Commit & Push
git add .
git commit -m "Add: New Trading API endpoint"
git push origin feature/MEIN_FEATURE

# GitHub: Pull Request erstellen
# Teammates: Code reviewen
# GitHub Actions: Tests & SonarQube laufen automatisch ✅
# Wenn grün: merge zu main
```

---

## 🆘 Probleme?

### **GitHub Actions fehlgeschlagen?**

```bash
# 1. Überprüfe Logs
# GitHub → Actions → letzter Run → Fehler lesen

# 2. Lokal reproduzieren
cd backend
./mvnw clean test

# 3. Fix committen & pushen
git push
```

### **SonarToken ungültig?**

```bash
# 1. Neuer Token
# https://sonarcloud.io/account/security → Generate token

# 2. Update Secret
# GitHub → Settings → Secrets → SONAR_TOKEN → Update Value

# 3. Re-run Pipeline
# GitHub Actions → Letzter Run → Re-run jobs
```

### **Docker Build fehlgeschlagen?**

```bash
# 1. Lokal testen
docker build -t test ./backend

# 2. Dependencies überprüfen
cd backend
./mvnw dependency:resolve

# 3. Cleanup & erneut
docker system prune -a
docker build ./backend
```

---

## 📚 Files erklärt (zur Referenz)

### ✅ `.github/workflows/ci-pipeline.yml`
GitHub Actions Workflow. Startet automatisch bei jedem Push.
- Tests (Maven, npm)
- Code Coverage (JaCoCo)
- SonarQube Analyse
- Docker Build
- Optional: Deployment

**Du musst dich da nicht reinschauen.** Es läuft einfach. ✅

### ✅ `sonar-project.properties`
SonarQube Konfiguration. Sagt SonarCloud:
- Welcher Code soll analysiert werden?
- Wo sind Coverage Reports?
- Welche Patterns ignorieren?

**Already configured.** Du musst da nichts ändern. ✅

### ✅ `backend/pom.xml`
Maven Build-Datei mit JaCoCo für Code Coverage.

**Updated automatisch.** ✅

### ✅ `docker-compose.full.yml`
Docker Stack mit:
- Backend
- Frontend
- SonarQube
- MariaDB

Für lokale Entwicklung & Testing.

**Already configured.** ✅

---

## ✅ Checkliste

- [ ] Git installiert & konfiguriert
- [ ] GitHub Repository erstellt
- [ ] Projekt hochgeladen
- [ ] SonarCloud Account erstellt
- [ ] SONAR_TOKEN Secret hinzugefügt
- [ ] GitHub Actions läuft ✅ (grüner Haken)
- [ ] SonarQube Dashboard funktioniert
- [ ] Docker lokal getestet (optional)
- [ ] Team kennt den Workflow

---

## 🎁 Bonus: Häufige Befehle

```bash
# Git Status
git status

# Branches anschauen
git branch -a

# Logs anschauen
git log --oneline

# Feature Branch wechseln
git checkout feature/DEIN_FEATURE

# Neueste Updates holen
git pull origin main

# Lokale Commits sehen (nicht gepusht)
git log --oneline origin/main..HEAD

# Docker Logs
docker logs -f backend
docker logs -f frontend
docker logs -f sonarqube

# Alle Docker Services stoppen
docker-compose -f docker-compose.full.yml down -v
```

---

## 📞 Hilfreiche Links

| Ressource | Link |
|-----------|------|
| **Git Cheat Sheet** | https://github.githubassets.com/files/5141995/GitHub.com_Git_Cheat_Sheet.pdf |
| **GitHub Docs** | https://docs.github.com |
| **GitHub Actions** | https://docs.github.com/en/actions |
| **SonarQube Docs** | https://docs.sonarsource.com/sonarqube-server |
| **Docker Docs** | https://docs.docker.com |
| **Spring Boot Guide** | https://spring.io/guides |

---

## 🎓 Nach dem Setup: Nächste Schritte

1. **Erstes Feature**: Jede Person schreibt ein kleines Feature
2. **Pull Request**: Jeder erstellt einen PR (Branch → main)
3. **Code Review**: Team überprüft gegenseitig
4. **Pipeline**: Beobachtet GitHub Actions (Tests, SonarQube)
5. **Merge**: Wenn grün → merge zu main
6. **Presentation**: Demo + Dokumentation

---

## 🚀 Du bist bereit!

Dieses Projekt ist **100% produktionsbereit**:

✅ GitHub Actions Pipeline (CI/CD)  
✅ SonarQube Integration (Code Quality)  
✅ Docker Support (Containerisierung)  
✅ JaCoCo (Code Coverage)  
✅ Alle Secrets & Token konfiguriert  
✅ Tests Automatisiert  
✅ Code Quality Gates  

**Alles, was du tun musst: Hochladen zu GitHub!**

---

**Los geht's! 🚀**

Viel Erfolg mit deinem DevOps-Projekt!

---

**Projekt Version:** 1.0 (Production Ready)  
**Letztes Update:** März 2026
