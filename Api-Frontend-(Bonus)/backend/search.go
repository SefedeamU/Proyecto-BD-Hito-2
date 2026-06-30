package main

import (
	"context"
	"fmt"
	"strings"
)

// SearchResult: material + métricas agregadas (para mostrar en resultados).
type SearchResult struct {
	Material
	TotalLikes    int      `json:"total_likes"`
	TotalLecturas int      `json:"total_lecturas"`
	TotalResenas  int      `json:"total_resenas"`
	PromedioPunt  *float64 `json:"promedio_puntaje"`
	NumAutores    int      `json:"num_autores"`
}

// SearchParams: TODOS los parámetros de búsqueda posibles sobre el modelo.
// (Sin búsqueda por texto/título: los alias del faker son genéricos y no
// producen resultados interesantes; el valor está en los filtros estructurales.)
type SearchParams struct {
	// --- atributos directos de Material ---
	Tipo    string // Libro/Ensayo/Revista/Poema/AudioBook
	Idioma  string
	Pais    string
	AnioMin, AnioMax       *int // rango de año de publicación (BETWEEN)
	PaginasMin, PaginasMax *int // rango de páginas
	// --- editorial ---
	Editorial      string // nombre (ILIKE)
	EditorialPais  string
	FundacionMin, FundacionMax *int // año de fundación de la editorial (rango)
	// --- clasificación de edad (AgeRate) ---
	AgeRate       string // label
	ViolenciaMax  *int
	SexualidadMax *int
	// --- géneros / subgéneros ---
	Genero    string
	SubGenero string
	// --- autores ---
	Autor     string // nombre o apellido (ILIKE)
	AutorID   *int
	AutorPais string
	// --- premios ---
	ConPremio        bool
	Premio           string // nombre del premio
	PremioCategoria  string
	RelevanciaMin    *int
	// --- ilustraciones / curiosidades ---
	ConIlustraciones bool
	TipoArte         string
	Artista          string
	ConCuriosidades  bool
	// --- métricas (agregados, estilo HAVING) ---
	MinLikes, MinLecturas, MinResenas *int
	PuntajeMin, PuntajeMax            *float64
	MinAutores                        *int
	MultiAutor                        bool
	ConResenas                        bool
	// --- orden / paginación ---
	Order  string
	Limit  int
	Offset int
}

// orderClauses: whitelist (evita inyección por el parámetro de orden).
var orderClauses = map[string]string{
	"relevancia":   "m.id",
	"anio_asc":     "m.anio_publicacion ASC, m.id",
	"anio_desc":    "m.anio_publicacion DESC, m.id",
	"paginas_asc":  "m.numero_paginas ASC, m.id",
	"paginas_desc": "m.numero_paginas DESC, m.id",
	"likes":        "total_likes DESC, m.id",
	"lecturas":     "total_lecturas DESC, m.id",
	"resenas":      "total_resenas DESC, m.id",
	"puntaje":      "promedio_puntaje DESC NULLS LAST, m.id",
	"populares":    "total_likes DESC, total_lecturas DESC, m.id",
}

type qbuilder struct {
	args  []any
	conds []string
}

// add: agrega una condición con uno o más placeholders ($%d) y un valor.
func (b *qbuilder) add(condFmt string, val any) {
	b.args = append(b.args, val)
	b.conds = append(b.conds, fmt.Sprintf(condFmt, len(b.args)))
}

