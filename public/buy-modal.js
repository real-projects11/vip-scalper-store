// Se engancha al botón con id="atc-btn" (o al que le pases) y abre un modal
// con el checkout: QR, wallet, polling, y al final el botón de descarga.
// Requiere la lib de qrcodejs cargada antes.

(function () {
  const API_BASE = ''; // si el backend está en otro dominio, poné la URL acá
  const WALLET_ADDRESS = 'TWgMxmdpLPcD3MZh7TJgecSpyEgARezJH9'; // igual a WALLET_ADDRESS del backend

  let pollInterval = null;
  let reservation = null;

  async function apiFetch(path, opts = {}) {
    const res = await fetch(API_BASE + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error de red');
    return data;
  }

  function fmt6(n) {
    return Number(n).toFixed(6);
  }

  function ensureOverlay() {
    let overlay = document.getElementById('buy-modal-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'buy-modal-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;' +
      'display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeModal() {
    if (pollInterval) clearInterval(pollInterval);
    const overlay = document.getElementById('buy-modal-overlay');
    if (overlay) overlay.remove();
  }

  function sheet(innerHtml) {
    return `
      <div style="background:#fff;border-radius:20px;padding:24px 22px;max-width:320px;width:100%;text-align:center;position:relative;font-family:'Inter',sans-serif;">
        <button id="buy-modal-close" style="position:absolute;top:12px;right:14px;border:none;background:none;font-size:18px;cursor:pointer;color:#999;">✕</button>
        ${innerHtml}
      </div>`;
  }

  async function openModal() {
    const overlay = ensureOverlay();
    overlay.innerHTML = sheet('<p>Generando tu pago...</p>');
    document.getElementById('buy-modal-close').addEventListener('click', closeModal);

    try {
      reservation = await apiFetch('/api/reserve', { method: 'POST' });
      renderCheckout();
      startPolling();
    } catch (err) {
      overlay.innerHTML = sheet(`<p>No se pudo iniciar la compra: ${err.message}</p>`);
      document.getElementById('buy-modal-close').addEventListener('click', closeModal);
    }
  }

  function renderCheckout() {
    const overlay = document.getElementById('buy-modal-overlay');
    overlay.innerHTML = sheet(`
      <div id="qr-container" style="width:170px;height:170px;margin:8px auto 14px;"></div>
      <div style="font-family:monospace;font-size:18px;font-weight:700;">$${fmt6(reservation.amount)} USDT</div>
      <div style="font-size:11px;color:#888;margin:6px 0 14px;">
        Enviá el monto EXACTO con los decimales, por la red TRC20 (Tron).
      </div>
      <div style="font-family:monospace;font-size:12px;word-break:break-all;background:#f5f5f5;padding:10px;border-radius:8px;">
        ${WALLET_ADDRESS}
      </div>
      <p id="checkout-status" style="font-size:12.5px;color:#888;margin-top:14px;">Esperando el pago...</p>
    `);
    document.getElementById('buy-modal-close').addEventListener('click', closeModal);

    new QRCode(document.getElementById('qr-container'), {
      text: `tron:${WALLET_ADDRESS}?amount=${fmt6(reservation.amount)}&token=USDT`,
      width: 170,
      height: 170,
    });
  }

  function startPolling() {
    pollInterval = setInterval(async () => {
      try {
        const result = await apiFetch(`/api/status/${reservation.reservationId}`);
        if (result.status === 'paid') {
          clearInterval(pollInterval);
          renderPaid(result.downloadToken);
        } else if (result.status === 'expired') {
          clearInterval(pollInterval);
          const overlay = document.getElementById('buy-modal-overlay');
          overlay.innerHTML = sheet('<p>El tiempo para pagar venció. Cerrá y volvé a intentar.</p>');
          document.getElementById('buy-modal-close').addEventListener('click', closeModal);
        }
      } catch (err) {
        // un fallo puntual de red no debería tirar todo el flujo abajo
      }
    }, 6000);
  }

  function renderPaid(downloadToken) {
    const overlay = document.getElementById('buy-modal-overlay');
    overlay.innerHTML = sheet(`
      <p style="font-weight:700;">¡Pago confirmado! 🎉</p>
      <a href="${API_BASE}/api/download/${downloadToken}"
         style="display:inline-block;margin-top:14px;padding:13px 22px;border-radius:40px;background:#111;color:#fff;font-weight:700;text-decoration:none;font-size:13px;">
        Descargar STL
      </a>
      <p style="font-size:11px;color:#888;margin-top:10px;">Este link vence en 1 hora.</p>
    `);
    document.getElementById('buy-modal-close').addEventListener('click', closeModal);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Contamos la visita apenas carga la página
    fetch(API_BASE + '/api/track-visit', { method: 'POST' }).catch(() => {});

    const btn = document.getElementById('atc-btn') || document.querySelector('.atc-btn');
    if (btn) btn.addEventListener('click', openModal);
  });
})();
