# Multi-stage Dockerfile for React Frontend

# Stage 1: Build React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code and build
COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
