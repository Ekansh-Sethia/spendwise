# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Provide API URL as argument for frontend build
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

# Stage 2: Build backend & serve
FROM node:20-alpine
WORKDIR /app/backend

COPY backend/package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev

COPY backend ./

# Copy frontend build output to backend's public folder
COPY --from=frontend-build /app/frontend/build ./public

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]
