import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { MaterialDetalle, Resena } from '../core/models';

@Component({
  selector: 'app-material-detail',
  imports: [RouterLink, DecimalPipe, UpperCasePipe, FormsModule],
  template: `
    @if (m(); as d) {
      <div class="container detail animate-in">
        <div class="gallery">
          <div class="main">
            <img [src]="active()" [alt]="'Portada de ' + title(d)" class="fade-img"
                 [class.loaded]="mainLoaded()" (load)="mainLoaded.set(true)" />
          </div>
          <div class="thumbs">
            @for (u of d.portadas; track u) {
              <button class="thumb" [class.sel]="active() === u"
                      (click)="select(u)" [attr.aria-label]="'Ver imagen'">
                <img [src]="u" alt="" loading="lazy" />
              </button>
            }
          </div>
        </div>

        <div class="info">
          <span class="chip">{{ d.tipo }}</span>
          <h1>{{ title(d) }}</h1>
          @if (d.eslogan) { <p class="slogan">“{{ d.eslogan }}”</p> }

          <div class="facts">
            <span>📅 {{ d.anio_publicacion }}</span>
            <span>🌐 {{ d.idioma | uppercase }}</span>
            <span>📄 {{ d.numero_paginas }} págs</span>
            @if (d.editorial) { <span>🏢 {{ d.editorial }}</span> }
            @if (d.agerate) { <span>🔞 {{ d.agerate }}</span> }
          </div>

          @if (d.autores.length) { <p class="line"><b>Autores:</b> {{ authors(d) }}</p> }
          @if (d.generos.length) {
            <div class="genres">@for (g of d.generos; track g) { <span class="chip">{{ g }}</span> }</div>
          }

          <div class="metrics">
            <div><b>{{ d.total_likes | number }}</b><span>likes</span></div>
            <div><b>{{ d.total_lecturas | number }}</b><span>lecturas</span></div>
            <div><b>{{ d.total_resenas | number }}</b><span>reseñas</span></div>
            <div><b>{{ d.promedio_puntaje ? (d.promedio_puntaje | number:'1.1-1') : '—' }}</b><span>puntaje</span></div>
          </div>

          <div class="actions">
            <button class="btn btn-mustard" (click)="like()" [disabled]="liking()">
              @if (liking()) { <span class="spinner"></span> } @else { ♥ } Me gusta
            </button>
          </div>
        </div>
      </div>

      <div class="container reviews">
        <h2>Reseñas</h2>

        @if (auth.user(); as u) {
          <form class="review-form card-panel" (submit)="$event.preventDefault(); submitReview()">
            <div class="field">
              <label for="rev">Tu reseña como {{ u.nombre }}</label>
              <textarea id="rev" rows="3" [(ngModel)]="comentario" name="comentario"
                        placeholder="¿Qué te pareció?"></textarea>
            </div>
            <div class="rate-row">
              <div class="field" style="margin:0">
                <label for="punt">Puntaje (0–10)</label>
                <input id="punt" name="puntaje" type="number" min="0" max="10" step="0.1"
                       [(ngModel)]="puntaje" style="width:120px" />
              </div>
              <button class="btn btn-mustard" type="submit" [disabled]="!comentario.trim() || posting()">
                @if (posting()) { <span class="spinner"></span> Publicando… } @else { Publicar reseña }
              </button>
            </div>
          </form>
        } @else {
          <p class="muted">Para dar like o reseñar,
            <a routerLink="/login" class="link">inicia sesión</a>.</p>
        }

        @for (r of reviews(); track r.code) {
          <article class="review">
            <div class="rev-head">
              <b>{{ r.usuario }}</b>
              <span class="score">★ {{ r.puntaje | number:'1.1-1' }}</span>
              <span class="muted date">{{ r.fecha }}</span>
            </div>
            <p>{{ r.comentario }}</p>
          </article>
        }
        @if (!reviews().length) { <p class="muted">Aún no hay reseñas. ¡Sé el primero!</p> }
      </div>
    } @else {
      <!-- skeleton de carga -->
      <div class="container detail">
        <div class="gallery"><div class="skeleton" style="aspect-ratio:2/3;border-radius:16px"></div></div>
        <div class="info">
          <div class="skeleton sk-line" style="width:80px;height:24px"></div>
          <div class="skeleton sk-line" style="width:70%;height:38px;margin-top:14px"></div>
          <div class="skeleton sk-line" style="width:90%;margin-top:18px"></div>
          <div class="skeleton sk-line sh" style="margin-top:10px"></div>
          <div class="skeleton" style="height:80px;margin-top:24px;border-radius:10px"></div>
        </div>
      </div>
    }

    @if (toast()) { <div class="toast" role="status">{{ toast() }}</div> }
  `,
  styles: [`
    .detail { display: grid; grid-template-columns: 360px 1fr; gap: 44px; padding: 36px 22px; align-items: start; }
    .main img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 16px; box-shadow: var(--shadow-lg); background: var(--surface-alt); }
    .thumbs { display: flex; gap: 10px; margin-top: 12px; }
    .thumb { padding: 0; border: 2px solid transparent; border-radius: 8px; overflow: hidden; cursor: pointer; background: none; opacity: .65; transition: all var(--t-fast); }
    .thumb img { width: 60px; aspect-ratio: 2/3; object-fit: cover; display: block; }
    .thumb.sel, .thumb:hover { opacity: 1; border-color: var(--mustard); }
    .info h1 { font-size: clamp(1.7rem, 4vw, 2.2rem); margin: 12px 0 8px; }
    .slogan { color: var(--muted); font-style: italic; font-size: 1.05rem; }
    .facts { display: flex; flex-wrap: wrap; gap: 16px; margin: 18px 0; color: var(--muted); font-size: .92rem; }
    .line { margin: 8px 0; }
    .genres { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    .metrics { display: flex; flex-wrap: wrap; gap: 28px; margin: 24px 0; padding: 18px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .metrics b { display: block; font-size: 1.5rem; color: var(--mustard-deep); font-family: 'Georgia', serif; }
    .metrics span { font-size: .8rem; color: var(--muted); }
    .actions { display: flex; align-items: center; gap: 14px; }
    .reviews { margin-top: 20px; }
    .reviews h2 { font-size: 1.6rem; }
    .review-form { margin: 16px 0 26px; }
    .rate-row { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .review { padding: 16px 0; border-bottom: 1px solid var(--line); }
    .rev-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .score { color: var(--mustard-deep); font-weight: 700; }
    .date { font-size: .85rem; margin-left: auto; }
    .link { color: var(--mustard-deep); font-weight: 600; }
    @media (max-width: 760px) { .detail { grid-template-columns: 1fr; gap: 24px; } }
  `],
})
export class MaterialDetail {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  protected auth = inject(Auth);

