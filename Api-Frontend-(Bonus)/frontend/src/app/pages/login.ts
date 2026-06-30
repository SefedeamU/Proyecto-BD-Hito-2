import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container narrow">
      <div class="card-panel">
        <h1>Ingresar</h1>
        <p class="muted">Accede con tu cuenta de lector.</p>
        <div class="field">
          <label>Usuario</label>
          <input [(ngModel)]="username" placeholder="p. ej. user1" (keyup.enter)="submit()" />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input type="password" [(ngModel)]="password" (keyup.enter)="submit()" />
        </div>
        @if (error()) { <p class="err">{{ error() }}</p> }
        <button class="btn btn-mustard" style="width:100%;justify-content:center" (click)="submit()" [disabled]="loading()">
          {{ loading() ? 'Verificando…' : 'Ingresar' }}
        </button>
        <p class="muted center" style="margin-top:16px">¿No tienes cuenta? <a routerLink="/register" class="link">Regístrate</a></p>
      </div>
    </div>
  `,
  styles: [`
    .narrow { max-width: 440px; padding-top: 50px; }
    h1 { font-size: 1.8rem; margin: 0 0 4px; }
    .err { color: var(--danger); font-size: .9rem; }
    .link { color: var(--mustard-deep); font-weight: 600; }
  `],
})
export class Login {
  private api = inject(Api);
  private auth = inject(Auth);
  private router = inject(Router);
  username = '';
  password = '';
  error = signal('');
  loading = signal(false);

  submit(): void {
    if (!this.username || !this.password) { this.error.set('Completa usuario y contraseña'); return; }
    this.loading.set(true);
    this.error.set('');
    this.api.login(this.username, this.password).subscribe({
      next: (u) => { this.auth.setUser(u); this.router.navigate(['/']); },
      error: (e) => { this.error.set(e?.error?.error ?? 'Error al ingresar'); this.loading.set(false); },
    });
  }
}
