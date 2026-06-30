import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { HistorialItem } from '../core/models';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  template: `
    <div class="container" style="padding:36px 22px">
      @if (auth.user(); as u) {
        <div class="head animate-in">
          <div class="avatar" aria-hidden="true">{{ u.nombre[0] }}{{ u.apellido[0] }}</div>
          <div>
            <h1>{{ u.nombre }} {{ u.apellido }}</h1>
            <p class="muted">{{ u.email }} · <span class="chip">{{ u.rol }}</span></p>
          </div>
        </div>

        <h2>Mi historial de lectura</h2>
        <p class="muted">Materiales que has leído, ordenados por fecha (consulta Q4 del experimento).</p>

        @if (loading()) {
          <div class="hist">
            @for (i of [1,2,3,4]; track i) {
              <div class="row"><div class="skeleton" style="width:48px;aspect-ratio:2/3;border-radius:6px"></div>
                <div style="flex:1">
                  <div class="skeleton sk-line" style="width:50%"></div>
                  <div class="skeleton sk-line sh"></div>
                </div></div>
            }
          </div>
        } @else if (history().length) {
          <div class="hist stagger">
            @for (h of history(); track h.material_id) {
              <a class="row" [routerLink]="['/material', h.material_id]">
                <img [src]="h.portadas[0]" alt="" loading="lazy" />
                <div class="rt">
                  <b>{{ h.alias ?? 'Material #' + h.material_id }}</b>
                  <span class="muted">{{ h.tipo }} · leído el {{ h.fecha }}</span>
                </div>
              </a>
            }
          </div>
        } @else {
          <div class="empty"><span class="emoji">🔖</span>
            <p class="muted">Aún no tienes lecturas registradas.</p></div>
        }
      } @else {
        <p class="muted center" style="padding:60px">
          No has iniciado sesión. <a routerLink="/login" class="link">Ingresar</a>
        </p>
      }
    </div>
  `,
  styles: [`
    .head { display: flex; align-items: center; gap: 18px; margin-bottom: 30px; }
    .avatar {
      width: 64px; height: 64px; border-radius: 50%; background: var(--mustard);
      color: #fff; display: grid; place-items: center; font-size: 1.4rem; font-weight: 700; flex-shrink: 0;
    }
    h1 { font-size: 1.8rem; margin: 0; }
    h2 { font-size: 1.4rem; margin: 26px 0 4px; }
    .hist { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .row {
      display: flex; align-items: center; gap: 16px; padding: 10px; border: 1px solid var(--line);
      border-radius: 12px; background: var(--surface); transition: border-color var(--t-fast), transform var(--t-fast);
    }
    .row:hover { border-color: var(--mustard); transform: translateX(3px); }
    .row img { width: 48px; aspect-ratio: 2/3; object-fit: cover; border-radius: 6px; background: var(--surface-alt); }
    .rt { display: flex; flex-direction: column; }
    .empty { text-align: center; padding: 50px 0; } .empty .emoji { font-size: 2.4rem; }
    .link { color: var(--mustard-deep); font-weight: 600; }
  `],
})
export class Profile {
  protected auth = inject(Auth);
  private api = inject(Api);
  history = signal<HistorialItem[]>([]);
  loading = signal(true);

  constructor() {
    const u = this.auth.user();
    if (u) {
      this.api.history(u.username).subscribe((h) => { this.history.set(h); this.loading.set(false); });
    } else {
      this.loading.set(false);
    }
  }
}
