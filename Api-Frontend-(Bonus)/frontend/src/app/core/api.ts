import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Material, MaterialDetalle, Popular, Resena, Usuario, HistorialItem, SearchResult, Options } from './models';

// Base del API. Orden de resolución (sin recompilar):
//  1) window.__API_BASE__  -> override manual (editable en dist/index.html).
//  2) Si la app se abre en localhost/127.0.0.1/file:// pero el backend NO está
//     local, se apunta al API desplegado (AWS, puerto 7000). Así el `ng serve`
//     de desarrollo consume la API real sin levantar el backend en la laptop.
//  3) En cualquier otro host (ej. servida desde el propio servidor) usa ese
//     mismo host en el puerto 7000.
const DEPLOYED_API = 'http://18.214.247.229:7000/api';

function resolveApiBase(): string {
  const override = (globalThis as { __API_BASE__?: string }).__API_BASE__;
  if (override) return override;
  const host = typeof location !== 'undefined' ? location.hostname : '';
  if (!host || host === 'localhost' || host === '127.0.0.1') return DEPLOYED_API;
  return `http://${host}:7000/api`;
}

const API = resolveApiBase();

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  stats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${API}/stats`);
  }

  genres(): Observable<string[]> {
    return this.http.get<string[]>(`${API}/genres`);
  }

  popular(limit = 18): Observable<Popular[]> {
    return this.http.get<Popular[]>(`${API}/popular`, { params: { limit } });
  }

  materials(opts: { search?: string; genre?: string; type?: string; limit?: number; offset?: number } = {}): Observable<Material[]> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(opts)) {
      if (v !== undefined && v !== '' && v !== null) p = p.set(k, String(v));
    }
    return this.http.get<Material[]>(`${API}/materials`, { params: p });
  }

  options(): Observable<Options> {
    return this.http.get<Options>(`${API}/options`);
  }

  search(params: Record<string, any>): Observable<SearchResult[]> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '' || v === false) continue;
      p = p.set(k, String(v === true ? 1 : v));
    }
    return this.http.get<SearchResult[]>(`${API}/search`, { params: p });
  }

  material(id: number): Observable<MaterialDetalle> {
    return this.http.get<MaterialDetalle>(`${API}/materials/${id}`);
  }

  reviews(id: number): Observable<Resena[]> {
    return this.http.get<Resena[]>(`${API}/materials/${id}/reviews`);
  }

  login(username: string, password: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${API}/login`, { username, password });
  }

  register(body: any): Observable<Usuario> {
    return this.http.post<Usuario>(`${API}/register`, body);
  }

  history(username: string): Observable<HistorialItem[]> {
    return this.http.get<HistorialItem[]>(`${API}/users/${username}/history`);
  }

  like(id: number, username: string, email: string): Observable<any> {
    return this.http.post(`${API}/materials/${id}/like`, { username, email });
  }

  addReview(id: number, body: { username: string; email: string; comentario: string; puntaje: number }): Observable<any> {
    return this.http.post(`${API}/materials/${id}/reviews`, body);
  }
}
