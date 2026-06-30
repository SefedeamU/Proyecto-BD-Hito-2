-- Q3: Historial de lectura de un usuario (a partir de cierto año).
-- Une Usuario - Leer - Material filtrando por un usuario concreto y por
-- las lecturas posteriores a 2004, ordenadas por fecha descendente.
-- Índice relevante: idx_leer_usuario (Usuario_Username, Usuario_Email,
-- Fecha DESC): filtra por usuario y entrega el ORDER BY ya resuelto.
SELECT m.Id, m.Alias, le.Fecha
FROM Usuario u
JOIN Leer le    ON le.Usuario_Username = u.Username
               AND le.Usuario_Email    = u.Email
JOIN Material m ON m.Id = le.Material_Id
WHERE u.Username = 'user1'                       -- :username
  AND u.Email    = 'user1@mail.com'              -- :email
  AND EXTRACT(YEAR FROM le.Fecha) > 2004         -- :anio_min
ORDER BY le.Fecha DESC;
