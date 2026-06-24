-- =====================================================================
-- 04_indexes.sql
-- Índices secundarios para optimizar las consultas experimentales.
--
-- [Cambio K] Se ELIMINARON del set los índices que eran REDUNDANTES con
-- la PK: en Escribe, Pertenece, Likes y Leer la PK ya empieza por
-- Material_Id, de modo que un índice extra sobre Material_Id no aporta
-- nada (mostraría 0% de mejora y confundiría el experimento). Solo se
-- crean índices sobre columnas NO cubiertas por la primera columna de
-- alguna PK.
-- =====================================================================

-- Consulta 1: Materiales por autor.
--   Filtra Escribe.Autor_Id, que es la 2ª columna de la PK -> NO cubierto.
CREATE INDEX idx_escribe_autor ON Escribe (Autor_Id);

-- Consulta 2: Materiales por género.
--   Filtra Pertenece.Genero_Nombre, 2ª columna de la PK -> NO cubierto.
CREATE INDEX idx_pertenece_genero ON Pertenece (Genero_Nombre);

-- Consulta 3: Materiales más populares (agregaciones).
--   Resena tiene PK = Code, por lo que Material_Id NO está cubierto.
CREATE INDEX idx_resena_material      ON Resena (Material_Id);
CREATE INDEX idx_resena_material_punt ON Resena (Material_Id, Puntaje);

-- Consulta 4: Historial de lectura de un usuario.
--   Filtra Leer por (Username, Email); la PK empieza por Material_Id,
--   así que NO está cubierto. La Fecha incluida cubre el ORDER BY.
CREATE INDEX idx_leer_usuario
    ON Leer (Usuario_Username, Usuario_Email, Fecha DESC);

-- Consulta "materiales por subgénero" ([Cambio I]).
--   PerteneceSubGenero tiene PK que empieza por Material_Id.
CREATE INDEX idx_pertenecesub_subgenero
    ON PerteneceSubGenero (Genero_Nombre, SubGenero_Nombre);

-- Índices de apoyo sobre Material (filtros y joins frecuentes).
CREATE INDEX idx_material_anio      ON Material (Anio_Publicacion);
CREATE INDEX idx_material_editorial ON Material (Editorial_Id);
CREATE INDEX idx_material_agerate   ON Material (AgeRate_Code);
