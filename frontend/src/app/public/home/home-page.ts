import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionsApi } from '../../core/api/sections-api';
import { apiErrorMessage } from '../../core/http/api-error';
import type { Section } from '../../core/models';
import { scrollToFragmentWhenReady } from '../../core/scroll/fragment-scroll';
import { Carousel } from '../components/carousel/carousel';
import { RichText } from '../components/rich-text';
import { SectionBlock } from '../components/section-block/section-block';

/**
 * RF-01.2: Inicio. Las secciones se pintan en el orden definido en el panel; la portada,
 * la historia, los fundadores y la misión/visión tienen diseño propio y cualquier otra
 * sección usa el diseño elegido al crearla.
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, Carousel, RichText, SectionBlock],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  protected readonly sections = inject(SectionsApi).pageResource(() => 'home');

  protected readonly list = computed<Section[]>(() => (this.sections.hasValue() ? this.sections.value() : []));

  protected readonly firstLoad = computed(() => this.sections.isLoading() && this.list().length === 0);
  protected readonly errorMessage = computed(() =>
    this.sections.error() ? apiErrorMessage(this.sections.error(), 'No pudimos cargar el contenido.') : null,
  );

  constructor() {
    scrollToFragmentWhenReady(computed(() => this.list().length > 0));
  }
}
