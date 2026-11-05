import { Component, input } from '@angular/core';
import type { Section } from '../../core/models';
import { RichText } from './rich-text';

/** Encabezado de una página interna, alimentado por su sección "intro" (editable en el panel). */
@Component({
  selector: 'app-page-intro',
  imports: [RichText],
  template: `
    @let s = section();
    <header class="intro">
      <div class="container intro-inner" [class.with-image]="!!s.imageUrl">
        <div>
          @if (s.subtitle) {
            <span class="eyebrow">{{ s.subtitle }}</span>
          }
          <h1>{{ s.title }}</h1>
          @if (s.body) {
            <app-rich-text class="lead" [text]="s.body" />
          }
          <ng-content />
        </div>
        @if (s.imageUrl) {
          <img class="intro-image" [src]="s.imageUrl" alt="" />
        }
      </div>
    </header>
    <span class="bm-stripe" aria-hidden="true"></span>
  `,
  styles: `
    :host {
      display: block;
    }
    .intro {
      padding-block: clamp(40px, 7vw, 80px);
      background:
        radial-gradient(circle at 92% 12%, rgb(249 233 59 / 32%), transparent 32%),
        radial-gradient(circle at 4% 100%, rgb(5 210 143 / 16%), transparent 38%),
        var(--bm-primary-soft);
    }
    .intro-inner.with-image {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
      gap: clamp(1.5rem, 4vw, 3rem);
      align-items: center;
    }
    h1 {
      color: var(--bm-primary);
    }
    .lead {
      max-width: 720px;
      font-size: 1.15rem;
      color: var(--bm-ink-soft);
    }
    .intro-image {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: var(--bm-radius);
      box-shadow: var(--bm-shadow);
    }
    @media (max-width: 820px) {
      .intro-inner.with-image {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class PageIntro {
  readonly section = input.required<Section>();
}
