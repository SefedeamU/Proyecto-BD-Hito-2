"""
Orquestador del proyecto faker: itera los escenarios solicitados y los
puebla. Es invocado por el punto de entrada run.py.

Uso:
    python run.py                 # puebla los 4 escenarios
    python run.py 1k 10k          # puebla solo esos escenarios
"""

import sys
import time

from . import config
from .loader import load_scenario
from .profiles import PROFILES


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    requested = [a.lower() for a in argv] or list(PROFILES.keys())

    invalid = [s for s in requested if s not in PROFILES]
    if invalid:
        print(f"Escenario(s) inválido(s): {', '.join(invalid)}")
        print(f"Válidos: {', '.join(PROFILES.keys())}")
        return 2

    print("Proyecto faker — plataforma literaria (Hito 2)")
    print(f"  PostgreSQL: {config.PG['user']}@{config.PG['host']}:{config.PG['port']}")
    print(f"  Escenarios: {', '.join(requested)}")
    print(f"  APPLY_SCHEMA={config.APPLY_SCHEMA}  DISABLE_TRIGGERS={config.DISABLE_TRIGGERS}  SEED={config.SEED}")

    t0 = time.time()
    for name in requested:
        load_scenario(name, config.SCENARIOS[name], PROFILES[name])
    print(f"\nListo. Tiempo total: {time.time() - t0:0.1f}s")
    return 0
