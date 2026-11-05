import { Component, computed, inject, input } from '@angular/core';
import { WorksheetsApi } from '../../core/api/worksheets-api';
import { fileKind, formatBytes } from '../../core/http/api-error';
import type { Worksheet } from '../../core/models';

@Component({
  selector: 'app-worksheet-card',
  template: `
    @let w = worksheet();
    <article class="card worksheet" [attr.data-level]="w.level">
      <div class="meta">
        <span class="badge" [class]="'badge-' + w.level">
          {{ w.humanValue }}
        </span>
        <span class="file">{{ kind() }} · {{ size() }}</span>
      </div>
      <h3>{{ w.title }}</h3>
      <p class="muted pre-line">{{ w.description }}</p>
      <a class="btn btn-primary btn-sm" [href]="downloadUrl()" download>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Descargar cartilla
        <span class="sr-only">: {{ w.title }}</span>
      </a>
    </article>
  `,
  styles: `
    :host { display: block; }
    .worksheet { height: 100%; display: flex; flex-direction: column; padding: 1.4rem; gap: 0.6rem; border-top: 5px solid var(--bm-brand-green); }
    .worksheet[data-level='preschool'] { border-top-color: var(--bm-brand-yellow); }
    .worksheet[data-level='secondary'] { border-top-color: var(--bm-brand-blue); }
    .meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .file { font-size: 0.8rem; color: var(--bm-ink-soft); }
    h3 { margin: 0.25rem 0 0; }
    p { flex: 1; margin: 0 0 0.5rem; }
    .btn { align-self: flex-start; }
  `,
})
export class WorksheetCard {
  readonly worksheet = input.required<Worksheet>();

  private readonly api = inject(WorksheetsApi);
  protected readonly downloadUrl = computed(() => this.api.downloadUrl(this.worksheet().id));
  protected readonly kind = computed(() => fileKind(this.worksheet().file.mimeType));
  protected readonly size = computed(() => formatBytes(this.worksheet().file.sizeBytes));
}
