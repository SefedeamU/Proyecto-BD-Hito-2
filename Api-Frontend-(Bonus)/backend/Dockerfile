# --- build ---
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 go build -trimpath -o /api .

# --- runtime ---
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=build /api /api
EXPOSE 7000
ENTRYPOINT ["/api"]
