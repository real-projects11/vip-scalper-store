import { useEffect, useState } from 'react';

export default function Admin() {
  const [token, setToken] = useState('');
  const [stats, setStats] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('admin_token') || '');
  }, []);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  async function load() {
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-token': token } });
      if (!res.ok) { setStats(null); return; }
      const data = await res.json();
      setStats(data);
      setPriceInput(String(data.price));
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

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '32px 20px', fontFamily: '-apple-system, Inter, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Panel</h1>

      <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 8 }}>ADMIN TOKEN</label>
      <input
        type="password"
        value={token}
        onChange={(e) => saveToken(e.target.value)}
        placeholder="Pegá tu ADMIN_TOKEN acá"
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #ddd', marginBottom: 28 }}
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
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1.5px solid #ddd' }}
            />
            <button
              onClick={savePrice}
              disabled={saving}
              style={{ padding: '0 18px', borderRadius: 10, border: 'none', background: '#111', color: '#fff', fontWeight: 700 }}
            >
              Guardar
            </button>
          </div>
          {msg && (
            <p style={{ fontSize: 12.5, marginTop: 10, color: msg.ok ? '#146B52' : '#B34A25' }}>{msg.text}</p>
          )}
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
