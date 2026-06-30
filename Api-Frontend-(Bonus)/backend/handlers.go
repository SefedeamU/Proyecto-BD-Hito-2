package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func fail(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func pathID(r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	return id, err == nil
}

func qInt(r *http.Request, key string, def int) int {
	if v := r.URL.Query().Get(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func (a *App) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{"status": "ok", "db": env("PGDATABASE", "bd_literaria_10k")})
}

func (a *App) stats(w http.ResponseWriter, r *http.Request) {
	s, err := a.store.Stats(r.Context())
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, s)
}

func (a *App) genres(w http.ResponseWriter, r *http.Request) {
	g, err := a.store.Genres(r.Context())
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, g)
}

func (a *App) popular(w http.ResponseWriter, r *http.Request) {
	limit := qInt(r, "limit", 20)
	if limit > 50 {
		limit = 50
	}
	p, err := a.store.Popular(r.Context(), limit)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, p)
}

func (a *App) listMaterials(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit := qInt(r, "limit", 24)
	if limit > 60 {
		limit = 60
	}
	offset := qInt(r, "offset", 0)
	m, err := a.store.ListMaterials(r.Context(),
		strings.TrimSpace(q.Get("search")), q.Get("type"), q.Get("genre"), limit, offset)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, m)
}

func (a *App) getMaterial(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		fail(w, 400, "id inválido")
		return
	}
	d, err := a.store.GetMaterial(r.Context(), id)
	if err != nil {
		fail(w, 404, "material no encontrado")
		return
	}
	writeJSON(w, 200, d)
}

func (a *App) getReviews(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		fail(w, 400, "id inválido")
		return
	}
	rs, err := a.store.GetReviews(r.Context(), id)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, rs)
}

func (a *App) login(w http.ResponseWriter, r *http.Request) {
	var body struct{ Username, Password string }
	if json.NewDecoder(r.Body).Decode(&body) != nil {
		fail(w, 400, "JSON inválido")
		return
	}
	u, err := a.store.Login(r.Context(), body.Username, body.Password)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	if u == nil {
		fail(w, 401, "usuario o contraseña incorrectos")
		return
	}
	writeJSON(w, 200, u)
}

func (a *App) register(w http.ResponseWriter, r *http.Request) {
	var b struct {
		Username, Email, Password, Nombre, Apellido, Ciudad string
		Edad                                                int
		Telefono                                            int64
	}
	if json.NewDecoder(r.Body).Decode(&b) != nil {
		fail(w, 400, "JSON inválido")
		return
	}
	if len(b.Password) != 12 {
		fail(w, 400, "la contraseña debe tener exactamente 12 caracteres")
		return
	}
	if b.Edad < 12 {
		fail(w, 400, "la edad mínima es 12")
		return
	}
	if b.Telefono == 0 {
		b.Telefono = 900000000
	}
	u := Usuario{Username: b.Username, Email: b.Email, Nombre: b.Nombre, Apellido: b.Apellido, Rol: "Registrado"}
	if err := a.store.Register(r.Context(), u, b.Password, b.Edad, b.Ciudad, b.Telefono); err != nil {
		fail(w, 409, "no se pudo registrar (¿usuario o email ya existe?): "+err.Error())
		return
	}
	writeJSON(w, 201, u)
}

func (a *App) history(w http.ResponseWriter, r *http.Request) {
	h, err := a.store.History(r.Context(), r.PathValue("username"))
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, h)
}

func (a *App) likeMaterial(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		fail(w, 400, "id inválido")
		return
	}
	var b struct{ Username, Email string }
	if json.NewDecoder(r.Body).Decode(&b) != nil || b.Username == "" {
		fail(w, 400, "se requiere username y email")
		return
	}
	if err := a.store.Like(r.Context(), id, b.Username, b.Email); err != nil {
		fail(w, 409, "no se pudo dar like: "+err.Error())
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (a *App) createReview(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r)
	if !ok {
		fail(w, 400, "id inválido")
		return
	}
	var b struct {
		Username, Email, Comentario string
		Puntaje                     float64
	}
	if json.NewDecoder(r.Body).Decode(&b) != nil || b.Username == "" || b.Comentario == "" {
		fail(w, 400, "se requiere username, email, comentario y puntaje")
		return
	}
	if b.Puntaje < 0 || b.Puntaje > 10 {
		fail(w, 400, "el puntaje debe estar entre 0 y 10")
		return
	}
	if err := a.store.CreateReview(r.Context(), id, b.Username, b.Email, b.Comentario, b.Puntaje); err != nil {
		fail(w, 409, "no se pudo crear la reseña (¿ya reseñaste este material?): "+err.Error())
		return
	}
	writeJSON(w, 201, map[string]string{"status": "ok"})
}
