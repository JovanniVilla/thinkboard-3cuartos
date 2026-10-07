# ==========================================
# Etapa 1: Compilación del Frontend (Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar manifiestos del frontend para maximizar caché de capas
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Copiar código y compilar bundle estático
COPY frontend/ ./
RUN npm run build

# ==========================================
# Etapa 2: Entorno de Producción (Backend)
# ==========================================
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copiar manifiestos de paquetes
COPY package*.json ./
COPY backend/package*.json ./backend/

# Instalación limpia y rápida sin dependencias de desarrollo ni auditorías de red
RUN npm ci --prefix backend --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copiar código fuente del backend
COPY backend/ ./backend/

# Copiar exclusivamente los archivos estáticos compilados del frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5001

CMD ["npm", "start"]
