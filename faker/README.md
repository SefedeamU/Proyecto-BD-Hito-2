# Faker — Poblamiento de la plataforma literaria (Hito 2)

Sistema de generación y carga masiva de datos sintéticos para las **4 bases
experimentales** del proyecto (escenarios de volumen `1k`, `10k`, `100k`, `1m`).

Todo se inicia con un **único punto de entrada** (`run.py`), cuya única
responsabilidad es arrancar el proyecto; la lógica vive en el paquete
`literaria_faker/`.

## Estructura

```
faker/
├── run.py                 # PUNTO DE ENTRADA (solo inicia el proyecto)
├── .env.example           # plantilla de conexión a las 4 bases
├── requirements.txt
└── literaria_faker/       # el proyecto (modular)
    ├── config.py          # lee .env: conexión, nombres de BD, flags
    ├── profiles.py        # volúmenes por escenario (1k/10k/100k/1m)
    ├── generators.py      # generación de datos coherentes (Faker + pools)
    ├── db.py              # crear BD, aplicar esquema, COPY, ANALYZE
    ├── loader.py          # orquesta la carga de un escenario
    └── main.py            # itera los escenarios solicitados
```

## Requisitos

- Python 3.10+
- PostgreSQL accesible y el cliente `psql` en el `PATH` (se usa para aplicar
  el esquema `../sql/00..03`).
- El usuario de conexión debe poder crear bases y ser dueño de las tablas
  (para desactivar triggers durante la carga). Si no, pon `DISABLE_TRIGGERS=false`.

## Uso

```bash
cd faker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # y ajusta credenciales/nombres

python run.py               # puebla las 4 bases
python run.py 1k 10k        # puebla solo esos escenarios
```

## Qué hace por cada base

1. **Crea la base** si no existe y **aplica el esquema** (`sql/00_reset`,
   `01_tables`, `02_triggers`, `03_views`). *No* aplica los índices (`04`):
   esos pertenecen a la fase de experimentación con/sin índices.
2. Genera datos **coherentes con las reglas** del modelo corregido
   (herencia con `Tipo`, año de publicación ≥ fundación de editorial, fecha de
   reseña/lectura ≥ publicación, ≥1 autor por material y por género, etc.).
3. Carga con **COPY** dentro de **una sola transacción**, desactivando los
   triggers durante la carga (los datos ya son válidos) para máxima velocidad.
4. Ejecuta **ANALYZE** para dejar las estadísticas listas para medir.

Los datos se generan con sesgo (`bestsellers` y `power users`) para que el
ranking de popularidad y el historial de lectura sean realistas y las
consultas experimentales muestren contrastes con/sin índices.

## Notas

- Reproducible vía `SEED` en el `.env`.
- Los identificadores se almacenan en minúsculas (PostgreSQL pliega los no
  entrecomillados); las columnas en el COPY usan ese mismo casing.
- Para cargar de nuevo desde cero, basta con volver a ejecutar: `APPLY_SCHEMA=true`
  hace `DROP SCHEMA ... CASCADE` en cada base antes de recrear.
