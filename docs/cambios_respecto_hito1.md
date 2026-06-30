# Cambios del modelo físico respecto al Hito 1

**Proyecto:** Plataforma de catálogo, lectura, reseñas y descubrimiento de materiales literarios — Hito 2, Base de Datos I.

Este documento deja constancia de **todas** las diferencias entre el modelo relacional entregado en el Hito 1 y el esquema físico implementado en PostgreSQL para el Hito 2, junto con su justificación. Cada cambio está identificado con una etiqueta `[Cambio X]` que aparece como comentario en los scripts `sql/`.

El espíritu de las correcciones fue **doble**: (1) cerrar reglas de negocio del propio Hito 1 que el modelo relacional dejó sin mecanismo de enforcement, y (2) dejar la base de datos en condiciones de producir una experimentación de índices honesta y reproducible. No se reinterpretó el dominio ni se agregaron entidades ajenas a la plataforma literaria.

---

## 1. Resumen de cambios

| ID | Categoría | Cambio | Archivo(s) |
|----|-----------|--------|------------|
| A | Integridad / herencia | Discriminador `Tipo` en `Material` | `01_tables.sql`, `03_views.sql` |
| B | Regla de negocio | Trigger: todo `Material` debe tener ≥1 autor | `02_triggers.sql` |
| C | Regla de negocio | Trigger: todo `Genero` debe tener ≥1 autor representante | `02_triggers.sql` |
| D | Modelo | `Leer`: `Fecha` entra a la PK (permite relecturas) | `01_tables.sql` |
| E | Integridad | `Resena`: `UNIQUE(Material, Usuario)` (una reseña por usuario-material) | `01_tables.sql` |
| F | Integridad | `Resena.Likes` con `CHECK (>= 0)` | `01_tables.sql` |
| G | Tipo de dato | `Resena.Puntaje`: `DOUBLE PRECISION` → `NUMERIC(3,1)` | `01_tables.sql` |
| H | Integridad referencial | `ON UPDATE CASCADE` en las FK hacia `Usuario` | `01_tables.sql` |
| I | Modelo | Nueva tabla `PerteneceSubGenero` (Material ↔ SubGénero) | `01_tables.sql`, `03_views.sql` |
| J | Experimento | Consulta de popularidad con subconsultas agregadas independientes | `06_experiments.sql` |
| K | Experimento | Índices alineados con los caminos de acceso de las 4 consultas | `04_indexes.sql`, `05_drop_indexes.sql` |
| M | Modelo | Nueva tabla `ImagenMaterial` (3 URLs de portada por material) | `01_tables.sql`, `03_views.sql` |

---

## 2. Detalle y justificación

### [Cambio A] Discriminador `Tipo` en `Material`
**Qué:** se agregó la columna `Tipo VARCHAR(10) NOT NULL` con `CHECK (Tipo IN ('Libro','Ensayo','Revista','Poema','AudioBook'))`.

**Por qué:** el Hito 1 especifica que `Material` es una jerarquía de herencia **total y disjunta** (todo material es exactamente uno de los cinco subtipos). El modelo relacional de tabla-por-subtipo (`Libro`, `Ensayo`, …) **no garantiza** esa regla: nada impide que un material no aparezca en ningún subtipo (viola la totalidad) o que aparezca en varios (viola la disjunción). El discriminador la enforza de forma barata y consultable: `NOT NULL` ⇒ totalidad, un único valor de `CHECK` ⇒ disjunción.

**Impacto:** las tablas de subtipo se conservan por fidelidad al Hito 1 y deben poblarse en coherencia con `Tipo`. `Tipo` es la fuente de verdad del subtipo y habilita consultar/filtrar por tipo directamente sobre `Material`.

### [Cambio B] Participación total: `Material` ≥ 1 autor
**Qué:** `CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED` sobre `Material` que valida, al `COMMIT`, que exista al menos una fila en `Escribe` para cada material.

**Por qué:** el Hito 1 lo declara como restricción de integridad ("un material no puede tener cero autores"), pero no es expresable con un `CHECK` simple porque cruza dos tablas y es circular respecto al orden de inserción. El trigger diferido resuelve la circularidad validando al final de la transacción.

**Impacto:** la carga debe insertar `Material` y su `Escribe` **dentro de la misma transacción** (ver sección 4).

### [Cambio C] Participación total: `Genero` ≥ 1 autor representante
**Qué:** análogo al anterior, trigger diferido sobre `Genero` que exige al menos una fila en `Popularizo`.

**Por qué:** regla del Hito 1 ("un género debe ser representado por al menos un autor") sin mecanismo de enforcement en el modelo relacional.

