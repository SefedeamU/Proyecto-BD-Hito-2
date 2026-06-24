-- =====================================================================
-- 00_reset.sql
-- Plataforma de catálogo, lectura, reseñas y descubrimiento de
-- materiales literarios.
--
-- Propósito: borrar y recrear el esquema para empezar desde cero.
-- Se ejecuta una vez por base de datos (bd_literaria_1k, _10k, _100k, _1m)
-- antes de crear las tablas.
--
-- ADVERTENCIA: este script ELIMINA todos los objetos del esquema public.
-- Úsalo únicamente sobre las bases experimentales del proyecto.
-- =====================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Restaurar permisos por defecto sobre el esquema recreado.
GRANT ALL ON SCHEMA public TO public;

COMMENT ON SCHEMA public IS
    'Esquema de la plataforma de materiales literarios (Hito 2 - BD I).';
