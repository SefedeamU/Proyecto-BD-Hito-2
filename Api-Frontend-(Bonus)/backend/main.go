// Biblioteca Literaria — API REST en Go sobre el modelo relacional del Hito 2.
// Lee la conexión desde variables de entorno (mismo esquema que faker/.env).
// Sirve en el puerto 7000 (configurable con API_PORT).
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct{ store *Store }

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func itoa(n int) string { return strconv.Itoa(n) }

func buildDSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		env("PGUSER", "bd_guest"),
		url.QueryEscape(env("PGPASSWORD", "")),
		env("PGHOST", "localhost"),
		env("PGPORT", "5432"),
		env("PGDATABASE", "bd_literaria_10k"),
		env("PGSSLMODE", "prefer"))
}

// CORS abierto: el front Angular (localhost:4200) consume esta API.
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	cfg, err := pgxpool.ParseConfig(buildDSN())
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	cfg.MaxConns = 8
	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		log.Fatalf("pool: %v", err)
	}
	defer pool.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("no se pudo conectar a la BD: %v", err)
	}
	log.Printf("Conectado a la base '%s' en %s", env("PGDATABASE", "bd_literaria_10k"), env("PGHOST", "localhost"))

	app := &App{store: &Store{pool: pool}}
	mux := http.NewServeMux()
	app.routes(mux)

	addr := ":" + env("API_PORT", "7000")
	log.Printf("Biblioteca Literaria API escuchando en %s", addr)
	log.Fatal(http.ListenAndServe(addr, cors(mux)))
}

func (a *App) routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/health", a.health)
	mux.HandleFunc("GET /api/stats", a.stats)
	mux.HandleFunc("GET /api/genres", a.genres)
	mux.HandleFunc("GET /api/options", a.options)
	mux.HandleFunc("GET /api/search", a.search)
	mux.HandleFunc("GET /api/popular", a.popular)
	mux.HandleFunc("GET /api/materials", a.listMaterials)
	mux.HandleFunc("GET /api/materials/{id}", a.getMaterial)
	mux.HandleFunc("GET /api/materials/{id}/reviews", a.getReviews)
	mux.HandleFunc("POST /api/materials/{id}/reviews", a.createReview)
	mux.HandleFunc("POST /api/materials/{id}/like", a.likeMaterial)
	mux.HandleFunc("POST /api/login", a.login)
	mux.HandleFunc("POST /api/register", a.register)
	mux.HandleFunc("GET /api/users/{username}/history", a.history)
}