### [Cambio D] `Leer`: `Fecha` forma parte de la PK
**Qué:** la PK pasó de `(Material_Id, Usuario_Username, Usuario_Email)` a `(Material_Id, Usuario_Username, Usuario_Email, Fecha)`, y `Fecha` es `NOT NULL`.

**Por qué:** con la PK del Hito 1, un usuario solo podía registrar **una** lectura por material; era imposible modelar relecturas. Como `Leer` representa el *historial de lectura*, lo correcto es que la fecha distinga eventos. Beneficio adicional: hace la tabla más voluminosa y realista, lo que fortalece la Consulta 3 (historial) como caso de demostración de índices.

### [Cambio E] `Resena`: una reseña por usuario-material
**Qué:** se agregó `UNIQUE (Material_Id, Usuario_Username, Usuario_Email)`.

**Por qué:** en el Hito 1 la PK de `Resena` es solo `Code`, por lo que el mismo usuario podía reseñar el mismo material infinitas veces. La restricción evita reseñas duplicadas, comportamiento estándar en plataformas de reseñas. *(Decisión revisable: si el curso exige permitir múltiples reseñas, basta con quitar esta UNIQUE.)*

### [Cambio F] `Resena.Likes` no negativo
**Qué:** `CHECK (Likes >= 0)`.

**Por qué:** un contador de votos positivos no puede ser negativo; el Hito 1 no lo acotaba.

### [Cambio G] `Resena.Puntaje` → `NUMERIC(3,1)`
**Qué:** el tipo cambió de `DOUBLE PRECISION` a `NUMERIC(3,1)` (se mantiene `CHECK BETWEEN 0 AND 10`).

**Por qué:** el Hito 1 dice explícitamente que el puntaje tiene "un decimal de precisión". `DOUBLE PRECISION` aceptaba valores como `7.3456`. `NUMERIC(3,1)` garantiza exactamente un decimal y evita los errores de representación del punto flotante.

### [Cambio H] `ON UPDATE CASCADE` hacia `Usuario`
**Qué:** las FK de `Likes`, `Leer` y `Resena` hacia `Usuario(Username, Email)` agregan `ON UPDATE CASCADE` (además del `ON DELETE CASCADE` ya presente).

**Por qué:** como `Username`/`Email` son la PK de `Usuario`, sin `ON UPDATE CASCADE` corregir el correo o el username de un usuario era imposible sin borrado manual. El cascade permite mantener esas correcciones sin romper la integridad referencial.

### [Cambio I] Nueva tabla `PerteneceSubGenero`
**Qué:** tabla intermedia M:N `PerteneceSubGenero(Material_Id, Genero_Nombre, SubGenero_Nombre)` con FK compuesta a `SubGenero(Genero_Nombre, Nombre)`. Se añadió también la vista `vista_material_subgenero`.

**Por qué:** el Hito 1 lista "listar materiales por subgénero" como consulta requerida (sección 1.5.4), pero **el modelo relacional dejó `SubGenero` sin ninguna relación con `Material`**: `Pertenece` solo conecta Material↔Género. La entidad quedaba aislada del catálogo y la consulta era imposible. Esta tabla cierra ese hueco.

### [Cambio J] Consulta de popularidad con subconsultas agregadas independientes
**Qué:** la consulta de "materiales más populares" (Q2) calcula cada métrica (likes, lecturas, reseñas, promedio) en **subconsultas independientes** que agregan por material y luego se combinan con `LEFT JOIN`.

**Por qué:** combinar las tres tablas 1-a-muchos con `LEFT JOIN` directos sobre `Material` multiplicaría las filas intermedias (`#likes × #lecturas × #reseñas` por material) y distorsionaría el benchmark: el costo vendría de la forma de la consulta, no de los índices. Con subconsultas agregadas, Q2 mide lo que debe medir: una **agregación total** (el caso donde el índice secundario ayuda poco).

### [Cambio K] Índices alineados con los caminos de acceso de las 4 consultas
**Qué:** el set de índices secundarios cubre los filtros y joins de las 4 consultas. El mayor contraste con/sin índice aparece sobre columnas que **no** lideran ninguna PK (`Pertenece.Genero_Nombre`, `Resena.Material_Id` —cuya PK es `Code`—, el camino de usuario en `Leer`, `Material.Anio_Publicacion`), porque ahí el escenario "sin índices" degrada a `Seq Scan`.

**Por qué:** en `Escribe`, `Pertenece`, `Likes` y `Leer` la PK ya empieza por `Material_Id`, así que los joins por esa columna se apoyan en la PK. Sobre `Likes` y `Leer` se añaden índices **estrechos** de una sola columna (`Material_Id`) porque permiten resolver el conteo de Q2 con un *index-only scan* más liviano que recorrer la PK completa; el resto de los índices ataca columnas no cubiertas por ninguna PK, que son las que producen el contraste real del experimento.

