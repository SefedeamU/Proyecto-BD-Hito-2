-- =====================================================================
-- 04_indexes.sql
-- Índices secundarios (B-tree, no únicos) que apoyan las 4 consultas del
-- experimento. [Cambio K] Toggle del experimento: 05_drop_indexes.sql los
-- elimina para medir el escenario "sin índices".
--
-- Los índices implícitos de PK/UNIQUE NO se tocan: PostgreSQL ya crea un
-- B-tree único por cada PRIMARY KEY y UNIQUE. El contraste más fuerte se
-- observa sobre columnas que NO son la primera de ninguna PK (p. ej.
-- Resena.Material_Id, cuya PK es Code; el camino de usuario en Leer; o el
-- año en Material), porque ahí "sin índice" cae a Seq Scan.
-- =====================================================================

-- Q1: Materiales de un género acotados por clasificación de edad.
--   Pertenece.Genero_Nombre es 2ª columna de la PK -> no cubierto.
--   Material.agerate_code y AgeRate.code apoyan el join/rango por edad.
CREATE INDEX IF NOT EXISTS idx_pertenece_genero ON Pertenece (Genero_Nombre);
CREATE INDEX IF NOT EXISTS idx_material_agerate ON Material (agerate_code);
CREATE INDEX IF NOT EXISTS idx_agerate_code     ON AgeRate (code);

-- Q2: Los 20 materiales más populares (agregación por material).
--   Resena tiene PK = Code, así que Material_Id NO está cubierto: este es
--   el índice que de verdad acelera la agregación de reseñas.
--   En Likes y Leer la PK ya empieza por Material_Id, pero un índice
--   estrecho sobre esa sola columna permite un conteo por index-only scan
--   más liviano que recorrer la PK completa.
CREATE INDEX IF NOT EXISTS idx_resena_material      ON Resena (Material_Id);
CREATE INDEX IF NOT EXISTS idx_resena_material_punt ON Resena (Material_Id, Puntaje);
CREATE INDEX IF NOT EXISTS idx_likes_material       ON Likes (Material_Id);
CREATE INDEX IF NOT EXISTS idx_leer_material        ON Leer (Material_Id);

-- Q3: Historial de lectura de un usuario.
--   Filtra Leer por (Username, Email); la PK empieza por Material_Id, así
--   que NO está cubierto. La Fecha DESC incluida cubre el ORDER BY.
CREATE INDEX IF NOT EXISTS idx_leer_usuario
    ON Leer (Usuario_Username, Usuario_Email, Fecha DESC);

-- Q4: Usuarios con reseñas destacadas por rango de años.
--   El rango BETWEEN sobre el año de publicación se resuelve con este
--   B-tree; idx_resena_material_punt (arriba) apoya el filtro por puntaje.
CREATE INDEX IF NOT EXISTS idx_material_anio ON Material (Anio_Publicacion);

-- Apoyo: camino de acceso "materiales por autor".
--   Escribe.Autor_Id es 2ª columna de la PK -> no cubierto.
CREATE INDEX IF NOT EXISTS idx_escribe_autor ON Escribe (Autor_Id);

ANALYZE;
