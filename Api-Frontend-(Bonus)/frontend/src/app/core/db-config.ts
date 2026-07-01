import { Injectable, signal } from '@angular/core';

export interface DbOption { value: string; label: string; hint: string; }

// Los 4 volúmenes del experimento. `value` es el nombre BASE de la base; el
// sufijo (_idx / _noidx) lo agrega effectiveDb() según el toggle de índices.
// La elección es GLOBAL: se aplica a TODAS las consultas (header X-Database).
export const DATABASES: DbOption[] = [
  { value: 'bd_literaria_1k', label: '1K', hint: '300 materiales' },
  { value: 'bd_literaria_10k', label: '10K', hint: '2 mil materiales' },
  { value: 'bd_literaria_100k', label: '100K', hint: '20 mil materiales' },
  { value: 'bd_literaria_1m', label: '1M', hint: '100 mil materiales' },
];

const KEY = 'biblioteca_db';
const KEY_IDX = 'biblioteca_indexes';
const DEFAULT = 'bd_literaria_10k';

@Injectable({ providedIn: 'root' })
export class DbConfig {
  readonly databases = DATABASES;
  // Volumen elegido (nombre base) y si los índices están activados.
  readonly db = signal<string>(this.restore());
  readonly indexes = signal<boolean>(this.restoreIndexes());

  private restore(): string {
    try {
      return localStorage.getItem(KEY) || DEFAULT;
    } catch {
      return DEFAULT;
    }
  }

  private restoreIndexes(): boolean {
    try {
      // Por defecto ON; solo el valor 'off' desactiva.
      return localStorage.getItem(KEY_IDX) !== 'off';
    } catch {
      return true;
    }
  }

  // Nombre REAL de la base a consultar: volumen + sufijo según el toggle.
  //   índices ON  -> bd_literaria_<V>_idx   (copia con los índices del informe)
  //   índices OFF -> bd_literaria_<V>_noidx (copia sin ningún índice)
  effectiveDb(): string {
    return this.db() + (this.indexes() ? '_idx' : '_noidx');
  }

  set(value: string): void {
    try { localStorage.setItem(KEY, value); } catch {}
    this.db.set(value);
  }

  setIndexes(on: boolean): void {
    try { localStorage.setItem(KEY_IDX, on ? 'on' : 'off'); } catch {}
    this.indexes.set(on);
  }
}
