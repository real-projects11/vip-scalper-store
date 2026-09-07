import { useState } from 'react';

// Herramienta de un solo uso, sin terminal: pegás el ADMIN_TOKEN y tocás el
// botón. Como esta página vive en el mismo dominio que la API, no hay
// problemas de CORS ni hace falta curl/PowerShell/nada de eso.
//
// Una vez que uses el botón y el producto se haya creado, podés borrar este
// archivo (pages/admin-seed.js) junto con pages/api/admin/seed-vip-scalper.js
// — no hacen falta para el funcionamiento normal de la tienda.

export default function AdminSeed() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/seed-vip-scalper', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json().catch(() => ({}));
      setResult({ ok: res.ok, status: res.status, data });
    } catch (e) {
      setResult({ ok: false, status: 0, data: { error: 'No se pudo conectar con el servidor.' } });
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px', fontFamily: '-apple-system, Inter, sans-serif', color: '#111' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Precargar producto VIP Scalper</h1>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
        Herramienta de un solo uso. Pegá tu ADMIN_TOKEN y tocá el botón — no hace falta terminal ni comandos.
      </p>

      <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 6 }}>ADMIN TOKEN</label>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Pegá tu ADMIN_TOKEN acá"
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #ddd', marginBottom: 16, boxSizing: 'border-box' }}
      />

      <button
        onClick={run}
        disabled={loading || !token}
        style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: '#111', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading || !token ? 'default' : 'pointer', opacity: loading || !token ? 0.6 : 1 }}
      >
        {loading ? 'Cargando...' : 'Crear producto VIP Scalper'}
      </button>

      {result && (
        <div
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 10,
            background: result.ok ? '#EAF5F0' : '#FBEAE3',
            color: result.ok ? '#146B52' : '#B34A25',
            fontSize: 12.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {result.ok
            ? '✅ Listo — el producto se creó. Andá a /admin y refrescá (F5) para verlo.'
            : `❌ Error (status ${result.status}): ${result.data.error || 'desconocido'}`}
        </div>
      )}
    </div>
  );
}
