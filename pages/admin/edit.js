import { useEffect, useState } from 'react';
import ProductLanding from '../../components/ProductLanding';
import { DEFAULT_CONTENT } from '../../lib/product-content';

export default function EditProduct() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('admin_token') || '');
  }, []);

  useEffect(() => {
    fetch('/api/product-content')
      .then((r) => r.json())
      .then((d) => setContent(d.content || DEFAULT_CONTENT))
      .catch(() => setContent(DEFAULT_CONTENT));
  }, []);

  function saveTokenInput(v) {
    setToken(v);
    localStorage.setItem('admin_token', v);
  }

  async function guardar() {
    setStatus('Guardando...');
    try {
      const res = await fetch('/api/product-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(content),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus(res.status === 401 ? '⚠️ Token inválido' : `⚠️ ${data.error || 'Error al guardar'}`);
        return;
      }
      setStatus('✓ Guardado');
      setTimeout(() => setStatus(''), 2000);
    } catch {
      setStatus('⚠️ No se pudo conectar');
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f4f4f4', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#111', color: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 14 }}>Editor de la landing</strong>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            value={token}
            onChange={(e) => saveTokenInput(e.target.value)}
            placeholder="ADMIN TOKEN"
            type={showToken ? 'text' : 'password'}
            style={{ padding: '6px 34px 6px 10px', borderRadius: 6, border: 'none', fontSize: 12, width: 220 }}
          />
          <button
            type="button"
            onClick={() => setShowToken((s) => !s)}
            title={showToken ? 'Ocultar' : 'Mostrar'}
            style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            {showToken ? (
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#666" fill="none" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#666" fill="none" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /><line x1="3" y1="3" x2="21" y2="21" /></svg>
            )}
          </button>
        </div>
        <button
          onClick={guardar}
          disabled={!content}
          style={{ padding: '7px 16px', borderRadius: 100, border: 'none', background: '#12664F', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          Guardar cambios
        </button>
        {status && <span style={{ fontSize: 12 }}>{status}</span>}
        <a href="/admin" style={{ color: '#aaa', fontSize: 12, marginLeft: 'auto' }}>← Volver al panel</a>
      </div>

      <p style={{ textAlign: 'center', color: '#888', fontSize: 12, margin: '14px 0 0' }}>
        Tocá cualquier texto para editarlo, el ícono de cada chip/badge para cambiarlo,
        las estrellas para poner la cantidad, el cartel amarillo para cambiarle el color, y el botón para editar su texto y el link de descarga.
      </p>

      <div style={{ padding: '20px 0 60px', display: 'flex', justifyContent: 'center' }}>
        {content && <ProductLanding content={content} editable onChange={setContent} />}
      </div>
    </div>
  );
}
