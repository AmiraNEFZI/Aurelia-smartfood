# ── Étape 1 : Build avec Maven ───────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Télécharge les dépendances d'abord (cache Docker)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Étape 2 : Image runtime légère ──────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copie uniquement le JAR final
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Port exposé
EXPOSE 8080

# Lancement
ENTRYPOINT ["java", "-jar", "app.jar"]
