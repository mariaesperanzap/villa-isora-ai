const CANONICAL_SITE_URL = 'https://villa-isora.com';

function normaliseUrl(value: string | undefined) {
  const candidate = value?.trim() || CANONICAL_SITE_URL;
  try {
    return new URL(candidate).origin;
  } catch {
    return CANONICAL_SITE_URL;
  }
}

export const siteConfig = {
  name: 'Villa Isora',
  title: 'Villa Isora | Villa con piscina en Playa Negra, Puerto Viejo',
  description:
    'Villa privada con piscina para hasta 5 huéspedes en Playa Negra, cerca de Puerto Viejo, Limón. Dos dormitorios, cocina, wifi y aparcamiento.',
  url: normaliseUrl(process.env.NEXT_PUBLIC_SITE_URL),
  bookingUrl: 'https://www.airbnb.com/rooms/1736319594283430921',
};
