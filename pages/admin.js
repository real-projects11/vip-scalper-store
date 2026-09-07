import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const NAV_ITEMS = [
  { id: 'section-resumen', label: 'Resumen' },
  { id: 'section-productos', label: 'Productos' },
  { id: 'section-pendientes', label: 'Pagos pendientes' },
  { id: 'section-historial', label: 'Historial de ventas' },
];

export default function Admin() {
  const [token, setToken] = useState('');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [pending, setPending] = useState([]);
  const [sales, setSales] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [landingReady, setLandingReady] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('admin_token') || '');
    const savedSidebar = localStorage.getItem('admin_sidebar_open');
    if (savedSidebar !== null) setSidebarOpen(savedSidebar === '1');
  }, []);

  useEffect(() => {
    if (!token) return;
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [token]);

  async function load() {
    try {
      const [statsRes, productsRes, pendingRes, salesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'x-admin-token': token } }),
        fetch('/api/admin/products', { headers: { 'x-admin-token': token } }),
        fetch('/api/admin/pending', { headers: { 'x-admin-token': token } }),
        fetch('/api/admin/sales', { headers: { 'x-admin-token': token } }),
      ]);
      setStats(statsRes.ok ? await statsRes.json() : null);
      if (productsRes.ok) setProducts((await productsRes.json()).products || []);
      if (pendingRes.ok) setPending((await pendingRes.json()).pending || []);
      if (salesRes.ok) setSales((await salesRes.json()).sales || []);
    } catch (e) {
      setStats(null);
    }
  }

  function saveToken(v) {
    setToken(v);
    localStorage.setItem('admin_token', v);
  }

  function toggleSidebar() {
    setSidebarOpen((v) => {
      localStorage.setItem('admin_sidebar_open', v ? '0' : '1');
      return !v;
    });
  }

  function goTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function createProduct() {
    setMsg(null);
    try {
      const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'x-admin-token': token } });
      const data = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: data.error }); return; }
      setMsg({ ok: true, text: 'Producto nuevo creado — quedó en borrador, no se muestra hasta que lo actives.' });
      load();
    } catch (e) {
      setMsg({ ok: false, text: 'No se pudo conectar con el servidor' });
    }
  }

  async function confirmManual(reservationId) {
    if (!window.confirm('¿Confirmás que viste este pago llegar a la wallet? Esto libera la descarga.')) return;
    setBusyId(reservationId);
    try {
      const res = await fetch(`/api/admin/confirm/${reservationId}`, { method: 'POST', headers: { 'x-admin-token': token } });
      const data = await res.json();
      setMsg(res.ok ? { ok: true, text: 'Pago confirmado — descarga liberada.' } : { ok: false, text: data.error });
    } catch (e) {
      setMsg({ ok: false, text: 'No se pudo conectar con el servidor' });
    }
    setBusyId(null);
    load();
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('es-AR');
  }

  return (
    <>
      {/* Plantilla compartida de la landing de producto — la misma que usa el
          home de la tienda — para que el preview de acá abajo sea 100% fiel. */}
      <Script src="/product-landing.js" strategy="afterInteractive" onLoad={() => setLandingReady(true)} />

      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, Inter, sans-serif', color: '#111' }}>
        {/* --- Sidebar --- */}
        <aside
          style={{
            width: sidebarOpen ? 220 : 0,
            flexShrink: 0,
            overflow: 'hidden',
            borderRight: sidebarOpen ? '1px solid #eee' : 'none',
            background: '#fafafa',
            transition: 'width .18s ease',
          }}
        >
          <div style={{ width: 220, padding: '20px 16px' }}>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-.02em', marginBottom: 22 }}>
              PANEL<sup style={{ fontSize: 9 }}>®</sup>
            </div>
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                onClick={() => goTo(item.id)}
                style={{ padding: '10px 10px', fontSize: 13, fontWeight: 600, color: '#333', cursor: 'pointer', borderRadius: 8, marginBottom: 2 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#eee'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </aside>

        {/* --- Contenido principal --- */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #eee' }}>
            <button
              onClick={toggleSidebar}
              title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
              style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Panel</h1>
          </div>

          <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 60px' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 8 }}>ADMIN TOKEN</label>
            <input
              type="password"
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="Pegá tu ADMIN_TOKEN acá"
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #ddd', marginBottom: 28, boxSizing: 'border-box' }}
            />

            {!stats && token && <p style={{ color: '#999', fontSize: 13 }}>Cargando o token inválido...</p>}

            {stats && (
              <>
                <div id="section-resumen" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28, scrollMarginTop: 20 }}>
                  <StatBox label="Visitas" value={stats.visits} />
                  <StatBox label="Ventas" value={stats.sales} />
                  <StatBox label="Ingresos" value={`$${stats.revenue.toFixed(2)}`} />
                  <StatBox label="Conversión" value={stats.visits ? `${((stats.sales / stats.visits) * 100).toFixed(1)}%` : '—'} />
                </div>

                {msg && (
                  <p style={{ fontSize: 12.5, marginBottom: 20, color: msg.ok ? '#146B52' : '#B34A25' }}>{msg.text}</p>
                )}

                <div id="section-productos" style={{ scrollMarginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '28px 0 12px' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Productos ({products.length})</h2>
                    <button onClick={createProduct} style={{ padding: '8px 14px', borderRadius: 100, border: 'none', background: '#111', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                      + Nuevo producto
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p} token={token} onSaved={load} landingReady={landingReady} />
                    ))}
                  </div>
                </div>

                <div id="section-pendientes" style={{ scrollMarginTop: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, margin: '28px 0 12px' }}>
                    Pagos pendientes {pending.length > 0 && `(${pending.length})`}
                  </h2>
                  {pending.length === 0 && <p style={{ color: '#999', fontSize: 13.5 }}>No hay nada pendiente ahora mismo.</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {pending.map((p) => (
                      <div key={p.reservationId} style={{ background: '#fff', border: `1.5px solid ${p.buyerConfirmedAt ? '#E0B04D' : '#E2E4DE'}`, borderRadius: 14, padding: '14px 16px' }}>
                        {p.buyerConfirmedAt && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#A05A0C', marginBottom: 8 }}>
                            ✋ El comprador avisó "ya pagué" — {fmtDate(p.buyerConfirmedAt)}
                          </div>
                        )}
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#666' }}>{p.productName}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 700 }}>${p.amount.toFixed(6)} USDT</div>
                        <div style={{ fontSize: 12.5, color: '#666', marginTop: 4 }}>Contacto: {p.contact || '— no dejó contacto —'}</div>
                        <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>Reservado: {fmtDate(p.createdAt)}</div>
                        <button
                          onClick={() => confirmManual(p.reservationId)}
                          disabled={busyId === p.reservationId}
                          style={{ marginTop: 10, padding: '9px 14px', borderRadius: 100, fontWeight: 700, fontSize: 12.5, border: 'none', background: '#12664F', color: '#fff', cursor: 'pointer' }}
                        >
                          ✓ Confirmar manualmente
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="section-historial" style={{ scrollMarginTop: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, margin: '28px 0 12px' }}>Historial de compras</h2>
                  {sales.length === 0 && <p style={{ color: '#999', fontSize: 13.5 }}>Todavía no hay ventas confirmadas.</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sales.map((s) => (
                      <div key={s.reservationId} style={{ border: '1.5px solid #eee', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{s.productName} — ${s.price.toFixed(2)}</div>
                          <div style={{ fontSize: 11.5, color: '#888' }}>{s.contact || '— sin contacto —'}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 11.5, color: '#999' }}>
                          {fmtDate(s.paidAt)}<br />
                          {s.txId === 'manual-admin' ? 'confirmado a mano' : 'automático'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ border: '1.5px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

// Switch deslizante (gris → verde) para activar/desactivar un producto.
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      title={checked ? 'Desactivar' : 'Activar'}
      style={{
        width: 44,
        height: 26,
        borderRadius: 100,
        border: 'none',
        padding: 3,
        background: checked ? '#12664F' : '#ddd',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        transition: 'background .2s ease, justify-content .2s ease',
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
          display: 'block',
          transition: 'transform .2s ease',
        }}
      />
    </button>
  );
}

function ProductCard({ product, token, onSaved, landingReady }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [form, setForm] = useState(() => toFormState(product));
  const iframeRef = useRef(null);

  function toFormState(p) {
    return {
      name: p.name,
      shortDesc: p.shortDesc,
      price: String(p.price),
      images: p.images.join('\n'),
      description: p.description,
      benefits: p.benefits.join('\n'),
      requirements: p.requirements.join('\n'),
      chips: p.chips.join(', '),
      fileUrl: p.fileUrl,
    };
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function parsedBody() {
    return {
      name: form.name,
      shortDesc: form.shortDesc,
      price: Number(form.price) || 0,
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      description: form.description,
      benefits: form.benefits.split('\n').map((s) => s.trim()).filter(Boolean),
      requirements: form.requirements.split('\n').map((s) => s.trim()).filter(Boolean),
      chips: form.chips.split(',').map((s) => s.trim()).filter(Boolean),
      fileUrl: form.fileUrl,
    };
  }

  // Antes, si el guardado fallaba (token mal puesto, error del servidor, sin
  // conexión, etc.) esto quedaba en silencio y el botón "no hacía nada" a la
  // vista — por eso el toggle de activar parecía no funcionar. Ahora se
  // controla la respuesta del servidor y se muestra el error en la tarjeta.
  async function save(extra = {}) {
    setCardError(null);
    const body = { ...parsedBody(), ...extra };
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCardError(
          res.status === 401
            ? 'No autorizado — revisá que el ADMIN TOKEN de arriba sea igual al configurado en Vercel.'
            : (data.error || `No se pudo guardar (error ${res.status}).`)
        );
        return false;
      }
      onSaved();
      return true;
    } catch (e) {
      setCardError('No se pudo conectar con el servidor.');
      return false;
    }
  }

  async function handleSaveForm() {
    setSaving(true);
    await save();
    setSaving(false);
  }

  async function handleToggleActive(nextValue) {
    setTogglingActive(true);
    await save({ active: nextValue });
    setTogglingActive(false);
  }

  // Preview en vivo: se regenera con cada cambio del formulario, sin
  // esperar a que se guarde. Usa la misma plantilla que ve el comprador.
  useEffect(() => {
    if (!open) return;
    const iframe = iframeRef.current;
    if (!iframe || !landingReady || typeof window.buildProductLandingHTML !== 'function') return;
    const body = parsedBody();
    iframe.srcdoc = window.buildProductLandingHTML(
      { ...body, id: product.id, sold: product.sold },
      { mode: 'preview' }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form, landingReady]);

  const inputStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ddd', fontSize: 13, boxSizing: 'border-box', marginBottom: 10 };
  const labelStyle = { fontSize: 10.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.03em', display: 'block', marginBottom: 4 };

  return (
    <div style={{ border: `1.5px solid ${product.active ? '#12664F' : '#E2E4DE'}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{product.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            ${product.price} · {product.sold} vendidos · {product.active ? <span style={{ color: '#146B52' }}>Activo</span> : <span style={{ color: '#999' }}>Borrador</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <ToggleSwitch checked={product.active} onChange={handleToggleActive} disabled={togglingActive} />
          <button
            onClick={() => setOpen((o) => !o)}
            style={{ padding: '7px 12px', borderRadius: 100, border: 'none', background: '#111', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
          >
            {open ? 'Cerrar' : 'Editar'}
          </button>
        </div>
      </div>

      {cardError && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#B34A25', background: '#FBEAE3', padding: '8px 10px', borderRadius: 8 }}>
          ⚠️ {cardError}
        </div>
      )}

      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {/* --- Formulario --- */}
          <div style={{ flex: '1 1 280px', minWidth: 260 }}>
            <label style={labelStyle}>Nombre</label>
            <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} />

            <label style={labelStyle}>Descripción corta (para la card del home)</label>
            <input style={inputStyle} value={form.shortDesc} onChange={(e) => set('shortDesc', e.target.value)} />

            <label style={labelStyle}>Precio (USDT)</label>
            <input style={inputStyle} type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} />

            <label style={labelStyle}>Imágenes (una URL por línea)</label>
            <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.images} onChange={(e) => set('images', e.target.value)} />

            <label style={labelStyle}>Descripción larga</label>
            <textarea style={{ ...inputStyle, minHeight: 90 }} value={form.description} onChange={(e) => set('description', e.target.value)} />

            <label style={labelStyle}>Beneficios / checks (uno por línea)</label>
            <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.benefits} onChange={(e) => set('benefits', e.target.value)} />

            <label style={labelStyle}>Requisitos (uno por línea)</label>
            <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} />

            <label style={labelStyle}>Chips/etiquetas (separadas por coma)</label>
            <input style={inputStyle} value={form.chips} onChange={(e) => set('chips', e.target.value)} />

            <label style={labelStyle}>Link de descarga (Drive/Dropbox, con descarga directa)</label>
            <input style={inputStyle} value={form.fileUrl} onChange={(e) => set('fileUrl', e.target.value)} />

            <button
              onClick={handleSaveForm}
              disabled={saving}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#12664F', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 4 }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

          {/* --- Preview en vivo --- */}
          <div style={{ flex: '0 0 auto' }}>
            <div style={labelStyle}>Preview en vivo</div>
            <div style={{ width: 320, height: 640, border: '8px solid #111', borderRadius: 32, overflow: 'hidden', background: '#fff' }}>
              <iframe
                ref={iframeRef}
                title={`Preview de ${product.name}`}
                style={{ width: '100%', height: '100%', border: 0 }}
              />
            </div>
            {!landingReady && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>Cargando plantilla de preview...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
