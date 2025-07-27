import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guards';
import { guestGuard } from './core/guards/guest.guards';
import { dentistGuard } from './core/guards/dentist.guard';

export const routes: Routes = [
    { path: '', 
      loadComponent: () => 
        import('./shared/home/home.component')
      .then(m => m.HomeComponent) 
    },
    { path: 'login', 
      loadComponent: () => 
        import('./features/auth/login/login')
      .then(m => m.LoginComponent),
      canActivate: [ guestGuard] 
    },
    { path: 'register', 
      loadComponent: () => 
        import('./features/auth/register/register')
      .then(m => m.RegisterComponent), 
      canActivate: [ guestGuard] 
    },
    {
    path: 'dentists',
    loadComponent: () =>
      import('./features/dentists/list/dentists-list')
        .then(m => m.DentistsListComponent)
    },
    {
  path: 'dentists/profile',
  loadComponent: () =>
    import('./features/dentists/profile/my-profile/my-profile').then(m => m.MyProfile),
  canActivate: [ authGuard, dentistGuard ]
},
{
  path: 'dentists/profile/create',
  loadComponent: () =>
    import('./features/dentists/profile/dentist-profile-form')
      .then(m => m.DentistProfileFormComponent),
  canActivate: [ authGuard, dentistGuard ]
},
{
  path: 'dentists/profile/edit',
  loadComponent: () =>
    import('./features/dentists/profile/dentist-profile-form')
      .then(m => m.DentistProfileFormComponent),
  canActivate: [ authGuard, dentistGuard ]
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
        .then(m => m.PromotionCreate),
        canActivate: [ authGuard]
},


   { path: '**', 
    loadComponent: () =>
    import('./shared/not-found/not-found')
      .then(m => m.NotFound)
    }
];
