import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth } from './core/auth';
import { DbConfig } from './core/db-config';
import { Perf } from './core/perf';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  protected auth = inject(Auth);
  protected dbcfg = inject(DbConfig);
  protected perf = inject(Perf);

  // Cambiar de base es configuración global: recargamos para que todas las
  // vistas vuelvan a consultar contra la base elegida.
  onDbChange(value: string): void {
    if (value === this.dbcfg.db()) return;
    this.dbcfg.set(value);
    location.reload();
  }

  // Activa/desactiva los índices: enruta las consultas a la copia _idx o
  // _noidx. Recargamos para que toda la vista actual se vuelva a medir.
  toggleIndexes(): void {
    this.dbcfg.setIndexes(!this.dbcfg.indexes());
    location.reload();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
