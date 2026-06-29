-- Q5: Materiales publicados en un RANGO de años (consulta por rango).
-- Requisito explícito del profesor: al menos una consulta debe filtrar por
-- RANGO, para mostrar las "bondades" de un índice B-tree, que resuelve un
-- predicado BETWEEN recorriendo un tramo contiguo de las hojas del árbol.
-- Índice relevante: idx_material_anio (Material.Anio_Publicacion).
--
-- Se eligió un rango SELECTIVO (primeros años del catálogo, escasos) porque
-- ahí el índice gana de forma clara: el planner elige Bitmap Index Scan y
-- toca solo ~0.1% de las filas en vez de leer toda la tabla.
--   Sin índice  -> Seq Scan de toda la tabla Material (lee 100% y filtra).
--   Con índice  -> Bitmap Index Scan + Bitmap Heap Scan (solo el tramo).
-- (Para un rango amplio, p. ej. 2010-2015 = ~12% de las filas, el planner
--  vuelve a Seq Scan a propósito: recorrer el índice no compensa. Ese
--  "crossover" por selectividad también es un resultado a reportar.)
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma
FROM Material m
WHERE m.Anio_Publicacion BETWEEN 1900 AND 1905   -- :anio_desde / :anio_hasta
ORDER BY m.Anio_Publicacion;
