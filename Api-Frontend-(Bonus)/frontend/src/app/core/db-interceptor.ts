import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DbConfig } from './db-config';

// Agrega el header X-Database a cada petición al API, con la base efectiva
// (volumen elegido + sufijo _idx/_noidx según el toggle de índices). Así el
// backend enruta la consulta a la copia con o sin índices.
export const dbInterceptor: HttpInterceptorFn = (req, next) => {
  const cfg = inject(DbConfig);
  return next(req.clone({ setHeaders: { 'X-Database': cfg.effectiveDb() } }));
};
