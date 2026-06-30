# Hito 2 — Base de Datos I
## Plataforma de catálogo, lectura, reseñas y descubrimiento de materiales literarios

**Integrantes:**
- Sergio Felipe Delgado Amado — 202310227
- Antonio Jorge Guerrero Cedrón — 202510717
- Luciana Mylene Melgarejo Quispe — 202420055

**Curso:** Base de Datos I — UTEC, Ciclo 2026.1

Implementación física en PostgreSQL del modelo diseñado en el Hito 1: creación de
tablas y restricciones, triggers, vistas, carga masiva de datos sintéticos a 4
escenarios de volumen, e índices para la experimentación de rendimiento.

Este README maestro documenta la **estructura del proyecto** y, sobre todo, las
**decisiones de diseño importantes** que tomamos (correcciones al modelo,
indexación, realismo de datos y conexión/poblamiento). Son parte conceptual del
proyecto y deben reflejarse en el informe.

---

## Estructura del proyecto

```
.
├── README.md                     # este documento
├── .gitignore                    # protege secretos (.env, llaves, etc.)
├── docs/
│   ├── hito1.pdf                 # entrega previa (modelo E-R y relacional)
│   ├── cambios_respecto_hito1.md # constancia de cambios del modelo físico
│   ├── informe_hito2.tex/.pdf    # informe final (LaTeX + compilado)
│   └── diapositivas_hito2.tex/.pdf # diapositivas de la exposición
├── sql/
│   ├── 00_reset.sql              # reset por DROP SCHEMA (requiere ser dueño)
│   ├── 00_reset_guest.sql        # reset "guest-safe" (borra solo nuestros objetos)
│   ├── 01_tables.sql             # tablas: PK, FK, UNIQUE, NOT NULL, CHECK
│   ├── 02_triggers.sql           # reglas multi-tabla (validaciones, participación)
│   ├── 03_views.sql              # vistas de usuario
│   ├── 04_indexes.sql            # índices secundarios del experimento
│   ├── 05_drop_indexes.sql       # elimina los secundarios (medir "sin índices")
│   ├── 06_experiments.sql        # las 4 consultas con EXPLAIN (ANALYZE, BUFFERS)
│   └── 07_index_overhead.sql     # demo de cuándo el índice PERJUDICA
├── querys/                       # las 4 consultas limpias (para revisión directa)
├── faker/                        # proyecto de poblamiento (ver faker/README.md)
├── dumps/                        # dumps restaurables de las 4 bases
├── results/                      # resultados_experimento.csv (tiempos con/sin índices)
├── video/                        # guion del video de demostración
└── Api-Frontend-(Bonus)/         # API + frontend de demostración
```

Las 4 bases de datos (un escenario de volumen cada una):
`bd_literaria_1k`, `bd_literaria_10k`, `bd_literaria_100k`, `bd_literaria_1m`.

---

## Decisiones de diseño importantes

### A. Correcciones al modelo del Hito 1

El modelo del Hito 1 dejó varias reglas de negocio sin mecanismo de enforcement.
En el Hito 2 las cerramos. Cada cambio está etiquetado `[Cambio X]` en los scripts
y explicado en detalle en [`docs/cambios_respecto_hito1.md`](docs/cambios_respecto_hito1.md).
Resumen:

| ID | Cambio | Motivo |
|----|--------|--------|
| A | Discriminador `Material.Tipo` (NOT NULL + CHECK) | garantizar herencia **total y disjunta** |
| B | Trigger diferido: todo `Material` con ≥1 autor | regla del Hito 1 sin enforcement |
| C | Trigger diferido: todo `Genero` con ≥1 autor | regla del Hito 1 sin enforcement |
| D | `Leer.Fecha` entra a la PK | permitir **relecturas** (historial real) |
| E | `Resena` UNIQUE(material, usuario) | una reseña por usuario-material |
| F | `Resena.Likes` CHECK ≥ 0 | contador no negativo |
| G | `Resena.Puntaje` → `NUMERIC(3,1)` | "un decimal de precisión" del Hito 1 |
| H | `ON UPDATE CASCADE` en FKs a `Usuario` | poder corregir credenciales |
| I | Nueva tabla `PerteneceSubGenero` + vista | habilitar "materiales por subgénero" |
| M | Tabla `ImagenMaterial` (3 URLs de portada por material) | la demo necesita imágenes; los datos viven en la BD, no en el front-end |

Decisiones de diseño del **benchmark** (consultas e índices del experimento, no
diferencias con el Hito 1) se detallan en la sección B de este README.

Decisiones de **NO cambiar** (fidelidad al Hito 1): PK compuesta de `Usuario`,
tablas de subtipo, validación temporal solo del lado "hijo". Nota: cualquier
usuario `Registrado` puede publicar/interactuar (no se modeló un rol *publisher*).

### B. Decisiones de indexación  ⭐

Esta es una decisión central del proyecto y conviene explicarla con precisión.

#### Tipo de índices
Los **10 índices** de `04_indexes.sql` son **todos B-tree, secundarios y NO únicos**.

