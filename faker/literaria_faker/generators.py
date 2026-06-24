"""
Generación de datos sintéticos coherentes con el esquema (Hito 2) y con
distribuciones REALISTAS de producción.

Rendimiento:
  - Faker se usa una sola vez para construir "pools" de strings; las filas
    se arman muestreando de esos pools (no millones de llamadas a Faker).
  - Maestras y relaciones se materializan en memoria (< 1M filas). Las
    tablas de interacción grandes se generan en streaming.

Realismo (decisiones de modelado de los datos):
  - puntaje sesgado alto (mayoría 7-10), no uniforme.
  - fechas de interacción RECIENTES (últimos ~8 años) y nunca antes de la
    publicación del material -> plataforma moderna.
  - roles: ~92% 'Registrado', ~8% 'Administrador' (sin 'Visitante', ya que
    cualquier registrado puede publicar/interactuar).
  - actividad por usuario con cola pesada: pocos "power users" concentran
    muchas lecturas/likes/reseñas.
  - popularidad de materiales desacoplada del id de inserción (permutación).
  - distribución realista de tipos (dominan los libros), nº de autores
    (mayoría 1), páginas por tipo, edad de usuarios y votos por reseña.

Coherencia con las reglas del modelo (correcciones del Hito 2):
  - material.anio >= año de fundación de su editorial.
  - reseña/lectura con año >= anio del material.
  - cada material >= 1 autor; cada género >= 1 autor.
  - material.tipo en {Libro,Ensayo,Revista,Poema,AudioBook} + tabla de subtipo.
  - leer admite relecturas; una reseña por (usuario, material); puntaje 1 decimal.
"""

import random
import string
from datetime import date

from faker import Faker

# Plataforma moderna: la actividad ocurre en esta ventana reciente.
ACTIVITY_START = 2018
ACTIVITY_END = 2025

TIPOS = ["Libro", "Ensayo", "Revista", "Poema", "AudioBook"]
# Dominan los libros; audiolibros y revistas en medio; poemas/ensayos menos.
TIPO_WEIGHTS = [0.50, 0.10, 0.13, 0.09, 0.18]
PAGES_BY_TIPO = {
    "Libro": (60, 1200), "Ensayo": (30, 400), "Revista": (20, 200),
    "Poema": (1, 80), "AudioBook": (50, 800),
}

IDIOMAS = ["es", "en", "fr", "pt", "de", "it", "ja", "zh"]
# Sesgo idiomático realista (mayoría es/en).
IDIOMA_WEIGHTS = [0.40, 0.30, 0.07, 0.07, 0.06, 0.05, 0.03, 0.02]
PAISES = ["Peru", "Chile", "Mexico", "Espana", "Argentina",
          "Colombia", "Bolivia", "Ecuador", "Uruguay", "Brasil"]
TIPOS_ARTE = ["Acuarela", "Digital", "Oleo", "Tinta", "Lapiz", "Collage"]

GENERO_BASE = [
    "Ficcion", "No Ficcion", "Fantasia", "Ciencia Ficcion", "Misterio",
    "Romance", "Terror", "Historia", "Biografia", "Poesia", "Drama",
    "Aventura", "Filosofia", "Ensayo", "Infantil", "Juvenil", "Clasico",
    "Policial", "Distopia", "Realismo Magico", "Comedia", "Tragedia",
    "Epica", "Satira", "Costumbrista", "Gotico", "Western", "Belico",
    "Religioso", "Cientifico", "Tecnico", "Autoayuda", "Viajes",
    "Gastronomia", "Arte", "Musica", "Deportes", "Politica", "Economia",
    "Naturaleza",
]
SUBGENERO_BASE = [
    "Clasico", "Contemporaneo", "Experimental", "Urbano", "Rural",
    "Historico", "Psicologico", "Social", "Intimista", "Coral",
]
PREMIO_BASE = [
    "Nobel", "Cervantes", "Pulitzer", "Booker", "Planeta", "Alfaguara",
    "Hugo", "Nebula", "Princesa de Asturias", "Romulo Gallego",
    "National Book Award", "Goncourt", "Pluma de Oro", "Letras de Plata",
    "Circulo Literario", "Gran Jurado", "Critica", "Lectores",
    "Revelacion", "Trayectoria",
]


