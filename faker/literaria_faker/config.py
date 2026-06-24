"""
Configuración: lee el .env y expone los parámetros de conexión, los
nombres de las 4 bases (escenarios) y los flags de comportamiento.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# faker/literaria_faker/config.py -> FAKER_DIR = faker/ ; ROOT = repo
FAKER_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = FAKER_DIR.parent
SQL_DIR = PROJECT_ROOT / "sql"

load_dotenv(FAKER_DIR / ".env")


def _b(name, default):
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "y", "si")


# Conexión común a PostgreSQL (las 4 bases comparten host/credenciales).
PG = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": int(os.getenv("PGPORT", "5432")),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", "postgres"),
}

# Una base por escenario de volumen.
SCENARIOS = {
    "1k":   os.getenv("DB_1K",   "bd_literaria_1k"),
    "10k":  os.getenv("DB_10K",  "bd_literaria_10k"),
    "100k": os.getenv("DB_100K", "bd_literaria_100k"),
    "1m":   os.getenv("DB_1M",   "bd_literaria_1m"),
}

# Flags de comportamiento.
APPLY_SCHEMA = _b("APPLY_SCHEMA", "true")      # aplica reset+01..03 antes de poblar
# CREATE_DB: si es false NO se intenta crear la base (ni conectarse a 'postgres').
# Úsalo cuando las bases ya existen y/o el usuario es invitado (bd_guest).
CREATE_DB = _b("CREATE_DB", "true")
DISABLE_TRIGGERS = _b("DISABLE_TRIGGERS", "true")  # acelera la carga masiva
# RESET_MODE: 'schema'  -> 00_reset.sql       (DROP SCHEMA; requiere ser dueño)
#             'objects' -> 00_reset_guest.sql (borra solo nuestros objetos; para usuarios invitados)
RESET_MODE = os.getenv("RESET_MODE", "schema").strip().lower()
SEED = int(os.getenv("SEED", "42"))            # reproducibilidad
