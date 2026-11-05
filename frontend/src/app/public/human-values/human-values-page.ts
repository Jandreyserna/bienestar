import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionsApi } from '../../core/api/sections-api';
import { WorksheetsApi } from '../../core/api/worksheets-api';
import { apiErrorMessage } from '../../core/http/api-error';
import { type EducationLevel, LEVEL_LABELS, type Section, type Worksheet } from '../../core/models';
import { GenericSection } from '../components/generic-section';
import { WorksheetCard } from '../components/worksheet-card';

interface LevelGroup {
  level: EducationLevel;
  label: string;
  anchor: string;
  description: string;
  items: Worksheet[];
}

const LEVEL_INFO: Record<EducationLevel, { anchor: string; description: string }> = {
  primary: {
    anchor: 'primaria',
    description: 'Actividades pensadas para niñas y niños de primaria: juegos, lecturas y reflexiones guiadas.',
  },
  secondary: {
    anchor: 'secundaria',
    description: 'Propuestas para adolescentes de secundaria: debates, casos y proyectos de convivencia.',
  },
};

/** RF-01.3: catálogo público de cartillas descargables, separado en Primaria y Secundaria. */
@Component({
  selector: 'app-human-values-page',
  imports: [RouterLink, WorksheetCard, GenericSection],
  templateUrl: './human-values-page.html',
  styleUrl: './human-values-page.css',
})
export class HumanValuesPage {
  protected readonly sections = inject(SectionsApi).pageResource(() => 'human-values');
  protected readonly worksheets = inject(WorksheetsApi).listResource();
  protected readonly query = signal('');

  private readonly sectionList = computed<Section[]>(() =>
    this.sections.hasValue() ? this.sections.value() : [],
  );
  protected readonly intro = computed(() => this.sectionList().find((s) => s.key === 'intro'));
  protected readonly extras = computed(() => this.sectionList().filter((s) => s.key !== 'intro'));

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

  protected readonly loadingWorksheets = computed(() => this.worksheets.isLoading() && this.all().length === 0);
  protected readonly worksheetsError = computed(() =>
    this.worksheets.error() ? apiErrorMessage(this.worksheets.error(), 'No pudimos cargar las cartillas.') : null,
  );
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
