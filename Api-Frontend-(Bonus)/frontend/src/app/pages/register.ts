import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container narrow">
      <form class="card-panel animate-in" (submit)="$event.preventDefault(); submit()" novalidate>
        <h1>Crear cuenta</h1>
        <p class="muted">Únete a la comunidad de lectores.</p>

        @if (error()) { <p class="form-error" role="alert">{{ error() }}</p> }

        <div class="two">
          <div class="field">
            <label for="nombre">Nombre</label>
            <input id="nombre" name="nombre" autocomplete="given-name" [(ngModel)]="f.nombre" />
          </div>
          <div class="field">
            <label for="apellido">Apellido</label>
            <input id="apellido" name="apellido" autocomplete="family-name" [(ngModel)]="f.apellido" />
          </div>
        </div>
        <div class="field">
          <label for="usuario">Usuario</label>
          <input id="usuario" name="username" autocomplete="username" [(ngModel)]="f.username" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" [(ngModel)]="f.email" />
        </div>
        <div class="field">
          <label for="pass">Contraseña</label>
          <input id="pass" name="password" type="password" autocomplete="new-password" maxlength="12"
                 [(ngModel)]="f.password" [class.invalid]="f.password.length > 0 && f.password.length !== 12"
                 [attr.aria-describedby]="'passhint'" />
          <span id="passhint" class="hint" [class.ok]="f.password.length === 12">
            {{ f.password.length }}/12 caracteres (exactamente 12)
          </span>
        </div>
        <div class="two">
          <div class="field">
            <label for="edad">Edad</label>
            <input id="edad" name="edad" type="number" min="12" inputmode="numeric" [(ngModel)]="f.edad" />
          </div>
          <div class="field">
            <label for="ciudad">Ciudad</label>
            <input id="ciudad" name="ciudad" autocomplete="address-level2" [(ngModel)]="f.ciudad" />
          </div>
        </div>

        <button class="btn btn-mustard full" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Creando… } @else { Crear cuenta }
        </button>
        <p class="muted center" style="margin-top:16px">
          ¿Ya tienes cuenta? <a routerLink="/login" class="link">Ingresa</a>
        </p>
      </form>
    </div>
  `,
  styles: [`
    .narrow { max-width: 480px; padding: 40px 22px; }
    h1 { font-size: 1.8rem; margin: 0 0 4px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .full { width: 100%; justify-content: center; }
    .link { color: var(--mustard-deep); font-weight: 600; }
    @media (max-width: 460px) { .two { grid-template-columns: 1fr; gap: 0; } }
  `],
})
export class Register {
  private api = inject(Api);
  private auth = inject(Auth);
  private router = inject(Router);
  f = { nombre: '', apellido: '', username: '', email: '', password: '', edad: 20, ciudad: 'Lima', telefono: 900000000 };
  error = signal('');
  loading = signal(false);

  submit(): void {
    if (!this.f.username || !this.f.email || !this.f.nombre) { this.error.set('Completa nombre, usuario y email'); return; }
    if (this.f.password.length !== 12) { this.error.set('La contraseña debe tener exactamente 12 caracteres'); return; }
    this.loading.set(true);
    this.error.set('');
    this.api.register(this.f).subscribe({
      next: (u) => { this.auth.setUser(u); this.router.navigate(['/']); },
      error: (e) => { this.error.set(e?.error?.error ?? 'No se pudo registrar'); this.loading.set(false); },
    });
  }
}
