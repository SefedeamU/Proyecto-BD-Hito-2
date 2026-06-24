"""
Acceso a PostgreSQL: creación de la base, aplicación del esquema (vía
psql), conexión, COPY masivo, manejo de triggers y ANALYZE.
"""

import os
import subprocess

import psycopg

from . import config

# Tablas que tienen triggers (se desactivan durante la carga masiva para
# acelerar; los datos se generan válidos por construcción).
TRIGGER_TABLES = ["material", "resena", "genero"]


def ensure_database(dbname):
    """Crea la base si no existe (conectando a la base 'postgres')."""
    with psycopg.connect(autocommit=True, dbname="postgres", **config.PG) as conn:
        row = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s",
                           (dbname,)).fetchone()
        if not row:
            conn.execute(f'CREATE DATABASE "{dbname}"')


def apply_schema(dbname):
    """Aplica 00_reset, 01_tables, 02_triggers y 03_views con psql.

    No aplica 04_indexes: los índices secundarios se crean en la fase de
    experimentación (con/sin índices), no durante el poblamiento.
    """
    env = os.environ.copy()
    env["PGPASSWORD"] = config.PG["password"]
    reset_file = "00_reset_guest.sql" if config.RESET_MODE == "objects" else "00_reset.sql"
    files = [reset_file, "01_tables.sql", "02_triggers.sql", "03_views.sql"]
    for f in files:
        path = config.SQL_DIR / f
        if not path.exists():
            raise FileNotFoundError(f"No se encontró el script SQL: {path}")
        subprocess.run(
            ["psql", "-h", config.PG["host"], "-p", str(config.PG["port"]),
             "-U", config.PG["user"], "-d", dbname,
             "-v", "ON_ERROR_STOP=1", "-q", "-f", str(path)],
            env=env, check=True,
        )


def connect(dbname):
    return psycopg.connect(dbname=dbname, autocommit=False, **config.PG)


def relax_timeouts(cur):
    """Quita límites de tiempo de la sesión para la carga masiva.

    El servidor remoto tiene statement_timeout/idle_in_transaction_timeout
    que cortan los COPY grandes (1M filas con validación FK sobre la red).
    Son GUCs de sesión, así que bd_guest puede ajustarlos para sí mismo.
    """
    cur.execute("SET statement_timeout = 0")
    cur.execute("SET lock_timeout = 0")
    cur.execute("SET idle_in_transaction_session_timeout = 0")


def disable_triggers(cur):
    for t in TRIGGER_TABLES:
        cur.execute(f"ALTER TABLE {t} DISABLE TRIGGER USER")


def enable_triggers(cur):
    for t in TRIGGER_TABLES:
        cur.execute(f"ALTER TABLE {t} ENABLE TRIGGER USER")


def copy_rows(cur, table, columns, rows):
    """COPY ... FROM STDIN. Devuelve la cantidad de filas escritas."""
    cols = ", ".join(columns)
    n = 0
    with cur.copy(f"COPY {table} ({cols}) FROM STDIN") as cp:
        for row in rows:
            cp.write_row(row)
            n += 1
    return n


def analyze(dbname):
    with psycopg.connect(autocommit=True, dbname=dbname, **config.PG) as conn:
        conn.execute("SET statement_timeout = 0")
        conn.execute("ANALYZE")
