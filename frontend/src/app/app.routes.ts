import type { Routes } from '@angular/router';
import { HomePage } from './public/home/home-page';
import { HumanValuesPage } from './public/human-values/human-values-page';
import { PublicLayout } from './public/layout/public-layout';

export const routes: Routes = [
  // Visual 1: sitio público
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: HomePage, title: 'Bienestar Moral' },
      { path: 'valores-humanos', component: HumanValuesPage, title: 'Valores humanos · Bienestar Moral' },
    ],
  },
  // Visual 2: panel de gestión (carga diferida: el público no descarga este código)
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: '**', redirectTo: '' },
];