- **No hay índices agrupados (clustered).** A diferencia de SQL Server o
  MySQL/InnoDB, **PostgreSQL no tiene índices agrupados**: todas las tablas son
  *heap* (las filas no se almacenan ordenadas por una clave) y **todos** los
  índices son secundarios — estructuras separadas que apuntan a la fila en el heap
  vía `ctid`. Existe el comando `CLUSTER tabla USING indice`, que reordena
  físicamente la tabla **una sola vez** según un índice, pero **no se mantiene**
  (las filas nuevas no respetan ese orden). No lo usamos; queda como posible
  optimización adicional para reportes.
- **Los índices únicos ya existen, pero implícitos:** PostgreSQL crea un índice
  único B-tree automáticamente por cada `PRIMARY KEY` y `UNIQUE`. Por eso no
  duplicamos índices únicos manuales. Ejemplos: `material_pkey(id)`,
  `usuario_pkey(username,email)` + `uq_usuario_username` + `uq_usuario_email`,
  `resena_pkey(code)` + `uq_resena_usuario_material(material,usuario)` `[Cambio E]`,
  y las PK compuestas de las tablas M:N (que además impiden duplicados, p. ej. un
  like único por usuario-material).
- **Los 10 de `04_indexes.sql` son secundarios NO únicos** porque las columnas
  indexadas tienen duplicados por naturaleza (un género agrupa muchos materiales,
  un material recibe muchas reseñas, etc.).

#### Mapa índice ↔ tabla ↔ consulta

| Índice | Tabla (columnas) | Característica | Consulta | Lógica de negocio |
|--------|------------------|---------------|----------|-------------------|
| `idx_pertenece_genero` | Pertenece(genero_nombre) | B-tree no único | Q1 | materiales de un género |
| `idx_material_agerate` | Material(agerate_code) | B-tree no único | Q1 | acotar por clasificación de edad |
| `idx_agerate_code` | AgeRate(code) | B-tree no único | Q1 | join/rango por clasificación |
| `idx_resena_material` | Resena(material_id) | B-tree no único | Q2, Q4 | reseñas por material (PK de Resena es Code) |
| `idx_resena_material_punt` | Resena(material_id, puntaje) | B-tree compuesto **cubridor** | Q2, Q4 | promedio y filtro por puntaje sin leer la tabla |
| `idx_likes_material` | Likes(material_id) | B-tree no único | Q2 | conteo de likes por material |
| `idx_leer_material` | Leer(material_id) | B-tree no único | Q2 | conteo de lecturas por material |
| `idx_leer_usuario` | Leer(username, email, **fecha DESC**) | B-tree compuesto | Q3 | historial de un usuario **ya ordenado** |
| `idx_material_anio` | Material(anio_publicacion) | B-tree no único | Q4 | filtrar por **rango** de años (`BETWEEN`) |
| `idx_escribe_autor` | Escribe(autor_id) | B-tree no único | apoyo | camino "materiales por autor" |

Los dos más relevantes:
- **`idx_leer_usuario`** (Q3): compuesto y con `fecha DESC`, de modo que el historial
  de un usuario sale **filtrado y ya ordenado** (el índice satisface el `ORDER BY`
  y elimina el paso de `Sort`). Es el de mayor impacto en el experimento.
- **`idx_resena_material_punt`** (Q2/Q4): índice **cubridor**; el `AVG(puntaje)` y el
  filtro por puntaje pueden resolverse con *index-only scan*, sin tocar la tabla.

#### ¿Se nota la diferencia con/sin índices?
Sí, principalmente en **100k y 1M**, y de forma distinta según la consulta (eso es
lo interesante del experimento). Tiempos medidos en `bd_literaria_1m` (ms, caliente):

| Consulta | Sin índice | Con índice | Mejora | Lectura |
|----------|-----------|-----------|--------|---------|
| **Q3** historial usuario | 555 | 261 | **−53%** | 🟢 el mayor beneficio: index scan filtrado y ya ordenado |
| **Q2** populares (agregación 3×) | 7 432 | 5 557 | −25% | 🟡 el índice en `Resena(material_id)` ayuda (su PK es Code); el resto debe leer todo |
| **Q1** género + clasificación | 626 | 477 | −24% | 🟢 filtra por género y acota el rango de clasificación |
| **Q4** usuarios por rango de años | 3 831 | 3 038 | −21% | 🟢 el `BETWEEN` sobre el año se resuelve con `idx_material_anio` |

En `1k`/`10k` la diferencia es de milisegundos o nula (incluso "con índice" sale a
veces algo más lento por ruido): PostgreSQL **ignora** el índice y hace *seq scan*
porque recorrer una tabla pequeña es más barato. Ese *crossover* por selectividad
entre escenarios es, en sí, un resultado a reportar.

Reglas para que la medición sea honesta:
1. El contraste se ve en **100k/1m**; en `1k`/`10k` el índice no ayuda (o estorba).
2. **Caché:** correr cada consulta varias veces, usar `EXPLAIN (ANALYZE, BUFFERS)`
   y comparar el estado caliente; si no, la diferencia frío/caliente contamina.
