import { describe, expect, it } from 'vitest';
import { BusinessRuleViolationError, ValidationError } from '../../src/shared/domain/errors.js';
import { Section } from '../../src/modules/site-content/domain/Section.js';
import { SectionFactory } from '../../src/modules/site-content/domain/SectionFactory.js';

const now = new Date('2026-01-01T00:00:00Z');
let counter = 0;
const factory = new SectionFactory(() => `id-${++counter}`);

describe('Agregado Section', () => {
  it('crea la sección normalizando textos y ordenando items', () => {
    const section = factory.create(
      {
        page: 'home',
        key: 'Nuestra-Historia',
        title: '  Historia  ',
        subtitle: '',
        items: [{ title: 'Inicio' }, { title: 'Hoy', description: 'Seguimos' }],
      },
      5,
      now,
    );
    const snapshot = section.toSnapshot();
    expect(snapshot.key).toBe('nuestra-historia');
    expect(snapshot.title).toBe('Historia');
    expect(snapshot.subtitle).toBeNull();
    expect(snapshot.position).toBe(5);
    expect(snapshot.items.map((i) => [i.title, i.position])).toEqual([
      ['Inicio', 0],
      ['Hoy', 1],
    ]);
  });

  it('rechaza título vacío, clave inválida y URLs de imagen inseguras', () => {
    expect(() => factory.create({ page: 'home', key: 'ok-key', title: '   ' }, 0, now)).toThrow(ValidationError);
    expect(() => factory.create({ page: 'home', key: 'con espacios', title: 'X' }, 0, now)).toThrow(
      ValidationError,
    );
    expect(() =>
      factory.create({ page: 'home', key: 'x1', title: 'X', imageUrl: 'javascript:alert(1)' }, 0, now),
    ).toThrow(ValidationError);
  });

  it(`no permite más de ${Section.MAX_ITEMS} items`, () => {
    const section = factory.create({ page: 'home', key: 'muchos', title: 'X' }, 0, now);
    const items = Array.from({ length: Section.MAX_ITEMS + 1 }, (_, i) => ({ title: `Item ${i}` }));
    expect(() => section.replaceItems(items, () => 'nuevo', now)).toThrow(ValidationError);
  });

  it('conserva ids de items existentes y rechaza ids ajenos', () => {
    const section = factory.create({ page: 'home', key: 'fund', title: 'F', items: [{ title: 'Ana' }] }, 0, now);
    const [ana] = section.toSnapshot().items;
    section.replaceItems([{ title: 'Beto' }, { id: ana!.id, title: 'Ana María' }], () => 'nuevo-id', now);
    expect(section.toSnapshot().items).toMatchObject([
      { id: 'nuevo-id', title: 'Beto', position: 0 },
      { id: ana!.id, title: 'Ana María', position: 1 },
    ]);
    expect(() => section.replaceItems([{ id: 'otro', title: 'X' }], () => 'n', now)).toThrow(ValidationError);
  });

  it('las secciones estructurales no se pueden eliminar', () => {
    const hero = factory.create({ page: 'home', key: 'hero', title: 'Portada' }, 0, now);
    const extra = factory.create({ page: 'home', key: 'aliados', title: 'Aliados' }, 0, now);
    expect(() => hero.assertCanBeDeleted()).toThrow(BusinessRuleViolationError);
    expect(() => extra.assertCanBeDeleted()).not.toThrow();
  });
});
