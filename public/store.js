// Home de la tienda: carga los productos activos, arma las cards, maneja el
// menú hamburguesa, el modal de detalle, y todo el flujo de compra.

(function () {
  const API_BASE = ''; // si el backend está en otro dominio, poné la URL acá
  const WALLET_ADDRESS = 'TWgMxmdpLPcD3MZh7TJgecSpyEgARezJH9'; // igual a WALLET_ADDRESS del backend
  const SUPPORT_EMAIL = 'advancetrading.info@gmail.com';

  let products = [];
  let selectedProduct = null;
  let reservation = null;
  let contactEmail = '';
  let pollInterval = null;
  let timerInterval = null;

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
  function fmtTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Carga y render de productos en el home
  // ---------------------------------------------------------------------

  async function loadProducts() {
    try {
      const data = await apiFetch('/api/products');
      products = data.products || [];
      renderProductList();
      renderMenuProductLinks();
    } catch (err) {
      document.getElementById('loading-msg').textContent = 'No se pudieron cargar los productos.';
    }
  }

  function renderProductList() {
    const area = document.getElementById('scroll-area');
    if (products.length === 0) {
      area.innerHTML = '<div class="empty-msg">Todavía no hay productos disponibles.</div>';
      return;
    }
    area.innerHTML = products.map((p, i) => `
      <div class="p-card" data-idx="${i}">
        <img src="${esc((p.images && p.images[0]) || '')}" alt="${esc(p.name)}" onerror="this.style.display='none'">
        <div class="p-card-body">
          <div class="p-card-name">${esc(p.name)}</div>
          <div class="p-card-desc">${esc(p.shortDesc)}</div>
          <div class="p-card-row">
            <div>
              <div class="p-card-price">$${p.price}</div>
              ${p.sold > 0 ? `<div class="p-card-sold">${p.sold} vendidos</div>` : ''}
            </div>
            <button class="p-card-btn">Ver más</button>
          </div>
        </div>
      </div>
    `).join('');

    area.querySelectorAll('.p-card').forEach((card) => {
      card.addEventListener('click', () => openProductDetail(products[Number(card.dataset.idx)]));
    });
  }

  function renderMenuProductLinks() {
    const el = document.getElementById('menu-products');
    el.innerHTML = products.map((p, i) => `<div class="menu-item" data-idx="${i}">${esc(p.name)}</div>`).join('');
    el.querySelectorAll('.menu-item').forEach((item) => {
      item.addEventListener('click', () => {
        closeMenu();
        openProductDetail(products[Number(item.dataset.idx)]);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Menú hamburguesa
  // ---------------------------------------------------------------------

  function openMenu() {
    document.getElementById('side-menu').classList.add('open');
    document.getElementById('menu-overlay').classList.add('open');
  }
  function closeMenu() {
    document.getElementById('side-menu').classList.remove('open');
    document.getElementById('menu-overlay').classList.remove('open');
  }

  // ---------------------------------------------------------------------
  // Modal genérico (overlay reutilizado para detalle y para el checkout)
  // ---------------------------------------------------------------------

  function ensureOverlay() {
    let overlay = document.getElementById('buy-modal-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'buy-modal-overlay';
    overlay.style.cssText =
      'position:absolute;inset:0;background:rgba(0,0,0,.65);z-index:60;' +
      'display:flex;align-items:center;justify-content:center;padding:20px;' +
      'font-family:-apple-system,Inter,sans-serif;overflow-y:auto;';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.getElementById('phone').appendChild(overlay);
    return overlay;
  }

  function closeModal() {
    if (pollInterval) clearInterval(pollInterval);
    if (timerInterval) clearInterval(timerInterval);
    const overlay = document.getElementById('buy-modal-overlay');
    if (overlay) overlay.remove();
  }

  function sheet(innerHtml) {
    return `
      <div style="background:#0d0d0d;border:1px solid #262626;border-radius:20px;padding:26px 22px;max-width:300px;width:100%;text-align:center;position:relative;color:#fff;max-height:90%;overflow-y:auto;">
        <button id="buy-modal-close" style="position:absolute;top:14px;right:16px;border:none;background:none;font-size:18px;cursor:pointer;color:#666;">✕</button>
        ${innerHtml}
      </div>`;
  }
  function bindClose() {
    document.getElementById('buy-modal-close').addEventListener('click', closeModal);
  }
  function supportLink() {
    return `<a href="mailto:${SUPPORT_EMAIL}" style="color:#e0b04d;font-size:11.5px;text-decoration:none;">✉️ ¿Necesitás ayuda? Escribinos</a>`;
  }

  // ---------------------------------------------------------------------
  // Paso 0: detalle del producto
  // ---------------------------------------------------------------------

  // Muestra la landing rica del producto (galería, badges, beneficios, etc.)
  // dentro de un <iframe>, reemplazando la lista de productos en el mismo
  // contenedor. La plantilla vive en /product-landing.js (compartida con el
  // preview del panel de admin) para que ambas vistas sean siempre idénticas.
  function openProductDetail(product) {
    selectedProduct = product;
    const area = document.getElementById('scroll-area');
    area.classList.add('no-scroll');
    area.innerHTML = `
      <button class="back-to-list-btn" id="back-to-list-btn">← Volver</button>
      <iframe class="product-landing-frame" id="product-landing-frame" title="${esc(product.name)}"></iframe>
    `;
    const iframe = document.getElementById('product-landing-frame');
    if (typeof window.buildProductLandingHTML === 'function') {
      iframe.srcdoc = window.buildProductLandingHTML(product, { mode: 'live' });
    }
    document.getElementById('back-to-list-btn').addEventListener('click', () => {
      area.classList.remove('no-scroll');
      renderProductList();
    });
  }

  // El botón "Comprar ahora" vive DENTRO del iframe de la landing, así que
  // nos avisa por postMessage en vez de un click handler directo.
  window.addEventListener('message', (event) => {
    if (event && event.data && event.data.type === 'vip-store:buy' && selectedProduct) {
      openTermsStep();
    }
  });

  // ---------------------------------------------------------------------
  // Paso 1: términos y condiciones
  // ---------------------------------------------------------------------

  function openTermsStep() {
    const overlay = document.getElementById('buy-modal-overlay');
    overlay.innerHTML = sheet(`
      <div style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px;">
        Antes de continuar
      </div>
      <p style="font-size:12.5px;color:#ccc;line-height:1.6;text-align:left;margin-bottom:16px;">
        Al continuar aceptás que:
      </p>
      <ul style="font-size:12px;color:#aaa;line-height:1.7;text-align:left;margin:0 0 18px;padding-left:18px;">
        <li>El archivo se entrega apenas se detecta el pago en la blockchain (o de forma manual si hiciera falta).</li>
        <li>Es un producto digital — no hay reembolsos una vez liberado el archivo.</li>
        <li>Si es un producto de trading, el trading conlleva riesgo y los resultados pasados no garantizan resultados futuros.</li>
      </ul>
      <label style="display:flex;align-items:flex-start;gap:8px;text-align:left;font-size:12px;color:#ccc;cursor:pointer;margin-bottom:18px;">
        <input type="checkbox" id="terms-check" style="margin-top:2px;">
        Leí y acepto estas condiciones
      </label>
      <button id="continue-terms-btn" disabled
        style="width:100%;padding:13px;border-radius:12px;border:none;background:#333;color:#777;font-weight:800;font-size:13.5px;cursor:not-allowed;transition:background .15s,color .15s;">
        Continuar
      </button>
    `);
    bindClose();

    const check = document.getElementById('terms-check');
    const btn = document.getElementById('continue-terms-btn');
    check.addEventListener('change', () => {
      btn.disabled = !check.checked;
      btn.style.background = check.checked ? '#e0b04d' : '#333';
      btn.style.color = check.checked ? '#111' : '#777';
      btn.style.cursor = check.checked ? 'pointer' : 'not-allowed';
    });
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      renderContactStep();
    });
  }

  // ---------------------------------------------------------------------
  // Paso 2: contacto
  // ---------------------------------------------------------------------

  function renderContactStep() {
    const overlay = document.getElementById('buy-modal-overlay');
    overlay.innerHTML = sheet(`
      <div style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px;">
        Un dato de contacto
      </div>
      <p style="font-size:12.5px;color:#ccc;line-height:1.6;margin-bottom:16px;">
        Dejanos tu email — es por si necesitás ayuda o preferís que te reenviemos el archivo por ahí.
      </p>
      <input id="contact-input" type="email" placeholder="tu@email.com"
        style="width:100%;padding:13px;border-radius:10px;border:1px solid #333;background:#161616;color:#fff;font-size:13.5px;margin-bottom:16px;box-sizing:border-box;">
      <button id="continue-contact-btn" disabled
        style="width:100%;padding:13px;border-radius:12px;border:none;background:#333;color:#777;font-weight:800;font-size:13.5px;cursor:not-allowed;transition:background .15s,color .15s;">
        Continuar
      </button>
    `);
    bindClose();

    const input = document.getElementById('contact-input');
    const btn = document.getElementById('continue-contact-btn');
    function validate() {
      const ok = /\S+@\S+\.\S+/.test(input.value.trim());
      btn.disabled = !ok;
      btn.style.background = ok ? '#e0b04d' : '#333';
      btn.style.color = ok ? '#111' : '#777';
      btn.style.cursor = ok ? 'pointer' : 'not-allowed';
    }
    input.addEventListener('input', validate);
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      contactEmail = input.value.trim();
      startPurchase();
    });
  }

  // ---------------------------------------------------------------------
  // Paso 3: reservar y mostrar QR
  // ---------------------------------------------------------------------

  async function startPurchase() {
    const overlay = document.getElementById('buy-modal-overlay');
    overlay.innerHTML = sheet('<p style="color:#999;">Generando tu pago...</p>');
    bindClose();

    try {
      reservation = await apiFetch('/api/reserve', {
        method: 'POST',
        body: JSON.stringify({ productId: selectedProduct.id, contact: contactEmail }),
      });
      renderCheckout();
      startPolling();
      startTimer();
    } catch (err) {
      overlay.innerHTML = sheet(`<p style="color:#e46;">No se pudo iniciar la compra: ${esc(err.message)}</p>`);
      bindClose();
    }
  }

  function renderCheckout() {
    const overlay = document.getElementById('buy-modal-overlay');
    overlay.innerHTML = sheet(`
      <div style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">
        Pagá con USDT · Red TRC20
      </div>
      <div style="font-size:12px;color:#e0b04d;font-weight:700;margin-bottom:12px;">${esc(selectedProduct.name)}</div>

      <div style="background:#fff;border-radius:14px;padding:12px;width:fit-content;margin:0 auto 16px;">
        <div id="qr-container"></div>
      </div>

      <div style="font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:800;letter-spacing:-.02em;">
        $${fmt6(reservation.amount)}
      </div>
      <div style="font-size:11px;color:#e0b04d;font-weight:700;margin-top:2px;">USDT</div>

      <div style="font-size:11.5px;color:#888;margin:10px 0 14px;line-height:1.5;">
        El QR solo trae la dirección. Copiá el monto exacto de abajo y pegalo vos en tu wallet o exchange.
      </div>

      <button id="copy-amount-btn" style="width:100%;padding:11px;border-radius:10px;border:1px solid #333;background:#161616;color:#fff;font-size:12.5px;font-weight:600;cursor:pointer;margin-bottom:8px;">
        📋 Copiar monto
      </button>

      <div style="font-family:monospace;font-size:11.5px;word-break:break-all;background:#161616;border:1px solid #262626;padding:10px;border-radius:10px;color:#ccc;margin-bottom:8px;">
        ${WALLET_ADDRESS}
      </div>
      <button id="copy-wallet-btn" style="width:100%;padding:11px;border-radius:10px;border:1px solid #333;background:#161616;color:#fff;font-size:12.5px;font-weight:600;cursor:pointer;margin-bottom:16px;">
        📋 Copiar wallet
      </button>

      <div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:12.5px;color:#999;margin-bottom:16px;">
        <span id="status-dot" style="width:7px;height:7px;border-radius:50%;background:#e0b04d;display:inline-block;animation:buy-modal-pulse 1.2s infinite;"></span>
        Esperando el pago
        <span style="color:#555;">·</span>
        <span id="checkout-timer" style="color:#e0b04d;font-weight:700;">18:00</span>
      </div>

      <button id="paid-btn" style="width:100%;padding:13px;border-radius:12px;border:none;background:#e0b04d;color:#111;font-weight:800;font-size:13.5px;cursor:pointer;margin-bottom:12px;">
        ✅ Ya pagué
      </button>

      ${supportLink()}

      <style>
        @keyframes buy-modal-pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
      </style>
    `);
    bindClose();

    new QRCode(document.getElementById('qr-container'), {
      text: WALLET_ADDRESS,
      width: 160,
      height: 160,
    });

    document.getElementById('copy-amount-btn').addEventListener('click', (e) => {
      navigator.clipboard.writeText(fmt6(reservation.amount));
      flashCopied(e.target, '📋 Copiar monto');
    });
    document.getElementById('copy-wallet-btn').addEventListener('click', (e) => {
      navigator.clipboard.writeText(WALLET_ADDRESS);
      flashCopied(e.target, '📋 Copiar wallet');
    });
    document.getElementById('paid-btn').addEventListener('click', handleMarkPaid);
  }

  function flashCopied(btn, original) {
    btn.textContent = '✓ Copiado';
    setTimeout(() => { btn.textContent = original; }, 1500);
  }

  // ---------------------------------------------------------------------
  // "Ya pagué" → pantalla de espera (el polling sigue corriendo igual)
  // ---------------------------------------------------------------------

  async function handleMarkPaid() {
    try {
      await apiFetch(`/api/mark-paid/${reservation.reservationId}`, { method: 'POST' });
    } catch (err) {
      // aunque falle el aviso, el polling automático sigue activo igual
    }
    renderWaiting();
  }

  function renderWaiting() {
    const overlay = document.getElementById('buy-modal-overlay');
    overlay.innerHTML = sheet(`
      <div style="font-size:34px;margin-bottom:10px;">⏳</div>
      <p style="font-weight:800;font-size:15.5px;margin-bottom:10px;">¡Gracias! Ya avisamos que pagaste.</p>
      <p style="font-size:12.5px;color:#ccc;line-height:1.6;margin-bottom:14px;">
        Dejá esta pestaña abierta — apenas detectemos el pago en la blockchain, la descarga se libera sola acá mismo.
      </p>
      <p style="font-size:12.5px;color:#ccc;line-height:1.6;margin-bottom:18px;">
        Si preferís cerrarla, te lo enviamos a <b>${esc(contactEmail || 'tu email')}</b> en cuanto lo confirmemos.
      </p>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;color:#999;margin-bottom:14px;">
        <span style="width:7px;height:7px;border-radius:50%;background:#e0b04d;display:inline-block;animation:buy-modal-pulse 1.2s infinite;"></span>
        Verificando...
      </div>
      ${supportLink()}
      <style>
        @keyframes buy-modal-pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
      </style>
    `);
    bindClose();
  }

  // ---------------------------------------------------------------------
  // Timer y polling (corren durante todo el flujo desde que se reserva)
  // ---------------------------------------------------------------------

  function startTimer() {
    timerInterval = setInterval(() => {
      const target = document.getElementById('checkout-timer');
      if (!target) return; // puede no estar visible (pantalla de espera), no pasa nada
      const left = reservation.expiresAt - Date.now();
      if (left <= 0) {
        target.textContent = '0:00';
        clearInterval(timerInterval);
        return;
      }
      target.textContent = fmtTime(left);
    }, 1000);
  }

  function startPolling() {
    pollInterval = setInterval(async () => {
      try {
        const result = await apiFetch(`/api/status/${reservation.reservationId}`);
        if (result.status === 'paid') {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          renderPaid(result.downloadToken);
        } else if (result.status === 'expired') {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          const overlay = document.getElementById('buy-modal-overlay');
          overlay.innerHTML = sheet(`<p style="color:#e46;">El tiempo para pagar venció.</p><p style="font-size:12px;color:#999;margin-top:8px;">Si ya transferiste, escribinos y lo resolvemos a mano.</p>${supportLink()}`);
          bindClose();
        }
      } catch (err) {
        // un fallo puntual de red no debería tirar todo el flujo abajo
      }
    }, 6000);
  }

  function renderPaid(downloadToken) {
    const overlay = document.getElementById('buy-modal-overlay');
    overlay.innerHTML = sheet(`
      <div style="font-size:38px;margin-bottom:8px;">✅</div>
      <p style="font-weight:800;font-size:17px;margin-bottom:4px;">¡Pago confirmado!</p>
      <p style="font-size:12.5px;color:#999;margin-bottom:20px;">Ya podés descargar tu archivo.</p>
      <a href="${API_BASE}/api/download/${downloadToken}"
         style="display:block;padding:14px 22px;border-radius:12px;background:#e0b04d;color:#111;font-weight:800;text-decoration:none;font-size:13.5px;">
        Descargar ${esc(selectedProduct.name)}
      </a>
      <p style="font-size:10.5px;color:#666;margin-top:12px;">Este link vence en 1 hora.</p>
    `);
    bindClose();
  }

  // ---------------------------------------------------------------------
  // Arranque
  // ---------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', () => {
    fetch(API_BASE + '/api/track-visit', { method: 'POST' }).catch(() => {});
    loadProducts();

    document.getElementById('ham-btn').addEventListener('click', openMenu);
    document.getElementById('menu-overlay').addEventListener('click', closeMenu);
    document.getElementById('menu-home').addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();
      document.getElementById('scroll-area').classList.remove('no-scroll');
      renderProductList();
    });
  });
})();
