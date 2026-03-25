# =========================================================
# Dockerfile: Backend (Java / Spring Boot)
# =========================================================
# Multi-Stage Build:
# 1. Build-Stage → kompiliert die Anwendung mit Maven
# 2. Runtime-Stage → schlankes Image nur zum Ausführen
# =========================================================


# =========================================================
# STAGE 1: BUILD
# =========================================================
# Verwendet Maven + JDK 17 zum Bauen der Anwendung
# =========================================================
FROM maven:3.9-eclipse-temurin-17 AS build

# Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiert zuerst nur die pom.xml (für Dependency-Caching)
COPY pom.xml .

# Lädt alle Abhängigkeiten herunter (wird gecached)
RUN mvn dependency:go-offline

# Kopiert den restlichen Source Code
COPY src ./src

# Baut das Projekt (ohne Tests für schnelleren Build)
RUN mvn clean package -DskipTests


# =========================================================
# STAGE 2: RUNTIME
# =========================================================
# Schlankes Image nur zum Ausführen der Anwendung
# =========================================================
FROM eclipse-temurin:17-jre

# Arbeitsverzeichnis
WORKDIR /app

# Kopiert das fertige JAR aus der Build-Stage
COPY --from=build /app/target/*.jar app.jar

# Dokumentiert, dass der Container Port 8080 nutzt
EXPOSE 8080

# Startet die Anwendung
ENTRYPOINT ["java", "-jar", "app.jar"]