  m = signal<MaterialDetalle | null>(null);
  reviews = signal<Resena[]>([]);
  active = signal('');
  mainLoaded = signal(false);
  toast = signal('');
  liking = signal(false);
  posting = signal(false);
  comentario = '';
  puntaje = 8;

  constructor() {
    this.route.paramMap.subscribe((p) => {
      const id = Number(p.get('id'));
      this.m.set(null);
      this.mainLoaded.set(false);
      this.api.material(id).subscribe((d) => { this.m.set(d); this.active.set(d.portadas?.[0] ?? ''); });
      this.api.reviews(id).subscribe((r) => this.reviews.set(r));
    });
  }

  title(d: MaterialDetalle): string { return d.alias ?? `Material #${d.id}`; }
  authors(d: MaterialDetalle): string { return d.autores.map((a) => `${a.nombre} ${a.apellido}`).join(', '); }
  select(u: string): void { this.mainLoaded.set(false); this.active.set(u); }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2600);
  }

  like(): void {
    const u = this.auth.user();
    if (!u) { this.flash('Inicia sesión para dar like'); return; }
    this.liking.set(true);
    this.api.like(this.m()!.id, u.username, u.email).subscribe({
      next: () => { this.flash('¡Te gusta este material!'); this.refresh(); this.liking.set(false); },
      error: () => { this.flash('No se pudo registrar el like'); this.liking.set(false); },
    });
  }

  submitReview(): void {
    const u = this.auth.user();
    if (!u || !this.comentario.trim()) return;
    this.posting.set(true);
    this.api.addReview(this.m()!.id, {
      username: u.username, email: u.email, comentario: this.comentario.trim(), puntaje: +this.puntaje,
    }).subscribe({
      next: () => { this.comentario = ''; this.flash('¡Reseña publicada!'); this.refresh(); this.posting.set(false); },
      error: (e) => { this.flash(e?.error?.error ?? 'No se pudo publicar la reseña'); this.posting.set(false); },
    });
  }

  private refresh(): void {
    const id = this.m()!.id;
    this.api.material(id).subscribe((d) => this.m.set(d));
    this.api.reviews(id).subscribe((r) => this.reviews.set(r));
  }
}
