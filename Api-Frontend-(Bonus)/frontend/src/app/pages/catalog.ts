import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { SearchResult, Options } from '../core/models';
import { MaterialCard } from '../shared/material-card';
import { SkeletonCard } from '../shared/skeleton-card';

const PAGE = 24;

interface Filters {
  tipo: string; idioma: string; pais: string;
  anio_min: number | null; anio_max: number | null; paginas_min: number | null; paginas_max: number | null;
  editorial_pais: string; fundacion_min: number | null; fundacion_max: number | null;
  agerate: string; violencia_max: number | null; sexualidad_max: number | null;
  genero: string; subgenero: string;
  autor_pais: string;
  con_premio: boolean; premio: string; premio_categoria: string; relevancia_min: number | null;
  con_ilustraciones: boolean; tipo_arte: string; con_curiosidades: boolean;
  min_likes: number | null; min_lecturas: number | null; min_resenas: number | null;
  puntaje_min: number | null; puntaje_max: number | null; min_autores: number | null;
  multi_autor: boolean; con_resenas: boolean;
  order: string;
}

function emptyFilters(): Filters {
  return {
    tipo: '', idioma: '', pais: '',
    anio_min: null, anio_max: null, paginas_min: null, paginas_max: null,
    editorial_pais: '', fundacion_min: null, fundacion_max: null,
    agerate: '', violencia_max: null, sexualidad_max: null,
    genero: '', subgenero: '',
    autor_pais: '',
    con_premio: false, premio: '', premio_categoria: '', relevancia_min: null,
    con_ilustraciones: false, tipo_arte: '', con_curiosidades: false,
    min_likes: null, min_lecturas: null, min_resenas: null,
    puntaje_min: null, puntaje_max: null, min_autores: null,
    multi_autor: false, con_resenas: false,
    order: 'relevancia',
  };
}

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, DecimalPipe, MaterialCard, SkeletonCard],
  template: `
    <div class="container">
      <header class="page-head">
        <div>
          <h1 class="page-title">Búsqueda avanzada</h1>
          <p class="muted">Filtra el catálogo combinando atributos, relaciones y métricas — cada filtro es una consulta sobre el modelo relacional.</p>
        </div>
        <button class="btn btn-ghost toggle" (click)="panel.set(!panel())">
          {{ panel() ? 'Ocultar filtros' : 'Filtros' }} @if (activeCount()) { <span class="count">{{ activeCount() }}</span> }
        </button>
      </header>

      <div class="layout">
        <aside class="filters" [class.open]="panel()">
          <fieldset>
            <legend>Material</legend>
            <div class="f"><label for="tipo">Tipo</label>
              <select id="tipo" [(ngModel)]="f.tipo">
                <option value="">Cualquiera</option>
                @for (t of tipos; track t) { <option [value]="t">{{ t }}</option> }
              </select></div>
            <div class="f"><label for="idioma">Idioma</label>
              <select id="idioma" [(ngModel)]="f.idioma">
                <option value="">Cualquiera</option>
                @for (x of opts()?.idiomas; track x) { <option [value]="x">{{ x }}</option> }
              </select></div>
            <div class="f"><label for="pais">País del material</label>
              <select id="pais" [(ngModel)]="f.pais">
                <option value="">Cualquiera</option>
                @for (x of opts()?.paises; track x) { <option [value]="x">{{ x }}</option> }
              </select></div>
            <div class="pair">
              <div class="f"><label>Año desde</label>
                <select [(ngModel)]="f.anio_min"><option [ngValue]="null">Cualquiera</option>
                  @for (y of decadas; track y) { <option [ngValue]="y">{{ y }}</option> }</select></div>
              <div class="f"><label>Año hasta</label>
                <select [(ngModel)]="f.anio_max"><option [ngValue]="null">Cualquiera</option>
                  @for (y of decadas; track y) { <option [ngValue]="y">{{ y }}</option> }</select></div>
            </div>
            <div class="pair">
              <div class="f"><label>Págs. mín.</label>
                <input type="number" min="0" inputmode="numeric" placeholder="Ej: 100" [(ngModel)]="f.paginas_min" />
                <span class="hint">entero de páginas</span></div>
              <div class="f"><label>Págs. máx.</label>
                <input type="number" min="0" inputmode="numeric" placeholder="Ej: 800" [(ngModel)]="f.paginas_max" /></div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Editorial</legend>
            <div class="f"><label>País de la editorial</label>
              <select [(ngModel)]="f.editorial_pais"><option value="">Cualquiera</option>
                @for (x of opts()?.editorial_paises; track x) { <option [value]="x">{{ x }}</option> }</select></div>
            <div class="pair">
              <div class="f"><label>Fundada desde</label>
                <select [(ngModel)]="f.fundacion_min"><option [ngValue]="null">Cualquiera</option>
                  @for (y of decadas; track y) { <option [ngValue]="y">{{ y }}</option> }</select></div>
              <div class="f"><label>Fundada hasta</label>
                <select [(ngModel)]="f.fundacion_max"><option [ngValue]="null">Cualquiera</option>
                  @for (y of decadas; track y) { <option [ngValue]="y">{{ y }}</option> }</select></div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Clasificación de edad</legend>
            <div class="f"><label>AgeRate</label>
              <select [(ngModel)]="f.agerate"><option value="">Cualquiera</option>
                @for (x of opts()?.agerates; track x) { <option [value]="x">{{ x }}</option> }</select></div>
            <div class="pair">
              <div class="f"><label>Violencia máx.</label>
                <select [(ngModel)]="f.violencia_max"><option [ngValue]="null">Cualquiera</option>
                  @for (n of niveles10; track n) { <option [ngValue]="n">{{ n }}</option> }</select>
                <span class="hint">escala 1–10</span></div>
              <div class="f"><label>Sexualidad máx.</label>
                <select [(ngModel)]="f.sexualidad_max"><option [ngValue]="null">Cualquiera</option>
                  @for (n of niveles10; track n) { <option [ngValue]="n">{{ n }}</option> }</select>
                <span class="hint">escala 1–10</span></div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Géneros</legend>
            <div class="f"><label>Género</label>
              <select [(ngModel)]="f.genero"><option value="">Cualquiera</option>
                @for (x of opts()?.generos; track x) { <option [value]="x">{{ x }}</option> }</select></div>
            <div class="f"><label>Subgénero</label>
              <select [(ngModel)]="f.subgenero"><option value="">Cualquiera</option>
                @for (x of opts()?.subgeneros; track x) { <option [value]="x">{{ x }}</option> }</select></div>
          </fieldset>

          <fieldset>
            <legend>Autores</legend>
            <div class="f"><label>País del autor</label>
              <select [(ngModel)]="f.autor_pais"><option value="">Cualquiera</option>
                @for (x of opts()?.autor_paises; track x) { <option [value]="x">{{ x }}</option> }</select></div>
          </fieldset>

          <fieldset>
            <legend>Premios</legend>
            <label class="check"><input type="checkbox" [(ngModel)]="f.con_premio" /> Solo premiados</label>
            <div class="f"><label>Premio</label>
              <select [(ngModel)]="f.premio"><option value="">Cualquiera</option>
                @for (x of opts()?.premios; track x) { <option [value]="x">{{ x }}</option> }</select></div>
            <div class="f"><label>Categoría del premio</label>
              <select [(ngModel)]="f.premio_categoria"><option value="">Cualquiera</option>
                @for (x of opts()?.premio_categorias; track x) { <option [value]="x">{{ x }}</option> }</select></div>
            <div class="f"><label>Relevancia mínima del premio</label>
              <select [(ngModel)]="f.relevancia_min"><option [ngValue]="null">Cualquiera</option>
                @for (n of niveles5; track n) { <option [ngValue]="n">{{ n }}</option> }</select>
              <span class="hint">escala 1–5 (5 = más prestigioso)</span></div>
          </fieldset>

          <fieldset>
            <legend>Ilustraciones y extras</legend>
            <label class="check"><input type="checkbox" [(ngModel)]="f.con_ilustraciones" /> Con ilustraciones</label>
            <div class="f"><label>Tipo de arte</label>
              <select [(ngModel)]="f.tipo_arte"><option value="">Cualquiera</option>
                @for (x of opts()?.tipos_arte; track x) { <option [value]="x">{{ x }}</option> }</select></div>
            <label class="check"><input type="checkbox" [(ngModel)]="f.con_curiosidades" /> Con curiosidades</label>
          </fieldset>

          <fieldset>
            <legend>Métricas de interacción</legend>
            <div class="pair">
              <div class="f"><label>Mín. likes</label>
                <input type="number" min="0" inputmode="numeric" placeholder="Ej: 50" [(ngModel)]="f.min_likes" /></div>
              <div class="f"><label>Mín. lecturas</label>
                <input type="number" min="0" inputmode="numeric" placeholder="Ej: 50" [(ngModel)]="f.min_lecturas" /></div>
            </div>
            <div class="f"><label>Mín. reseñas</label>
              <input type="number" min="0" inputmode="numeric" placeholder="Ej: 10" [(ngModel)]="f.min_resenas" />
              <span class="hint">entero ≥ 0</span></div>
            <div class="pair">
              <div class="f"><label>Puntaje ≥</label>
                <input type="number" step="0.1" min="0" max="10" inputmode="decimal" placeholder="Ej: 8.5" [(ngModel)]="f.puntaje_min" />
                <span class="hint">0–10, un decimal</span></div>
              <div class="f"><label>Puntaje ≤</label>
                <input type="number" step="0.1" min="0" max="10" inputmode="decimal" placeholder="Ej: 10" [(ngModel)]="f.puntaje_max" /></div>
            </div>
            <div class="f"><label>Mín. de autores</label>
              <select [(ngModel)]="f.min_autores"><option [ngValue]="null">Cualquiera</option>
                @for (n of autoresOpts; track n) { <option [ngValue]="n">{{ n }}</option> }</select></div>
            <label class="check"><input type="checkbox" [(ngModel)]="f.multi_autor" /> Más de un autor</label>
            <label class="check"><input type="checkbox" [(ngModel)]="f.con_resenas" /> Con al menos una reseña</label>
          </fieldset>

          <div class="panel-actions">
            <button class="btn btn-mustard full" (click)="apply()">Buscar</button>
            <button class="btn btn-ghost full" (click)="clear()">Limpiar filtros</button>
          </div>
        </aside>

        <section class="results">
          <div class="results-head">
            <span class="muted" role="status">
              @if (loading()) { Buscando… } @else { {{ items().length }} resultado(s){{ canLoadMore() ? '+' : '' }} }
            </span>
            <div class="f inline"><label for="order">Ordenar por</label>
              <select id="order" [(ngModel)]="f.order" (change)="apply()">
                <option value="relevancia">Relevancia</option>
                <option value="populares">Más populares</option>
                <option value="likes">Más likes</option>
                <option value="lecturas">Más leídos</option>
                <option value="resenas">Más reseñados</option>
                <option value="puntaje">Mejor puntaje</option>
                <option value="anio_desc">Más recientes</option>
                <option value="anio_asc">Más antiguos</option>
                <option value="paginas_desc">Más páginas</option>
                <option value="paginas_asc">Menos páginas</option>
              </select>
            </div>
          </div>

          @if (error()) {
            <div class="empty"><span class="emoji">🔌</span><h3>No se pudo conectar con el API</h3>
              <p class="muted">Verifica que el backend esté corriendo en el puerto 7000 ({{ apiHost() }}).</p>
              <button class="btn btn-mustard" (click)="apply()" style="margin-top:10px">Reintentar</button></div>
          } @else if (loading()) {
            <div class="grid">@for (i of sk; track i) { <app-skeleton-card /> }</div>
          } @else if (items().length) {
            <div class="grid stagger">
              @for (r of items(); track r.id) {
                <div class="result">
                  <app-material-card [m]="r" />
                  <div class="badges">
                    <span title="likes">♥ {{ r.total_likes }}</span>
                    <span title="lecturas">👁 {{ r.total_lecturas }}</span>
                    @if (r.promedio_puntaje !== null) { <span title="puntaje">★ {{ r.promedio_puntaje | number:'1.1-1' }}</span> }
                    <span title="autores">✍ {{ r.num_autores }}</span>
                  </div>
                </div>
              }
            </div>
            @if (canLoadMore()) {
              <div class="center" style="margin:30px 0">
                <button class="btn btn-ghost" (click)="loadMore()" [disabled]="loadingMore()">
                  @if (loadingMore()) { <span class="spinner dark"></span> Cargando… } @else { Cargar más }
                </button>
              </div>
            }
          } @else {
            <div class="empty"><span class="emoji">🔍</span><h3>Sin resultados</h3>
              <p class="muted">Ningún material cumple esa combinación de filtros. Prueba relajar alguno.</p></div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin: 28px 0 18px; }
    .page-title { font-size: clamp(1.6rem, 4vw, 2rem); margin: 0 0 4px; }
    .toggle { display: none; } .toggle .count { background: var(--mustard); color: #fff; border-radius: 999px; padding: 1px 8px; font-size: .78rem; }
    .layout { display: grid; grid-template-columns: 290px 1fr; gap: 28px; align-items: start; }
    .filters {
      position: sticky; top: 84px; display: flex; flex-direction: column; gap: 14px;
      max-height: calc(100vh - 104px); overflow-y: auto; padding-right: 6px;
    }
    fieldset { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; background: var(--surface); }
    legend { font-weight: 700; font-size: .9rem; color: var(--mustard-deep); padding: 0 6px; }
    .f { display: flex; flex-direction: column; gap: 4px; margin: 8px 0; }
    .f.inline { flex-direction: row; align-items: center; gap: 8px; margin: 0; }
    .f label { font-size: .78rem; font-weight: 600; color: var(--muted); }
    .f .hint { font-size: .7rem; color: var(--muted); margin-top: 2px; }
    .f input, .f select { width: 100%; min-width: 0; min-height: 40px; padding: 8px 10px; border: 1.5px solid var(--line); border-radius: 8px; background: var(--surface); font-size: .88rem; color: var(--ink); font-family: inherit; }
    .f input:focus, .f select:focus { outline: none; border-color: var(--mustard); box-shadow: 0 0 0 3px var(--mustard-soft); }
    .f.inline select { width: auto; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .check { display: flex; align-items: center; gap: 8px; font-size: .85rem; margin: 8px 0; cursor: pointer; }
    .check input { width: 18px; height: 18px; accent-color: var(--mustard); }
    .panel-actions { display: flex; flex-direction: column; gap: 8px; position: sticky; bottom: 0; background: var(--bg); padding-top: 8px; }
    .full { width: 100%; justify-content: center; }
    .results-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .result { display: flex; flex-direction: column; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; font-size: .76rem; color: var(--muted); }
    .badges span { background: var(--surface-alt); padding: 2px 8px; border-radius: 999px; }
    .empty { text-align: center; padding: 70px 20px; } .empty .emoji { font-size: 3rem; } .empty h3 { margin: 12px 0 4px; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .toggle { display: inline-flex; }
      .filters { position: static; max-height: none; display: none; }
      .filters.open { display: flex; }
    }
    @media (max-width: 560px) {
      .page-head { flex-direction: column; align-items: stretch; }
      .toggle { align-self: flex-start; }
    }
    /* Campos de filtro más altos para el dedo en pantallas táctiles */
    @media (any-pointer: coarse) {
      .f input, .f select { min-height: 46px; }
      .check input { width: 22px; height: 22px; }
    }
  `],
})
export class Catalog {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  sk = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  tipos = ['Libro', 'Ensayo', 'Revista', 'Poema', 'AudioBook']; // dominio fijo (CHECK)
  // Dominios ACOTADOS por el esquema -> se eligen de una lista (no texto libre):
  niveles10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Violence/Sexuality: CHECK 1..10
  niveles5 = [1, 2, 3, 4, 5];                   // Premio.Relevancia: CHECK 1..5
  autoresOpts = [1, 2, 3, 4, 5];               // mín. de autores por material
  // Años como décadas (los datos van de 1900 a ~2024): elegible, no a mano.
  decadas = [1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
  opts = signal<Options | null>(null);
  items = signal<SearchResult[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  canLoadMore = signal(false);
  panel = signal(false);
  error = signal(false);
  apiHost = () => (typeof location !== 'undefined' ? location.hostname || 'localhost' : 'localhost');
  f: Filters = emptyFilters();

  activeCount(): number {
    const cur = this.f as unknown as Record<string, unknown>;
    return Object.keys(cur).filter((k) => k !== 'order' && cur[k] !== '' && cur[k] !== null && cur[k] !== false).length;
  }

  constructor() {
    this.api.options().subscribe({
      next: (o) => this.opts.set(o),
      error: () => this.opts.set(null), // los desplegables quedan vacíos pero la app no se rompe
    });
    // permite llegar con ?genre=Ficcion desde la home
    this.route.queryParams.subscribe((p) => {
      if (p['genre']) this.f.genero = p['genre'];
      this.apply();
    });
  }

  private params(offset: number) {
    return { ...this.f, limit: PAGE, offset };
  }

  apply(): void {
    this.loading.set(true);
    this.error.set(false);
    this.panel.set(false);
    this.api.search(this.params(0)).subscribe({
      next: (res) => {
        this.items.set(res);
        this.canLoadMore.set(res.length === PAGE);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.api.search(this.params(this.items().length)).subscribe({
      next: (res) => {
        this.items.update((cur) => [...cur, ...res]);
        this.canLoadMore.set(res.length === PAGE);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  clear(): void {
    this.f = emptyFilters();
    this.apply();
  }
}
