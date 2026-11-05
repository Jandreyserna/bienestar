import { HttpEventType } from '@angular/common/http';
import { Component, type OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WorksheetsApi } from '../../core/api/worksheets-api';
import { apiErrorMessage, formatBytes } from '../../core/http/api-error';
import { type EducationLevel, LEVEL_LABELS, type Worksheet } from '../../core/models';

const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

const SUGGESTED_VALUES = [
  'Respeto', 'Responsabilidad', 'Honestidad', 'Solidaridad', 'Empatía', 'Tolerancia',
  'Justicia', 'Gratitud', 'Paz', 'Amistad', 'Perseverancia', 'Cooperación', 'Generosidad',
];

/** RF-02.2: cargar o editar una cartilla con su archivo descargable. */
@Component({
  selector: 'app-worksheet-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './worksheet-form-page.html',
})
export class WorksheetFormPage implements OnInit {
  readonly id = input<string>();
  readonly nivel = input<string>();

  private readonly api = inject(WorksheetsApi);
  private readonly router = inject(Router);

  protected readonly levels = Object.entries(LEVEL_LABELS) as [EducationLevel, string][];
  protected readonly suggestions = SUGGESTED_VALUES;
  protected readonly accept = DOCUMENT_TYPES.join(',');
  protected readonly worksheet = this.api.worksheetResource(() => this.id());
  protected readonly current = computed<Worksheet | undefined>(() =>
    this.worksheet.hasValue() ? this.worksheet.value() : undefined,
  );
  protected readonly isNew = computed(() => !this.id());

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    humanValue: ['', [Validators.required, Validators.maxLength(100)]],
    level: ['primary' as EducationLevel, Validators.required],
  });
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly progress = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly formatBytes = formatBytes;

  constructor() {
    effect(() => {
      const w = this.current();
      if (!w) return;
      untracked(() => {
        this.form.setValue({ title: w.title, description: w.description, humanValue: w.humanValue, level: w.level });
        this.form.markAsPristine();
      });
    });
  }

  ngOnInit(): void {
    const level = this.nivel();
    if (this.isNew() && (level === 'primary' || level === 'secondary')) this.form.controls.level.setValue(level);
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileError.set(null);
    if (!file) {
      this.file.set(null);
      return;
    }
    if (!DOCUMENT_TYPES.includes(file.type)) {
      this.fileError.set('Formato no permitido. Usa PDF, Word (.doc/.docx) o PowerPoint (.ppt/.pptx).');
      input.value = '';
      this.file.set(null);
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      this.fileError.set('El archivo supera 20 MB.');
      input.value = '';
      this.file.set(null);
      return;
    }
    this.file.set(file);
  }

  protected submit(): void {
    if (this.isNew() && !this.file()) this.fileError.set('Adjunta el archivo de la cartilla.');
    if (this.form.invalid || this.fileError()) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos marcados.');
      return;
    }

    const payload = { ...this.form.getRawValue(), file: this.file() };
    const id = this.id();
    const request = id ? this.api.update(id, payload) : this.api.create(payload);

    this.error.set(null);
    this.progress.set(0);
    request.pipe(finalize(() => this.progress.set(null))).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response) {
          void this.router.navigate(['/admin/cartillas'], {
            queryParams: { nivel: payload.level },
            state: { flash: id ? 'Cartilla actualizada.' : 'Cartilla publicada.' },
          });
        }
      },
      error: (err: unknown) => this.error.set(apiErrorMessage(err, 'No se pudo guardar la cartilla.')),
    });
  }
}
