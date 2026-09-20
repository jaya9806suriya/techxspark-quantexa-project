# Full-Stack Multi-Stage Dockerfile for Quantum Traffic Command Center
FROM node:22-alpine AS builder
WORKDIR /app

# Install Python & build tools
RUN apk add --no-cache python3 py3-pip make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache python3 py3-pip

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.cjs"]
