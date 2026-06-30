#!/usr/bin/env python3
"""
add_images.py — [Cambio M]  Migración: portadas por material.

Agrega a las 4 bases YA pobladas la tabla `imagenmaterial`, donde cada
material recibe un arreglo de 3 URLs de imagen (portadas) provenientes de
Lorem Picsum (servicio público, sin API key, deterministas por seed -> el
dump es reproducible). No re-genera datos: solo crea la tabla/vista e
inserta las URLs derivadas del id de cada material (INSERT...SELECT
server-side, sin transferir filas por la red).

Antes de poblar cada base VALIDA que una muestra de las URLs responda 200,
con reintentos y backoff (requisito explícito). Si alguna URL no responde
200 tras los reintentos, aborta sin tocar esa base.

Uso (desde la carpeta faker/):   python add_images.py
Reutiliza faker/.env para la conexión (mismas credenciales del faker).
"""

import random
import time
import urllib.request

import psycopg

from literaria_faker import config, db

# DDL espejo de sql/01_tables.sql ([Cambio M]) — para bases que aún no la tienen.
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS imagenmaterial (
    material_id BIGINT NOT NULL,
    urls        TEXT[] NOT NULL,
    CONSTRAINT pk_imagenmaterial PRIMARY KEY (material_id),
    CONSTRAINT fk_imagenmaterial_material FOREIGN KEY (material_id)
        REFERENCES material (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_imagenmaterial_urls CHECK (array_length(urls, 1) = 3)
)
"""

# Vista espejo de sql/03_views.sql ([Cambio M]).
CREATE_VIEW_SQL = """
CREATE OR REPLACE VIEW vista_material_portadas AS
SELECT m.id AS material_id, m.alias AS alias, m.tipo AS tipo, im.urls AS portadas
FROM material m
LEFT JOIN imagenmaterial im ON im.material_id = m.id
"""


def url_ok(url, attempts=4, timeout=15):
    """True si la URL responde 200; reintenta con backoff lineal."""
    last = None
    for i in range(attempts):
        try:
            req = urllib.request.Request(
                url, method="GET",
                headers={"User-Agent": "Mozilla/5.0 (literaria-image-check)"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                if r.status == 200:
                    return True
                last = f"HTTP {r.status}"
        except Exception as e:                       # noqa: BLE001
            last = str(e)
        time.sleep(1.5 * (i + 1))                    # backoff: 1.5s, 3s, 4.5s...
    print(f"      ! NO respondió 200 tras {attempts} intentos: {url}  ({last})")
    return False


def sample_ids(cur, k=6):
    """Ids representativos (extremos + un aleatorio) sin ordenar 1M filas."""
    mx = cur.execute("SELECT max(id) FROM material").fetchone()[0]
    if not mx:
        return []
    pts = {1, max(mx // 4, 1), max(mx // 2, 1), max(3 * mx // 4, 1), mx,
           random.randint(1, mx)}
    return sorted(pts)[:k]


def validate_urls(cur):
    """Valida (200 + reintentos) las 3 URLs de una muestra de materiales."""
    ids = sample_ids(cur)
    urls = [u for mid in ids for u in db.image_urls(mid)]
    ok = sum(url_ok(u) for u in urls)
    print(f"  · validación de URLs: {ok}/{len(urls)} respondieron 200 "
          f"(muestra ids={ids})")
    return ok == len(urls)


def migrate(dbname):
    print(f"\n=== Base '{dbname}' ===")
    conn = db.connect(dbname)
    n = 0
    try:
        with conn.cursor() as cur:
            db.relax_timeouts(cur)
            cur.execute(CREATE_TABLE_SQL)
            cur.execute(CREATE_VIEW_SQL)
            if not validate_urls(cur):
                raise RuntimeError(f"URLs no validadas en '{dbname}'; no se puebla.")
            cur.execute("TRUNCATE imagenmaterial")
            print("  · insertando portadas (INSERT...SELECT server-side) ...")
            cur.execute(db.INSERT_IMAGES_SQL)
            n = cur.rowcount
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    with psycopg.connect(autocommit=True, dbname=dbname, **config.PG) as c:
        c.execute("SET statement_timeout = 0")
        c.execute("ANALYZE imagenmaterial")
    print(f"  ✓ {n:,} materiales con portadas")
    return n


def main():
    print("Migración [Cambio M]: portadas (3 URLs Lorem Picsum por material)")
    for name, dbname in config.SCENARIOS.items():
        migrate(dbname)
    print("\nListo. Verifica con:  SELECT * FROM vista_material_portadas LIMIT 3;")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
