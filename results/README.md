# results/ — Mediciones del experimento

Resultados de la experimentación con/sin índices sobre las 4 bases.

Archivo principal: `mediciones.csv`, con una fila por (consulta × escenario ×
condición). Columnas sugeridas:

| Columna | Descripción |
|---------|-------------|
| `consulta` | Q1, Q2, Q3, Q4 |
| `escenario` | 1k / 10k / 100k / 1m |
| `tiempo_sin_indices_ms` | tiempo de `EXPLAIN ANALYZE` sin índices secundarios |
| `tiempo_con_indices_ms` | tiempo con índices |
| `mejora_pct` | `(sin - con) / sin * 100` |
| `plan_sin` | tipo de plan sin índices (ej. Seq Scan) |
| `plan_con` | tipo de plan con índices (ej. Index Scan) |
| `observacion` | notas (caché, crossover, índice ignorado, etc.) |

Fórmula de mejora: `Mejora (%) = ((T_sin - T_con) / T_sin) * 100`.

También puede guardarse aquí la salida de los planes `EXPLAIN` (carpeta
`planes_explain/`) y gráficos comparativos (`graficos/`).
