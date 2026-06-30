import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../core/api';
import { Material } from '../core/models';
import { MaterialCard } from '../shared/material-card';
import { SkeletonCard } from '../shared/skeleton-card';

const TIPOS = ['Libro', 'Ensayo', 'Revista', 'Poema', 'AudioBook'];
const PAGE = 24;

@Component({
  selector: 'app-catalog',
  imports: [MaterialCard, SkeletonCard],
  template: `
    <div class="container">
      <h1 class="page-title">Catálogo</h1>

      <div class="filters">
        <div class="chips" role="group" aria-label="Filtrar por género">
          <button class="chip-outline" [class.active]="!genre()" (click)="setGenre('')">Todos los géneros</button>
          @for (g of genres(); track g) {
            <button class="chip-outline" [class.active]="genre() === g" (click)="setGenre(g)">{{ g }}</button>
          }
        </div>
        <div class="chips" role="group" aria-label="Filtrar por tipo">
          <button class="chip-outline" [class.active]="!type()" (click)="setType('')">Todo tipo</button>
          @for (t of tipos; track t) {
            <button class="chip-outline" [class.active]="type() === t" (click)="setType(t)">{{ t }}</button>
          }
        </div>
      </div>

      @if (search()) { <p class="muted" role="status">Resultados para “<b>{{ search() }}</b>”</p> }

      @if (loading()) {
        <div class="grid">@for (i of skeletons; track i) { <app-skeleton-card /> }</div>
      } @else if (items().length) {
        <div class="grid stagger">
          @for (m of items(); track m.id) { <app-material-card [m]="m" /> }
        </div>
        @if (canLoadMore()) {
          <div class="center" style="margin:30px 0">
            <button class="btn btn-ghost" (click)="loadMore()" [disabled]="loadingMore()">
              @if (loadingMore()) { <span class="spinner dark"></span> Cargando… } @else { Cargar más }
            </button>
          </div>
        }
      } @else {
        <div class="empty">
          <span class="emoji">📚</span>
          <h3>Sin resultados</h3>
          <p class="muted">Prueba con otro filtro o término de búsqueda.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: clamp(1.6rem, 4vw, 2rem); margin: 32px 0 18px; }
    .filters { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip-outline {
      padding: 6px 14px; border-radius: 999px; background: transparent;
      border: 1.5px solid var(--line); color: var(--muted); cursor: pointer;
      font-size: .82rem; font-weight: 600; transition: all var(--t-fast);
    }
    .chip-outline:hover { border-color: var(--mustard); color: var(--mustard-deep); }
    .chip-outline.active { background: var(--mustard); color: #fff; border-color: var(--mustard); }
    .stagger > *:nth-child(1){animation-delay:.02s} .stagger > *:nth-child(2){animation-delay:.04s}
    .stagger > *:nth-child(3){animation-delay:.06s} .stagger > *:nth-child(4){animation-delay:.08s}
    .stagger > *:nth-child(5){animation-delay:.1s} .stagger > *:nth-child(6){animation-delay:.12s}
    .empty { text-align: center; padding: 70px 20px; }
    .empty .emoji { font-size: 3rem; }
    .empty h3 { margin: 12px 0 4px; }
  `],
})
export class Catalog {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  tipos = TIPOS;
  skeletons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  genres = signal<string[]>([]);
  items = signal<Material[]>([]);
  search = signal('');
  genre = signal('');
  type = signal('');
  loading = signal(true);
  loadingMore = signal(false);
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
    this.api.materials({ search: this.search(), genre: this.genre(), type: this.type(), limit: PAGE, offset: 0 })
      .subscribe((res) => {
        this.items.set(res);
        this.canLoadMore.set(res.length === PAGE);
        this.loading.set(false);
      });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.api.materials({ search: this.search(), genre: this.genre(), type: this.type(), limit: PAGE, offset: this.items().length })
      .subscribe((res) => {
        this.items.update((cur) => [...cur, ...res]);
        this.canLoadMore.set(res.length === PAGE);
        this.loadingMore.set(false);
      });
  }

  setGenre(g: string): void { this.genre.set(g); this.reload(); }
  setType(t: string): void { this.type.set(t); this.reload(); }
}
