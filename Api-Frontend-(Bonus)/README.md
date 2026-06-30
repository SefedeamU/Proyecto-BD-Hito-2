# Api-Frontend-(Bonus)/ — Demo web de la Biblioteca Literaria

Aplicación completa que **consume y manipula** la base de datos real (PostgreSQL
en AWS) para demostrar el modelo del Hito 2 con un programa real, no solo
consultas sueltas.

```
backend/    API REST en Go (puerto 7000), conectada a la base remota vía Docker Compose
frontend/   SPA en Angular (puerto 4200), paleta blanco hueso + mostaza, layout estilo Netflix
```

La demo cubre: **login/registro**, **catálogo** con portadas (tabla `ImagenMaterial`,
[Cambio M]), **búsqueda** y filtros por género/tipo, **detalle** del material con
galería de 3 imágenes + autores + géneros + métricas, **reseñas** y **likes**
(escrituras reales a la BD), y **historial de lectura** del usuario (consulta Q4).
Todos los datos salen de PostgreSQL.

## 1. Backend (Go + Docker Compose, puerto 7000)

```bash
cd backend
cp .env.example .env        # y completa PGPASSWORD (ver faker/.env)
docker compose up --build   # API en http://localhost:7000
```

O sin Docker (requiere Go 1.25):
```bash
cd backend
set -a; . ./.env; set +a
go run .
```

La base se elige con `PGDATABASE` en el `.env` (por defecto `bd_literaria_10k`,
buen tamaño para navegar; puedes apuntar a `bd_literaria_1m`).

Endpoints principales: `GET /api/materials`, `/api/materials/{id}`,
`/api/materials/{id}/reviews`, `/api/popular`, `/api/genres`, `/api/stats`,
`POST /api/login`, `/api/register`, `/api/materials/{id}/like`, `/api/users/{u}/history`.

**Búsqueda avanzada** — `GET /api/search` acepta ~30 parámetros que se traducen
en una consulta con múltiples JOINs, subconsultas `EXISTS` y filtros sobre
agregados: por atributos de Material (tipo, idioma, país, rango de año/páginas),
editorial (nombre, país, año de fundación), clasificación de edad (AgeRate,
niveles de violencia/sexualidad), género y subgénero, autor (nombre, país),
premios (con premio, premio, categoría, relevancia), ilustraciones (con
ilustraciones, tipo de arte, artista), curiosidades, y métricas
(`min_likes`, `min_lecturas`, `min_resenas`, `puntaje_min/max`, `min_autores`,
`multi_autor`, `con_resenas`), con `order` y paginación. `GET /api/options`
devuelve las listas para poblar los desplegables del frontend.

## 2. Frontend (Angular, puerto 4200)

```bash
cd frontend
npm install        # solo la primera vez
ng serve           # http://localhost:4200
```

El frontend apunta a `http://localhost:7000/api` (constante `API` en
`src/app/core/api.ts`). Levanta primero el backend.

## Notas
- Las **credenciales** se leen del `.env` (no versionado). El `.env.example` es la plantilla.
- Las **portadas** son URLs de Lorem Picsum almacenadas en la BD (`imagenmaterial`).
- La contraseña de un usuario nuevo debe tener **exactamente 12 caracteres** (restricción del Hito 1).
- Para probar login con datos sembrados: los usuarios son `user0`, `user1`, … pero
  sus contraseñas son aleatorias; lo más simple es **registrar** un usuario nuevo.

> Núcleo del Hito 2: la base de datos y su experimentación. Esta API + frontend
> están **al servicio** de demostrar que la base se consume y manipula con un
> programa real.
