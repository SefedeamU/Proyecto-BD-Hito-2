# sql/ — Scripts estructurales y de experimentación

Scripts SQL del proyecto, separados por responsabilidad. Pensados para PostgreSQL.

## Orden de ejecución

| # | Script | Qué hace |
|---|--------|----------|
| 0a | `00_reset.sql` | Reset por `DROP SCHEMA public` (requiere ser **dueño** de la base). |
| 0b | `00_reset_guest.sql` | Reset "guest-safe": borra solo nuestros objetos, sin `DROP SCHEMA`. Para usuarios sin ownership del esquema (p. ej. `bd_guest`). |
| 1 | `01_tables.sql` | Tablas con PK, FK, UNIQUE, NOT NULL y CHECK. |
| 2 | `02_triggers.sql` | Reglas multi-tabla: validaciones temporales y participación total. |
| 3 | `03_views.sql` | Vistas de usuario. |
| 4 | `04_indexes.sql` | Índices secundarios del experimento. |
| 5 | `05_drop_indexes.sql` | Elimina esos índices (para medir el caso "sin índices"). |
| 6 | `06_experiments.sql` | Las 4 consultas con `EXPLAIN (ANALYZE, BUFFERS)`. |

Uso típico para **crear el esquema** (uno de los dos resets, según privilegios):
```bash
psql "<conexión>" -f 00_reset_guest.sql -f 01_tables.sql -f 02_triggers.sql -f 03_views.sql
```

Para el **experimento** con/sin índices, ver la sección "Cómo ejecutar" del
[README maestro](../README.md).

## Notas

- Cada cambio respecto al modelo del Hito 1 está etiquetado `[Cambio X]` en los
  scripts y explicado en [`../docs/cambios_respecto_hito1.md`](../docs/cambios_respecto_hito1.md).
- Los detalles de las decisiones de indexación están en el README maestro.
- El poblamiento de datos NO se hace aquí, sino con el proyecto [`../faker/`](../faker/).