func (s *Store) Search(ctx context.Context, p SearchParams) ([]SearchResult, error) {
	b := &qbuilder{}

	// ----- atributos directos de Material -----
	if p.Tipo != "" {
		b.add("m.tipo = $%d", p.Tipo)
	}
	if p.Idioma != "" {
		b.add("m.idioma = $%d", p.Idioma)
	}
	if p.Pais != "" {
		b.add("m.pais = $%d", p.Pais)
	}
	if p.AnioMin != nil {
		b.add("m.anio_publicacion >= $%d", *p.AnioMin)
	}
	if p.AnioMax != nil {
		b.add("m.anio_publicacion <= $%d", *p.AnioMax)
	}
	if p.PaginasMin != nil {
		b.add("m.numero_paginas >= $%d", *p.PaginasMin)
	}
	if p.PaginasMax != nil {
		b.add("m.numero_paginas <= $%d", *p.PaginasMax)
	}

	// ----- editorial -----
	if p.Editorial != "" {
		b.add("e.nombre ILIKE $%d", "%"+p.Editorial+"%")
	}
	if p.EditorialPais != "" {
		b.add("e.pais = $%d", p.EditorialPais)
	}
	if p.FundacionMin != nil {
		b.add("EXTRACT(YEAR FROM e.fundacion) >= $%d", *p.FundacionMin)
	}
	if p.FundacionMax != nil {
		b.add("EXTRACT(YEAR FROM e.fundacion) <= $%d", *p.FundacionMax)
	}

	// ----- clasificación de edad -----
	if p.AgeRate != "" {
		b.add("a.label = $%d", p.AgeRate)
	}
	if p.ViolenciaMax != nil {
		b.add("a.violence <= $%d", *p.ViolenciaMax)
	}
	if p.SexualidadMax != nil {
		b.add("a.sexuality <= $%d", *p.SexualidadMax)
	}

	// ----- géneros / subgéneros (EXISTS) -----
	if p.Genero != "" {
		b.add("EXISTS (SELECT 1 FROM pertenece pg WHERE pg.material_id = m.id AND pg.genero_nombre = $%d)", p.Genero)
	}
	if p.SubGenero != "" {
		b.add("EXISTS (SELECT 1 FROM pertenecesubgenero ps WHERE ps.material_id = m.id AND ps.subgenero_nombre = $%d)", p.SubGenero)
	}

	// ----- autores (EXISTS sobre Escribe -> Autor) -----
	if p.Autor != "" {
		b.add("EXISTS (SELECT 1 FROM escribe es JOIN autor au ON au.id = es.autor_id WHERE es.material_id = m.id AND (au.nombre ILIKE $%[1]d OR au.apellido ILIKE $%[1]d))", "%"+p.Autor+"%")
	}
	if p.AutorID != nil {
		b.add("EXISTS (SELECT 1 FROM escribe es WHERE es.material_id = m.id AND es.autor_id = $%d)", *p.AutorID)
	}
	if p.AutorPais != "" {
		b.add("EXISTS (SELECT 1 FROM escribe es JOIN autor au ON au.id = es.autor_id WHERE es.material_id = m.id AND au.pais = $%d)", p.AutorPais)
	}

	// ----- premios -----
	if p.ConPremio {
		b.conds = append(b.conds, "EXISTS (SELECT 1 FROM ganar gn WHERE gn.material_id = m.id)")
	}
	if p.Premio != "" {
		b.add("EXISTS (SELECT 1 FROM ganar gn WHERE gn.material_id = m.id AND gn.premio_nombre = $%d)", p.Premio)
	}
	if p.PremioCategoria != "" {
		b.add("EXISTS (SELECT 1 FROM ganar gn JOIN premio pr ON pr.nombre = gn.premio_nombre WHERE gn.material_id = m.id AND pr.categoria = $%d)", p.PremioCategoria)
	}
	if p.RelevanciaMin != nil {
		b.add("EXISTS (SELECT 1 FROM ganar gn JOIN premio pr ON pr.nombre = gn.premio_nombre WHERE gn.material_id = m.id AND pr.relevancia >= $%d)", *p.RelevanciaMin)
	}

	// ----- ilustraciones / curiosidades -----
	if p.ConIlustraciones {
		b.conds = append(b.conds, "EXISTS (SELECT 1 FROM contiene co WHERE co.material_id = m.id)")
	}
	if p.TipoArte != "" {
		b.add("EXISTS (SELECT 1 FROM contiene co JOIN ilustracion il ON il.code = co.ilustracion_code WHERE co.material_id = m.id AND il.tipodearte = $%d)", p.TipoArte)
	}
	if p.Artista != "" {
		b.add("EXISTS (SELECT 1 FROM contiene co JOIN ilustracion il ON il.code = co.ilustracion_code WHERE co.material_id = m.id AND il.artista ILIKE $%d)", "%"+p.Artista+"%")
	}
	if p.ConCuriosidades {
		b.conds = append(b.conds, "EXISTS (SELECT 1 FROM tiene tc WHERE tc.material_id = m.id)")
	}

	// ----- métricas (filtros sobre los LEFT JOIN agregados) -----
	if p.MinLikes != nil {
		b.add("COALESCE(lk.c,0) >= $%d", *p.MinLikes)
	}
	if p.MinLecturas != nil {
		b.add("COALESCE(le.c,0) >= $%d", *p.MinLecturas)
	}
	if p.MinResenas != nil {
		b.add("COALESCE(rs.c,0) >= $%d", *p.MinResenas)
	}
	if p.ConResenas {
		b.conds = append(b.conds, "COALESCE(rs.c,0) > 0")
	}
	if p.PuntajeMin != nil {
		b.add("rs.avg >= $%d", *p.PuntajeMin)
	}
	if p.PuntajeMax != nil {
		b.add("rs.avg <= $%d", *p.PuntajeMax)
	}
	if p.MultiAutor {
		b.conds = append(b.conds, "(SELECT count(*) FROM escribe ea WHERE ea.material_id = m.id) > 1")
	}
	if p.MinAutores != nil {
		b.add("(SELECT count(*) FROM escribe ea WHERE ea.material_id = m.id) >= $%d", *p.MinAutores)
	}

	where := "1=1"
	if len(b.conds) > 0 {
		where = strings.Join(b.conds, "\n  AND ")
	}

	order := orderClauses[p.Order]
	if order == "" {
		order = orderClauses["relevancia"]
	}

	limit, offset := p.Limit, p.Offset
	b.args = append(b.args, limit)
	limPh := fmt.Sprintf("$%d", len(b.args))
	b.args = append(b.args, offset)
	offPh := fmt.Sprintf("$%d", len(b.args))

	q := `
SELECT m.id, m.alias, m.tipo, m.anio_publicacion, m.idioma, m.pais,
       m.numero_paginas, m.eslogan, e.nombre, COALESCE(im.urls,'{}'),
       COALESCE(lk.c,0), COALESCE(le.c,0), COALESCE(rs.c,0), rs.avg,
       (SELECT count(*) FROM escribe ec WHERE ec.material_id = m.id)
FROM material m
LEFT JOIN editorial e        ON e.id = m.editorial_id
LEFT JOIN agerate a          ON a.code = m.agerate_code
LEFT JOIN imagenmaterial im  ON im.material_id = m.id
LEFT JOIN (SELECT material_id, count(*) c FROM likes  GROUP BY material_id) lk ON lk.material_id = m.id
LEFT JOIN (SELECT material_id, count(*) c FROM leer   GROUP BY material_id) le ON le.material_id = m.id
LEFT JOIN (SELECT material_id, count(*) c, avg(puntaje) avg FROM resena GROUP BY material_id) rs ON rs.material_id = m.id
WHERE ` + where + `
ORDER BY ` + order + `
LIMIT ` + limPh + ` OFFSET ` + offPh

	rows, err := s.pool.Query(ctx, q, b.args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SearchResult{}
	for rows.Next() {
		var r SearchResult
		if err := rows.Scan(&r.ID, &r.Alias, &r.Tipo, &r.Anio, &r.Idioma, &r.Pais,
			&r.Paginas, &r.Eslogan, &r.Editorial, &r.Portadas,
			&r.TotalLikes, &r.TotalLecturas, &r.TotalResenas, &r.PromedioPunt, &r.NumAutores); err != nil {
			return nil, err
		}
		r.Portadas = emptyIfNil(r.Portadas)
		out = append(out, r)
	}
	return out, rows.Err()
}

// Options: listas para poblar los desplegables de la búsqueda avanzada.
func (s *Store) Options(ctx context.Context) (map[string]any, error) {
	out := map[string]any{"tipos": []string{"Libro", "Ensayo", "Revista", "Poema", "AudioBook"}}
	lists := map[string]string{
		"idiomas":          "SELECT DISTINCT idioma FROM material ORDER BY 1",
		"paises":           "SELECT DISTINCT pais FROM material ORDER BY 1",
		"editorial_paises": "SELECT DISTINCT pais FROM editorial ORDER BY 1",
		"autor_paises":     "SELECT DISTINCT pais FROM autor ORDER BY 1",
		"generos":          "SELECT nombre FROM genero ORDER BY 1",
		"subgeneros":       "SELECT DISTINCT nombre FROM subgenero ORDER BY 1",
		"agerates":         "SELECT DISTINCT label FROM agerate ORDER BY 1",
		"premios":          "SELECT DISTINCT nombre FROM premio ORDER BY 1",
		"premio_categorias": "SELECT DISTINCT categoria FROM premio ORDER BY 1",
		"tipos_arte":       "SELECT DISTINCT tipodearte FROM ilustracion ORDER BY 1",
	}
	for key, sql := range lists {
		rows, err := s.pool.Query(ctx, sql)
		if err != nil {
			return nil, err
		}
		arr := []string{}
		for rows.Next() {
			var v string
			if err := rows.Scan(&v); err != nil {
				rows.Close()
				return nil, err
			}
			arr = append(arr, v)
		}
		rows.Close()
		out[key] = arr
	}
	return out, nil
}
