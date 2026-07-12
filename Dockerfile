# ============================================================
# Muskets — Single-container multi-stage build
# Stage 1: Build frontend (Vite)
# Stage 2: Build backend (Maven) + embed frontend static assets
# Stage 3: Runtime (JRE only)
# ============================================================

# --- Stage 1: Frontend ---
FROM node:24.4.1-alpine3.21 AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Backend ---
FROM eclipse-temurin:25-jdk AS backend-build
WORKDIR /app

# Copy Maven wrapper and POM first for dependency caching
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:resolve -B --no-transfer-progress

# Copy source code
COPY backend/src/ src/

# Embed frontend build output into Spring Boot static resources
COPY --from=frontend-build /frontend/dist/ src/main/resources/static/

# Package the application (skip tests — they run separately)
RUN ./mvnw package -B -DskipTests --no-transfer-progress

# --- Stage 3: Runtime ---
FROM eclipse-temurin:25-jre
WORKDIR /app

# Create data directory for H2 file-mode persistence
RUN mkdir -p /data && chown 1000:1000 /data
VOLUME /data

COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
