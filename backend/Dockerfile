# Build context = repo root (see docker-compose.yml)
FROM node:22-alpine
WORKDIR /app

# 先拷贝依赖清单，利用 Docker 层缓存
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# 再拷贝代码与前端静态资源
COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "server.js"]
