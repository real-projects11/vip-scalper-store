import { useEffect, useState } from 'react';
import Head from 'next/head';

const BRAND = 'ADVANCE';

const NAV_LINKS = [
  { label: 'Inicio', href: '#top' },
  { label: 'Catálogo', href: '#catalogo' },
  { label: 'Contacto', href: '#contacto' },
];

// Categorías de filtro — placeholders para que los pills tengan el mismo
// look&feel que la referencia. Todavía NO filtran productos (no hay campo
// de categoría en /api/products): dejalo cableado a tu criterio real.
const FILTERS = ['Todos', 'Bots', 'Plantillas', 'Recursos'];

// --- Paleta pensada para "herramientas digitales" (bots, archivos, plantillas):
// tinta oscura casi negra + acento bronce/dorado — se mantiene la identidad
// ya elegida para ADVANCE en vez de copiar el naranja de la referencia.
const CSS = `
  .home, .home *, .home *::before, .home *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .home {
    --ink: #0d0f13;
    --panel: #15181d;
    --line: rgba(246,244,239,0.1);
    --text: #f6f4ef;
    --muted: rgba(246,244,239,0.56);
    --accent: #b08a4e;
    --accent-soft: rgba(176,138,78,0.16);
    --accent-2: #e3c489;
    font-family: 'Inter', sans-serif;
    background: var(--ink);
    color: var(--text);
  }
  .home .display { font-family: 'Space Grotesk', 'Inter', sans-serif; }

  .home header {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px clamp(20px, 5vw, 56px);
    background: rgba(13,15,19,0.86); backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .home .brand { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); text-decoration: none; }
  .home .brand sup { font-size: 10px; color: var(--accent); }

  .home .nav-desktop { display: flex; align-items: center; gap: 32px; }
  .home .nav-link { font-size: 13.5px; color: var(--muted); text-decoration: none; transition: color .15s ease; }
  .home .nav-link:hover { color: var(--text); }
  .home .nav-cta {
    background: var(--accent); color: #12161c; text-decoration: none;
    font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 999px;
    transition: background-color .15s ease;
  }
  .home .nav-cta:hover { background: var(--accent-2); }

  .home .nav-toggle {
    display: none; width: 38px; height: 38px; border-radius: 8px;
    border: 1px solid var(--line); background: transparent; color: var(--text);
    align-items: center; justify-content: center; cursor: pointer;
  }
  .home .nav-mobile {
    display: none; flex-direction: column; gap: 4px;
    padding: 8px clamp(20px, 5vw, 56px) 18px; background: var(--ink);
    border-bottom: 1px solid var(--line);
  }
  .home .nav-mobile.open { display: flex; }
  .home .nav-mobile a { padding: 10px 0; font-size: 14.5px; color: var(--muted); text-decoration: none; border-bottom: 1px solid var(--line); }
  .home .nav-mobile a:last-child { border-bottom: none; }

  .home .intro { padding: clamp(56px, 9vw, 108px) clamp(20px, 5vw, 56px) clamp(32px, 5vw, 48px); max-width: 1180px; margin: 0 auto; }
  .home .intro-eyebrow { font-size: 13px; color: var(--muted); margin-bottom: 18px; max-width: 32ch; }
  .home .intro-title { font-size: clamp(36px, 6vw, 64px); font-weight: 600; line-height: 1.03; letter-spacing: -0.02em; max-width: 16ch; margin-bottom: 20px; }
  .home .intro-sub { font-size: 16px; line-height: 1.55; color: var(--muted); max-width: 50ch; margin-bottom: 32px; }

  .home .filters { display: flex; flex-wrap: wrap; gap: 10px; }
  .home .filter-pill {
    border: 1px solid var(--line); background: var(--panel); color: var(--muted);
    font-size: 13px; font-weight: 500; padding: 9px 18px; border-radius: 999px;
    cursor: pointer; transition: background-color .15s ease, color .15s ease, border-color .15s ease;
  }
  .home .filter-pill:hover { color: var(--text); }
  .home .filter-pill.active { background: var(--accent); border-color: var(--accent); color: #12161c; }

  .home .catalog { padding: 0 clamp(20px, 5vw, 56px) clamp(72px, 9vw, 104px); max-width: 1180px; margin: 0 auto; }
  .home .catalog-count { font-size: 13px; color: var(--muted); margin-bottom: 24px; }

  .home .empty, .home .loading { padding: 60px 0; text-align: center; color: var(--muted); font-size: 14px; }

  .home .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 32px 28px; }
  .home .card { display: block; text-decoration: none; color: var(--text); }
  .home .card-media { position: relative; aspect-ratio: 4 / 3; border-radius: 14px; background: var(--panel); overflow: hidden; margin-bottom: 16px; }
  .home .card-media img { width: 100%; height: 100%; object-fit: cover; }
  .home .card-media .noimg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 11.5px; }
  .home .card-badge {
    position: absolute; left: 12px; bottom: 12px; background: rgba(13,15,19,0.82);
    color: var(--text); font-size: 11px; font-weight: 600; padding: 6px 12px; border-radius: 999px;
  }
  .home .card-title { font-family: 'Space Grotesk', sans-serif; font-size: 16.5px; font-weight: 600; line-height: 1.3; margin-bottom: 10px; transition: color .15s ease; }
  .home .card:hover .card-title { color: var(--accent-2); }
  .home .card-row { display: flex; align-items: center; justify-content: space-between; }
  .home .card-price { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; }
  .home .card-arrow { font-size: 13px; color: var(--muted); opacity: 0; transform: translateX(-4px); transition: opacity .15s ease, transform .15s ease; }
  .home .card:hover .card-arrow { opacity: 1; transform: translateX(0); color: var(--accent-2); }

  .home footer { position: relative; overflow: hidden; padding-top: clamp(48px, 7vw, 80px); background: linear-gradient(180deg, rgba(176,138,78,0.14) 0%, rgba(13,15,19,0) 38%); }
  .home .footer-cols {
    position: relative; z-index: 2; max-width: 1180px; margin: 0 auto;
    padding: 0 clamp(20px, 5vw, 56px) clamp(40px, 6vw, 56px);
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px;
    border-bottom: 1px solid var(--line);
  }
  .home .footer-col h4 { font-size: 12.5px; color: var(--muted); margin-bottom: 14px; font-weight: 500; }
  .home .footer-col a { display: block; font-size: 13.5px; color: var(--text); text-decoration: none; margin-bottom: 10px; opacity: 0.85; }
  .home .footer-col a:hover { opacity: 1; }
  .home .socials { display: flex; gap: 10px; }
  .home .socials a {
    width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line);
    display: flex; align-items: center; justify-content: center; margin-bottom: 0;
  }
  .home .newsletter-copy { font-size: 13.5px; color: var(--muted); margin-bottom: 14px; line-height: 1.4; }
  .home .newsletter-form { display: flex; gap: 8px; }
  .home .newsletter-form input {
    flex: 1; min-width: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 8px;
    padding: 10px 12px; color: var(--text); font-size: 13px;
  }
  .home .newsletter-form button {
    background: var(--accent); color: #12161c; border: none; border-radius: 8px;
    padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
  }

  .home .wordmark-wrap { position: relative; height: clamp(90px, 16vw, 180px); overflow: hidden; }
  .home .wordmark {
    position: absolute; left: clamp(20px, 5vw, 56px); top: 0;
    font-family: 'Space Grotesk', sans-serif; font-weight: 700;
    font-size: clamp(90px, 16vw, 220px); line-height: 1;
    background: linear-gradient(180deg, var(--accent-2) 0%, rgba(227,196,137,0.08) 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    white-space: nowrap;
  }

  @media (max-width: 860px) {
    .home .nav-desktop { display: none; }
    .home .nav-toggle { display: inline-flex; }
    .home .footer-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
`;

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M18.9 2h3.3l-7.2 8.2L23.4 22h-6.6l-5.2-6.8L5.6 22H2.3l7.7-8.8L1.6 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 4H5.5l12.2 16Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M21.9 3.3 2.7 10.8c-1.2.5-1.2 1.2-.2 1.5l4.9 1.5 1.9 5.8c.2.6.4.9.9.9.5 0 .7-.2 1-.5l2.4-2.3 4.9 3.6c.9.5 1.5.2 1.8-.8L23.9 4.5c.4-1.2-.4-1.7-1.9-1.2ZM8.8 14.4l-1.6-5 10.6-6.6-9 11.6Z" />
    </svg>
  );
}

