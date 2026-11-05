import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { finalize } from 'rxjs';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MediaApi } from '../../core/api/media-api';
import { apiErrorMessage } from '../../core/http/api-error';

let nextId = 0;

/**
 * Campo de formulario para imágenes: sube el archivo a la API (que lo envía a Hostinger
 * mediante el Worker) y guarda en el formulario la URL pública resultante.
 * También permite pegar una URL existente.
 */
@Component({
  selector: 'app-image-field',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ImageField), multi: true }],
  template: `
    <div class="field">
      <span class="label" [id]="id + '-label'">{{ label() }}</span>
      @if (hint()) {
        <span class="hint">{{ hint() }}</span>
      }
      <div class="box">
        <div class="preview">
          @if (value()) {
            <img [src]="value()" alt="Vista previa" />
          } @else {
            <span class="empty" aria-hidden="true">Sin imagen</span>
          }
        </div>
        <div class="controls">
          <label class="btn btn-ghost btn-sm upload" [class.busy]="uploading()">
            {{ uploading() ? 'Subiendo…' : value() ? 'Cambiar imagen' : 'Subir imagen' }}
            <input
              type="file"
              class="sr-only"
              [accept]="accept"
              [disabled]="disabled() || uploading()"
              [attr.aria-labelledby]="id + '-label'"
              (change)="onFileSelected($event)"
            />
          </label>
          <input
            class="input"
            type="url"
            placeholder="…o pega la URL de la imagen"
            [value]="value()"
            [disabled]="disabled()"
            [attr.aria-labelledby]="id + '-label'"
            (input)="update($any($event.target).value)"
            (blur)="onTouched()"
          />
          @if (value()) {
            <button class="btn btn-danger btn-sm" type="button" [disabled]="disabled()" (click)="update('')">
              Quitar
            </button>
          }
        </div>
      </div>
      @if (error(); as message) {
        <span class="field-error" role="alert">{{ message }}</span>
      }
    </div>
  `,
  styles: `
    .box { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
    .preview { width: 140px; aspect-ratio: 4 / 3; border-radius: var(--bm-radius-sm); overflow: hidden;
      background: #efe9de; display: grid; place-items: center; flex-shrink: 0; }
    .preview img { width: 100%; height: 100%; object-fit: cover; }
    .empty { font-size: 0.8rem; color: var(--bm-ink-soft); }
    .controls { flex: 1; min-width: 220px; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .controls .input { flex: 1 1 220px; }
    .upload { position: relative; }
    .upload:focus-within { outline: 3px solid var(--bm-accent); outline-offset: 2px; }
    .busy { opacity: 0.7; pointer-events: none; }
  `,
})
export class ImageField implements ControlValueAccessor {
  readonly label = input('Imagen');
  readonly hint = input<string>();

  private readonly media = inject(MediaApi);
  protected readonly id = `image-field-${nextId++}`;
  protected readonly accept = IMAGE_TYPES.join(',');
  protected readonly value = signal('');
  protected readonly uploading = signal(false);
  protected readonly disabled = signal(false);
  protected readonly error = signal<string | null>(null);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected update(value: string): void {
    this.value.set(value.trim());
    this.error.set(null);
    this.onChange(value.trim());
    this.onTouched();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      this.error.set('Formato no permitido. Usa JPG, PNG, WebP, GIF o AVIF.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.error.set('La imagen supera 5 MB. Reduce su tamaño antes de subirla.');
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    this.media
      .uploadImage(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (stored) => this.update(stored.url),
        error: (err: unknown) => this.error.set(apiErrorMessage(err, 'No se pudo subir la imagen.')),
      });
  }
}
