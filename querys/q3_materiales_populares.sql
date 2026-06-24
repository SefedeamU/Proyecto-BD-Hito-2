-- Q3: Materiales más populares.
-- Agrega Likes, Leer y Resena por material (cada métrica en su propia
-- subconsulta para evitar el producto cartesiano). Agregación total:
-- caso donde los índices secundarios casi no ayudan.
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