### [Cambio M] Portadas por material (tabla `ImagenMaterial`)
**Qué:** se agregó la tabla `ImagenMaterial(Material_Id, URLs)` —una fila por material con un arreglo `TEXT[]` de **3 URLs de imagen**— más la vista `vista_material_portadas`. Cada material queda con tres portadas. Las URLs apuntan a **Lorem Picsum** (`https://picsum.photos/seed/litmat<id>-<n>/400/600`).

**Por qué:** la aplicación de demostración (catálogo, búsqueda, reseñas) necesita mostrar imágenes de cada material, pero el modelo del Hito 1 no contemplaba portadas. Se decidió **almacenar las URLs en la base de datos** (no inyectarlas desde el front-end), porque en un curso de bases de datos los datos deben provenir de la BD; resolverlo en el front sería una solución débil y podría interpretarse como que los datos no están realmente modelados.

**Detalles de diseño:**
- Se eligió **Lorem Picsum** por ser un servicio público, sin API key, **determinista por seed** (la misma URL siempre devuelve la misma imagen), de modo que los dumps son reproducibles. Las URLs se generan a partir del `id` del material, sin transferir datos (`INSERT ... SELECT` en el servidor).
- Se modela como **una fila por material con un arreglo de 3 URLs** (en lugar de 3 filas) para no triplicar el volumen (1M filas en vez de 3M) y mantener livianas la carga y los dumps. Es un uso deliberado de arrays de PostgreSQL; la alternativa totalmente normalizada (tabla `(Material_Id, Orden, URL)`) era válida pero pesaba 3× sin aportar al objetivo de la demo.
- La poblamiento valida que una **muestra de las URLs responda HTTP 200 con reintentos** antes de insertar (script `faker/add_images.py`), y el faker también las genera en corridas frescas (`loader.py`), para mantener todo coherente.

---

## 3. Decisiones deliberadas de NO cambiar (fidelidad al Hito 1)

Para transparencia, se documentan los puntos observados que **se decidió mantener** tal como en el Hito 1:

- **PK compuesta de `Usuario` `(Username, Email)`.** Es redundante (cada columna ya es única por separado) y obliga a arrastrar ambos campos como FK en `Likes`/`Leer`/`Resena`, denormalizando. Se conserva por fidelidad al modelo del Hito 1.
- **Tablas de subtipo `Libro`/`Ensayo`/`Revista`/`Poema`/`AudioBook` sin atributos propios.** Quedan redundantes con el discriminador `Tipo` [Cambio A], pero se mantienen porque el Hito 1 las modela explícitamente (tabla-por-subtipo).
- **Renombre `Reseña` → `Resena`** (sin "ñ") en el identificador de tabla, por robustez en SQL. El contenido es idéntico.
- **Validación temporal solo del lado "hijo".** Los triggers (a) y (b) validan al insertar/actualizar `Material` y `Resena`, pero no re-validan si luego se actualiza `Editorial.Fundacion` o `Material.Anio_Publicacion` invalidando filas existentes. Se asume que esos campos no se modifican retroactivamente; se deja constancia como limitación conocida.

---

## 4. Notas para el poblamiento (Faker / COPY)

Los cambios [B] y [C] usan triggers **diferidos** (validan al `COMMIT`). Por ello, el `populate.py` debe:

- Cargar todo dentro de **una sola transacción** (`BEGIN ... COMMIT`), o al menos garantizar que `Material` y sus filas de `Escribe` (y `Genero` con su `Popularizo`) queden en la misma transacción.
- Si se hace carga masiva por `COPY` tabla-por-tabla en transacciones separadas, los triggers diferidos deben deshabilitarse temporalmente y validarse al final con una consulta de control.

Restricciones de tipo del Hito 1 que la generación de datos debe respetar (no se modificaron):

- `Material.Pais` e `Idioma`: `VARCHAR(15)`.
- `Usuario.Nombre`/`Apellido`/`Ciudad`: `VARCHAR(20)`.
- `Usuario.Password`: `VARCHAR(12)` con `CHECK = 12` exacto.
- `Usuario.Telefono`: `BIGINT` (solo dígitos).
- `Material.Tipo`: uno de `{Libro, Ensayo, Revista, Poema, AudioBook}`, y el material debe insertarse también en la tabla de subtipo correspondiente.
- Todos los identificadores se almacenan en **minúsculas** (PostgreSQL pliega los identificadores no entrecomillados).
