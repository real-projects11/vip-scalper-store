import { useEffect, useState } from 'react';
import Head from 'next/head';

const BRAND = 'ADVANCE';

// --- Paleta pensada para "herramientas digitales" (bots, archivos, plantillas):
// tinta azulada oscura + un acento bronce/dorado apagado — nada de verde cripto
// ni de la combinación clon "beige cálido + serif" que se ve en todos lados.
const CSS = `
  .home, .home *, .home *::before, .home *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .home {
    --ink: #12161c;
    --ink-soft: #1c222a;
    --paper: #f6f4ef;
    --line: #e6e2d8;
    --line-on-ink: rgba(246,244,239,0.16);
    --accent: #b08a4e;
    --muted: #726c5e;
    --muted-on-ink: rgba(246,244,239,0.6);
    font-family: 'Inter', sans-serif;
    background: var(--paper);
    color: var(--ink);
  }
  .home .display { font-family: 'Space Grotesk', 'Inter', sans-serif; }

  .home header {
    position: absolute; top: 0; left: 0; right: 0; z-index: 5;
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px clamp(20px, 5vw, 56px);
  }
  .home .brand { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 700; letter-spacing: -0.02em; color: #fff; }
  .home .brand sup { font-size: 10px; }

  .home .hero {
    position: relative; overflow: hidden;
    min-height: 86vh;
    display: flex; align-items: flex-end;
    background: var(--ink);
  }
  .home .hero-media { position: absolute; inset: 0; }
  .home .hero-media img { width: 100%; height: 100%; object-fit: cover; opacity: 0.5; }
  .home .hero-media .fallback { position: absolute; inset: 0; }
  .home .hero-scrim {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(18,22,28,0.35) 0%, rgba(18,22,28,0.55) 45%, rgba(18,22,28,0.96) 100%);
  }
  .home .hero-content {
    position: relative; z-index: 2; width: 100%;
    padding: 0 clamp(20px, 5vw, 56px) clamp(48px, 7vw, 84px);
  }
  .home .hero-eyebrow { font-size: 13px; color: var(--muted-on-ink); margin-bottom: 18px; max-width: 30ch; }
  .home .hero-title {
    font-size: clamp(34px, 5.4vw, 60px); font-weight: 600; line-height: 1.04;
    letter-spacing: -0.02em; color: #fff; max-width: 15ch; margin-bottom: 20px;
  }
  .home .hero-sub { font-size: 16px; line-height: 1.55; color: var(--muted-on-ink); max-width: 46ch; margin-bottom: 32px; }
  .home .hero-cta {
    display: inline-flex; align-items: center; gap: 10px;
    background: #fff; color: var(--ink); text-decoration: none;
    font-size: 13.5px; font-weight: 600; padding: 14px 22px; border-radius: 3px;
    transition: background-color .15s ease, transform .15s ease;
  }
  .home .hero-cta:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }
  .home .hero-cta svg { width: 14px; height: 14px; }

  .home .catalog { padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 56px) 100px; max-width: 1180px; margin: 0 auto; }
  .home .catalog-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 40px; border-bottom: 1px solid var(--line); padding-bottom: 24px; }
  .home .catalog-title { font-size: clamp(24px, 3vw, 32px); font-weight: 600; letter-spacing: -0.01em; }
  .home .catalog-count { font-size: 13.5px; color: var(--muted); white-space: nowrap; }

  .home .empty, .home .loading { padding: 60px 0; text-align: center; color: var(--muted); font-size: 14px; }

  .home .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .home .card {
    display: block; text-decoration: none; color: var(--ink); background: var(--paper);
    padding: 0 0 22px;
  }
  .home .card-media { aspect-ratio: 4 / 3; background: var(--ink); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 18px; }
  .home .card-media img { width: 100%; height: 100%; object-fit: contain; }
  .home .card-media .noimg { color: var(--muted-on-ink); font-size: 11.5px; }
  .home .card-body { padding: 0 22px; }
  .home .card-caption { font-size: 11.5px; color: var(--muted); margin-bottom: 6px; }
  .home .card-title {
    font-family: 'Space Grotesk', sans-serif; font-size: 16.5px; font-weight: 600;
    line-height: 1.3; margin-bottom: 12px; transition: color .15s ease;
  }
  .home .card:hover .card-title { color: var(--accent); }
  .home .card-row { display: flex; align-items: center; justify-content: space-between; }
  .home .card-price { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; color: var(--ink); }
  .home .card-arrow { font-size: 14px; color: var(--muted); opacity: 0; transform: translateX(-4px); transition: opacity .15s ease, transform .15s ease; }
  .home .card:hover .card-arrow { opacity: 1; transform: translateX(0); color: var(--accent); }

  .home footer { border-top: 1px solid var(--line); padding: 22px clamp(20px, 5vw, 56px); display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }

  @media (max-width: 640px) {
    .home .hero { min-height: 72vh; }
    .home .hero-title { max-width: 100%; }
  }
`;

