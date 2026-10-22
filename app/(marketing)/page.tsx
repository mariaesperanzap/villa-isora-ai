import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/core/config/site';

const highlights = [
  {
    eyebrow: 'Privacidad',
    title: 'Tu propio refugio',
    body: 'Una villa independiente, rodeada de vegetación y pensada para bajar el ritmo.',
  },
  {
    eyebrow: 'Exterior',
    title: 'Piscina entre el verde',
    body: 'El corazón de la casa: un espacio privado para descansar a cualquier hora del día.',
  },
  {
    eyebrow: 'Caribe Sur',
    title: 'Naturaleza muy cerca',
    body: 'Un punto de partida tranquilo para descubrir Puerto Viejo y su entorno tropical.',
  },
];

export default function LandingPage() {
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'VacationRental', name: 'Villa Isora',
    description: siteConfig.description, url: siteConfig.url,
    image: [`${siteConfig.url}/media/villa-isora-hero-poster.jpg`, `${siteConfig.url}/media/villa-isora-pool.jpg`],
    address: { '@type': 'PostalAddress', addressLocality: 'Playa Negra', addressRegion: 'Limón', addressCountry: 'CR' },
    occupancy: { '@type': 'QuantitativeValue', maxValue: 5 }, numberOfBedrooms: 2,
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Piscina privada', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Wifi', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Cocina', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Aparcamiento gratuito', value: true },
    ],
    sameAs: [siteConfig.bookingUrl],
  };

  return (
    <main className="villa-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
      }} />
      <section className="villa-hero" aria-labelledby="villa-title">
        <video
          className="villa-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/media/villa-isora-hero-poster.jpg"
          aria-hidden="true"
        >
          <source
            src="/media/villa-isora-hero-mobile.mp4"
            media="(max-width: 767px)"
            type="video/mp4"
          />
          <source src="/media/villa-isora-hero-desktop.mp4" type="video/mp4" />
        </video>
        <div className="villa-hero-shade" />

        <nav className="villa-nav" aria-label="Navegación principal">
          <a href="#inicio" className="villa-wordmark" aria-label="Villa Isora, inicio">
            <span>Villa</span>
            <span>Isora</span>
          </a>
          <div className="villa-nav-links">
            <a href="#villa">La villa</a>
            <a href="#entorno">El entorno</a>
            <a href="#reservar" className="villa-nav-cta">Reservar</a>
          </div>
        </nav>

        <div id="inicio" className="villa-hero-content">
          <p className="villa-kicker">Puerto Viejo · Costa Rica</p>
          <h1 id="villa-title">Un refugio privado en el corazón del Caribe.</h1>
          <p className="villa-hero-copy">
            Naturaleza, calma y una piscina solo para ti. Descubre Villa Isora desde una
            perspectiva diferente.
          </p>
          <a href="#reservar" className="villa-primary-action">
            Consultar disponibilidad
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="villa-scroll-cue" aria-hidden="true">
          <span />
          Explora
        </div>
      </section>

      <section id="villa" className="villa-intro">
        <div>
          <p className="villa-section-label">Villa Isora</p>
          <h2>El lujo de tener espacio para desconectar.</h2>
        </div>
        <p>
          Una estancia sencilla y luminosa donde el interior se abre al jardín. Aquí los días
          empiezan sin prisa, continúan junto a la piscina y terminan con los sonidos del bosque.
        </p>
      </section>

      <section className="villa-facts" aria-label="Características principales">
        <p><strong>Hasta 5</strong><span>huéspedes</span></p>
        <p><strong>2</strong><span>dormitorios</span></p>
        <p><strong>Privada</strong><span>piscina y villa completa</span></p>
        <p><strong>Playa Negra</strong><span>Limón, Costa Rica</span></p>
      </section>

      <section className="villa-gallery" aria-label="Imágenes de Villa Isora">
        <figure className="villa-gallery-main">
          <Image
            src="/media/villa-isora-pool.jpg"
            alt="Piscina privada y jardín de Villa Isora"
            fill
            sizes="(max-width: 900px) 100vw, 66vw"
            priority
          />
        </figure>
        <figure className="villa-gallery-side">
          <Image
            src="/media/villa-isora-living.jpg"
            alt="Salón luminoso con vistas a la piscina"
            fill
            sizes="(max-width: 900px) 100vw, 34vw"
          />
        </figure>
      </section>

      <section id="entorno" className="villa-highlights">
        {highlights.map((highlight, index) => (
          <article key={highlight.title}>
            <span className="villa-highlight-number">0{index + 1}</span>
            <p className="villa-section-label">{highlight.eyebrow}</p>
            <h3>{highlight.title}</h3>
            <p>{highlight.body}</p>
          </article>
        ))}
      </section>

      <section className="villa-seo-copy" aria-labelledby="villa-location-title">
        <div>
          <p className="villa-section-label">Playa Negra · Puerto Viejo</p>
          <h2 id="villa-location-title">Una villa con piscina para vivir el Caribe Sur a tu ritmo.</h2>
        </div>
        <div>
          <p>Villa Isora es una casa completa en Playa Negra, Limón, preparada para alojar hasta cinco personas. Dispone de dos dormitorios, cocina, wifi, aparcamiento y piscina privada: una base tranquila para disfrutar de Puerto Viejo y la costa caribeña.</p>
          <p>La entrada autónoma facilita la llegada y permite empezar la estancia sin prisas. Consulta las fechas disponibles y el precio exacto para tu viaje antes de reservar.</p>
        </div>
      </section>

      <section className="villa-faq" aria-labelledby="villa-faq-title">
        <div>
          <p className="villa-section-label">Preguntas frecuentes</p>
          <h2 id="villa-faq-title">Antes de tu estancia</h2>
        </div>
        <div className="villa-faq-list">
          <details><summary>¿Cuántas personas pueden alojarse?</summary><p>Villa Isora admite hasta cinco huéspedes y cuenta con dos dormitorios y tres camas.</p></details>
          <details><summary>¿La piscina es privada?</summary><p>Sí. La piscina forma parte de la villa completa y es de uso privado durante la estancia.</p></details>
          <details><summary>¿Dónde está Villa Isora?</summary><p>La villa se encuentra en Playa Negra, en la provincia de Limón, cerca de Puerto Viejo de Talamanca.</p></details>
          <details><summary>¿Cómo consulto disponibilidad y precio?</summary><p>Selecciona tus fechas y número de huéspedes en el enlace de reserva para ver disponibilidad y precio actualizados.</p></details>
        </div>
      </section>

      <section id="reservar" className="villa-closing">
        <p className="villa-section-label">Prepara tu estancia</p>
        <h2>Consulta tus fechas para Villa Isora.</h2>
        <p className="villa-closing-copy">Comprueba disponibilidad, precio y condiciones para el número de huéspedes de tu viaje.</p>
        <a href={siteConfig.bookingUrl} target="_blank" rel="noreferrer" className="villa-primary-action villa-primary-action-dark">
          Consultar disponibilidad
          <span aria-hidden="true">→</span>
        </a>
      </section>

      <footer className="villa-footer">
        <a href="#inicio" className="villa-wordmark">
          <span>Villa</span>
          <span>Isora</span>
        </a>
        <p className="villa-footer-links">
          <Link href="/sign-in">Gestión</Link>
          <a href="https://repull.dev" target="_blank" rel="noreferrer">Powered by Repull</a>
        </p>
        <p>© {new Date().getFullYear()} Villa Isora</p>
      </footer>
    </main>
  );
}
