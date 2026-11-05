import type { Routes } from '@angular/router';
import { authGuard } from '../core/auth/auth-guard';
import { AdminLayout } from './layout/admin-layout';
import { LoginPage } from './login/login-page';
import { SectionEditorPage } from './sections/section-editor-page';
import { SectionsPage } from './sections/sections-page';
import { WorksheetFormPage } from './worksheets/worksheet-form-page';
import { WorksheetsPage } from './worksheets/worksheets-page';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: LoginPage, title: 'Ingresar · Panel Bienestar Moral' },
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'secciones' },
      { path: 'secciones', component: SectionsPage, title: 'Secciones · Panel' },
      { path: 'secciones/nueva', component: SectionEditorPage, title: 'Nueva sección · Panel' },
      { path: 'secciones/:id', component: SectionEditorPage, title: 'Editar sección · Panel' },
      { path: 'cartillas', component: WorksheetsPage, title: 'Cartillas · Panel' },
      { path: 'cartillas/nueva', component: WorksheetFormPage, title: 'Nueva cartilla · Panel' },
      { path: 'cartillas/:id', component: WorksheetFormPage, title: 'Editar cartilla · Panel' },
    ],
  },
];
