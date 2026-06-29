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
-- Q1: Materiales escritos por un autor (índice ayuda mucho).
--     Filtra Escribe.Autor_Id (2ª col de la PK) -> sin idx_escribe_autor
--     cae a Seq Scan sobre Escribe.
-- ---------------------------------------------------------------------
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma
FROM Autor au
JOIN Escribe esc ON esc.Autor_Id = au.Id
JOIN Material m  ON m.Id = esc.Material_Id
WHERE au.Id = 1;


-- ---------------------------------------------------------------------
-- Q2: Materiales por género (baja cardinalidad: el índice ayuda poco;
--     el planner suele preferir Seq Scan + Hash Join).
-- ---------------------------------------------------------------------
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma
FROM Genero g
JOIN Pertenece p ON p.Genero_Nombre = g.Nombre
JOIN Material m  ON m.Id = p.Material_Id
WHERE g.Nombre = 'Ficcion';


-- ---------------------------------------------------------------------
-- Q3: Materiales más populares (agregación total: el índice NO ayuda,
--     hay que leer todas las filas de Likes/Leer/Resena).
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
-- Q4: Historial de lectura de un usuario (índice ayuda mucho y ADEMÁS
--     elimina el Sort). OJO: el usuario es 'user1', no 'usuario1'.
-- ---------------------------------------------------------------------
SELECT m.Id, m.Alias, le.Fecha
FROM Usuario u
JOIN Leer le    ON le.Usuario_Username = u.Username
               AND le.Usuario_Email    = u.Email
JOIN Material m ON m.Id = le.Material_Id
WHERE u.Username = 'user1'              -- :username  (existen user0..userN)
  AND u.Email    = 'user1@mail.com'     -- :email
ORDER BY le.Fecha DESC;


-- =====================================================================
-- BLOQUES PARA ALTERNAR EL ESTADO (ejecutar con F5, NO con el visualizador)
-- =====================================================================

-- (A) Volver al estado SIN índices secundarios:
-- DROP INDEX IF EXISTS idx_escribe_autor;
-- DROP INDEX IF EXISTS idx_pertenece_genero;
-- DROP INDEX IF EXISTS idx_resena_material;
-- DROP INDEX IF EXISTS idx_resena_material_punt;
-- DROP INDEX IF EXISTS idx_leer_usuario;
-- ANALYZE;

-- (B) Volver al estado CON índices:
-- CREATE INDEX IF NOT EXISTS idx_escribe_autor       ON Escribe (Autor_Id);
-- CREATE INDEX IF NOT EXISTS idx_pertenece_genero    ON Pertenece (Genero_Nombre);
-- CREATE INDEX IF NOT EXISTS idx_resena_material     ON Resena (Material_Id);
-- CREATE INDEX IF NOT EXISTS idx_resena_material_punt ON Resena (Material_Id, Puntaje);
-- CREATE INDEX IF NOT EXISTS idx_leer_usuario        ON Leer (Usuario_Username, Usuario_Email, Fecha DESC);
-- ANALYZE;
