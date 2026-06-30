import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth } from './core/auth';
import { DbConfig } from './core/db-config';

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

  // Cambiar de base es configuración global: recargamos para que todas las
  // vistas vuelvan a consultar contra la base elegida.
  onDbChange(value: string): void {
    if (value === this.dbcfg.db()) return;
    this.dbcfg.set(value);
    location.reload();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
