# querys/ — Consultas experimentales (versión limpia)

Las **4 consultas** del experimento, separadas y sin `EXPLAIN`, para que se puedan
revisar y ejecutar directamente. Son las mismas que `sql/06_experiments.sql` mide
con `EXPLAIN (ANALYZE, BUFFERS)`.

| Archivo | Consulta | Tablas | Patrón de acceso |
|---------|----------|--------|------------------|
| `q1_materiales_por_genero.sql` | Materiales de un género acotados por clasificación de edad | Genero · Pertenece · Material · AgeRate | igualdad (género) + **rango** (`code BETWEEN`) |
| `q2_materiales_populares.sql` | Los 20 materiales más populares | Material · Likes · Leer · Resena | agregación total (3 subconsultas agregadas) |
| `q3_historial_usuario.sql` | Historial de lectura de un usuario | Usuario · Leer · Material | igualdad selectiva + filtro temporal + orden |
| `q4_usuarios_resenas_destacadas.sql` | Usuarios con reseñas destacadas por rango de años | Usuario · Resena · Material | **rango** (`anio BETWEEN`) + puntaje alto + `DISTINCT` |

Los valores de filtro (`'Ficcion'`, `'user1'`, los rangos de años) son ejemplos;
reemplázalos por valores existentes en cada base. Las decisiones de indexación y
qué índice acelera cada consulta están en el [README maestro](../README.md).
