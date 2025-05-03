import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./shared/components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./modules/users/users.module').then((m) => m.UsersModule),
  },
  {
    path: 'connections',
    loadChildren: () =>
      import('./modules/connections/connections.module').then(
        (m) => m.ConnectionsModule
      ),
  },
  {
    path: 'profiles',
    loadChildren: () =>
      import('./modules/profiles/profiles.module').then(
        (m) => m.ProfilesModule
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
