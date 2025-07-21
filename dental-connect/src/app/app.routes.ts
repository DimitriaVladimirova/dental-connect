import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) },
    {
    path: 'dentists',
    loadComponent: () =>
      import('./features/dentists/list/dentists-list')
        .then(m => m.DentistsListComponent)
    },
    { path: 'dentist/profile',
    loadComponent: () =>
    import('./features/dentists/profile/dentist-profile-form')
      .then(m => m.DentistProfileFormComponent)
  },
  {  path: 'dentists/:id',
    loadComponent: () =>
    import('./features/dentists/details/dentist-details')
      .then(m => m.DentistDetailsComponent)
  }, 
  {
    path: 'promotions',
    loadComponent: () =>
      import('./features/promotions/list/promotions-list')
        .then(m => m.PromotionsListComponent)
},
{
    path: 'promotions/create',
    loadComponent: () =>
      import('./features/promotions/create/promotion-create')
        .then(m => m.PromotionCreate)
},


   { path: '**', redirectTo: '' }
];
