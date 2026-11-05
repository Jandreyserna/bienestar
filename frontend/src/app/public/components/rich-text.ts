import { Component, computed, input } from '@angular/core';
import { linkify } from '../../core/text/linkify';

/**
 * Texto escrito en el panel: cada línea en blanco separa un párrafo, los saltos de línea se
 * respetan y las URLs y correos se vuelven enlaces (sin usar innerHTML).
 */
@Component({
  selector: 'app-rich-text',
  template: `
    @for (paragraph of paragraphs(); track $index) {
      <p>@for (part of paragraph; track $index) {@if (part.href) {<a [href]="part.href" [attr.target]="part.external ? '_blank' : null" [attr.rel]="part.external ? 'noopener' : null">{{ part.text }}</a>} @else {<ng-container>{{ part.text }}</ng-container>}}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    p {
      white-space: pre-line;
    }
    p:last-child {
      margin-bottom: 0;
    }
    a {
      overflow-wrap: break-word;
    }
  `,
})
export class RichText {
  readonly text = input<string | null | undefined>('');

  protected readonly paragraphs = computed(() =>
    (this.text() ?? '')
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map(linkify),
  );
}
