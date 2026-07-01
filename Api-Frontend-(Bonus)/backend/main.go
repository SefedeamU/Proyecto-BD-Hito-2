// Biblioteca Literaria — API REST en Go sobre el modelo relacional del Hito 2.
// Maneja las 4 bases de volumen (1k/10k/100k/1m) y enruta cada consulta a la
// base que el frontend pida vía el header X-Database (o ?db=...). Lee la
// conexión desde variables de entorno (mismo esquema que faker/.env).
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
	"strings"
	"time"
)

type App struct{ db *DBManager }

// clave de contexto para pasar el Store (ligado a una base) a los handlers.
type ctxKey int

const storeKey ctxKey = 0

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func itoa(n int) string { return strconv.Itoa(n) }

func buildDSN(dbname string) string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		env("PGUSER", "bd_guest"),
		url.QueryEscape(env("PGPASSWORD", "")),
		env("PGHOST", "localhost"),
		env("PGPORT", "5432"),
		dbname,
		env("PGSSLMODE", "prefer"))
}

// CORS abierto: el front Angular (localhost:4200) consume esta API. Se permite
// el header X-Database para que el front elija la base.
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Database")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// withDB resuelve la base pedida (header X-Database o ?db=, o la default) y
// deja un Store ligado a esa base en el contexto del request.
func (a *App) withDB(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := r.Header.Get("X-Database")
		if name == "" {
			name = r.URL.Query().Get("db")
		}
		if name == "" {
			name = a.db.Default()
		}
		if !a.db.Allowed(name) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "base de datos no permitida: " + name})
			return
		}
		pool, err := a.db.Pool(name)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		ctx := context.WithValue(r.Context(), storeKey, &Store{pool: pool, name: name})
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func storeOf(r *http.Request) *Store { return r.Context().Value(storeKey).(*Store) }

func main() {
	// Allowlist: las 8 bases del experimento. Por cada volumen hay dos copias:
	//   _idx   = con el set de índices del informe (escenario "con índices")
	//   _noidx = sin NINGÚN índice (escenario "sin índices")
	// El frontend elige volumen + toggle de índices y arma el nombre completo,
	// que llega en el header X-Database.
	names := strings.Split(env("DATABASES", "bd_literaria_1k_idx,bd_literaria_1k_noidx,bd_literaria_10k_idx,bd_literaria_10k_noidx,bd_literaria_100k_idx,bd_literaria_100k_noidx,bd_literaria_1m_idx,bd_literaria_1m_noidx"), ",")
	for i := range names {
		names[i] = strings.TrimSpace(names[i])
	}
	def := env("PGDATABASE", "bd_literaria_10k_idx")
	mgr := NewDBManager(names, def)
	defer mgr.Close()

	// Ping a la base por defecto para fallar rápido si la conexión está mal.
	pool, err := mgr.Pool(def)
	if err != nil {
		log.Fatalf("config de la base por defecto: %v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("no se pudo conectar a la BD '%s': %v", def, err)
	}
	log.Printf("Bases disponibles: %s | por defecto: %s | host: %s", strings.Join(names, ", "), def, env("PGHOST", "localhost"))

	app := &App{db: mgr}
	mux := http.NewServeMux()
	app.routes(mux)

	addr := ":" + env("API_PORT", "7000")
	log.Printf("Biblioteca Literaria API escuchando en %s", addr)
	log.Fatal(http.ListenAndServe(addr, cors(app.withDB(mux))))
}

func (a *App) routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/health", a.health)
	mux.HandleFunc("GET /api/databases", a.databases)
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
