package main

// Modelos serializados a JSON para el front-end Angular.

type Material struct {
	ID       int64    `json:"id"`
	Alias    *string  `json:"alias"`
	Tipo     string   `json:"tipo"`
	Anio     int      `json:"anio_publicacion"`
	Idioma   string   `json:"idioma"`
	Pais     string   `json:"pais"`
	Paginas  int      `json:"numero_paginas"`
	Eslogan  *string  `json:"eslogan"`
	Editorial *string `json:"editorial"`
	Portadas []string `json:"portadas"`
}

type MaterialDetalle struct {
	Material
	AgeRate  *string  `json:"agerate"`
	Autores  []Autor  `json:"autores"`
	Generos  []string `json:"generos"`
	Likes    int      `json:"total_likes"`
	Lecturas int      `json:"total_lecturas"`
	Resenas  int      `json:"total_resenas"`
	Puntaje  *float64 `json:"promedio_puntaje"`
}

type Autor struct {
	ID       int64  `json:"id"`
	Nombre   string `json:"nombre"`
	Apellido string `json:"apellido"`
}

type Resena struct {
	Code       int64   `json:"code"`
	Usuario    string  `json:"usuario"`
	Comentario string  `json:"comentario"`
	Puntaje    float64 `json:"puntaje"`
	Fecha      string  `json:"fecha"`
	Likes      int     `json:"likes"`
}

type Popular struct {
	Material
	Likes    int      `json:"total_likes"`
	Lecturas int      `json:"total_lecturas"`
	Puntaje  *float64 `json:"promedio_puntaje"`
}

type Usuario struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Nombre   string `json:"nombre"`
	Apellido string `json:"apellido"`
	Rol      string `json:"rol"`
}

type HistorialItem struct {
	MaterialID int64   `json:"material_id"`
	Alias      *string `json:"alias"`
	Tipo       string  `json:"tipo"`
	Fecha      string  `json:"fecha"`
	Portadas   []string `json:"portadas"`
}
