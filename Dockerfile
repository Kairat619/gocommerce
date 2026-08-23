# Build stage
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server/

# Frontend build stage
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Production stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/server ./
COPY --from=frontend /app/public/build ./public/build
COPY --from=frontend /app/frontend/index.html ./frontend/index.html
COPY --from=frontend /app/frontend/public/ ./public/

RUN mkdir -p /app/sql/schema

EXPOSE 8080

ENV APP_ENV=production

CMD ["./server"]
