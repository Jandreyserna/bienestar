import type { Routes } from '@angular/router';
import { ContentPage } from './public/content-page/content-page';
import { HomePage } from './public/home/home-page';
import { HumanValuesPage } from './public/human-values/human-values-page';
import { PublicLayout } from './public/layout/public-layout';

export const routes: Routes = [
  // Visual 1: sitio público (una ruta por cada opción del menú)
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: HomePage, title: 'Bienestar Moral · Sembrando principios que transforman vidas' },
      { path: 'quienes-somos', component: ContentPage, data: { page: 'about' }, title: 'Quiénes somos · Bienestar Moral' },
      { path: 'servicios', component: ContentPage, data: { page: 'services' }, title: 'Servicios de apoyo · Bienestar Moral' },
      { path: 'valores-humanos', component: HumanValuesPage, title: 'Valores humanos · Bienestar Moral' },
      { path: 'equipo', component: ContentPage, data: { page: 'team' }, title: 'Equipo de trabajo · Bienestar Moral' },
      { path: 'contacto', component: ContentPage, data: { page: 'contact' }, title: 'Contáctenos · Bienestar Moral' },
    ],
  },
  // Visual 2: panel de gestión (carga diferida: el público no descarga este código)
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: '**', redirectTo: '' },
];