function GaugePattern() {
  // Fondo de respaldo para el hero cuando todavía no hay ningún producto
  // con imagen — un motivo de arcos concéntricos, sobrio, sin ser genérico.
  return (
    <svg className="fallback" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="#12161c" />
      {[80, 160, 240, 320, 400, 480].map((r) => (
        <circle key={r} cx="640" cy="120" r={r} fill="none" stroke="#b08a4e" strokeOpacity="0.14" strokeWidth="1" />
      ))}
      <g stroke="#f6f4ef" strokeOpacity="0.05">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={i * 60} y1="0" x2={i * 60} y2="600" />
        ))}
      </g>
    </svg>
  );
}

export default function Home() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, []);

  const heroImage = products?.find((p) => p.images?.[0])?.images?.[0] || null;
  const count = products ? products.length : 0;

  return (
    <>
      <Head>
        <title>{BRAND}</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="home">
        <style>{CSS}</style>

        <header>
          <div className="brand">{BRAND}<sup>®</sup></div>
        </header>

        <section className="hero">
          <div className="hero-media">
            {heroImage ? <img src={heroImage} alt="" /> : <GaugePattern />}
            <div className="hero-scrim" />
          </div>
          <div className="hero-content">
            <div className="hero-eyebrow">Herramientas digitales para operar y trabajar mejor</div>
            <h1 className="display hero-title">Descargá lo que necesitás, al instante.</h1>
            <p className="hero-sub">
              Bots, plantillas y archivos digitales listos para usar. Pagás y recibís
              el acceso a la descarga en el momento, sin esperas ni intermediarios.
            </p>
            <a className="hero-cta" href="#catalogo">
              Ver catálogo
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            </a>
          </div>
        </section>

        <section className="catalog" id="catalogo">
          <div className="catalog-head">
            <h2 className="display catalog-title">Catálogo</h2>
            <span className="catalog-count">
              {products === null ? '' : count === 0 ? 'Sin productos por ahora' : count === 1 ? '1 producto disponible' : `${count} productos disponibles`}
            </span>
          </div>

          {products === null && <div className="loading">Cargando catálogo...</div>}
          {products && products.length === 0 && (
            <div className="empty">Todavía no publicamos productos — volvé pronto.</div>
          )}

          {products && products.length > 0 && (
            <div className="grid">
              {products.map((p) => (
                <a key={p.slug} className="card" href={`/p/${p.slug}`}>
                  <div className="card-media">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.title} /> : <span className="noimg">Sin imagen</span>}
                  </div>
                  <div className="card-body">
                    {p.reviewText && <div className="card-caption">{p.reviewText}</div>}
                    <div className="card-title">{p.title}</div>
                    <div className="card-row">
                      <span className="card-price">${p.price}</span>
                      <span className="card-arrow">Ver producto →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        <footer>
          <span>{BRAND}®</span>
          <span>Productos digitales — entrega inmediata</span>
        </footer>
      </div>
    </>
  );
}
