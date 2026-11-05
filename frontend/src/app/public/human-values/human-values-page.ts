import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionsApi } from '../../core/api/sections-api';
import { WorksheetsApi } from '../../core/api/worksheets-api';
import { apiErrorMessage } from '../../core/http/api-error';
import {
  type EducationLevel,
  LEVEL_LABELS,
  type Section,
  type SectionItem,
  type Worksheet,
} from '../../core/models';
import { scrollToFragmentWhenReady } from '../../core/scroll/fragment-scroll';
import { PageIntro } from '../components/page-intro';
import { RichText } from '../components/rich-text';
import { type ItemLink, SectionBlock } from '../components/section-block/section-block';
import { WorksheetCard } from '../components/worksheet-card';

interface LevelGroup {
  level: EducationLevel;
  label: string;
  anchor: string;
  description: string;
  items: Worksheet[];
}

const LEVEL_INFO: Record<EducationLevel, { anchor: string; description: string }> = {
  preschool: { anchor: 'preescolar', description: 'Material didáctico para niñas y niños de preescolar.' },
  primary: { anchor: 'primaria', description: 'Material didáctico para estudiantes de primaria.' },
  secondary: { anchor: 'secundaria', description: 'Material didáctico para adolescentes de secundaria.' },
};

/**
 * RF-01.3: Valores humanos. Banco de valores (editable en el panel) y catálogo público de
 * cartillas descargables por nivel. Cada valor enlaza a sus cartillas cuando existen.
 */
@Component({
  selector: 'app-human-values-page',
  imports: [RouterLink, PageIntro, RichText, SectionBlock, WorksheetCard],
  templateUrl: './human-values-page.html',
  styleUrl: './human-values-page.css',
})
export class HumanValuesPage {
  /** ?valor=La%20amistad (desde "Ver cartillas" de un valor) filtra el catálogo. */
  readonly valor = input<string>();

  protected readonly sections = inject(SectionsApi).pageResource(() => 'human-values');
  protected readonly worksheets = inject(WorksheetsApi).listResource();
  protected readonly query = linkedSignal(() => this.valor() ?? '');

  private readonly sectionList = computed<Section[]>(() =>
    this.sections.hasValue() ? this.sections.value() : [],
  );
  protected readonly intro = computed(() => this.sectionList().find((s) => s.key === 'intro'));
  protected readonly rest = computed(() => this.sectionList().filter((s) => s.key !== 'intro'));

  private readonly all = computed<Worksheet[]>(() => (this.worksheets.hasValue() ? this.worksheets.value() : []));

  protected readonly groups = computed<LevelGroup[]>(() => {
    const term = normalize(this.query());
    const matches = (w: Worksheet) =>
      !term || normalize(`${w.title} ${w.humanValue} ${w.description}`).includes(term);
    return (Object.keys(LEVEL_LABELS) as EducationLevel[]).map((level) => ({
      level,
      label: LEVEL_LABELS[level],
      ...LEVEL_INFO[level],
      items: this.all().filter((w) => w.level === level && matches(w)),
    }));
  });

  /** Cuántas cartillas hay por valor, para enlazar el banco de valores con el catálogo. */
  private readonly countByValue = computed(() => {
    const counts = new Map<string, number>();
    for (const w of this.all()) counts.set(valueKey(w.humanValue), (counts.get(valueKey(w.humanValue)) ?? 0) + 1);
    return counts;
  });

  protected readonly valueLink = (item: SectionItem): ItemLink | null => {
    const count = this.countByValue().get(valueKey(item.title));
    if (!count) return null;
    return {
      label: count === 1 ? 'Ver la cartilla' : `Ver ${count} cartillas`,
      route: '/valores-humanos',
      queryParams: { valor: item.title },
      fragment: 'worksheets',
    };
  };

  protected readonly loadingWorksheets = computed(() => this.worksheets.isLoading() && this.all().length === 0);
  protected readonly worksheetsError = computed(() =>
    this.worksheets.error() ? apiErrorMessage(this.worksheets.error(), 'No pudimos cargar las cartillas.') : null,
  );

  constructor() {
    scrollToFragmentWhenReady(computed(() => this.sectionList().length > 0 && !this.loadingWorksheets()));
  }
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** "La Amistad" y "amistad" son el mismo valor. */
function valueKey(text: string): string {
  return normalize(text).replace(/^(el|la|los|las)\s+/, '');
}
