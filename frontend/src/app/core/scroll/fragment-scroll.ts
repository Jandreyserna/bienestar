import { ViewportScroller } from '@angular/common';
import { Injector, type Signal, afterNextRender, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

/**
 * El contenido de las páginas llega de la API después de navegar, así que el salto del router
 * a "#seccion" ocurre antes de que exista el elemento. Esto lo repite cuando el contenido ya se
 * pintó. Debe llamarse en un contexto de inyección (constructor o inicializador de campo).
 */
export function scrollToFragmentWhenReady(ready: Signal<boolean>): void {
  const fragment = toSignal(inject(ActivatedRoute).fragment);
  const scroller = inject(ViewportScroller);
  const injector = inject(Injector);

  effect(() => {
    const target = fragment();
    if (!target || !ready()) return;
    afterNextRender(() => scroller.scrollToAnchor(target), { injector });
  });
}
