import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionsApi } from '../../core/api/sections-api';
import { apiErrorMessage } from '../../core/http/api-error';
import type { Section } from '../../core/models';
import { Carousel } from '../components/carousel/carousel';
import { GenericSection } from '../components/generic-section';

const CORE_KEYS = ['hero', 'history', 'founders', 'mission-vision'];

/** RF-01.2: Inicio (portada, historia, fundadores, misión y visión). */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, Carousel, GenericSection],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  protected readonly sections = inject(SectionsApi).pageResource(() => 'home');

  private readonly list = computed<Section[]>(() => (this.sections.hasValue() ? this.sections.value() : []));
  private readonly byKey = computed(() => new Map(this.list().map((s) => [s.key, s])));

  protected readonly hero = computed(() => this.byKey().get('hero'));
  protected readonly history = computed(() => this.byKey().get('history'));
  protected readonly founders = computed(() => this.byKey().get('founders'));
  protected readonly missionVision = computed(() => this.byKey().get('mission-vision'));
  protected readonly extras = computed(() => this.list().filter((s) => !CORE_KEYS.includes(s.key)));

  protected readonly firstLoad = computed(() => this.sections.isLoading() && this.list().length === 0);
  protected readonly errorMessage = computed(() =>
    this.sections.error() ? apiErrorMessage(this.sections.error(), 'No pudimos cargar el contenido.') : null,
  );
}
