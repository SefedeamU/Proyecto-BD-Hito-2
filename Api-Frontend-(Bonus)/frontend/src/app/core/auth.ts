import { Injectable, signal } from '@angular/core';
import { Usuario } from './models';

const KEY = 'biblioteca_user';

@Injectable({ providedIn: 'root' })
export class Auth {
  readonly user = signal<Usuario | null>(this.restore());

  private restore(): Usuario | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }

  setUser(u: Usuario): void {
    localStorage.setItem(KEY, JSON.stringify(u));
    this.user.set(u);
  }

  logout(): void {
    localStorage.removeItem(KEY);
    this.user.set(null);
  }
}
