import { displayUrl } from './linkify';

export type ContactKind = 'email' | 'whatsapp' | 'phone' | 'web' | 'address' | 'text';

export interface ContactEntry {
  kind: ContactKind;
  label: string;
  value: string;
  href: string | null;
  external: boolean;
}

const EMAIL = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/;
const URL_LIKE = /^https?:\/\//i;
const PHONE = /^\+?[\d\s().-]{7,}$/;
const ADDRESS_LABEL = /direcci|oficina|ubicaci|sede|sitio de encuentro/i;

/**
 * Interpreta un dato de contacto escrito en el panel ("WhatsApp" / "320 730 5719") y le asigna
 * el enlace adecuado: mailto:, wa.me, tel:, la URL o una búsqueda en Google Maps.
 */
export function toContactEntry(label: string, rawValue: string | null): ContactEntry {
  const value = (rawValue ?? '').trim();
  const base = { label, value, external: false };

  if (EMAIL.test(value)) return { ...base, kind: 'email', href: `mailto:${value}` };
  if (URL_LIKE.test(value)) return { ...base, kind: 'web', value: displayUrl(value), href: value, external: true };

  const digits = value.replace(/\D/g, '');
  if (PHONE.test(value) && digits.length >= 7 && digits.length <= 15) {
    // Celulares colombianos (10 dígitos que empiezan por 3): se antepone el indicativo 57.
    const international = digits.length === 10 && digits.startsWith('3') ? `57${digits}` : digits;
    return /whatsapp/i.test(label)
      ? { ...base, kind: 'whatsapp', href: `https://wa.me/${international}`, external: true }
      : { ...base, kind: 'phone', href: `tel:+${international}` };
  }

  if (value && ADDRESS_LABEL.test(label)) {
    const query = encodeURIComponent(`${value}, Colombia`);
    return { ...base, kind: 'address', href: `https://www.google.com/maps/search/?api=1&query=${query}`, external: true };
  }
  return { ...base, kind: 'text', href: null };
}
