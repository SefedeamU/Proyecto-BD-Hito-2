import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { HistorialItem } from '../core/models';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  template: `
    <div class="container" style="padding-top:36px">
      @if (auth.user(); as u) {
        <div class="head">
          <div class="avatar">{{ u.nombre[0] }}{{ u.apellido[0] }}</div>
          <div>
            <h1>{{ u.nombre }} {{ u.apellido }}</h1>
            <p class="muted">{{ u.email }} · <span class="chip">{{ u.rol }}</span></p>
          </div>
        </div>

        <h2>Mi historial de lectura</h2>
        <p class="muted">Materiales que has leído, ordenados por fecha (consulta Q4 del experimento).</p>

        @if (history().length) {
          <div class="hist">
            @for (h of history(); track h.material_id) {
              <a class="row" [routerLink]="['/material', h.material_id]">
                <img [src]="h.portadas[0]" alt="" />
                <div class="rt">
                  <b>{{ h.alias ?? 'Material #' + h.material_id }}</b>
                  <span class="muted">{{ h.tipo }} · leído el {{ h.fecha }}</span>
                </div>
              </a>
            }
          </div>
        } @else {
          <p class="muted" style="padding:30px 0">Este usuario aún no tiene lecturas registradas.</p>
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
      color: #fff; display: grid; place-items: center; font-size: 1.4rem; font-weight: 700;
    }
    h1 { font-size: 1.8rem; margin: 0; }
    h2 { font-size: 1.4rem; margin: 26px 0 4px; }
    .hist { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .row {
      display: flex; align-items: center; gap: 16px; padding: 10px; border: 1px solid var(--line);
      border-radius: 12px; background: var(--surface); transition: border-color .15s;
    }
    .row:hover { border-color: var(--mustard); }
    .row img { width: 48px; aspect-ratio: 2/3; object-fit: cover; border-radius: 6px; }
    .rt { display: flex; flex-direction: column; }
    .link { color: var(--mustard-deep); font-weight: 600; }
  `],
})
export class Profile {
  protected auth = inject(Auth);
  private api = inject(Api);
  private router = inject(Router);
  history = signal<HistorialItem[]>([]);

  constructor() {
    const u = this.auth.user();
    if (u) this.api.history(u.username).subscribe((h) => this.history.set(h));
  }
}
