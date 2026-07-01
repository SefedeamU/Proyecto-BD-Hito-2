import { HttpInterceptorFn, HttpEventType } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { Perf } from './perf';

// Cronometra el round-trip de cada llamada al API y lo registra en Perf. En una
// demo local (front y API en localhost) el round-trip es prácticamente el
// tiempo de la consulta, así que sirve para comparar con/sin índices.
export const perfInterceptor: HttpInterceptorFn = (req, next) => {
  const perf = inject(Perf);
  const start = performance.now();
  return next(req).pipe(
    tap((event) => {
      if (event.type === HttpEventType.Response) {
        perf.add(performance.now() - start);
      }
    }),
  );
};
