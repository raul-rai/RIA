/**
 * Agenda da sessao estrategica.
 *
 * O provedor vive atras desta funcao e da URL em config.ts. Trocar Cal.com por
 * Google Appointment Schedule toca este arquivo e o .env — nada mais. O embed e
 * um iframe puro de proposito: uma dependencia de npm para montar um iframe
 * seria peso sem retorno.
 */

export interface BookingPrefill {
  name: string;
  email: string;
  /** Contexto que o Raul le antes da chamada — ex.: as frentes descobertas. */
  notes?: string;
}

export function buildBookingUrl(base: string, prefill: BookingPrefill): string {
  if (!base) return '';

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return '';
  }

  url.searchParams.set('embed', 'true');
  url.searchParams.set('name', prefill.name);
  url.searchParams.set('email', prefill.email);
  if (prefill.notes) url.searchParams.set('notes', prefill.notes);

  return url.toString();
}
