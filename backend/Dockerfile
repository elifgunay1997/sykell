# ---- Build Stage ----
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server main.go

# ---- Run Stage ----
FROM alpine:latest
WORKDIR /app

# Install netcat for wait-for-it script
RUN apk add --no-cache netcat-openbsd

# Copy wait-for-it script and make it executable
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Copy the built server
COPY --from=builder /app/server ./server

EXPOSE 8080
CMD ["./server"] 