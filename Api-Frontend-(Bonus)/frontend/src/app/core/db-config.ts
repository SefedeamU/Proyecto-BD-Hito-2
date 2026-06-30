import { Injectable, signal } from '@angular/core';

export interface DbOption { value: string; label: string; hint: string; }

// Las 4 bases de volumen. Es configuración GLOBAL de quien navega la demo:
// la base elegida se aplica a TODAS las consultas (vía el header X-Database).
export const DATABASES: DbOption[] = [
  { value: 'bd_literaria_1k', label: '1K', hint: '300 materiales' },
  { value: 'bd_literaria_10k', label: '10K', hint: '2 mil materiales' },
  { value: 'bd_literaria_100k', label: '100K', hint: '20 mil materiales' },
  { value: 'bd_literaria_1m', label: '1M', hint: '100 mil materiales' },
];

const KEY = 'biblioteca_db';
const DEFAULT = 'bd_literaria_10k';

@Injectable({ providedIn: 'root' })
export class DbConfig {
  readonly databases = DATABASES;
  readonly db = signal<string>(this.restore());

  private restore(): string {
    try {
      return localStorage.getItem(KEY) || DEFAULT;
    } catch {
      return DEFAULT;
    }
  }

  set(value: string): void {
    try { localStorage.setItem(KEY, value); } catch {}
    this.db.set(value);
  }
}
