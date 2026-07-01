import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Material, MaterialDetalle, Popular, Resena, Usuario, HistorialItem, SearchResult, Options } from './models';

// Base del API. La API vive SIEMPRE en la EC2 (puerto 7000), aunque el front se
// sirva desde otro host (S3 estático, localhost, etc.). Por eso NO se deduce del
// host de la página: se apunta directo a la EC2. El front S3 es HTTP y el 7000
// es público y HTTP, así que no hay contenido mixto.
// Override sin recompilar: define window.__API_BASE__ en dist/index.html (por si
// cambia la IP o se sirve la API tras un dominio/proxy).
const DEPLOYED_API = 'http://18.214.247.229:7000/api';

function resolveApiBase(): string {
  const override = (globalThis as { __API_BASE__?: string }).__API_BASE__;
  if (override) return override;
  // Demo local (ng serve): la API y las 8 bases del experimento están en
  // localhost. Solo el host local usa el API local; cualquier otro host
  // (S3, etc.) sigue apuntando a la EC2.
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:7000/api';
  return DEPLOYED_API;
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
