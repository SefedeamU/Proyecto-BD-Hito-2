-- =====================================================================
-- 03_views.sql
-- Vistas de usuario.
--
-- NOTA: las vistas usan únicamente columnas que existen en el modelo
-- del Hito 1. El Material no tiene atributo "titulo" y la relación
-- Escribe no tiene atributo "relevancia"; por ello no aparecen aquí.
-- =====================================================================


-- ---------------------------------------------------------------------
-- vista_material_basico
-- Datos básicos de cada material: identificador, alias, año, idioma,
-- país, editorial y clasificación por edad (AgeRate).
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_material_basico AS
SELECT
    m.Id                AS material_id,
    m.Alias             AS alias,
    m.Tipo              AS tipo,            -- [Cambio A] discriminador de subtipo
    m.Anio_Publicacion  AS anio_publicacion,
    m.Idioma            AS idioma,
    m.Pais              AS pais,
    e.Nombre            AS editorial,
    a.Label             AS clasificacion_edad
FROM Material m
JOIN Editorial e ON e.Id   = m.Editorial_Id
JOIN AgeRate   a ON a.Code = m.AgeRate_Code;


-- ---------------------------------------------------------------------
-- vista_material_autores
-- Materiales con sus autores (relación Escribe).
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_material_autores AS
SELECT
    m.Id                                   AS material_id,
    m.Alias                                AS alias,
    au.Id                                  AS autor_id,
    (au.Nombre || ' ' || au.Apellido)      AS autor
FROM Material m
JOIN Escribe esc ON esc.Material_Id = m.Id
JOIN Autor   au  ON au.Id           = esc.Autor_Id;


-- ---------------------------------------------------------------------
-- [Cambio I] vista_material_subgenero
-- Materiales con su género y subgénero (relación PerteneceSubGenero).
-- Solo es posible gracias a la nueva tabla agregada en el Hito 2.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_material_subgenero AS
SELECT
    m.Id                AS material_id,
    m.Alias             AS alias,
    ps.Genero_Nombre    AS genero,
    ps.SubGenero_Nombre AS subgenero
FROM Material m
JOIN PerteneceSubGenero ps ON ps.Material_Id = m.Id;


-- ---------------------------------------------------------------------
-- vista_popularidad_material
-- Popularidad por material: total de likes, total de lecturas,
-- cantidad de reseñas y promedio de puntaje.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_popularidad_material AS
SELECT
    m.Id AS material_id,
    m.Alias AS alias,
    COALESCE(l.total_likes,    0) AS total_likes,
    COALESCE(le.total_lecturas, 0) AS total_lecturas,
    COALESCE(r.total_resenas,  0) AS total_resenas,
    r.promedio_puntaje         AS promedio_puntaje
FROM Material m
LEFT JOIN (
    SELECT Material_Id, COUNT(*) AS total_likes
    FROM Likes GROUP BY Material_Id
) l  ON l.Material_Id = m.Id
LEFT JOIN (
    SELECT Material_Id, COUNT(*) AS total_lecturas
    FROM Leer GROUP BY Material_Id
) le ON le.Material_Id = m.Id
LEFT JOIN (
    SELECT Material_Id,
           COUNT(*)        AS total_resenas,
           AVG(Puntaje)    AS promedio_puntaje
    FROM Resena GROUP BY Material_Id
) r  ON r.Material_Id = m.Id;


-- ---------------------------------------------------------------------
-- vista_historial_usuario
-- Historial de lectura de cada usuario: material leído y fecha.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_historial_usuario AS
SELECT
    u.Username        AS username,
    u.Email           AS email,
    le.Material_Id    AS material_id,
    m.Alias           AS alias,
    le.Fecha          AS fecha_lectura
FROM Usuario u
JOIN Leer     le ON le.Usuario_Username = u.Username
                AND le.Usuario_Email    = u.Email
JOIN Material m  ON m.Id = le.Material_Id;


-- ---------------------------------------------------------------------
-- vista_material_portadas  [Cambio M]
-- Material con su arreglo de portadas (URLs de imagen). Conveniente para
-- que la API/front-end traiga el material y sus imágenes en un solo lugar.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_material_portadas AS
SELECT
    m.Id              AS material_id,
    m.Alias           AS alias,
    m.Tipo            AS tipo,
    im.URLs           AS portadas
FROM Material m
LEFT JOIN ImagenMaterial im ON im.Material_Id = m.Id;
