-- =====================================================================
-- 07_index_overhead.sql
-- Demostraciones de CUÁNDO UN ÍNDICE PERJUDICA (los índices no son gratis).
--
-- Complementa a 06_experiments.sql (que muestra los speedups). Aquí se
-- muestran los dos costos reales de un índice:
--   DEMO A: encarece las ESCRITURAS (hay que mantener el índice).
--   DEMO B: una LECTURA no selectiva con el índice forzado es más lenta
--           que un seq scan (por eso el planner lo evita).
--
-- Es autocontenido y no deja residuos: usa tablas TEMP y crea/borra el
-- índice de la Demo B. Ejecutar con psql -f (usa \timing y \echo).
-- =====================================================================

\timing on
SET statement_timeout = 0;

\echo ''
\echo '================ DEMO A: el índice encarece la ESCRITURA ================'

\echo '--- A1: INSERT de 1,000,000 filas SIN índice (rápido) ---'
CREATE TEMP TABLE t_noidx (id bigint, autor_id bigint, fecha date);
EXPLAIN (ANALYZE, TIMING OFF)
INSERT INTO t_noidx
SELECT g, (random()*25000)::bigint, DATE '2018-01-01' + (random()*2000)::int
FROM generate_series(1, 1000000) g;

\echo '--- A2: INSERT de 1,000,000 filas CON 2 índices que mantener (más lento) ---'
CREATE TEMP TABLE t_idx (id bigint, autor_id bigint, fecha date);
CREATE INDEX ix_tidx_autor ON t_idx(autor_id);
CREATE INDEX ix_tidx_fecha ON t_idx(fecha);
EXPLAIN (ANALYZE, TIMING OFF)
INSERT INTO t_idx
SELECT g, (random()*25000)::bigint, DATE '2018-01-01' + (random()*2000)::int
FROM generate_series(1, 1000000) g;

\echo ''
\echo '======= DEMO B: el índice perjudica una LECTURA no selectiva (forzado) ======='

-- La Demo B necesita un índice sobre material(anio_publicacion).
CREATE INDEX IF NOT EXISTS idx_material_anio ON material(anio_publicacion);
ANALYZE material;

\echo '--- B1: el planner ELIGE Seq Scan (correcto: el filtro abarca casi todo) ---'
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM material WHERE anio_publicacion >= 1900;

\echo '--- B2: FORZAMOS el índice -> Index Scan con acceso aleatorio al heap (más lento) ---'
SET enable_seqscan = off;
SET enable_bitmapscan = off;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM material WHERE anio_publicacion >= 1900;
RESET enable_seqscan;
RESET enable_bitmapscan;

-- Limpieza: el script no deja residuos en el esquema.
DROP INDEX idx_material_anio;
