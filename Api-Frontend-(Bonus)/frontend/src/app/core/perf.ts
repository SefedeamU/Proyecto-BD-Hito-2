import { Injectable, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

// Mide el tiempo de las consultas al API de la página ACTUAL. Cada navegación
// reinicia la medición, de modo que el promedio refleja solo las consultas que
// dispara la vista en la que estás (que cambian de página en página).
@Injectable({ providedIn: 'root' })
export class Perf {
  private router = inject(Router);
  private samples = signal<number[]>([]);

  readonly count = computed(() => this.samples().length);
  readonly total = computed(() => this.samples().reduce((a, b) => a + b, 0));
  readonly avg = computed(() => (this.count() ? this.total() / this.count() : 0));

  constructor() {
    // Al terminar cada navegación empezamos una medición nueva.
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.reset();
    });
  }

  add(ms: number): void {
    this.samples.update((s) => [...s, ms]);
  }

  reset(): void {
    this.samples.set([]);
  }

  // Formato adaptativo ms / s / min según la magnitud.
  fmt(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(1)} ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)} s`;
    const m = Math.floor(ms / 60000);
    const s = ((ms % 60000) / 1000).toFixed(1);
    return `${m} min ${s} s`;
  }
}
