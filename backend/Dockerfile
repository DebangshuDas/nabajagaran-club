
# Stage 1: Build Spring Boot application
FROM gradle:8-jdk21 AS build

WORKDIR /app

COPY . .

RUN chmod +x gradlew
RUN ./gradlew clean bootJar --no-daemon

# Stage 2: Run application
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-10000} -jar app.jar"]
