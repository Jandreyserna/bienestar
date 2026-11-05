import { Component, computed, inject, input } from '@angular/core';
import { SectionsApi } from '../../core/api/sections-api';
import { apiErrorMessage } from '../../core/http/api-error';
import type { PageSlug, Section } from '../../core/models';
import { scrollToFragmentWhenReady } from '../../core/scroll/fragment-scroll';
import { PageIntro } from '../components/page-intro';
import { SectionBlock } from '../components/section-block/section-block';

/**
 * Página genérica (Quiénes somos, Servicios de apoyo, Equipo de trabajo, Contáctenos):
 * la sección "intro" es el encabezado y el resto se presenta en orden con su diseño.
 * Todo el contenido sale de la API, así que se administra desde el panel.
 */
@Component({
  selector: 'app-content-page',
  imports: [PageIntro, SectionBlock],
  template: `
    @if (firstLoad()) {
      <div class="container loading" aria-busy="true" aria-label="Cargando contenido">
        <div class="skeleton" style="height: 220px"></div>
        <div class="skeleton" style="height: 320px; margin-top: 2rem"></div>
      </div>
    } @else if (errorMessage(); as message) {
      <div class="container state">
        <p>{{ message }}</p>
        <button class="btn btn-ghost" type="button" (click)="sections.reload()">Reintentar</button>
      </div>
    } @else {
      @if (intro(); as intro) {
        <app-page-intro [section]="intro" />
      }
      @for (section of rest(); track section.id; let even = $even) {
        <app-section-block [section]="section" [alt]="!even" />
      } @empty {
        <p class="container state">Pronto publicaremos el contenido de esta página.</p>
      }
    }
  `,
  styles: `
    .loading {
      padding-block: 2rem;
    }
  `,
})
export class ContentPage {
  /** Llega desde `data` de la ruta (withComponentInputBinding). */
  readonly page = input.required<PageSlug>();

  protected readonly sections = inject(SectionsApi).pageResource(() => this.page());

  private readonly list = computed<Section[]>(() => (this.sections.hasValue() ? this.sections.value() : []));
  protected readonly intro = computed(() => this.list().find((s) => s.key === 'intro'));
  protected readonly rest = computed(() => this.list().filter((s) => s.key !== 'intro'));

  protected readonly firstLoad = computed(() => this.sections.isLoading() && this.list().length === 0);
  protected readonly errorMessage = computed(() =>
    this.sections.error() ? apiErrorMessage(this.sections.error(), 'No pudimos cargar el contenido.') : null,
  );

  constructor() {
    scrollToFragmentWhenReady(computed(() => this.list().length > 0));
  }
}