class DataFactory:
    """Construye y entrega los datos de un escenario."""

    def __init__(self, profile, seed):
        self.p = profile
        self.rng = random.Random(seed)
        self._build_pools(seed)

    # ---- pools (Faker una sola vez) ---------------------------------
    def _build_pools(self, seed):
        fk = Faker()
        Faker.seed(seed)
        self.first = [fk.first_name() for _ in range(3000)]
        self.last = [fk.last_name() for _ in range(3000)]
        self.cities = [fk.city()[:20] for _ in range(1500)]
        self.companies = [fk.company()[:50] for _ in range(1500)]
        self.comments = [fk.sentence(nb_words=12)[:480] for _ in range(5000)]

    # ---- helpers ----------------------------------------------------
    def _pick(self, pool):
        return pool[self.rng.randrange(len(pool))]

    def _date(self, y_lo, y_hi):
        y = self.rng.randint(y_lo, y_hi)
        return date(y, self.rng.randint(1, 12), self.rng.randint(1, 28))

    def _recent_date(self, floor_year):
        """Fecha en la ventana de actividad, nunca antes de floor_year."""
        lo = max(floor_year, ACTIVITY_START)
        return self._date(min(lo, ACTIVITY_END), ACTIVITY_END)

    def _skewed(self, n):
        """Índice sesgado hacia 0 (cola pesada: pocos muy activos/populares)."""
        return min(n - 1, int(n * (self.rng.random() ** 2)))

    def _wcount(self, lo, hi, decay):
        """Conteo en [lo,hi] con sesgo hacia lo (decay<1 => más sesgo)."""
        counts = list(range(lo, hi + 1))
        weights = [decay ** i for i in range(len(counts))]
        return self.rng.choices(counts, weights=weights)[0]

    def _password(self):
        return "".join(self.rng.choices(string.ascii_letters + string.digits, k=12))

    # =================================================================
    # CONSTRUCCIÓN
    # =================================================================
    def build(self):
        p, rng = self.p, self.rng

        # 1. AgeRate
        self.agerate = [(c, f"T{rng.randint(7, 18)}", rng.randint(1, 10),
                         rng.randint(1, 10), rng.randint(1, 10), rng.randint(1, 10))
                        for c in range(1, p["agerate"] + 1)]
        self.agerate_codes = [r[0] for r in self.agerate]

        # 2. Warning
        self.warning = []
        for code in self.agerate_codes:
            for k in range(p["warnings_per_agerate"]):
                self.warning.append((code, f"Advertencia {k+1}: {self._pick(self.comments)}"))

        # 3. Editorial
        self.editorial = []
        self.editorial_years = []
        for i in range(1, p["editorial"] + 1):
            f = self._date(1900, 2015)
            self.editorial_years.append(f.year)
            web = None if rng.random() < 0.30 else f"http://edi{i}.example.com"
            self.editorial.append((i, self._pick(self.companies), self._pick(PAISES), f, web))

        # 4. Genero
        self.genero_names = []
        self.genero = []
        for i in range(p["genero"]):
            name = GENERO_BASE[i] if i < len(GENERO_BASE) else f"Subtema {i}"
            self.genero_names.append(name)
            self.genero.append((name, self._pick(self.comments)[:500]))

        # 5. SubGenero
        self.subgenero = []
        self.subgen_pairs = []
        for g in self.genero_names:
            for j in range(p["subgenero_per_genero"]):
                sn = f"{SUBGENERO_BASE[j % len(SUBGENERO_BASE)]} {j+1}"[:50]
                self.subgenero.append((g, sn, self._pick(self.comments)[:500]))
                self.subgen_pairs.append((g, sn))

        # 6. Autor
        self.autor = []
        for i in range(1, p["autor"] + 1):
            bio = None if rng.random() < 0.30 else self._pick(self.comments)
            self.autor.append((i, self._pick(self.first)[:50], self._pick(self.last)[:50],
                               self._pick(PAISES), self._date(1940, 2005), bio))
        self.AU = p["autor"]

        # 7. Premio
        self.premio_names = []
        self.premio = []
        for i in range(p["premio"]):
            name = (PREMIO_BASE[i] if i < len(PREMIO_BASE) else f"Premio {i}")[:50]
            self.premio_names.append(name)
            rel = None if rng.random() < 0.20 else rng.randint(1, 5)
            self.premio.append((name, self._pick(["Ficcion", "Poesia", "Ensayo", "Novela"]), rel))

        # 8. Ilustracion
        self.ilustracion = [(i, f"{self._pick(self.first)} {self._pick(self.last)}"[:50],
                             self._pick(TIPOS_ARTE), f"http://img/{i}.jpg"[:100],
                             self._date(1980, 2024))
                            for i in range(1, p["ilustracion"] + 1)]
        self.IL = p["ilustracion"]

        # 9. Curiosidad
        self.curiosidad = [(i, self._pick(self.comments)[:500])
                           for i in range(1, p["curiosidad"] + 1)]
        self.curi_codes = [r[0] for r in self.curiosidad]

        # 10. Usuario  (roles realistas, edad sesgada a adulto joven)
        self.usuario = []
        self.users = []
        for i in range(p["usuario"]):
            u, e = f"user{i}", f"user{i}@mail.com"
            self.users.append((u, e))
            rol = "Administrador" if rng.random() < 0.08 else "Registrado"
            edad = int(rng.triangular(12, 80, 27))
            self.usuario.append((u, e, self._password(),
                                 self._pick(self.first)[:20], self._pick(self.last)[:20],
                                 edad, rng.randint(10**8, 9 * 10**8),
                                 self._pick(self.cities)[:20], rol))
        self.U = p["usuario"]

        # 11. Material (tipo y páginas realistas)
        self.material = []
        self.materials = []
        self.buckets = {t: [] for t in TIPOS}
        E, A = p["editorial"], p["agerate"]
        for i in range(1, p["material"] + 1):
            e_idx = rng.randrange(E)
            anio = rng.randint(self.editorial_years[e_idx], 2024)
            tipo = rng.choices(TIPOS, weights=TIPO_WEIGHTS)[0]
            pg_lo, pg_hi = PAGES_BY_TIPO[tipo]
            eslogan = None if rng.random() < 0.40 else self._pick(self.comments)[:100]
            alias = None if rng.random() < 0.40 else f"alias{i}"[:50]
            self.material.append((i, rng.randint(pg_lo, pg_hi), anio, eslogan, alias,
                                  self._pick(PAISES)[:15],
                                  rng.choices(IDIOMAS, weights=IDIOMA_WEIGHTS)[0][:15],
                                  tipo, rng.randint(1, A), e_idx + 1))
            self.materials.append((i, anio, tipo))
            self.buckets[tipo].append(i)
        self.M = p["material"]

        # Permutaciones: popularidad/actividad NO correlacionadas con el id.
        self.mat_by_pop = list(range(self.M)); rng.shuffle(self.mat_by_pop)
        self.user_by_act = list(range(self.U)); rng.shuffle(self.user_by_act)

        self._build_relations()

    def _build_relations(self):
        p, rng = self.p, self.rng
        M, AU = self.M, self.AU

        # Escribe: mayoría 1 autor (sesgo fuerte hacia lo)  [Cambio B]
        a_lo, a_hi = p["authors_per_material"]
        self.escribe = []
        for (mid, _a, _t) in self.materials:
            k = min(self._wcount(a_lo, a_hi, 0.30), AU)
            for ai in rng.sample(range(AU), k):
                self.escribe.append((mid, ai + 1))

        # Pertenece: 1-3 géneros, sesgo moderado
        g_lo, g_hi = p["genres_per_material"]
        G = len(self.genero_names)
        self.pertenece = []
        for (mid, _a, _t) in self.materials:
            k = min(self._wcount(g_lo, g_hi, 0.55), G)
            for g in rng.sample(self.genero_names, k):
                self.pertenece.append((mid, g))

        # PerteneceSubGenero  [Cambio I]
        s_lo, s_hi = p["subgenres_per_material"]
        self.pertenecesub = []
        if self.subgen_pairs:
            for (mid, _a, _t) in self.materials:
                k = min(self._wcount(s_lo, s_hi, 0.55), len(self.subgen_pairs))
                for (g, sn) in rng.sample(self.subgen_pairs, k):
                    self.pertenecesub.append((mid, g, sn))

        # Popularizo: cada género >= 1 autor  [Cambio C]
        ag_lo, ag_hi = p["authors_per_genero"]
        self.popularizo = []
        for g in self.genero_names:
            k = min(rng.randint(ag_lo, ag_hi), AU)
            for ai in rng.sample(range(AU), k):
                self.popularizo.append((ai + 1, g))

        # Ganar: pocos materiales premiados; fecha >= publicación
        self.ganar = []
        P = len(self.premio_names)
        winners = rng.sample(range(M), int(M * p["ganar_frac"]))
        pl, ph = p["premios_per_winner"]
        for mi in winners:
            anio = self.materials[mi][1]
            for pn in rng.sample(self.premio_names, min(rng.randint(pl, ph), P)):
                self.ganar.append((mi + 1, pn, self._date(anio, 2024)))

        # Contiene: ilustraciones, sesgo hacia pocas por material
        self.contiene = []
        cl, ch = p["ilus_per_material"]
        carriers = rng.sample(range(M), int(M * p["contiene_frac"]))
        for mi in carriers:
            k = min(self._wcount(cl, ch, 0.5), self.IL)
            for ii in rng.sample(range(self.IL), k):
                self.contiene.append((mi + 1, ii + 1, rng.randint(1, 500)))

        # Tiene: curiosidad -> material (popular) opcional
        self.tiene = []
        for code in self.curi_codes:
            if rng.random() < p["tiene_assigned_frac"]:
                self.tiene.append((code, self.materials[self.mat_by_pop[self._skewed(M)]][0]))
            else:
                self.tiene.append((code, None))

    # =================================================================
    # INTERACCIÓN (streaming, dedupe, cola pesada en materiales y usuarios)
    # =================================================================
    def _hot_material(self):
        return self.mat_by_pop[self._skewed(self.M)]

    def _hot_user(self):
        return self.user_by_act[self._skewed(self.U)]

    def gen_likes(self):
        target, seen = self.p["likes"], set()
        while len(seen) < target:
            mi, ui = self._hot_material(), self._hot_user()
            if (mi, ui) in seen:
                continue
            seen.add((mi, ui))
            u, e = self.users[ui]
            yield (self.materials[mi][0], u, e)

    def gen_leer(self):
        target, seen = self.p["leer"], set()
        while len(seen) < target:
            mi, ui = self._hot_material(), self._hot_user()
            mat_id, anio, _t = self.materials[mi]
            f = self._recent_date(anio)
            key = (mi, ui, f)
            if key in seen:
                continue
            seen.add(key)
            u, e = self.users[ui]
            yield (mat_id, u, e, f)

    def gen_resena(self):
        target, seen = self.p["resena"], set()
        code = 0
        while len(seen) < target:
            mi, ui = self._hot_material(), self._hot_user()
            if (mi, ui) in seen:
                continue
            seen.add((mi, ui))
            code += 1
            mat_id, anio, _t = self.materials[mi]
            u, e = self.users[ui]
            # puntaje sesgado alto (mayoría 7-10); votos de reseña sesgados a bajos
            puntaje = round(self.rng.triangular(0, 10, 8.3), 1)
            votos = int((self.rng.random() ** 3) * 60)
            yield (code, mat_id, u, e, self._pick(self.comments),
                   puntaje, self._recent_date(anio), votos)
