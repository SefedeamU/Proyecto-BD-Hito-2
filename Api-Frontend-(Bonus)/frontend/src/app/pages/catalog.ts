import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../core/api';
import { Material } from '../core/models';
import { MaterialCard } from '../shared/material-card';

const TIPOS = ['Libro', 'Ensayo', 'Revista', 'Poema', 'AudioBook'];
const PAGE = 24;

@Component({
  selector: 'app-catalog',
  imports: [MaterialCard],
  template: `
    <div class="container">
      <h1 class="page-title">Catálogo</h1>

      <div class="filters">
        <div class="chips">
          <span class="chip-outline" [class.active]="!genre()" (click)="setGenre('')">Todos los géneros</span>
          @for (g of genres(); track g) {
            <span class="chip-outline" [class.active]="genre() === g" (click)="setGenre(g)">{{ g }}</span>
          }
        </div>
        <div class="chips">
          <span class="chip-outline" [class.active]="!type()" (click)="setType('')">Todo tipo</span>
          @for (t of tipos; track t) {
            <span class="chip-outline" [class.active]="type() === t" (click)="setType(t)">{{ t }}</span>
          }
        </div>
      </div>

      @if (search()) { <p class="muted">Resultados para “<b>{{ search() }}</b>”</p> }

      <div class="grid">
        @for (m of items(); track m.id) { <app-material-card [m]="m" /> }
      </div>

      @if (!items().length && !loading()) {
        <p class="muted center" style="padding:50px">Sin resultados. Prueba otro filtro o búsqueda.</p>
      }
      @if (loading()) { <p class="muted center" style="padding:30px">Cargando…</p> }
      @if (canLoadMore()) {
        <div class="center" style="margin:30px 0">
          <button class="btn btn-ghost" (click)="loadMore()">Cargar más</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 2rem; margin: 32px 0 18px; }
    .filters { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  `],
})
export class Catalog {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  tipos = TIPOS;
  genres = signal<string[]>([]);
  items = signal<Material[]>([]);
  search = signal('');
  genre = signal('');
  type = signal('');
  loading = signal(false);
  canLoadMore = signal(false);

  constructor() {
    this.api.genres().subscribe((g) => this.genres.set(g));
    this.route.queryParams.subscribe((p) => {
      this.search.set(p['search'] ?? '');
      this.genre.set(p['genre'] ?? '');
      this.reload();
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.items.set([]);
    this.fetch(0);
  }

  private fetch(offset: number): void {
    this.api.materials({
      search: this.search(), genre: this.genre(), type: this.type(),
      limit: PAGE, offset,
    }).subscribe((res) => {
      this.items.update((cur) => offset === 0 ? res : [...cur, ...res]);
      this.canLoadMore.set(res.length === PAGE);
      this.loading.set(false);
    });
  }

  loadMore(): void { this.fetch(this.items().length); }
  setGenre(g: string): void { this.genre.set(g); this.reload(); }
  setType(t: string): void { this.type.set(t); this.reload(); }
}
