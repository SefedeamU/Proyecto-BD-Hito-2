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
(escrituras reales a la BD), y **historial de lectura** del usuario (consulta Q3).
Todos los datos salen de PostgreSQL. Un **selector global en el topbar** permite
cambiar entre las 4 bases de volumen (1K/10K/100K/1M) en caliente, y todas las
consultas se enrutan a la base elegida.

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

**Multi-base.** La API se conecta a las 4 bases listadas en `DATABASES` del `.env`
(por defecto las cuatro: `bd_literaria_1k,bd_literaria_10k,bd_literaria_100k,bd_literaria_1m`)
y enruta cada consulta a la base que el frontend pida mediante el header
`X-Database` (o `?db=`). `PGDATABASE` es solo la base por defecto cuando no se
especifica ninguna. Los pools se crean de forma perezosa y con allowlist.

Endpoints principales: `GET /api/databases` (bases disponibles), `/api/materials`,
`/api/materials/{id}`, `/api/materials/{id}/reviews`, `/api/popular`, `/api/genres`,
`/api/stats`, `POST /api/login`, `/api/register`, `/api/materials/{id}/like`,
`/api/users/{u}/history`.

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

El frontend resuelve la base del API en `src/app/core/api.ts`: por defecto apunta
a la API desplegada en la EC2 (puerto 7000), de modo que sirve igual abierto en
local o como sitio estático (p. ej. S3). Puede forzarse con `window.__API_BASE__`
en `dist/index.html` sin recompilar. Para desarrollo contra un backend local,
ajusta esa resolución o define el override.

## Notas
- Las **credenciales** se leen del `.env` (no versionado). El `.env.example` es la plantilla.
- Las **portadas** son URLs de Lorem Picsum almacenadas en la BD (`imagenmaterial`).
- La contraseña de un usuario nuevo debe tener **exactamente 12 caracteres** (restricción del Hito 1).
- Para probar login con datos sembrados: los usuarios son `user0`, `user1`, … pero
  sus contraseñas son aleatorias; lo más simple es **registrar** un usuario nuevo.

> Núcleo del Hito 2: la base de datos y su experimentación. Esta API + frontend
> están **al servicio** de demostrar que la base se consume y manipula con un
> programa real.
