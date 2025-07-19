import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) },
    {
    path: 'dentists',
    loadComponent: () =>
      import('./features/dentists/list/dentists-list/dentists-list')
        .then(m => m.DentistsListComponent)
  },
    { path: 'dentist/profile',
  loadComponent: () =>
    import('./features/dentists/profile/dentist-profile-form/dentist-profile-form')
      .then(m => m.DentistProfileFormComponent)
}
];
