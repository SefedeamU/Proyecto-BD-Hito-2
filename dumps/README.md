# dumps/ — Copias restaurables de las 4 bases

Aquí van los dumps de cada escenario, como evidencia y respaldo restaurable:

```
bd_literaria_1k.dump
bd_literaria_10k.dump
bd_literaria_100k.dump
bd_literaria_1m.dump
```

Los dumps **no reemplazan** al proyecto `faker/` (que genera y carga los datos);
son una fotografía restaurable del estado de cada base.

## Generar un dump
```bash
pg_dump -Fc "<conexión>/bd_literaria_1m" -f dumps/bd_literaria_1m.dump
```

## Restaurar
```bash
pg_restore -d "<conexión>/bd_literaria_1m" dumps/bd_literaria_1m.dump
```

## Nota sobre el repositorio
Los dumps de `100k` y `1m` pueden pesar cientos de MB. Si no quieres subirlos a
git, descomenta `dumps/*.dump` en el `.gitignore` de la raíz.
