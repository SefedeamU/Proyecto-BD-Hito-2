import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { Material } from '../core/models';

@Component({
  selector: 'app-material-card',
  imports: [RouterLink, UpperCasePipe],
  template: `
    <a class="card" [routerLink]="['/material', m().id]" [attr.aria-label]="title()">
      <div class="cover" [class.skeleton]="!loaded()">
        <img
          [src]="cover()"
          [alt]="'Portada de ' + title()"
          class="fade-img"
          [class.loaded]="loaded()"
          loading="lazy"
          (load)="loaded.set(true)"
          (error)="loaded.set(true)" />
        <span class="tipo">{{ m().tipo }}</span>
      </div>
      <div class="meta">
        <h3 class="title">{{ title() }}</h3>
        <span class="sub">{{ m().anio_publicacion }} · {{ m().idioma | uppercase }}</span>
      </div>
    </a>
  `,
  styles: [`
    .card { width: clamp(150px, 42vw, 188px); max-width: 100%; display: block; cursor: pointer; }
    .cover {
      position: relative; aspect-ratio: 2/3; border-radius: 12px; overflow: hidden;
      background: var(--surface-alt); box-shadow: var(--shadow);
      transition: transform var(--t-med), box-shadow var(--t-med);
    }
    .card:hover .cover, .card:focus-visible .cover { transform: translateY(-6px) scale(1.03); box-shadow: var(--shadow-lg); }
    .cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .tipo {
      position: absolute; top: 10px; left: 10px; background: rgba(43,38,32,.82);
      color: #fff; font-size: .7rem; font-weight: 600; padding: 3px 9px; border-radius: 999px;
      letter-spacing: .02em;
    }
    .meta { padding: 10px 4px 0; }
    .title {
      font-size: .98rem; margin: 0 0 2px; line-height: 1.25;
      display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
    }
    .sub { font-size: .8rem; color: var(--muted); }
  `],
})
export class MaterialCard {
  m = input.required<Material>();
  loaded = signal(false);
  title = () => this.m().alias ?? `Material #${this.m().id}`;
  cover = () => this.m().portadas?.[0] ?? 'https://picsum.photos/seed/fallback/400/600';
}
