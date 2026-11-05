import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WorksheetsApi } from '../../core/api/worksheets-api';
import { apiErrorMessage, fileKind, formatBytes } from '../../core/http/api-error';
import { type EducationLevel, LEVEL_LABELS, type Worksheet } from '../../core/models';

/** RF-02.2: administración de cartillas de Primaria y Secundaria. */
@Component({
  selector: 'app-worksheets-page',
  imports: [RouterLink, DatePipe],
  template: `
    <header class="admin-header">
      <div>
        <h1>Cartillas</h1>
        <p class="muted">Documentos descargables de la página Valores humanos.</p>
      </div>
      <a class="btn btn-primary" routerLink="nueva" [queryParams]="level() ? { nivel: level() } : {}">+ Nueva cartilla</a>
    </header>

    <nav class="tabs" aria-label="Nivel">
      @for (tab of tabs; track tab.label) {
        <a [routerLink]="[]" [queryParams]="{ nivel: tab.value ?? null }" [class.active]="tab.value === level()"
          [attr.aria-current]="tab.value === level() ? 'page' : null">{{ tab.label }}</a>
      }
    </nav>

    @if (notice(); as message) {
      <div class="alert alert-success" role="status">{{ message }}</div>
    }
    @if (error(); as message) {
      <div class="alert alert-error" role="alert">{{ message }}</div>
    }

    @if (worksheets.isLoading() && !list().length) {
      <p class="state">Cargando cartillas…</p>
    } @else if (worksheets.error()) {
      <div class="state">
        <p>No se pudieron cargar las cartillas.</p>
        <button class="btn btn-ghost" type="button" (click)="worksheets.reload()">Reintentar</button>
      </div>
    } @else {
      <ul class="admin-list">
        @for (w of list(); track w.id) {
          <li class="card admin-row">
            <div class="info">
              <strong>{{ w.title }}</strong>
              <div class="tags">
                <span class="badge" [class]="w.level === 'primary' ? 'badge-primary' : 'badge-secondary'">
                  {{ levelLabels[w.level] }}
                </span>
                <span class="badge">{{ w.humanValue }}</span>
                <span class="muted">{{ kind(w) }} · {{ size(w) }} · actualizada {{ w.updatedAt | date: 'mediumDate' }}</span>
              </div>
            </div>
            <div class="actions">
              <a class="btn btn-ghost btn-sm" [href]="downloadUrl(w)" download>Descargar</a>
              <a class="btn btn-ghost btn-sm" [routerLink]="[w.id]">Editar</a>
              <button class="btn btn-danger btn-sm" type="button" [disabled]="deleting() === w.id" (click)="remove(w)">
                {{ deleting() === w.id ? 'Eliminando…' : 'Eliminar' }}
              </button>
            </div>
          </li>
        } @empty {
          <li class="state">No hay cartillas{{ level() ? ' en ' + levelLabels[level()!] : '' }}. Crea la primera.</li>
        }
      </ul>
    }
  `,
  styles: `
    .tags { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; margin-top: 0.3rem; font-size: 0.85rem; }
  `,
})
export class WorksheetsPage {
  /** Query param ?nivel=primary|secondary */
  readonly nivel = input<string>();

  private readonly api = inject(WorksheetsApi);
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly tabs: { label: string; value?: EducationLevel }[] = [
    { label: 'Todas' },
    { label: 'Primaria', value: 'primary' },
    { label: 'Secundaria', value: 'secondary' },
  ];
  protected readonly level = computed<EducationLevel | undefined>(() => {
    const value = this.nivel();
    return value === 'primary' || value === 'secondary' ? value : undefined;
  });
  protected readonly worksheets = this.api.listResource(this.level);
  protected readonly list = computed<Worksheet[]>(() => (this.worksheets.hasValue() ? this.worksheets.value() : []));
  protected readonly deleting = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>((history.state as { flash?: string } | null)?.flash ?? null);

  protected kind(w: Worksheet): string {
    return fileKind(w.file.mimeType);
  }
  protected size(w: Worksheet): string {
    return formatBytes(w.file.sizeBytes);
  }
  protected downloadUrl(w: Worksheet): string {
    return this.api.downloadUrl(w.id);
  }

  protected remove(w: Worksheet): void {
    if (!confirm(`¿Eliminar la cartilla "${w.title}"? También se borrará su archivo del servidor.`)) return;
    this.deleting.set(w.id);
    this.error.set(null);
    this.notice.set(null);
    this.api
      .remove(w.id)
      .pipe(finalize(() => this.deleting.set(null)))
      .subscribe({
        next: () => {
          this.notice.set('Cartilla eliminada.');
          this.worksheets.reload();
        },
        error: (err: unknown) => this.error.set(apiErrorMessage(err, 'No se pudo eliminar la cartilla.')),
      });
  }
}
