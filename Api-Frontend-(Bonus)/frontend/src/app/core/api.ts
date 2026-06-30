import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Material, MaterialDetalle, Popular, Resena, Usuario, HistorialItem } from './models';

const API = 'http://localhost:7000/api';

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
