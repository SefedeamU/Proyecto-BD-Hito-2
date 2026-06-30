import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth } from './core/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  protected auth = inject(Auth);
  protected query = signal('');

  onInput(v: string): void { this.query.set(v); }

  search(): void {
    const q = this.query().trim();
    this.router.navigate(['/catalog'], { queryParams: q ? { search: q } : {} });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
