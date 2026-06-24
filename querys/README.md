# querys/ — Consultas experimentales (versión limpia)

Las **4 consultas** del experimento, separadas y sin `EXPLAIN`, para que se puedan
revisar y ejecutar directamente. Son las mismas que `sql/06_experiments.sql` mide
con `EXPLAIN (ANALYZE, BUFFERS)`.

| Archivo | Consulta | Tablas | Mide |
|---------|----------|--------|------|
| `q1_materiales_por_autor.sql` | Materiales de un autor | Autor · Escribe · Material | búsqueda selectiva por FK |
| `q2_materiales_por_genero.sql` | Materiales de un género | Genero · Pertenece · Material | filtro de baja cardinalidad |
| `q3_materiales_populares.sql` | Ranking de popularidad | Likes · Leer · Resena · Material | agregación total |
| `q4_historial_usuario.sql` | Historial de lectura | Usuario · Leer · Material | filtro selectivo + orden |

Los valores de filtro (`:autor_id`, `:genero`, `:username`, `:email`) son ejemplos;
reemplázalos por valores existentes en cada base. Ver las decisiones de indexación
y qué índice acelera cada consulta en el [README maestro](../README.md).
