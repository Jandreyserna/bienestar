import { toContactEntry } from './contact';
import { displayUrl, linkify } from './linkify';

describe('linkify', () => {
  it('convierte URLs y correos en enlaces sin incluir la puntuación final', () => {
    const parts = linkify('Visita https://fundasemillas.org/representacion/. Escribe a info@bm.org, gracias');
    expect(parts.filter((p) => p.href).map((p) => p.href)).toEqual([
      'https://fundasemillas.org/representacion/',
      'mailto:info@bm.org',
    ]);
    expect(parts.map((p) => p.text).join('')).toContain('. Escribe a ');
  });

  it('deja el texto sin enlaces tal cual', () => {
    expect(linkify('Carrera 3 # 22-47')).toEqual([{ text: 'Carrera 3 # 22-47' }]);
  });

  it('muestra las URLs sin protocolo y permite cortar la línea solo después de "/"', () => {
    expect(displayUrl('https://www.fundasemillas.org/representacion/')).toBe('fundasemillas.org/​representacion');
  });
});

describe('datos de contacto', () => {
  it('reconoce correo, WhatsApp, teléfono, dirección, web y texto', () => {
    expect(toContactEntry('Correo', 'a@b.co')).toMatchObject({ kind: 'email', href: 'mailto:a@b.co' });
    expect(toContactEntry('WhatsApp', '320 730 5719')).toMatchObject({ kind: 'whatsapp', href: 'https://wa.me/573207305719' });
    expect(toContactEntry('Teléfono', '(606) 335 1234')).toMatchObject({ kind: 'phone', href: 'tel:+6063351234' });
    expect(toContactEntry('Dirección', 'Carrera 3 # 22-47, Pereira').href).toContain('google.com/maps');
    expect(toContactEntry('Web', 'https://fundasemillas.org/')).toMatchObject({ kind: 'web', external: true });
    expect(toContactEntry('Persona de contacto', 'Julio César Villamizar')).toMatchObject({ kind: 'text', href: null });
  });
});
