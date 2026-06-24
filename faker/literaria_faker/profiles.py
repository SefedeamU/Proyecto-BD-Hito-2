"""
Perfiles de volumen por escenario (rúbrica: 4 tamaños de datos).

El volumen se controla principalmente en las tablas de INTERACCIÓN
(reseñas, likes, lecturas). Las tablas maestras escalan de forma
proporcional pero moderada (no tiene sentido 1M de géneros o premios).

Rangos (min, max) controlan densidades de las relaciones.
"""

# Distribución base tomada del contexto del proyecto, ajustada para que
# las consultas experimentales (Q1..Q4) tengan datos suficientes.
PROFILES = {
    "1k": dict(
        agerate=10, warnings_per_agerate=2,
        editorial=20, genero=8, subgenero_per_genero=3,
        autor=100, premio=10, ilustracion=100, curiosidad=100,
        usuario=200, material=300,
        authors_per_material=(1, 3),
        genres_per_material=(1, 2),
        subgenres_per_material=(0, 2),
        authors_per_genero=(1, 3),
        ganar_frac=0.05, premios_per_winner=(1, 2),
        contiene_frac=0.30, ilus_per_material=(1, 3),
        tiene_assigned_frac=0.70,
        likes=1_000, leer=1_000, resena=1_000,
    ),
    "10k": dict(
        agerate=12, warnings_per_agerate=2,
        editorial=50, genero=15, subgenero_per_genero=3,
        autor=500, premio=30, ilustracion=500, curiosidad=1_000,
        usuario=1_000, material=2_000,
        authors_per_material=(1, 3),
        genres_per_material=(1, 3),
        subgenres_per_material=(0, 2),
        authors_per_genero=(1, 4),
        ganar_frac=0.05, premios_per_winner=(1, 2),
        contiene_frac=0.30, ilus_per_material=(1, 3),
        tiene_assigned_frac=0.70,
        likes=10_000, leer=10_000, resena=10_000,
    ),
    "100k": dict(
        agerate=15, warnings_per_agerate=3,
        editorial=500, genero=30, subgenero_per_genero=4,
        autor=5_000, premio=200, ilustracion=5_000, curiosidad=20_000,
        usuario=10_000, material=20_000,
        authors_per_material=(1, 3),
        genres_per_material=(1, 3),
        subgenres_per_material=(0, 2),
        authors_per_genero=(2, 6),
        ganar_frac=0.05, premios_per_winner=(1, 2),
        contiene_frac=0.30, ilus_per_material=(1, 3),
        tiene_assigned_frac=0.70,
        likes=100_000, leer=100_000, resena=100_000,
    ),
    "1m": dict(
        agerate=15, warnings_per_agerate=3,
        editorial=2_000, genero=50, subgenero_per_genero=4,
        autor=25_000, premio=1_000, ilustracion=20_000, curiosidad=50_000,
        usuario=100_000, material=100_000,
        authors_per_material=(1, 3),
        genres_per_material=(1, 3),
        subgenres_per_material=(0, 2),
        authors_per_genero=(2, 8),
        ganar_frac=0.05, premios_per_winner=(1, 2),
        contiene_frac=0.30, ilus_per_material=(1, 3),
        tiene_assigned_frac=0.70,
        likes=1_000_000, leer=1_000_000, resena=1_000_000,
    ),
}
