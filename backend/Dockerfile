# ============================================================
# Stage 1: Build the Spring Boot application using Maven
# ============================================================
FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

# Copy Maven wrapper configuration and descriptors first for optimal layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Normalize line endings in wrapper script and make it executable
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Resolve project dependencies (cache layer)
RUN ./mvnw dependency:go-offline -B --no-transfer-progress || true

# Copy project source code
COPY src/ src/

# Build production JAR (skip tests during container packaging for speed)
RUN ./mvnw clean package -B -DskipTests --no-transfer-progress

# ============================================================
# Stage 2: Minimal runtime image with Eclipse Temurin JRE 25
# ============================================================
FROM eclipse-temurin:25-jre

WORKDIR /app

# Create dedicated directory for H2 database file-mode persistence
RUN mkdir -p /app/data

# Copy compiled JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Render injects PORT env variable dynamically; default to 8080 locally
ENV PORT=8080
EXPOSE 8080

# Configure JVM for container environments (optimal memory sizing for Render)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# Start the Spring Boot application
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT} -jar app.jar"]
