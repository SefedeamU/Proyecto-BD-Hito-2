-- Q2: Materiales que pertenecen a un género.
-- Une Genero - Pertenece - Material. Filtro de baja cardinalidad.
-- Índice relevante: idx_pertenece_genero (Pertenece.Genero_Nombre).
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma
FROM Genero g
JOIN Pertenece p ON p.Genero_Nombre = g.Nombre
JOIN Material m  ON m.Id = p.Material_Id
WHERE g.Nombre = 'Ficcion';   -- :genero
