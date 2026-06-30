export interface Material {
  id: number;
  alias: string | null;
  tipo: string;
  anio_publicacion: number;
  idioma: string;
  pais: string;
  numero_paginas: number;
  eslogan: string | null;
  editorial: string | null;
  portadas: string[];
}

export interface Autor {
  id: number;
  nombre: string;
  apellido: string;
}

export interface MaterialDetalle extends Material {
  agerate: string | null;
  autores: Autor[];
  generos: string[];
  total_likes: number;
  total_lecturas: number;
  total_resenas: number;
  promedio_puntaje: number | null;
}

export interface Popular extends Material {
  total_likes: number;
  total_lecturas: number;
  promedio_puntaje: number | null;
}

export interface Resena {
  code: number;
  usuario: string;
  comentario: string;
  puntaje: number;
  fecha: string;
  likes: number;
}

export interface Usuario {
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
}

export interface HistorialItem {
  material_id: number;
  alias: string | null;
  tipo: string;
  fecha: string;
  portadas: string[];
}
