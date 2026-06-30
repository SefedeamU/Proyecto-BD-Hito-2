-- =====================================================================
-- 05_drop_indexes.sql
-- Elimina los índices secundarios de 04_indexes.sql para medir el
-- escenario "sin índices". NO toca los índices implícitos de PK/UNIQUE
-- (son parte del esquema base).
--
-- Como las PK de Leer/Likes/Escribe/Pertenece empiezan por Material_Id,
-- los joins por Material_Id siguen apoyándose en la PK aunque aquí no
-- quede ningún índice secundario. Por eso el contraste más limpio aparece
-- en columnas que NO lideran una PK (Genero_Nombre, el camino de usuario
-- en Leer, Resena.Material_Id, Material.Anio_Publicacion).
-- =====================================================================

DROP INDEX IF EXISTS idx_pertenece_genero;
DROP INDEX IF EXISTS idx_material_agerate;
DROP INDEX IF EXISTS idx_agerate_code;

DROP INDEX IF EXISTS idx_resena_material;
DROP INDEX IF EXISTS idx_resena_material_punt;
DROP INDEX IF EXISTS idx_likes_material;
DROP INDEX IF EXISTS idx_leer_material;

DROP INDEX IF EXISTS idx_leer_usuario;

DROP INDEX IF EXISTS idx_material_anio;

DROP INDEX IF EXISTS idx_escribe_autor;

ANALYZE;
