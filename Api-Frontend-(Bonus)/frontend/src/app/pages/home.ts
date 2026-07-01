import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Api } from '../core/api';
import { Material } from '../core/models';
import { MaterialCard } from '../shared/material-card';
import { SkeletonCard } from '../shared/skeleton-card';

interface Row { genero: string; items: Material[]; }

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe, MaterialCard, SkeletonCard],
  template: `
    <section class="hero">
      <div class="container hero-in">
        <div class="hero-copy animate-in">
          <span class="kicker">Catálogo · Lectura · Reseñas · Descubrimiento</span>
          <h1>Encuentra tu próxima<br><em>gran lectura.</em></h1>
          <p>Explora miles de materiales literarios, descubre los más populares y comparte tus reseñas.</p>
          <a routerLink="/catalog" class="btn btn-mustard">Explorar catálogo</a>
        </div>
        <div class="stats animate-in">
          @if (stats(); as s) {
            <div class="stat"><b>{{ s['materiales'] | number }}</b><span>materiales</span></div>
            <div class="stat"><b>{{ s['usuarios'] | number }}</b><span>lectores</span></div>
            <div class="stat"><b>{{ s['resenas'] | number }}</b><span>reseñas</span></div>
            <div class="stat"><b>{{ s['autores'] | number }}</b><span>autores</span></div>
          } @else {
            @for (i of [1,2,3,4]; track i) { <div class="stat skeleton" style="height:86px"></div> }
          }
        </div>
      </div>
    </section>

    <div class="container">
      <section class="row-section">
        <div class="row-head"><h2>🔥 Más populares</h2><a routerLink="/catalog">Ver todo</a></div>
        <div class="carousel">
          @if (popularLoading()) {
            @for (i of skeletons; track i) { <app-skeleton-card /> }
          } @else {
            @for (m of popular(); track m.id) { <app-material-card [m]="m" /> }
          }
        </div>
        @if (apiDown()) { <p class="muted">No se pudo conectar con el API (puerto 7000).</p> }
      </section>

      @for (row of rows(); track row.genero) {
        @if (row.items.length) {
          <section class="row-section animate-in">
            <div class="row-head"><h2>{{ row.genero }}</h2>
              <a routerLink="/catalog" [queryParams]="{ genre: row.genero }">Ver más</a></div>
            <div class="carousel">
              @for (m of row.items; track m.id) { <app-material-card [m]="m" /> }
            </div>
          </section>
        }
      }

      @if (loadingRows()) {
        <section class="row-section">
          <div class="row-head"><div class="skeleton sk-line" style="width:160px;height:20px"></div></div>
          <div class="carousel">
            @for (i of skeletons; track i) { <app-skeleton-card /> }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .hero { background: linear-gradient(120deg, var(--mustard-soft), var(--bg)); border-bottom: 1px solid var(--line); }
    .hero-in { display: flex; align-items: center; justify-content: space-between; gap: clamp(24px, 5vw, 40px); padding: clamp(32px, 6vw, 56px) clamp(14px, 4vw, 22px); flex-wrap: wrap; }
    .hero-copy { max-width: 560px; }
    .kicker { color: var(--mustard-deep); font-weight: 600; font-size: .85rem; letter-spacing: .04em; text-transform: uppercase; }
    .hero h1 { font-size: clamp(1.9rem, 6vw, 2.9rem); margin: 12px 0 14px; line-height: 1.08; }
    .hero h1 em { color: var(--mustard-deep); font-style: italic; }
    .hero p { color: var(--muted); font-size: clamp(.98rem, 2.6vw, 1.08rem); margin-bottom: 22px; max-width: 460px; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(10px, 2.5vw, 14px); flex: 1 1 260px; }
    .stat {
      background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
      padding: clamp(14px, 3vw, 18px) clamp(12px, 3vw, 24px); text-align: center; box-shadow: var(--shadow); min-width: 0;
    }
    .stat b { display: block; font-size: clamp(1.35rem, 5vw, 1.7rem); color: var(--mustard-deep); font-family: 'Georgia', serif; }
    .stat span { font-size: .82rem; color: var(--muted); }
    .hero-copy .btn { max-width: 100%; }
    @media (max-width: 520px) {
      .hero-copy { max-width: 100%; }
      .hero p { max-width: 100%; }
    }
  `],
})
export class Home {
  private api = inject(Api);
  skeletons = [1, 2, 3, 4, 5, 6, 7];
  stats = signal<Record<string, number> | null>(null);
  popular = signal<Material[]>([]);
  rows = signal<Row[]>([]);
  loadingRows = signal(true);
  popularLoading = signal(true);
  apiDown = signal(false);

  constructor() {
    this.api.stats().subscribe({ next: (s) => this.stats.set(s), error: () => this.apiDown.set(true) });
    this.api.popular(18).subscribe({
      next: (p) => { this.popular.set(p); this.popularLoading.set(false); },
      error: () => { this.popularLoading.set(false); this.apiDown.set(true); },
    });
    this.api.genres().subscribe({
      next: (gs) => {
        const pick = gs.slice(0, 6);
        let pending = pick.length;
        if (!pending) this.loadingRows.set(false);
        pick.forEach((g) =>
          this.api.materials({ genre: g, limit: 14 }).subscribe((items) => {
            this.rows.update((r) => [...r, { genero: g, items }]);
            if (--pending === 0) this.loadingRows.set(false);
          }));
      },
      error: () => { this.loadingRows.set(false); this.apiDown.set(true); },
    });
  }
}
