-- =====================================================================
-- visualizer_pgadmin.sql
-- Consultas PLANAS (sin EXPLAIN) listas para el "Graphical Explain" de
-- pgAdmin: pega UNA query, selecciónala y pulsa el botón
-- "Explain Analyze" (Shift+F7), NO Execute/F5.
--
-- En el desplegable (▼) junto al botón activa: Analyze, Buffers, Timing,
-- Costs, Verbose. pgAdmin antepone EXPLAIN(FORMAT JSON, ...) por ti y
-- dibuja el árbol del plan.
--
-- Para comparar CON vs SIN índice: corre la query con el visualizador,
-- luego ejecuta el bloque DROP/CREATE de abajo (F5), y vuelve a correr
-- la MISMA query con el visualizador. Compara los dos diagramas.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Q1: Materiales de un género acotados por clasificación de edad.
--     Igualdad (género) + RANGO (code BETWEEN). Se apoya en
--     idx_pertenece_genero, idx_material_agerate, idx_agerate_code.
-- ---------------------------------------------------------------------
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma, ag.label
FROM Genero g
JOIN Pertenece p ON p.Genero_Nombre = g.Nombre
JOIN Material m  ON m.Id = p.Material_Id
JOIN AgeRate ag  ON ag.code = m.agerate_code
WHERE g.Nombre = 'Ficcion'
  AND ag.code BETWEEN 2 AND 5;


-- ---------------------------------------------------------------------
-- Q2: Los 20 materiales más populares (agregación total: el índice ayuda
--     poco; el de Resena(Material_Id) sí, porque la PK de Resena es Code).
-- ---------------------------------------------------------------------
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
-- Q3: Historial de lectura de un usuario (el índice ayuda mucho y ADEMÁS
--     elimina el Sort). OJO: el usuario es 'user1', no 'usuario1'.
-- ---------------------------------------------------------------------
SELECT m.Id, m.Alias, le.Fecha
FROM Usuario u
JOIN Leer le    ON le.Usuario_Username = u.Username
               AND le.Usuario_Email    = u.Email
JOIN Material m ON m.Id = le.Material_Id
WHERE u.Username = 'user1'                       -- existen user0..userN
  AND u.Email    = 'user1@mail.com'
  AND EXTRACT(YEAR FROM le.Fecha) > 2004
ORDER BY le.Fecha DESC;


-- ---------------------------------------------------------------------
-- Q4: Usuarios con reseñas destacadas por RANGO de años.
--     RANGO (año BETWEEN) + puntaje alto + DISTINCT. El BETWEEN sobre el
--     año se resuelve con idx_material_anio.
-- ---------------------------------------------------------------------
SELECT DISTINCT u.Username, u.Email
FROM Usuario u
JOIN Resena r   ON r.Usuario_Username = u.Username
               AND r.Usuario_Email    = u.Email
JOIN Material m ON m.Id = r.Material_Id
WHERE m.Anio_Publicacion BETWEEN 2000 AND 2005
  AND r.Puntaje > 8.5;


-- =====================================================================
-- BLOQUES PARA ALTERNAR EL ESTADO (ejecutar con F5, NO con el visualizador)
-- =====================================================================

-- (A) Volver al estado SIN índices secundarios:
-- DROP INDEX IF EXISTS idx_pertenece_genero;
-- DROP INDEX IF EXISTS idx_material_agerate;
-- DROP INDEX IF EXISTS idx_agerate_code;
-- DROP INDEX IF EXISTS idx_resena_material;
-- DROP INDEX IF EXISTS idx_resena_material_punt;
-- DROP INDEX IF EXISTS idx_likes_material;
-- DROP INDEX IF EXISTS idx_leer_material;
-- DROP INDEX IF EXISTS idx_leer_usuario;
-- DROP INDEX IF EXISTS idx_material_anio;
-- DROP INDEX IF EXISTS idx_escribe_autor;
-- ANALYZE;

-- (B) Volver al estado CON índices:
-- CREATE INDEX IF NOT EXISTS idx_pertenece_genero     ON Pertenece (Genero_Nombre);
-- CREATE INDEX IF NOT EXISTS idx_material_agerate     ON Material (agerate_code);
-- CREATE INDEX IF NOT EXISTS idx_agerate_code         ON AgeRate (code);
-- CREATE INDEX IF NOT EXISTS idx_resena_material      ON Resena (Material_Id);
-- CREATE INDEX IF NOT EXISTS idx_resena_material_punt ON Resena (Material_Id, Puntaje);
-- CREATE INDEX IF NOT EXISTS idx_likes_material       ON Likes (Material_Id);
-- CREATE INDEX IF NOT EXISTS idx_leer_material        ON Leer (Material_Id);
-- CREATE INDEX IF NOT EXISTS idx_leer_usuario         ON Leer (Usuario_Username, Usuario_Email, Fecha DESC);
-- CREATE INDEX IF NOT EXISTS idx_material_anio        ON Material (Anio_Publicacion);
-- CREATE INDEX IF NOT EXISTS idx_escribe_autor        ON Escribe (Autor_Id);
-- ANALYZE;
