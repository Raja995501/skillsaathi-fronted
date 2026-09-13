# --- Stage 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# Build-time env vars (baked into the static bundle — Vite inlines VITE_* at build time,
# so these must be passed as --build-arg, not runtime env vars, unlike the backend).
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_WS_URL=/ws
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
