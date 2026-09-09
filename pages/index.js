import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, []);

  return (
    <>
      <Head>
        <title>Tienda</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100dvh', background: '#fff', fontFamily: "'Inter', sans-serif", padding: '40px 20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 32, color: '#111' }}>Nuestros productos</h1>

        {products === null && <p style={{ textAlign: 'center', color: '#999' }}>Cargando...</p>}
        {products && products.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Todavía no hay productos publicados.</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {products && products.map((p) => (
            <a
              key={p.slug}
              href={`/p/${p.slug}`}
              style={{ display: 'block', border: '1px solid #e5e5e5', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', color: '#111', transition: 'border-color .15s' }}
            >
              <div style={{ height: 160, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ color: '#555', fontSize: 12 }}>Sin imagen</span>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4, lineHeight: 1.3 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#666' }}>${p.price}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
