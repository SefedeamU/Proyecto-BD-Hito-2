# results/ — Resultados del experimento

Resultados de la experimentación con/sin índices sobre las 4 bases
(`bd_literaria_1k`, `10k`, `100k`, `1m`).

Archivo principal: [`resultados_experimento.csv`](resultados_experimento.csv),
con una fila por (base × consulta × condición). Columnas:

| Columna | Descripción |
|---------|-------------|
| `base` | `bd_literaria_1k` / `10k` / `100k` / `1m` |
| `consulta` | `Q1_por_autor`, `Q2_por_genero`, `Q3_populares`, `Q4_historial`, `Q5_por_rango_anio` |
| `escenario_indices` | `SIN` (sin índices secundarios) o `CON` (con índices) |
| `tiempo_ms` | `Execution Time` reportado por `EXPLAIN ANALYZE` (en caliente) |
| `plan_elegido` | tipo de plan: `Seq Scan`, `Index Scan`, `Bitmap Index Scan`, etc. |

Fórmula de mejora: `Mejora (%) = ((T_sin - T_con) / T_sin) * 100`.

## Cómo completar el CSV

Las credenciales del servidor **no se versionan**: se toman de `faker/.env`
(ver `faker/.env.example`). Exporta la contraseña en tu shell antes de correr:

```bash
export PGPASSWORD="$(grep '^PGPASSWORD' faker/.env | cut -d= -f2-)"
HOST=<host>          # ver faker/.env
DB=bd_literaria_1m   # repetir para cada base

# 1) SIN índices
psql -h $HOST -p 5432 -U bd_guest -d $DB -f sql/05_drop_indexes.sql
psql -h $HOST -p 5432 -U bd_guest -d $DB -c "ANALYZE;"
psql -h $HOST -p 5432 -U bd_guest -d $DB -f sql/06_experiments.sql
# -> anotar el "Execution Time" de Q1..Q5 en la columna SIN

# 2) CON índices
psql -h $HOST -p 5432 -U bd_guest -d $DB -f sql/04_indexes.sql
psql -h $HOST -p 5432 -U bd_guest -d $DB -c "ANALYZE;"
psql -h $HOST -p 5432 -U bd_guest -d $DB -f sql/06_experiments.sql
# -> anotar el "Execution Time" de Q1..Q5 en la columna CON
```

> Mide siempre con el `Execution Time` del `EXPLAIN ANALYZE` (lo reporta el
> servidor; excluye red y render) y toma la **2ª corrida** (caché caliente).

## Después de llenar el CSV
1. Generar los gráficos (barras sin/con por consulta, speedup en 1M, escalamiento)
   en `graficos/`.
2. Completar las tablas de tiempos en `docs/informe_hito2.tex`.
3. Redactar el análisis y las conclusiones del experimento.
