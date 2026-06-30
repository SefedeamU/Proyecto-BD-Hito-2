import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Api } from '../core/api';
import { Material } from '../core/models';
import { MaterialCard } from '../shared/material-card';

interface Row { genero: string; items: Material[]; }

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe, MaterialCard],
  template: `
    <section class="hero">
      <div class="container hero-in">
        <div class="hero-copy">
          <span class="kicker">Catálogo · Lectura · Reseñas · Descubrimiento</span>
          <h1>Encuentra tu próxima<br><em>gran lectura.</em></h1>
          <p>Explora miles de materiales literarios, descubre los más populares y comparte tus reseñas.</p>
          <a routerLink="/catalog" class="btn btn-mustard">Explorar catálogo</a>
        </div>
        @if (stats(); as s) {
          <div class="stats">
            <div class="stat"><b>{{ s['materiales'] | number }}</b><span>materiales</span></div>
            <div class="stat"><b>{{ s['usuarios'] | number }}</b><span>lectores</span></div>
            <div class="stat"><b>{{ s['resenas'] | number }}</b><span>reseñas</span></div>
            <div class="stat"><b>{{ s['autores'] | number }}</b><span>autores</span></div>
          </div>
        }
      </div>
    </section>

    <div class="container">
      @if (popular().length) {
        <section class="row-section">
          <div class="row-head"><h2>🔥 Más populares</h2><a routerLink="/catalog">Ver todo</a></div>
          <div class="carousel">
            @for (m of popular(); track m.id) { <app-material-card [m]="m" /> }
          </div>
        </section>
      }

      @for (row of rows(); track row.genero) {
        @if (row.items.length) {
          <section class="row-section">
            <div class="row-head"><h2>{{ row.genero }}</h2>
              <a routerLink="/catalog" [queryParams]="{ genre: row.genero }">Ver más</a></div>
            <div class="carousel">
              @for (m of row.items; track m.id) { <app-material-card [m]="m" /> }
            </div>
          </section>
        }
      }

      @if (loading()) { <p class="muted center" style="padding:40px">Cargando catálogo…</p> }
    </div>
  `,
  styles: [`
    .hero { background: linear-gradient(120deg, var(--mustard-soft), var(--bg)); border-bottom: 1px solid var(--line); }
    .hero-in { display: flex; align-items: center; justify-content: space-between; gap: 40px; padding: 56px 22px; flex-wrap: wrap; }
    .hero-copy { max-width: 560px; }
    .kicker { color: var(--mustard-deep); font-weight: 600; font-size: .85rem; letter-spacing: .04em; text-transform: uppercase; }
    .hero h1 { font-size: 2.9rem; margin: 12px 0 14px; line-height: 1.08; }
    .hero h1 em { color: var(--mustard-deep); font-style: italic; }
    .hero p { color: var(--muted); font-size: 1.08rem; margin-bottom: 22px; max-width: 460px; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .stat {
      background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
      padding: 18px 24px; text-align: center; box-shadow: var(--shadow); min-width: 130px;
    }
    .stat b { display: block; font-size: 1.7rem; color: var(--mustard-deep); font-family: 'Georgia', serif; }
    .stat span { font-size: .82rem; color: var(--muted); }
  `],
})
export class Home {
  private api = inject(Api);
  stats = signal<Record<string, number> | null>(null);
  popular = signal<Material[]>([]);
  rows = signal<Row[]>([]);
  loading = signal(true);

  constructor() {
    this.api.stats().subscribe((s) => this.stats.set(s));
    this.api.popular(18).subscribe((p) => this.popular.set(p));
    this.api.genres().subscribe((gs) => {
      const pick = gs.slice(0, 6);
      this.loading.set(false);
      pick.forEach((g) =>
        this.api.materials({ genre: g, limit: 14 }).subscribe((items) =>
          this.rows.update((r) => [...r, { genero: g, items }])));
    });
  }
}
