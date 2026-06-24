-- Q1: Materiales escritos por un autor.
-- Une Autor - Escribe - Material. Búsqueda selectiva por autor.
-- Índice relevante: idx_escribe_autor (Escribe.Autor_Id).
SELECT m.Id, m.Alias, m.Anio_Publicacion, m.Idioma
FROM Autor au
JOIN Escribe esc ON esc.Autor_Id = au.Id
JOIN Material m  ON m.Id = esc.Material_Id
WHERE au.Id = 1;            -- :autor_id
