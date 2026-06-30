-- Q1: Materiales de un género, acotados por clasificación de edad.
-- Une Genero - Pertenece - Material - AgeRate. Combina un filtro por
-- igualdad (género) con un filtro por RANGO sobre la clasificación.
-- Índices relevantes: idx_pertenece_genero (Pertenece.Genero_Nombre),
-- idx_material_agerate (Material.agerate_code), idx_agerate_code (AgeRate.code).
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma, ag.label
FROM Genero g
JOIN Pertenece p ON p.Genero_Nombre = g.Nombre
JOIN Material m  ON m.Id = p.Material_Id
JOIN AgeRate ag  ON ag.code = m.agerate_code
WHERE g.Nombre = 'Ficcion'            -- :genero
  AND ag.code BETWEEN 2 AND 5;        -- :code_desde / :code_hasta
