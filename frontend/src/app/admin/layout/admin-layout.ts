import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a routerLink="/admin" class="brand">
          <span class="logo"><img src="/marca/logo-bienestar-moral.png" alt="" width="40" height="40" /></span>
          <span>Bienestar Moral <small>Panel de gestión</small></span>
        </a>
        <nav aria-label="Panel">
          <a routerLink="secciones" routerLinkActive="active">Páginas y secciones</a>
          <a routerLink="cartillas" routerLinkActive="active">Cartillas</a>
        </nav>
        <div class="foot">
          <a routerLink="/" target="_blank" rel="noopener">Ver sitio público ↗</a>
          <span class="who" [title]="auth.adminEmail() ?? ''">{{ auth.adminEmail() }}</span>
          <button class="btn btn-ghost btn-sm" type="button" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
    .sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; gap: 1.5rem;
      padding: 1.5rem 1rem; background: var(--bm-primary-strong); color: #dcdaf2; }
    .sidebar::before { content: ''; position: absolute; inset: 0 0 auto; height: 5px; background: var(--bm-stripe); }
    .brand { display: flex; align-items: center; gap: 0.6rem; color: #fff; text-decoration: none; font-family: var(--bm-font-display);
      font-weight: 800; font-size: 1.15rem; line-height: 1.15; padding-inline: 0.5rem; }
    .brand small { display: block; font-family: var(--bm-font-body); font-weight: 600; font-size: 0.78rem; color: #b9b5e4; }
    .logo { flex: none; display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: #fff; }
    nav { display: grid; gap: 0.25rem; }
    nav a { padding: 0.65rem 0.75rem; border-radius: var(--bm-radius-sm); color: #dcdaf2; text-decoration: none; font-weight: 700; }
    nav a:hover { background: rgb(255 255 255 / 8%); }
    nav a.active { background: var(--bm-brand-yellow); color: var(--bm-primary-strong); }
    .foot { margin-top: auto; display: grid; gap: 0.6rem; padding-inline: 0.75rem; font-size: 0.88rem; }
    .foot a { color: #fff; }
    .who { color: #b9b5e4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .foot .btn { color: #fff; border-color: rgb(255 255 255 / 25%); }
    .content { min-width: 0; padding: clamp(1.25rem, 4vw, 2.5rem) var(--bm-gutter); max-width: 1080px; width: 100%; }
    @media (max-width: 860px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { position: relative; height: auto; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 0.75rem 1rem; padding: 0.75rem var(--bm-gutter); }
      nav { display: flex; flex-wrap: wrap; }
      .foot { margin: 0 0 0 auto; display: flex; flex-wrap: wrap; align-items: center; padding: 0; }
      .who { display: none; }
    }
  `,
})
export class AdminLayout {
  protected readonly auth = inject(AuthService);
}
