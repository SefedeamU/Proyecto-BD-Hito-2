package main

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store envuelve el pool de UNA base y concentra todas las consultas SQL al
// modelo relacional. Cada método mapea 1:1 con un endpoint de la API. El
// campo name indica a qué base está ligado este Store (para reportarlo).
type Store struct {
	pool *pgxpool.Pool
	name string
}

func emptyIfNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

// ListMaterials: catálogo paginado con filtros opcionales (texto, tipo, género).
func (s *Store) ListMaterials(ctx context.Context, search, tipo, genero string, limit, offset int) ([]Material, error) {
	var args []any
	where := []string{"1=1"}
	if search != "" {
		args = append(args, "%"+search+"%")
		where = append(where, "(m.alias ILIKE $"+itoa(len(args))+" OR m.eslogan ILIKE $"+itoa(len(args))+")")
	}
	if tipo != "" {
		args = append(args, tipo)
		where = append(where, "m.tipo = $"+itoa(len(args)))
	}
	join := ""
	if genero != "" {
		args = append(args, genero)
		join = "JOIN pertenece p ON p.material_id = m.id AND p.genero_nombre = $" + itoa(len(args))
	}
	args = append(args, limit)
	lim := "$" + itoa(len(args))
	args = append(args, offset)
	off := "$" + itoa(len(args))

	q := `
SELECT m.id, m.alias, m.tipo, m.anio_publicacion, m.idioma, m.pais,
       m.numero_paginas, m.eslogan, e.nombre, COALESCE(im.urls, '{}')
FROM material m
` + join + `
LEFT JOIN editorial e      ON e.id = m.editorial_id
LEFT JOIN imagenmaterial im ON im.material_id = m.id
WHERE ` + strings.Join(where, " AND ") + `
ORDER BY m.id
LIMIT ` + lim + ` OFFSET ` + off

	rows, err := s.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Material{}
	for rows.Next() {
		var m Material
		if err := rows.Scan(&m.ID, &m.Alias, &m.Tipo, &m.Anio, &m.Idioma, &m.Pais,
			&m.Paginas, &m.Eslogan, &m.Editorial, &m.Portadas); err != nil {
			return nil, err
		}
		m.Portadas = emptyIfNil(m.Portadas)
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) GetMaterial(ctx context.Context, id int64) (*MaterialDetalle, error) {
	var d MaterialDetalle
	err := s.pool.QueryRow(ctx, `
SELECT m.id, m.alias, m.tipo, m.anio_publicacion, m.idioma, m.pais,
       m.numero_paginas, m.eslogan, e.nombre, COALESCE(im.urls,'{}'), a.label
FROM material m
LEFT JOIN editorial e      ON e.id = m.editorial_id
LEFT JOIN imagenmaterial im ON im.material_id = m.id
LEFT JOIN agerate a        ON a.code = m.agerate_code
WHERE m.id = $1`, id).Scan(&d.ID, &d.Alias, &d.Tipo, &d.Anio, &d.Idioma, &d.Pais,
		&d.Paginas, &d.Eslogan, &d.Editorial, &d.Portadas, &d.AgeRate)
	if err != nil {
		return nil, err
	}
	d.Portadas = emptyIfNil(d.Portadas)

	// autores
	d.Autores = []Autor{}
	ar, err := s.pool.Query(ctx, `
SELECT a.id, a.nombre, a.apellido FROM escribe e
JOIN autor a ON a.id = e.autor_id WHERE e.material_id = $1`, id)
	if err != nil {
		return nil, err
	}
	for ar.Next() {
		var a Autor
		if err := ar.Scan(&a.ID, &a.Nombre, &a.Apellido); err != nil {
			ar.Close()
			return nil, err
		}
		d.Autores = append(d.Autores, a)
	}
	ar.Close()

	// géneros
	d.Generos = []string{}
	gr, err := s.pool.Query(ctx, `SELECT genero_nombre FROM pertenece WHERE material_id = $1`, id)
	if err != nil {
		return nil, err
	}
	for gr.Next() {
		var g string
		if err := gr.Scan(&g); err != nil {
			gr.Close()
			return nil, err
		}
		d.Generos = append(d.Generos, g)
	}
	gr.Close()

	// métricas de interacción
	_ = s.pool.QueryRow(ctx, `SELECT count(*) FROM likes WHERE material_id=$1`, id).Scan(&d.Likes)
	_ = s.pool.QueryRow(ctx, `SELECT count(*) FROM leer WHERE material_id=$1`, id).Scan(&d.Lecturas)
	_ = s.pool.QueryRow(ctx, `SELECT count(*), avg(puntaje) FROM resena WHERE material_id=$1`, id).Scan(&d.Resenas, &d.Puntaje)
	return &d, nil
}

func (s *Store) GetReviews(ctx context.Context, id int64) ([]Resena, error) {
	rows, err := s.pool.Query(ctx, `
SELECT code, usuario_username, comentario, puntaje, to_char(fecha,'YYYY-MM-DD'), likes
FROM resena WHERE material_id = $1 ORDER BY likes DESC, fecha DESC LIMIT 50`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Resena{}
	for rows.Next() {
		var r Resena
		if err := rows.Scan(&r.Code, &r.Usuario, &r.Comentario, &r.Puntaje, &r.Fecha, &r.Likes); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) Popular(ctx context.Context, limit int) ([]Popular, error) {
	rows, err := s.pool.Query(ctx, `
SELECT m.id, m.alias, m.tipo, m.anio_publicacion, m.idioma, m.pais,
       m.numero_paginas, m.eslogan, e.nombre, COALESCE(im.urls,'{}'),
       COALESCE(l.c,0), COALESCE(le.c,0), r.avg
FROM material m
LEFT JOIN editorial e       ON e.id = m.editorial_id
LEFT JOIN imagenmaterial im ON im.material_id = m.id
LEFT JOIN (SELECT material_id, count(*) c FROM likes  GROUP BY material_id) l  ON l.material_id  = m.id
LEFT JOIN (SELECT material_id, count(*) c FROM leer   GROUP BY material_id) le ON le.material_id = m.id
LEFT JOIN (SELECT material_id, count(*) c, avg(puntaje) avg FROM resena GROUP BY material_id) r ON r.material_id = m.id
ORDER BY COALESCE(l.c,0) DESC, COALESCE(le.c,0) DESC
LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Popular{}
	for rows.Next() {
		var p Popular
		if err := rows.Scan(&p.ID, &p.Alias, &p.Tipo, &p.Anio, &p.Idioma, &p.Pais,
			&p.Paginas, &p.Eslogan, &p.Editorial, &p.Portadas, &p.Likes, &p.Lecturas, &p.Puntaje); err != nil {
			return nil, err
		}
		p.Portadas = emptyIfNil(p.Portadas)
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) Genres(ctx context.Context) ([]string, error) {
	rows, err := s.pool.Query(ctx, `SELECT nombre FROM genero ORDER BY nombre`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var g string
		if err := rows.Scan(&g); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

func (s *Store) Stats(ctx context.Context) (map[string]int64, error) {
	out := map[string]int64{}
	for k, t := range map[string]string{
		"materiales": "material", "usuarios": "usuario", "autores": "autor",
		"resenas": "resena", "likes": "likes", "lecturas": "leer", "generos": "genero",
	} {
		var n int64
		if err := s.pool.QueryRow(ctx, "SELECT count(*) FROM "+t).Scan(&n); err != nil {
			return nil, err
		}
		out[k] = n
	}
	return out, nil
}

func (s *Store) Login(ctx context.Context, username, password string) (*Usuario, error) {
	var u Usuario
	err := s.pool.QueryRow(ctx, `
SELECT username, email, nombre, apellido, rol FROM usuario
WHERE username = $1 AND password = $2`, username, password).
		Scan(&u.Username, &u.Email, &u.Nombre, &u.Apellido, &u.Rol)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) Register(ctx context.Context, u Usuario, password string, edad int, ciudad string, telefono int64) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO usuario (username, email, password, nombre, apellido, edad, telefono, ciudad, rol)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Registrado')`,
		u.Username, u.Email, password, u.Nombre, u.Apellido, edad, telefono, ciudad)
	return err
}

func (s *Store) History(ctx context.Context, username string) ([]HistorialItem, error) {
	rows, err := s.pool.Query(ctx, `
SELECT m.id, m.alias, m.tipo, to_char(le.fecha,'YYYY-MM-DD'), COALESCE(im.urls,'{}')
FROM leer le
JOIN material m         ON m.id = le.material_id
LEFT JOIN imagenmaterial im ON im.material_id = m.id
WHERE le.usuario_username = $1
ORDER BY le.fecha DESC LIMIT 100`, username)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []HistorialItem{}
	for rows.Next() {
		var h HistorialItem
		if err := rows.Scan(&h.MaterialID, &h.Alias, &h.Tipo, &h.Fecha, &h.Portadas); err != nil {
			return nil, err
		}
		h.Portadas = emptyIfNil(h.Portadas)
		out = append(out, h)
	}
	return out, rows.Err()
}

// Like idempotente (PK = material+usuario).
func (s *Store) Like(ctx context.Context, materialID int64, username, email string) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO likes (material_id, usuario_username, usuario_email)
VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, materialID, username, email)
	return err
}

// CreateReview genera el code (max+1) y fija fecha=hoy, likes=0.
func (s *Store) CreateReview(ctx context.Context, materialID int64, username, email, comentario string, puntaje float64) error {
	_, err := s.pool.Exec(ctx, `
INSERT INTO resena (code, material_id, usuario_username, usuario_email, comentario, puntaje, fecha, likes)
VALUES ((SELECT COALESCE(MAX(code),0)+1 FROM resena), $1, $2, $3, $4, $5, CURRENT_DATE, 0)`,
		materialID, username, email, comentario, puntaje)
	return err
}
