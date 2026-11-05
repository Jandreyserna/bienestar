import { Component, type OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  type FormControl,
  type FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SectionsApi } from '../../core/api/sections-api';
import { apiErrorMessage } from '../../core/http/api-error';
import {
  PAGES,
  type PageSlug,
  SECTION_LAYOUTS,
  type Section,
  type SectionItem,
  type SectionLayout,
  type SectionPayload,
} from '../../core/models';
import { ImageField } from '../shared/image-field';
import { profileFor } from './section-profiles';

const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ITEMS = 30;

type ItemForm = FormGroup<{
  id: FormControl<string | null>;
  title: FormControl<string>;
  description: FormControl<string>;
  imageUrl: FormControl<string>;
}>;

/** RF-02.1 / RF-02.2: crear o editar una sección, sus items e imágenes. */
@Component({
  selector: 'app-section-editor-page',
  imports: [ReactiveFormsModule, RouterLink, ImageField],
  templateUrl: './section-editor-page.html',
  styleUrl: './section-editor-page.css',
})
export class SectionEditorPage implements OnInit {
  /** Parámetro de ruta :id (ausente al crear). */
  readonly id = input<string>();
  /** Query param ?pagina= para preseleccionar la página al crear. */
  readonly pagina = input<string>();

  private readonly api = inject(SectionsApi);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly pages = PAGES;
  protected readonly layouts = SECTION_LAYOUTS;
  protected readonly maxItems = MAX_ITEMS;
  protected readonly section = this.api.sectionResource(() => this.id());
  protected readonly isNew = computed(() => !this.id());
  protected readonly loaded = computed<Section | undefined>(() =>
    this.section.hasValue() ? this.section.value() : undefined,
  );
  /** Las secciones estructurales tienen diseño fijo; las demás eligen cómo se presentan. */
  protected readonly isCore = computed(() => this.loaded()?.isCore ?? false);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ type: 'success' | 'error'; text: string } | null>(
    (history.state as { flash?: string } | null)?.flash
      ? { type: 'success', text: (history.state as { flash: string }).flash }
      : null,
  );

  protected readonly form = this.fb.group({
    page: this.fb.control<PageSlug>('home'),
    key: this.fb.control('', [Validators.required, Validators.pattern(KEY_PATTERN), Validators.maxLength(60)]),
    title: this.fb.control('', [Validators.required, Validators.maxLength(200)]),
    subtitle: this.fb.control('', Validators.maxLength(300)),
    body: this.fb.control('', Validators.maxLength(5000)),
    imageUrl: this.fb.control(''),
    layout: this.fb.control<SectionLayout>('cards'),
    position: this.fb.control<number | null>(null, Validators.min(0)),
    items: this.fb.array<ItemForm>([]),
  });

  private readonly layoutValue = toSignal(this.form.controls.layout.valueChanges, {
    initialValue: this.form.controls.layout.value,
  });
  protected readonly profile = computed(() => profileFor(this.loaded(), this.layoutValue()));
  protected readonly layoutHint = computed(
    () => this.layouts.find((layout) => layout.value === this.layoutValue())?.hint ?? '',
  );

  constructor() {
    // Cuando llega (o se actualiza) la sección desde la API, se vuelca en el formulario.
    effect(() => {
      const section = this.loaded();
      if (section) untracked(() => this.fill(section));
    });
  }

  ngOnInit(): void {
    if (this.isNew()) {
      const requested = PAGES.find((page) => page.slug === this.pagina());
      this.form.controls.page.setValue(requested?.slug ?? 'home');
    }
  }

  protected get items() {
    return this.form.controls.items;
  }

  protected addItem(): void {
    this.items.push(this.itemGroup());
    this.form.markAsDirty();
  }

  protected removeItem(index: number): void {
    this.items.removeAt(index);
    this.form.markAsDirty();
  }

  protected moveItem(index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= this.items.length) return;
    const control = this.items.at(index);
    this.items.removeAt(index);
    this.items.insert(target, control);
    this.form.markAsDirty();
  }

  protected invalid(control: { invalid: boolean; touched: boolean }): boolean {
    return control.invalid && control.touched;
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notice.set({ type: 'error', text: 'Revisa los campos marcados en rojo.' });
      return;
    }

    const v = this.form.getRawValue();
    const payload: SectionPayload = {
      title: v.title,
      subtitle: v.subtitle || null,
      body: v.body || null,
      imageUrl: v.imageUrl || null,
      ...(this.isCore() ? {} : { layout: v.layout }),
      ...(v.position !== null ? { position: v.position } : {}),
      ...(this.profile().usesItems
        ? {
            items: v.items.map((item) => ({
              ...(item.id ? { id: item.id } : {}),
              title: item.title,
              description: item.description || null,
              imageUrl: item.imageUrl || null,
            })),
          }
        : {}),
    };

    this.saving.set(true);
    this.notice.set(null);
    const id = this.id();
    const request = id
      ? this.api.update(id, payload)
      : this.api.create({ ...payload, page: v.page, key: v.key.trim().toLowerCase() });

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        if (id) {
          this.section.set(saved);
          this.notice.set({ type: 'success', text: 'Cambios guardados. Ya se ven en el sitio.' });
        } else {
          void this.router.navigate(['/admin/secciones', saved.id], {
            replaceUrl: true,
            state: { flash: 'Sección creada.' },
          });
        }
      },
      error: (err: unknown) =>
        this.notice.set({ type: 'error', text: apiErrorMessage(err, 'No se pudieron guardar los cambios.') }),
    });
  }

  private fill(section: Section): void {
    this.form.controls.key.disable();
    this.form.patchValue({
      page: section.page,
      key: section.key,
      title: section.title,
      subtitle: section.subtitle ?? '',
      body: section.body ?? '',
      imageUrl: section.imageUrl ?? '',
      layout: section.layout,
      position: section.position,
    });
    this.items.clear();
    section.items.forEach((item) => this.items.push(this.itemGroup(item)));
    this.form.markAsPristine();
  }

  private itemGroup(item?: SectionItem): ItemForm {
    return this.fb.group({
      id: this.fb.control<string | null>(item?.id ?? null),
      title: this.fb.control(item?.title ?? '', [Validators.required, Validators.maxLength(200)]),
      description: this.fb.control(item?.description ?? '', Validators.maxLength(3000)),
      imageUrl: this.fb.control(item?.imageUrl ?? ''),
    });
  }
}