3. `05_drop_indexes.sql` borra **solo los 10 secundarios**; los índices de PK
   permanecen. Por eso el contraste más limpio aparece en columnas que **no** son la
   primera de ninguna PK (`genero_nombre`, el camino de usuario en `Leer`,
   `Resena.material_id` —cuya PK es `Code`—, `Material.anio_publicacion`).

#### Hallazgo educativo: cuándo el índice PERJUDICA

Los índices **no son gratis**. `sql/07_index_overhead.sql` lo demuestra; medido en
`bd_literaria_1m`:

**A. El índice encarece las ESCRITURAS.** Insertar 1 000 000 de filas:

| Caso | Tiempo |
|------|--------|
| Sin índice | ~1 130 ms |
| Con 2 índices que mantener | ~5 640 ms (**≈5× más lento**) |

Cada índice debe actualizarse en cada `INSERT`/`UPDATE`/`DELETE`. Por eso el faker
carga **sin** índices secundarios y los crea después.

**B. Una lectura NO selectiva con el índice forzado es más lenta.**
`SELECT * FROM material WHERE anio_publicacion >= 1900` (≈100 % de las filas):

| Plan | Tiempo |
|------|--------|
| Seq Scan (lo que elige el planner) | ~139 ms |
| Index Scan forzado (`enable_seqscan=off`) | ~171 ms (**≈23 % más lento**) |

Cuando el filtro abarca casi toda la tabla, recorrer el índice y saltar al heap
(acceso aleatorio) cuesta más que un *seq scan* secuencial. **El planner tiene razón
al ignorar el índice**; se fuerza solo para demostrarlo.

> Panorama completo del experimento: el índice **ayuda** (Q3 historial, Q1, Q4), es
> **casi indiferente** (Q2, agregación total) o **perjudica** (escrituras / lectura
> no selectiva).

### C. Decisiones de realismo de los datos (faker)

Los datos sintéticos se generan para parecerse a producción (no solo ser válidos):

- **Puntaje** sesgado alto (distribución triangular, pico ~8.3), no uniforme.
- **Fechas de interacción recientes** (2018–2025) y nunca antes de la publicación.
- **Roles** realistas: ~92% `Registrado`, ~8% `Administrador` (sin `Visitante`).
- **Cola pesada de actividad**: pocos *power users* y *bestsellers* concentran la
  mayoría de likes/lecturas/reseñas; popularidad **desacoplada del id**.
- Distribución realista de **tipos** (dominan los libros), **autores por material**
  (mayoría 1), **páginas por tipo** y **edad** de usuarios.
- **Limitación conocida:** el embudo `lecturas : likes : reseñas` es **1:1:1** por
  exigencia de la rúbrica (en producción sería ~10:5:1). Se documenta como tal.

### D. Decisiones de conexión y poblamiento

- **Una sola transacción por escenario**, idempotente: si falla, se reintenta solo
  ese escenario sin rehacer los demás.
- **Carga rápida con `COPY`** y *pools* de datos precomputados; triggers de usuario
  desactivados durante la carga (los datos se generan válidos por construcción).
- **Compatibilidad con usuario invitado** (`bd_guest`, que no es dueño de las bases):
  `RESET_MODE=objects` usa `00_reset_guest.sql` (borra solo nuestros objetos, sin
  `DROP SCHEMA`), y `CREATE_DB=false` evita conectarse a la base `postgres`.
- **`SET statement_timeout = 0`** durante la carga: el servidor remoto tiene un
  `statement_timeout` que cortaba el `COPY` de 1M filas; se desactiva por sesión.

---

## Cómo ejecutar

### 1. Crear y poblar las bases (faker)
```bash
cd faker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # ajustar credenciales (ver datos de conexión propios)
python run.py               # puebla las 4 bases
python run.py 1k 100k       # o solo algunos escenarios
```
Detalles en [`faker/README.md`](faker/README.md). El `.env` (con credenciales) está
excluido del repositorio por `.gitignore`; usar `faker/.env.example` como plantilla.

### 2. Experimentación con índices (por base)
```bash
psql "<conexión>/bd_literaria_1m" -f sql/05_drop_indexes.sql   # medir SIN índices
psql "<conexión>/bd_literaria_1m" -f sql/06_experiments.sql
psql "<conexión>/bd_literaria_1m" -f sql/04_indexes.sql        # crear índices
psql "<conexión>/bd_literaria_1m" -c "ANALYZE;"
psql "<conexión>/bd_literaria_1m" -f sql/06_experiments.sql    # medir CON índices
```

---

## Escenarios de volumen

| Escenario | Usuarios | Materiales | Reseñas / Likes / Lecturas |
|-----------|----------|------------|----------------------------|
| 1k        | 200      | 300        | 1 000 cada una             |
| 10k       | 1 000    | 2 000      | 10 000 cada una            |
| 100k      | 10 000   | 20 000     | 100 000 cada una           |
| 1m        | 100 000  | 100 000    | 1 000 000 cada una         |

El volumen experimental se concentra en las tablas de interacción
(`Resena`, `Likes`, `Leer`); las tablas maestras escalan de forma proporcional.
