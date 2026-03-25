# =========================================================
# Dockerfile: Frontend (Node.js / Vite)
# =========================================================
# Dieses Setup startet eine Frontend-App im Dev-Modus.
#
# Eigenschaften:
# - Nutzt leichtgewichtiges Alpine-Image
# - Installiert Dependencies
# - Startet Dev-Server (z.B. Vite)
# =========================================================


# =========================================================
# BASE IMAGE
# =========================================================
# Node.js 18 auf Alpine Linux (klein & schnell)
# =========================================================
FROM node:18-alpine

# Arbeitsverzeichnis im Container
WORKDIR /app


# =========================================================
# DEPENDENCIES INSTALLIEREN
# =========================================================
# Erst package.json kopieren → besseres Layer-Caching
# =========================================================
COPY package*.json ./

# Installiert alle Node-Abhängigkeiten
RUN npm install


# =========================================================
# APPLICATION CODE
# =========================================================
# Kopiert den restlichen Source Code
# =========================================================
COPY . .


# =========================================================
# NETWORK
# =========================================================
# Dokumentiert den Port des Dev-Servers
# =========================================================
EXPOSE 3000


# =========================================================
# START COMMAND
# =========================================================
# Startet den Dev-Server und macht ihn von außen erreichbar
# (--host notwendig für Docker)
# =========================================================
CMD ["npm", "run", "dev", "--", "--host"]