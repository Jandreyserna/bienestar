import { Component, type ElementRef, effect, input, signal, viewChild } from '@angular/core';

export interface CarouselSlide {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

/**
 * Carrusel reutilizable basado en scroll-snap (funciona con gestos táctiles sin librerías).
 * - variant "story": una diapositiva a la vez con imagen + texto (Historia).
 * - variant "portrait": varias tarjetas con foto circular + nombre (Fundadores).
 * El autoplay se pausa con el mouse/foco encima y se desactiva con "reducir movimiento".
 */
@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
  host: {
    role: 'region',
    'aria-roledescription': 'carrusel',
    '[attr.aria-label]': 'label()',
    '[class.story]': "variant() === 'story'",
    '[class.portrait]': "variant() === 'portrait'",
    '(mouseenter)': 'paused.set(true)',
    '(mouseleave)': 'paused.set(false)',
    '(focusin)': 'paused.set(true)',
    '(focusout)': 'paused.set(false)',
  },
})
export class Carousel {
  readonly slides = input.required<CarouselSlide[]>();
  readonly variant = input<'story' | 'portrait'>('story');
  readonly label = input('Carrusel');
  /** Milisegundos entre diapositivas; 0 desactiva el avance automático. */
  readonly autoplayMs = input(0);

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  protected readonly current = signal(0);
  protected readonly paused = signal(false);
  private readonly reducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    effect((onCleanup) => {
      const ms = this.autoplayMs();
      if (!ms || this.reducedMotion || this.slides().length < 2) return;
      const timer = setInterval(() => {
        if (!this.paused() && !document.hidden) this.next();
      }, ms);
      onCleanup(() => clearInterval(timer));
    });
  }

  protected goTo(index: number): void {
    const track = this.track().nativeElement;
    const slide = track.children.item(index) as HTMLElement | null;
    if (!slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: this.reducedMotion ? 'auto' : 'smooth' });
    this.current.set(index);
  }

  protected next(): void {
    const track = this.track().nativeElement;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    this.goTo(atEnd ? 0 : Math.min(this.current() + 1, this.slides().length - 1));
  }

  protected prev(): void {
    const track = this.track().nativeElement;
    this.goTo(track.scrollLeft <= 4 ? this.slides().length - 1 : Math.max(this.current() - 1, 0));
  }

  /** Sincroniza el indicador cuando el usuario desliza con el dedo o la rueda. */
  protected onScroll(): void {
    const track = this.track().nativeElement;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((child, index) => {
      const d = Math.abs((child as HTMLElement).offsetLeft - track.scrollLeft);
      if (d < distance) {
        distance = d;
        nearest = index;
      }
    });
    if (nearest !== this.current()) this.current.set(nearest);
  }

  protected initials(text: string): string {
    return text
      .split(/\s+/)
      .filter((word) => /^\p{L}/u.test(word))
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join('');
  }
}
