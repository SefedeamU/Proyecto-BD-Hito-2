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
      <form class="card-panel animate-in" (submit)="$event.preventDefault(); submit()" novalidate>
        <h1>Ingresar</h1>
        <p class="muted">Accede con tu cuenta de lector.</p>

        @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }

        <div class="field">
          <label for="u">Usuario</label>
          <input id="u" name="username" autocomplete="username" [(ngModel)]="username"
                 placeholder="p. ej. user1" [class.invalid]="error() && !username" />
        </div>
        <div class="field">
          <label for="p">Contraseña</label>
          <input id="p" name="password" type="password" autocomplete="current-password"
                 [(ngModel)]="password" [class.invalid]="error() && !password" />
        </div>

        <button class="btn btn-mustard full" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Verificando… } @else { Ingresar }
        </button>
        <p class="muted center" style="margin-top:16px">
          ¿No tienes cuenta? <a routerLink="/register" class="link">Regístrate</a>
        </p>
      </form>
    </div>
  `,
  styles: [`
    .narrow { max-width: 440px; padding: clamp(32px, 7vw, 50px) clamp(14px, 4vw, 22px); }
    h1 { font-size: clamp(1.5rem, 5vw, 1.8rem); margin: 0 0 4px; }
    .full { width: 100%; justify-content: center; }
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
