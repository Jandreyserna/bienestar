import { ViewportScroller } from '@angular/common';
import { Component, DestroyRef, type ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SectionsApi } from '../../core/api/sections-api';
import { PAGES, type PageSlug } from '../../core/models';

/**
 * Marco del sitio público: encabezado con logo y menú (cada página con sus secciones),
 * contenido y pie de página. Las secciones del menú salen de la API, así que las que se
 * agreguen desde el panel aparecen automáticamente.
 */
@Component({
  selector: 'app-public-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
  host: { '(document:keydown.escape)': 'closeMenus()' },
})
export class PublicLayout {
  private readonly navigation = inject(SectionsApi).navigationResource();
  private readonly header = viewChild.required<ElementRef<HTMLElement>>('header');

  protected readonly menuOpen = signal(false);
  protected readonly openSubmenu = signal<PageSlug | null>(null);
  protected readonly year = new Date().getFullYear();

  protected readonly menu = computed(() => {
    const navigation = this.navigation.hasValue() ? this.navigation.value() : [];
    return PAGES.map((page) => ({
      ...page,
      sections: navigation.find((entry) => entry.page === page.slug)?.sections ?? [],
    }));
  });

  constructor() {
    // Los saltos a "#seccion" dejan el título visible bajo el encabezado fijo.
    inject(ViewportScroller).setOffset(() => [0, (this.header().nativeElement.offsetHeight ?? 0) + 12]);

    const subscription = inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeMenus());
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  protected toggleSubmenu(slug: PageSlug): void {
    this.openSubmenu.update((current) => (current === slug ? null : slug));
  }

  protected closeMenus(): void {
    this.menuOpen.set(false);
    this.openSubmenu.set(null);
  }
}
