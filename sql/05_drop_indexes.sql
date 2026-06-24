-- =====================================================================
-- 05_drop_indexes.sql
-- Elimina los índices secundarios creados en 04_indexes.sql para medir
-- el escenario "sin índices". NO toca los índices implícitos de
-- PK/UNIQUE (son parte del esquema base).
--
-- NOTA experimental: como las PK de Leer/Likes/Escribe/Pertenece
-- empiezan por Material_Id, los filtros/joins por Material_Id seguirán
-- usando la PK aunque aquí no quede ningún índice secundario. Por eso
-- las consultas que demuestran el contraste filtran por columnas NO
-- líderes de la PK (Autor_Id, Genero_Nombre, Username/Email) o son
-- agregaciones totales (Consulta 3).
-- =====================================================================

DROP INDEX IF EXISTS idx_escribe_autor;
DROP INDEX IF EXISTS idx_pertenece_genero;

DROP INDEX IF EXISTS idx_resena_material;
DROP INDEX IF EXISTS idx_resena_material_punt;

DROP INDEX IF EXISTS idx_leer_usuario;

DROP INDEX IF EXISTS idx_pertenecesub_subgenero;

DROP INDEX IF EXISTS idx_material_anio;
DROP INDEX IF EXISTS idx_material_editorial;
DROP INDEX IF EXISTS idx_material_agerate;
