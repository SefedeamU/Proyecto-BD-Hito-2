-- Q4: Historial de lectura de un usuario.
-- Une Usuario - Leer - Material, filtra por usuario y ordena por fecha desc.
-- Índice relevante: idx_leer_usuario (Usuario_Username, Usuario_Email, Fecha DESC)
-- -> filtra y entrega ya ordenado (evita el Sort).
SELECT m.Id, m.Alias, le.Fecha
FROM Usuario u
JOIN Leer le    ON le.Usuario_Username = u.Username
               AND le.Usuario_Email    = u.Email
JOIN Material m ON m.Id = le.Material_Id
WHERE u.Username = 'usuario1'              -- :username
  AND u.Email    = 'usuario1@mail.com'     -- :email
ORDER BY le.Fecha DESC;
