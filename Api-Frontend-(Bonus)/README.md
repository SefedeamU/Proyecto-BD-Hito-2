# Api-Frontend-(Bonus)/ — API y frontend de demostración

Aunque la rúbrica lo marca como *bonus*, para esta entrega se trata como
obligatorio: una API y un frontend simples que demuestren que la base se puede
**consumir y manipular con un programa real**, no solo con consultas sueltas.

```
backend/    API conectada a PostgreSQL (lee de la base real, no datos quemados)
frontend/   interfaz simple que consume la API
```

## Objetivo
La demo debe mostrar:
- Datos saliendo de PostgreSQL a través de la API.
- Consultas reales (catálogo, detalle de material, reseñas, búsqueda por
  autor/género, ranking de populares, historial de usuario).
- Alguna escritura (registrar like o reseña).
- Idealmente, una pantalla con los resultados del benchmark.

## Conexión
El backend debe leer la conexión desde variables de entorno (mismo esquema que
`faker/.env.example`) y **nunca** traer credenciales quemadas en el código. El
archivo `.env` real está excluido por el `.gitignore` de la raíz.

> Núcleo del Hito 2: la implementación y experimentación de la base de datos. La
> API y el frontend están **al servicio** de demostrar la base, las consultas y la
> manipulación real de datos.
