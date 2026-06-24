-- =====================================================================
-- 06_experiments.sql
-- Consultas experimentales del Hito 2 con EXPLAIN ANALYZE.
--
-- Estas son las mismas 4 consultas que estarán (limpias, sin EXPLAIN)
-- en la carpeta querys/. Aquí se envuelven con EXPLAIN (ANALYZE, BUFFERS)
-- para medir tiempos y planes.
--
-- METODOLOGÍA SUGERIDA:
--   1. Ejecutar ANALYZE; (actualiza estadísticas del planificador).
--   2. Correr este script SIN índices (tras 05_drop_indexes.sql).
--   3. Crear índices (04_indexes.sql), ANALYZE; y volver a correrlo.
--   4. Comparar tiempos y planes (sin vs con índices) en cada escenario
--      (1K, 10K, 100K, 1M).
--
-- Los valores de filtro (:autor_id, :genero, :username, :email) son
-- ejemplos; reemplázalos por IDs reales existentes en cada base.
-- =====================================================================

-- Actualiza estadísticas antes de medir.
ANALYZE;


-- ---------------------------------------------------------------------
-- CONSULTA 1: Materiales escritos por un autor.
-- Une Autor - Escribe - Material. Mide búsqueda por autor.
-- ---------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma
FROM Autor au
JOIN Escribe esc ON esc.Autor_Id = au.Id
JOIN Material m  ON m.Id = esc.Material_Id
WHERE au.Id = 1;            -- :autor_id


-- ---------------------------------------------------------------------
-- CONSULTA 2: Materiales que pertenecen a un género.
-- Une Genero - Pertenece - Material. Mide búsqueda por categoría.
-- ---------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma
FROM Genero g
JOIN Pertenece p ON p.Genero_Nombre = g.Nombre
JOIN Material m  ON m.Id = p.Material_Id
WHERE g.Nombre = 'Ficcion';   -- :genero


-- ---------------------------------------------------------------------
-- CONSULTA 3: Materiales más populares.
-- Agrega Likes, Leer y Reseña por material. Mide agregaciones pesadas.
--
-- [Cambio J] Se reescribió para evitar el PRODUCTO CARTESIANO que tenía
-- la versión anterior (3 LEFT JOIN 1-a-muchos sobre Material generaban
-- #likes x #lecturas x #reseñas filas intermedias). Ahora cada métrica
-- se calcula en su propia subconsulta agregada y luego se combinan, que
-- es como debe medirse esta consulta para un benchmark honesto.
-- Esta consulta es el caso "el índice NO ayuda": al ser una agregación
-- total sin filtro selectivo, debe leer todas las filas de las tres
-- tablas (seq scan + agregación) con o sin índice secundario.
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
-- CONSULTA 4: Historial de lectura de un usuario.
-- Une Usuario - Leer - Material filtrando por usuario y ordenando por
-- fecha descendente.
-- ---------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT m.Id, m.Alias, le.Fecha
FROM Usuario u
JOIN Leer le    ON le.Usuario_Username = u.Username
               AND le.Usuario_Email    = u.Email
JOIN Material m ON m.Id = le.Material_Id
WHERE u.Username = 'usuario1'              -- :username
  AND u.Email    = 'usuario1@mail.com'     -- :email
ORDER BY le.Fecha DESC;
