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
      <div class="card-panel">
        <h1>Crear cuenta</h1>
        <p class="muted">Únete a la comunidad de lectores.</p>
        <div class="two">
          <div class="field"><label>Nombre</label><input [(ngModel)]="f.nombre" /></div>
          <div class="field"><label>Apellido</label><input [(ngModel)]="f.apellido" /></div>
        </div>
        <div class="field"><label>Usuario</label><input [(ngModel)]="f.username" /></div>
        <div class="field"><label>Email</label><input type="email" [(ngModel)]="f.email" /></div>
        <div class="field">
          <label>Contraseña (exactamente 12 caracteres)</label>
          <input type="password" [(ngModel)]="f.password" maxlength="12" />
          <small class="muted">{{ f.password.length }}/12</small>
        </div>
        <div class="two">
          <div class="field"><label>Edad</label><input type="number" min="12" [(ngModel)]="f.edad" /></div>
          <div class="field"><label>Ciudad</label><input [(ngModel)]="f.ciudad" /></div>
        </div>
        @if (error()) { <p class="err">{{ error() }}</p> }
        <button class="btn btn-mustard" style="width:100%;justify-content:center" (click)="submit()" [disabled]="loading()">
          {{ loading() ? 'Creando…' : 'Crear cuenta' }}
        </button>
        <p class="muted center" style="margin-top:16px">¿Ya tienes cuenta? <a routerLink="/login" class="link">Ingresa</a></p>
      </div>
    </div>
  `,
  styles: [`
    .narrow { max-width: 480px; padding-top: 40px; }
    h1 { font-size: 1.8rem; margin: 0 0 4px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .err { color: var(--danger); font-size: .9rem; }
    .link { color: var(--mustard-deep); font-weight: 600; }
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
    if (this.f.password.length !== 12) { this.error.set('La contraseña debe tener exactamente 12 caracteres'); return; }
    if (!this.f.username || !this.f.email || !this.f.nombre) { this.error.set('Completa los campos requeridos'); return; }
    this.loading.set(true);
    this.error.set('');
    this.api.register(this.f).subscribe({
      next: (u) => { this.auth.setUser(u); this.router.navigate(['/']); },
      error: (e) => { this.error.set(e?.error?.error ?? 'No se pudo registrar'); this.loading.set(false); },
    });
  }
}
