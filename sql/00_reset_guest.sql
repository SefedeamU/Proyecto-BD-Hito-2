-- =====================================================================
-- 00_reset_guest.sql
-- Reset "guest-safe": elimina ÚNICAMENTE los objetos de este proyecto,
-- sin hacer DROP SCHEMA public (que exige ser dueño del esquema).
--
-- Úsalo cuando el usuario de conexión NO es dueño de la base/esquema
-- (p. ej. el usuario invitado `bd_guest` del servidor remoto) pero sí
-- tiene privilegio CREATE sobre el esquema public y posee los objetos
-- que él mismo creó.
--
-- Equivale funcionalmente a 00_reset.sql para este proyecto, pero de
-- forma no destructiva respecto al esquema compartido.
-- =====================================================================

-- Vistas (03_views)
DROP VIEW IF EXISTS vista_material_basico     CASCADE;
DROP VIEW IF EXISTS vista_material_autores    CASCADE;
DROP VIEW IF EXISTS vista_material_subgenero  CASCADE;
DROP VIEW IF EXISTS vista_material_portadas   CASCADE;
DROP VIEW IF EXISTS vista_popularidad_material CASCADE;
DROP VIEW IF EXISTS vista_historial_usuario   CASCADE;

-- Tablas (01_tables). CASCADE elimina FKs y triggers asociados.
DROP TABLE IF EXISTS imagenmaterial     CASCADE;
DROP TABLE IF EXISTS resena             CASCADE;
DROP TABLE IF EXISTS leer               CASCADE;
DROP TABLE IF EXISTS likes              CASCADE;
DROP TABLE IF EXISTS tiene              CASCADE;
DROP TABLE IF EXISTS contiene           CASCADE;
DROP TABLE IF EXISTS ganar              CASCADE;
DROP TABLE IF EXISTS popularizo         CASCADE;
DROP TABLE IF EXISTS pertenecesubgenero CASCADE;
DROP TABLE IF EXISTS pertenece          CASCADE;
DROP TABLE IF EXISTS escribe            CASCADE;
DROP TABLE IF EXISTS libro              CASCADE;
DROP TABLE IF EXISTS ensayo             CASCADE;
DROP TABLE IF EXISTS revista            CASCADE;
DROP TABLE IF EXISTS poema              CASCADE;
DROP TABLE IF EXISTS audiobook          CASCADE;
DROP TABLE IF EXISTS material           CASCADE;
DROP TABLE IF EXISTS usuario            CASCADE;
DROP TABLE IF EXISTS curiosidad         CASCADE;
DROP TABLE IF EXISTS ilustracion        CASCADE;
DROP TABLE IF EXISTS premio             CASCADE;
DROP TABLE IF EXISTS autor              CASCADE;
DROP TABLE IF EXISTS subgenero          CASCADE;
DROP TABLE IF EXISTS genero             CASCADE;
DROP TABLE IF EXISTS editorial          CASCADE;
DROP TABLE IF EXISTS warning            CASCADE;
DROP TABLE IF EXISTS agerate            CASCADE;

-- Funciones de trigger (02_triggers)
DROP FUNCTION IF EXISTS fn_material_anio_vs_editorial() CASCADE;
DROP FUNCTION IF EXISTS fn_resena_fecha_vs_material()   CASCADE;
DROP FUNCTION IF EXISTS fn_material_min_un_autor()      CASCADE;
DROP FUNCTION IF EXISTS fn_genero_min_un_autor()        CASCADE;
