-- =====================================================================
-- 06_experiments.sql
-- Las 4 consultas experimentales del Hito 2, envueltas en
-- EXPLAIN (ANALYZE, BUFFERS) para medir tiempos y planes. Son las mismas
-- que están limpias (sin EXPLAIN) en la carpeta querys/.
--
-- METODOLOGÍA:
--   1. ANALYZE; (actualiza estadísticas del planificador).
--   2. Correr este script SIN índices (tras 05_drop_indexes.sql).
--   3. Crear índices (04_indexes.sql), ANALYZE; y volver a correrlo.
--   4. Comparar tiempos y planes (sin vs con índices) en cada escenario
--      (1K, 10K, 100K, 1M). Tomar la 2ª corrida (caché caliente).
--
-- Los valores de filtro ('Ficcion', 'user1', los rangos de años) son
-- ejemplos; reemplázalos por valores existentes en cada base.
-- =====================================================================

-- Actualiza estadísticas antes de medir.
ANALYZE;


-- ---------------------------------------------------------------------
-- CONSULTA 1: Materiales de un género acotados por clasificación de edad.
-- Une Genero - Pertenece - Material - AgeRate. Combina igualdad (género)
-- con un filtro por RANGO sobre la clasificación (code BETWEEN).
-- ---------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma, ag.label
FROM Genero g
JOIN Pertenece p ON p.Genero_Nombre = g.Nombre
JOIN Material m  ON m.Id = p.Material_Id
JOIN AgeRate ag  ON ag.code = m.agerate_code
WHERE g.Nombre = 'Ficcion'            -- :genero
  AND ag.code BETWEEN 2 AND 5;        -- :code_desde / :code_hasta


-- ---------------------------------------------------------------------
-- CONSULTA 2: Los 20 materiales más populares (ranking). [Cambio J]
-- Agrega likes, lecturas y reseñas por material en subconsultas
-- independientes que luego se combinan, de modo que cada métrica se
-- cuenta una sola vez (sin multiplicar filas entre las tres tablas). Es
-- una agregación total: el caso donde el índice secundario ayuda poco.
-- ---------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    m.Id,
    m.Alias,
    COALESCE(l.total_likes,     0) AS total_likes,
    COALESCE(le.total_lecturas, 0) AS total_lecturas,
    COALESCE(r.total_resenas,   0) AS total_resenas,
    r.promedio_puntaje            AS promedio_puntaje
FROM Material m
LEFT JOIN (SELECT Material_Id, COUNT(*) AS total_likes
             FROM Likes  GROUP BY Material_Id) l  ON l.Material_Id  = m.Id
LEFT JOIN (SELECT Material_Id, COUNT(*) AS total_lecturas
             FROM Leer   GROUP BY Material_Id) le ON le.Material_Id = m.Id
LEFT JOIN (SELECT Material_Id, COUNT(*) AS total_resenas, AVG(Puntaje) AS promedio_puntaje
             FROM Resena GROUP BY Material_Id) r  ON r.Material_Id  = m.Id
ORDER BY total_likes DESC, total_lecturas DESC
LIMIT 20;


-- ---------------------------------------------------------------------
-- CONSULTA 3: Historial de lectura de un usuario (a partir de cierto año).
-- Une Usuario - Leer - Material filtrando por usuario y por lecturas
-- posteriores a 2004, ordenadas por fecha descendente. El índice
-- idx_leer_usuario filtra por usuario y entrega el ORDER BY ya resuelto.
-- ---------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT m.Id, m.Alias, le.Fecha
FROM Usuario u
JOIN Leer le    ON le.Usuario_Username = u.Username
               AND le.Usuario_Email    = u.Email
JOIN Material m ON m.Id = le.Material_Id
WHERE u.Username = 'user1'                       -- :username
  AND u.Email    = 'user1@mail.com'              -- :email
  AND EXTRACT(YEAR FROM le.Fecha) > 2004         -- :anio_min
ORDER BY le.Fecha DESC;


-- ---------------------------------------------------------------------
-- CONSULTA 4: Usuarios con reseñas destacadas por RANGO de años.
-- Une Usuario - Resena - Material y combina un filtro por rango sobre el
-- año de publicación (BETWEEN) con un filtro selectivo por puntaje alto.
-- DISTINCT porque un usuario puede tener varias reseñas que califiquen.
-- Se apoya en idx_material_anio (el rango) e idx_resena_material_punt.
-- ---------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT DISTINCT u.Username, u.Email
FROM Usuario u
JOIN Resena r   ON r.Usuario_Username = u.Username
               AND r.Usuario_Email    = u.Email
JOIN Material m ON m.Id = r.Material_Id
WHERE m.Anio_Publicacion BETWEEN 2000 AND 2005   -- :anio_desde / :anio_hasta
  AND r.Puntaje > 8.5;                           -- :puntaje_min