export default function Home() {
  const [products, setProducts] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, []);

  const count = products ? products.length : 0;

  return (
    <>
      <Head>
        <title>{BRAND}</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="home" id="top">
        <style>{CSS}</style>

        <header>
          <a className="brand" href="#top">{BRAND}<sup>®</sup></a>

          <nav className="nav-desktop">
            {NAV_LINKS.map((l) => (
              <a key={l.href} className="nav-link" href={l.href}>{l.label}</a>
            ))}
            <a className="nav-cta" href="#catalogo">Ver catálogo</a>
          </nav>

          <button className="nav-toggle" aria-label="Abrir menú" onClick={() => setNavOpen((v) => !v)}>
            <MenuIcon />
          </button>
        </header>

        <nav className={`nav-mobile${navOpen ? ' open' : ''}`}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setNavOpen(false)}>{l.label}</a>
          ))}
        </nav>

        <section className="intro">
          <div className="intro-eyebrow">Herramientas digitales para operar y trabajar mejor</div>
          <h1 className="display intro-title">Descargá lo que necesitás, al instante.</h1>
          <p className="intro-sub">
            Bots, plantillas y archivos digitales listos para usar. Pagás y recibís
            el acceso a la descarga en el momento, sin esperas ni intermediarios.
          </p>
          <div className="filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill${activeFilter === f ? ' active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        <section className="catalog" id="catalogo">
          <div className="catalog-count">
            {products === null ? '' : count === 0 ? 'Sin productos por ahora' : count === 1 ? '1 producto disponible' : `${count} productos disponibles`}
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
                    <span className="card-badge">{p.reviewText || 'Digital'}</span>
                  </div>
                  <div className="card-title">{p.title}</div>
                  <div className="card-row">
                    <span className="card-price">${p.price}</span>
                    <span className="card-arrow">Ver producto <ChevronIcon /></span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        <footer id="contacto">
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Enlaces</h4>
              {NAV_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Términos de uso</a>
              <a href="#">Política de privacidad</a>
            </div>
            <div className="footer-col">
              <h4>Seguinos</h4>
              <div className="socials">
                <a href="#" aria-label="X"><XIcon /></a>
                <a href="#" aria-label="Telegram"><TelegramIcon /></a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Novedades</h4>
              <p className="newsletter-copy">Enterate cuando suba un producto nuevo.</p>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="tu@email.com" />
                <button type="submit">Sumarme</button>
              </form>
            </div>
          </div>
          <div className="wordmark-wrap">
            <div className="display wordmark">{BRAND}</div>
          </div>
        </footer>
      </div>
    </>
  );
}
