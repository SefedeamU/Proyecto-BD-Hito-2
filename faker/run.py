#!/usr/bin/env python3
"""
Punto de entrada del proyecto faker.

Responsabilidad ÚNICA y limitada: iniciar el proyecto faker. No contiene
lógica de generación, conexión ni carga; solo delega en el paquete.

    python run.py            # puebla las 4 bases
    python run.py 1k 100k    # puebla solo esos escenarios
"""

from literaria_faker.main import main

if __name__ == "__main__":
    raise SystemExit(main())
