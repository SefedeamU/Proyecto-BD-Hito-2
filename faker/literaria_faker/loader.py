"""
Orquestación de la carga de UN escenario (una base de datos):
  1. (opcional) crea la base y aplica el esquema.
  2. desactiva triggers, genera y COPIA todas las tablas en el orden de
     FKs, dentro de una sola transacción, reactiva triggers y commitea.
  3. ejecuta ANALYZE para dejar estadísticas listas para el benchmark.
"""

import time

from . import config, db
from .generators import DataFactory, TIPOS

# Orden de carga (respeta dependencias de llaves foráneas).
SUBTYPE_TABLES = {"Libro": "libro", "Ensayo": "ensayo", "Revista": "revista",
                  "Poema": "poema", "AudioBook": "audiobook"}


def _populate(cur, fac):
    """Genera y COPIA todas las tablas. Devuelve dict {tabla: filas}."""
    counts = {}

    def copy(table, columns, rows):
        counts[table] = db.copy_rows(cur, table, columns, rows)

    # --- maestras ---
    copy("agerate", ["code", "label", "language", "violence", "sexuality", "topics"], fac.agerate)
    copy("warning", ["agerate_code", "texto"], fac.warning)
    copy("editorial", ["id", "nombre", "pais", "fundacion", "webpage"], fac.editorial)
    copy("genero", ["nombre", "descripcion"], fac.genero)
    copy("subgenero", ["genero_nombre", "nombre", "descripcion"], fac.subgenero)
    copy("autor", ["id", "nombre", "apellido", "pais", "nacimiento", "biografia"], fac.autor)
    copy("premio", ["nombre", "categoria", "relevancia"], fac.premio)
    copy("ilustracion", ["code", "artista", "tipodearte", "imagenurl", "fecha"], fac.ilustracion)
    copy("curiosidad", ["code", "descripcion"], fac.curiosidad)
    copy("usuario", ["username", "email", "password", "nombre", "apellido",
                     "edad", "telefono", "ciudad", "rol"], fac.usuario)

    # --- material + subtipos ---
    copy("material", ["id", "numero_paginas", "anio_publicacion", "eslogan", "alias",
                      "pais", "idioma", "tipo", "agerate_code", "editorial_id"], fac.material)
    for tipo in TIPOS:
        copy(SUBTYPE_TABLES[tipo], ["material_id"], ((mid,) for mid in fac.buckets[tipo]))

    # --- relaciones materializadas ---
    copy("escribe", ["material_id", "autor_id"], fac.escribe)
    copy("pertenece", ["material_id", "genero_nombre"], fac.pertenece)
    copy("pertenecesubgenero", ["material_id", "genero_nombre", "subgenero_nombre"], fac.pertenecesub)
    copy("popularizo", ["autor_id", "genero_nombre"], fac.popularizo)
    copy("ganar", ["material_id", "premio_nombre", "fecha"], fac.ganar)
    copy("contiene", ["material_id", "ilustracion_code", "numerodepagina"], fac.contiene)
    copy("tiene", ["curiosidad_code", "material_id"], fac.tiene)

    # --- interacción (streaming) ---
    copy("likes", ["material_id", "usuario_username", "usuario_email"], fac.gen_likes())
    copy("leer", ["material_id", "usuario_username", "usuario_email", "fecha"], fac.gen_leer())
    copy("resena", ["code", "material_id", "usuario_username", "usuario_email",
                    "comentario", "puntaje", "fecha", "likes"], fac.gen_resena())
    return counts


def load_scenario(name, dbname, profile):
    t0 = time.time()
    print(f"\n=== Escenario {name}  ->  base '{dbname}' ===")

    if config.APPLY_SCHEMA:
        if config.CREATE_DB:
            print("  · creando base (si falta) ...")
            db.ensure_database(dbname)
        print("  · aplicando esquema (reset + 01..03) ...")
        db.apply_schema(dbname)

    print("  · generando datos en memoria ...")
    fac = DataFactory(profile, config.SEED)
    fac.build()

    conn = db.connect(dbname)
    try:
        with conn.cursor() as cur:
            db.relax_timeouts(cur)
            if config.DISABLE_TRIGGERS:
                db.disable_triggers(cur)
            print("  · cargando (COPY) ...")
            counts = _populate(cur, fac)
            if config.DISABLE_TRIGGERS:
                db.enable_triggers(cur)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print("  · ANALYZE ...")
    db.analyze(dbname)

    dt = time.time() - t0
    total = sum(counts.values())
    print(f"  ✓ {total:,} filas en {dt:0.1f}s")
    for t in ("usuario", "material", "likes", "leer", "resena"):
        print(f"      {t:<10} {counts.get(t, 0):,}")
    return counts
