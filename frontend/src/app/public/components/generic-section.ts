import { Component, input } from '@angular/core';
import type { Section } from '../../core/models';

/** Presenta cualquier sección adicional creada desde el panel (no estructural). */
@Component({
  selector: 'app-generic-section',
  template: `
    @let s = section();
    <section class="page-section">
      <div class="container">
        <div class="section-heading">
          @if (s.subtitle) {
            <span class="eyebrow">{{ s.subtitle }}</span>
          }
          <h2>{{ s.title }}</h2>
          @if (s.body) {
            <p class="lead pre-line">{{ s.body }}</p>
          }
        </div>
        @if (s.imageUrl) {
          <img class="banner" [src]="s.imageUrl" [alt]="s.title" loading="lazy" />
        }
        @if (s.items.length) {
          <div class="grid">
            @for (item of s.items; track item.id) {
              <article class="card item">
                @if (item.imageUrl) {
                  <img [src]="item.imageUrl" [alt]="item.title" loading="lazy" />
                }
                <div class="item-body">
                  <h3>{{ item.title }}</h3>
                  @if (item.description) {
                    <p class="muted pre-line">{{ item.description }}</p>
                  }
                </div>
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .banner { width: 100%; max-height: 460px; object-fit: cover; border-radius: var(--bm-radius); margin-bottom: 2rem; }
    .grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
    .item { overflow: hidden; }
    .item img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
    .item-body { padding: 1.25rem; }
    .item-body p { margin: 0; }
  `,
})
export class GenericSection {
  readonly section = input.required<Section>();
}
