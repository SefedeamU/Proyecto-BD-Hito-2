# video/ — Video de la experimentación

Aquí va el video (o su enlace) que pide la rúbrica.
Debe mostrar la experimentación completa sobre la base de **1 millón de registros**.

**Enlace:** *(pegar aquí cuando esté grabado)*

---

## Guion — qué mostrar y en qué orden (~6-8 minutos)

### 1. Presentar la base (1 min)
Conectarse a `bd_literaria_1m` y mostrar que los datos están:

```sql
SELECT 'Material' tabla, COUNT(*) filas FROM Material
UNION ALL SELECT 'Likes',  COUNT(*) FROM Likes
UNION ALL SELECT 'Leer',   COUNT(*) FROM Leer
UNION ALL SELECT 'Resena', COUNT(*) FROM Resena;
```

### 2. Correr sin índices (2 min)
```sql
\i sql/05_drop_indexes.sql
ANALYZE;
\i sql/06_experiments.sql
```
Mostrar el plan y el Execution Time de cada consulta.
Resaltar los `Seq Scan` en el plan.

### 3. Crear los índices (30 seg)
```sql
\i sql/04_indexes.sql
ANALYZE;
```
Mencionar brevemente qué columna indexa cada uno.

### 4. Correr con índices (2 min)
```sql
\i sql/06_experiments.sql
```
Mostrar cómo cambian los planes: aparecen `Index Scan` y `Bitmap Index Scan`.
Comparar los tiempos con los del paso 2.

### 5. Costo de los índices (1 min)
```sql
\i sql/07_index_overhead.sql
```
Mostrar que las escrituras son más lentas con índices.

### 6. Cierre (30 seg)
Resumir los tres comportamientos observados:
cuándo el índice ayudó mucho, cuándo poco y cuándo no ayudó.
