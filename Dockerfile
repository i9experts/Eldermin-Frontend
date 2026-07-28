# --- Build stage ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes env vars in at BUILD time, so this must be passed as a
# build ARG (Railway auto-forwards a service variable of the same
# name as a build arg when it's declared here).
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Serve stage ---
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

# Railway assigns PORT dynamically — must bind to it, not a hardcoded port.
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
