import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) },
];
