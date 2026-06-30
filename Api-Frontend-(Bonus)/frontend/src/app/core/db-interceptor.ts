import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DbConfig } from './db-config';

// Agrega el header X-Database a cada petición al API, con la base elegida
// globalmente por el usuario. Así el backend enruta la consulta a esa base.
export const dbInterceptor: HttpInterceptorFn = (req, next) => {
  const cfg = inject(DbConfig);
  return next(req.clone({ setHeaders: { 'X-Database': cfg.db() } }));
};
