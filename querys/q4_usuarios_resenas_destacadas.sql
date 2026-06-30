-- Q4: Usuarios que dieron reseñas destacadas a materiales de un rango de años.
-- Une Usuario - Resena - Material y combina un filtro por RANGO sobre el
-- año de publicación (BETWEEN) con un filtro selectivo por puntaje alto.
-- DISTINCT porque un usuario puede tener varias reseñas que califiquen.
-- Índices relevantes: idx_material_anio (Material.Anio_Publicacion, el rango),
-- idx_resena_material_punt (Resena.Material_Id, Puntaje), idx_resena_material.
SELECT DISTINCT u.Username, u.Email
FROM Usuario u
JOIN Resena r   ON r.Usuario_Username = u.Username
               AND r.Usuario_Email    = u.Email
JOIN Material m ON m.Id = r.Material_Id
WHERE m.Anio_Publicacion BETWEEN 2000 AND 2005   -- :anio_desde / :anio_hasta
  AND r.Puntaje > 8.5;                           -- :puntaje_min
