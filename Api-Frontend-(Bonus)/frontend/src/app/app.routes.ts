import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  { path: 'catalog', loadComponent: () => import('./pages/catalog').then((m) => m.Catalog) },
  { path: 'material/:id', loadComponent: () => import('./pages/material-detail').then((m) => m.MaterialDetail) },
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  { path: 'register', loadComponent: () => import('./pages/register').then((m) => m.Register) },
  { path: 'profile', loadComponent: () => import('./pages/profile').then((m) => m.Profile) },
  { path: '**', redirectTo: '' },
];
