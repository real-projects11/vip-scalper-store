import { useEffect, useState } from 'react';

export default function Admin() {
  const [token, setToken] = useState('');
  const [stats, setStats] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [pending, setPending] = useState([]);
  const [sales, setSales] = useState([]);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem('admin_token') || '');
  }, []);

  useEffect(() => {
    if (!token) return;
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [token]);

  async function load() {
    try {
      const [statsRes, pendingRes, salesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'x-admin-token': token } }),
        fetch('/api/admin/pending', { headers: { 'x-admin-token': token } }),
        fetch('/api/admin/sales', { headers: { 'x-admin-token': token } }),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
        setPriceInput(String(data.price));
      } else {
        setStats(null);
      }
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

  async function savePrice() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/set-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ price: Number(priceInput) }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: data.error }); }
      else { setMsg({ ok: true, text: `Precio actualizado a $${data.price}` }); load(); }
    } catch (e) {
      setMsg({ ok: false, text: 'No se pudo conectar con el servidor' });
    }
    setSaving(false);
  }

  async function confirmManual(reservationId) {
    if (!window.confirm('¿Confirmás que viste este pago llegar a la wallet? Esto libera la descarga.')) return;
    setBusyId(reservationId);
    try {
      const res = await fetch(`/api/admin/confirm/${reservationId}`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (!res.ok) setMsg({ ok: false, text: data.error });
      else setMsg({ ok: true, text: 'Pago confirmado — descarga liberada.' });
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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 60px', fontFamily: '-apple-system, Inter, sans-serif', color: '#111' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Panel — VIP Scalper</h1>

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
            <StatBox label="Visitas" value={stats.visits} />
            <StatBox label="Ventas" value={stats.sales} />
            <StatBox label="Ingresos" value={`$${stats.revenue.toFixed(2)}`} />
            <StatBox label="Conversión" value={stats.visits ? `${((stats.sales / stats.visits) * 100).toFixed(1)}%` : '—'} />
          </div>

          <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 8 }}>PRECIO (USDT)</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: msg ? 10 : 32 }}>
            <input
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1.5px solid #ddd', boxSizing: 'border-box' }}
            />
            <button
              onClick={savePrice}
              disabled={saving}
              style={{ padding: '0 18px', borderRadius: 10, border: 'none', background: '#111', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Guardar
            </button>
          </div>
          {msg && <p style={{ fontSize: 12.5, marginBottom: 24, color: msg.ok ? '#146B52' : '#B34A25' }}>{msg.text}</p>}

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
                <div style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 700 }}>${p.amount.toFixed(6)} USDT</div>
                <div style={{ fontSize: 12.5, color: '#666', marginTop: 4 }}>
                  Contacto: {p.contact || '— no dejó contacto —'}
                </div>
                <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>
                  Reservado: {fmtDate(p.createdAt)}
                </div>
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

          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '28px 0 12px' }}>Historial de compras</h2>
          {sales.length === 0 && <p style={{ color: '#999', fontSize: 13.5 }}>Todavía no hay ventas confirmadas.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sales.map((s) => (
              <div key={s.reservationId} style={{ border: '1.5px solid #eee', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>${s.price.toFixed(2)}</div>
                  <div style={{ fontSize: 11.5, color: '#888' }}>{s.contact || '— sin contacto —'}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11.5, color: '#999' }}>
                  {fmtDate(s.paidAt)}<br />
                  {s.txId === 'manual-admin' ? 'confirmado a mano' : 'automático'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
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
