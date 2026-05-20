# Etapa 1: Construir el Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend-user/package*.json ./
RUN npm ci
COPY frontend-user/ ./
RUN npm run build

# Etapa 2: Servidor de Producción
FROM node:20-alpine
WORKDIR /app

# Instalar dependencias del sistema requeridas para sqlite3 u otros binarios si es necesario
RUN apk add --no-cache python3 make g++

# Copiar package.json del root e instalar dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código del backend
COPY backend ./backend

# Copiar el build del frontend obtenido en la etapa 1
COPY --from=frontend-builder /app/frontend/dist ./frontend-user/dist

# Crear directorios para subidas de archivos y base de datos
RUN mkdir -p uploads backend/shared

# Exponer el puerto del API Gateway
EXPOSE 4000

# Ejecutar todos los servicios concurrentemente
CMD ["npm", "run", "start:all"]
