import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SectionsApi } from '../../core/api/sections-api';
import { apiErrorMessage } from '../../core/http/api-error';
import { PAGES, type PageSlug, type Section } from '../../core/models';

/** RF-02.1: listado de secciones por página. */
@Component({
  selector: 'app-sections-page',
  imports: [RouterLink],
  template: `
    <header class="admin-header">
      <div>
        <h1>Páginas y secciones</h1>
        <p class="muted">Edita los textos e imágenes que se muestran en el sitio público.</p>
      </div>
      <a class="btn btn-primary" routerLink="nueva" [queryParams]="{ pagina: page() }">+ Nueva sección</a>
    </header>

    <nav class="tabs" aria-label="Página">
      @for (p of pages; track p.slug) {
        <a [routerLink]="[]" [queryParams]="{ pagina: p.slug }" [class.active]="p.slug === page()"
          [attr.aria-current]="p.slug === page() ? 'page' : null">{{ p.label }}</a>
      }
    </nav>

    @if (error(); as message) {
      <div class="alert alert-error" role="alert">{{ message }}</div>
    }

    @if (sections.isLoading() && !list().length) {
      <p class="state">Cargando secciones…</p>
    } @else if (sections.error()) {
      <div class="state">
        <p>No se pudieron cargar las secciones.</p>
        <button class="btn btn-ghost" type="button" (click)="sections.reload()">Reintentar</button>
      </div>
    } @else {
      <ul class="admin-list">
        @for (section of list(); track section.id) {
          <li class="card admin-row">
            <span class="order" title="Orden en la página">{{ section.position }}</span>
            <div class="info">
              <strong>{{ section.title }}</strong>
              <div class="tags">
                <code>{{ section.key }}</code>
                @if (section.isCore) {
                  <span class="badge badge-neutral" title="Forma parte de la estructura de la página">Estructural</span>
                }
                @if (section.items.length) {
                  <span class="badge">{{ section.items.length }} elemento(s)</span>
                }
              </div>
            </div>
            <div class="actions">
              <a class="btn btn-ghost btn-sm" [routerLink]="[section.id]">Editar</a>
              @if (!section.isCore) {
                <button class="btn btn-danger btn-sm" type="button" [disabled]="deleting() === section.id"
                  (click)="remove(section)">
                  {{ deleting() === section.id ? 'Eliminando…' : 'Eliminar' }}
                </button>
              }
            </div>
          </li>
        } @empty {
          <li class="state">Esta página aún no tiene secciones.</li>
        }
      </ul>
    }
  `,
  styles: `
    .order { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 50%;
      background: var(--bm-primary-soft); color: var(--bm-primary); font-weight: 700; }
    .tags { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; margin-top: 0.25rem; font-size: 0.85rem; }
    code { color: var(--bm-ink-soft); }
  `,
})
export class SectionsPage {
  /** Query param ?pagina=home|human-values */
  readonly pagina = input<string>();

  private readonly api = inject(SectionsApi);
  protected readonly pages = PAGES;
  protected readonly page = computed<PageSlug>(() => (this.pagina() === 'human-values' ? 'human-values' : 'home'));
  protected readonly sections = this.api.pageResource(this.page);
  protected readonly list = computed<Section[]>(() => (this.sections.hasValue() ? this.sections.value() : []));
  protected readonly deleting = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected remove(section: Section): void {
    if (!confirm(`¿Eliminar la sección "${section.title}"? Esta acción no se puede deshacer.`)) return;
    this.deleting.set(section.id);
    this.error.set(null);
    this.api
      .remove(section.id)
      .pipe(finalize(() => this.deleting.set(null)))
      .subscribe({
        next: () => this.sections.reload(),
        error: (err: unknown) => this.error.set(apiErrorMessage(err, 'No se pudo eliminar la sección.')),
      });
  }
}
