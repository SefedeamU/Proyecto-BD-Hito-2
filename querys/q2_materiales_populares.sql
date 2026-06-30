-- Q2: Los 20 materiales más populares (ranking de popularidad).
-- Agrega likes, lecturas y reseñas por material en SUBCONSULTAS
-- independientes que luego se combinan, de modo que cada métrica se
-- cuenta una sola vez (no se multiplican las filas entre las tres tablas).
-- Es una agregación total: el caso donde el índice secundario ayuda poco.
-- Índices relevantes: idx_likes_material, idx_leer_material,
-- idx_resena_material, idx_resena_material_punt.
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
