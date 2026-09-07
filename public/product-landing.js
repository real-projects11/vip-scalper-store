// Genera el documento HTML completo de la landing de un producto (mockup de
// celular: galería con carrusel, badges, beneficios, descripción y CTA fijo).
//
// Se usa en DOS lugares distintos, cargando este mismo archivo como script:
//   1) public/store.js  -> home de la tienda, dentro de un <iframe> real.
//      Se llama con { mode: 'live' }: el botón de compra manda un
//      postMessage al padre para arrancar el checkout de verdad.
//   2) pages/admin.js    -> preview en vivo del panel de administración.
//      Se llama con { mode: 'preview' }: el botón de compra queda
//      deshabilitado (solo es una vista previa, no dispara nada).
//
// Al ser una sola fuente de verdad, el preview del admin es SIEMPRE
// visualmente idéntico a lo que va a ver el comprador en la tienda.

(function (global) {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var STAR_SVG =
    '<svg class="star" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>';

  var CHECK_SVG = '<svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg>';
  var CHIP_ICON_SVG = '<svg viewBox="0 0 24 24"><polyline points="2,12 9,19 22,4"/></svg>';

  // Heurística simple: si el nombre o los chips del producto mencionan
  // trading/bots/MT4-MT5, mostramos el disclaimer de riesgo de trading.
  // Si no, mostramos un disclaimer genérico de producto digital.
  function isTradingProduct(product) {
    var haystack = ((product.name || '') + ' ' + (product.chips || []).join(' ')).toLowerCase();
    return /trading|forex|scalp|bot|mt4|mt5|metatrader|grid/.test(haystack);
  }

  var CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: 'Inter', sans-serif; background: #fff; }
    .wrap { height: 100%; overflow-y: auto; scrollbar-width: none; position: relative; padding-bottom: 100px; }
    .wrap::-webkit-scrollbar { display: none; }

    .banner { background: #f7f7f7; border-bottom: 1px solid #e8e8e8; padding: 7px 14px; text-align: center; }
    .banner span { font-size: 11px; font-weight: 500; color: #111; letter-spacing: -0.01em; }

    .gallery { display: flex; gap: 9px; padding: 14px 14px 0; align-items: flex-start; }
    .main-img { flex: 1; background: #000; border-radius: 14px; border: 1.5px solid #ddd; position: relative; height: 260px; overflow: hidden; }
    .bestseller { position: absolute; top: 10px; left: 10px; background: #fff; border-radius: 20px; padding: 5px 11px; font-size: 11px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.12); z-index: 2; }
    .product-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.5s ease; }
    .product-img.active { opacity: 1; }
    .product-img.placeholder { display: flex; align-items: center; justify-content: center; color: #888; font-size: 12px; background: #151515; }

    .badges { display: flex; flex-direction: column; gap: 8px; width: 82px; flex-shrink: 0; height: 260px; justify-content: space-between; }
    .badge { background: #1c1c1c; border-radius: 12px; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 6px 4px; }
    .badge svg { width: 22px; height: 22px; stroke: #fff; fill: none; stroke-width: 1.5; }
    .badge span { color: #fff; font-size: 9px; font-weight: 500; text-align: center; line-height: 1.3; }

    .dots { display: flex; justify-content: center; gap: 6px; padding: 8px 14px 6px; }
    .dot { width: 6.5px; height: 6.5px; border-radius: 50%; background: #ccc; }
    .dot.active { background: #111; }

    .info { padding: 6px 20px 0; }
    .rating-row { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
    .stars { display: flex; gap: 4px; }
    .star { width: 13px; height: 13px; fill: #FFC107; stroke: #FFC107; stroke-width: 1.4; }
    .rev { font-size: 11px; color: #999; }

    .ptitle { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #111; line-height: 1.15; margin-bottom: 12px; }

    .chips { display: flex; gap: 7px; margin-bottom: 14px; flex-wrap: wrap; }
    .chip { border: 1px solid #d8d8d8; border-radius: 24px; padding: 5px 12px; font-size: 11px; color: #111; }

    .benefits { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .ben { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #111; }
    .chk { width: 15px; height: 15px; background: #111; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .chk svg { width: 7px; height: 7px; stroke: #fff; fill: none; stroke-width: 2.5; }

    .desc-box { padding: 0 20px 10px; font-size: 12px; color: #333; line-height: 1.6; }
    .desc-box p { margin-bottom: 12px; }
    .req-title { font-size: 10.5px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
    .desc-box ul { margin-bottom: 16px; padding-left: 18px; list-style: disc; }
    .desc-box li { margin-bottom: 6px; }

    .bottom-badges-wrap { display: flex; align-items: center; justify-content: space-between; margin: 20px 0 5px; padding: 0 5px; }
    .b-badge { width: 72px; height: 72px; border: 1px solid #d8d8d8; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
    .b-badge svg { width: 22px; height: 22px; stroke: #111; fill: none; stroke-width: 1.5; }
    .b-badge span { font-size: 9px; font-weight: 600; color: #111; text-align: center; line-height: 1.2; }
    .b-divider { width: 1.5px; height: 32px; background: #eaeaea; }

    .alert-box { background: #fdf5d3; color: #735a00; padding: 10px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 500; margin-top: 14px; text-align: center; }

    .cta { position: fixed; bottom: 0; left: 0; width: 100%; background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 35%, #fff 50%); padding: 30px 18px 16px; z-index: 10; }
    .atc-btn { width: 100%; background: #111; color: #fff; border: none; border-radius: 40px; padding: 13px; font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; margin-bottom: 6px; }
    .atc-btn:disabled { opacity: .55; cursor: default; }
    .guarantee { display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 11.5px; color: #111; }
    .g-dot { width: 18px; height: 18px; background: #111; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .g-dot svg { width: 10px; height: 10px; stroke: #fff; fill: none; stroke-width: 2.5; }

    @keyframes slideInTop { 0% { opacity: 0; transform: translateX(-30px) translateY(10px); } 100% { opacity: 1; transform: translateX(0) translateY(0); } }
    @keyframes slideOutTop { 0% { opacity: 1; transform: translateX(0) translateY(0); } 100% { opacity: 0; transform: translateX(-30px) translateY(10px); } }
    @keyframes slideInBottom { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
    @keyframes slideOutBottom { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(15px); } }
    .cta.top-in { animation: slideInTop 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .cta.top-out { animation: slideOutTop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .cta.bottom-in { animation: slideInBottom 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .cta.bottom-out { animation: slideOutBottom 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  `;

  var SCRIPT = `
    (function () {
      var images = document.querySelectorAll('.product-img');
      var dots = document.querySelectorAll('.dot');
      var idx = 0;
      if (images.length > 1) {
        setInterval(function () {
          images[idx].classList.remove('active');
          if (dots[idx]) dots[idx].classList.remove('active');
          idx = (idx + 1) % images.length;
          images[idx].classList.add('active');
          if (dots[idx]) dots[idx].classList.add('active');
        }, 3000);
      }
      var area = document.getElementById('scrollArea');
      var cta = document.getElementById('ctaBlock');
      var state = 'top';
      area.addEventListener('scroll', function () {
        var st = area.scrollTop;
        var max = area.scrollHeight - area.clientHeight;
        if (st <= 20 && state !== 'top') { cta.className = 'cta top-in'; state = 'top'; }
        else if (st >= max - 20 && state !== 'bottom') { cta.className = 'cta bottom-in'; state = 'bottom'; }
        else if (st > 20 && st < max - 20 && state !== 'middle') {
          cta.className = state === 'top' ? 'cta top-out' : 'cta bottom-out';
          state = 'middle';
        }
      });
    })();
  `;

  function buildProductLandingHTML(product, opts) {
    product = product || {};
    opts = opts || {};
    var mode = opts.mode === 'live' ? 'live' : 'preview';

    var images = (product.images || []).filter(Boolean);
    if (images.length === 0) images = [null]; // placeholder único, sin romper el layout

    var hasChips = (product.chips || []).length > 0;
    var badgeChips = (product.chips || []).slice(0, 3);
    var showBestseller = Number(product.sold || 0) > 0;
    var showRisk = isTradingProduct(product);

    var galleryImgs = images
      .map(function (src, i) {
        if (!src) {
          return '<div class="product-img placeholder active">Sin imagen cargada</div>';
        }
        return (
          '<img class="product-img' + (i === 0 ? ' active' : '') + '" src="' +
          esc(src) + '" alt="' + esc(product.name || 'Producto') + ' ' + (i + 1) + '">'
        );
      })
      .join('');

    var dotsHtml =
      images.length > 1
        ? '<div class="dots" id="dotsContainer">' +
          images.map(function (_, i) { return '<div class="dot' + (i === 0 ? ' active' : '') + '"></div>'; }).join('') +
          '</div>'
        : '';

    var badgesCol = hasChips
      ? '<div class="badges">' +
        badgeChips.map(function (c) {
          return '<div class="badge">' + CHIP_ICON_SVG + '<span>' + esc(c) + '</span></div>';
        }).join('') +
        '</div>'
      : '';

    var chipsHtml = (product.chips || [])
      .map(function (c) { return '<div class="chip">' + esc(c) + '</div>'; })
      .join('');

    var benefitsHtml = (product.benefits || [])
      .map(function (b) { return '<div class="ben"><div class="chk">' + CHECK_SVG + '</div>' + esc(b) + '</div>'; })
      .join('');

    var descParas = (product.description || '')
      .split('\n')
      .map(function (p) { return p.trim(); })
      .filter(Boolean)
      .map(function (p) { return '<p>' + esc(p) + '</p>'; })
      .join('');

    var reqHtml =
      (product.requirements || []).length > 0
        ? '<div class="req-title">Requisitos</div><ul>' +
          product.requirements.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') +
          '</ul>'
        : '';

    var bottomBadges = hasChips
      ? '<div class="bottom-badges-wrap">' +
        badgeChips
          .map(function (c, i) {
            return (
              (i > 0 ? '<div class="b-divider"></div>' : '') +
              '<div class="b-badge">' + CHIP_ICON_SVG + '<span>' + esc(c) + '</span></div>'
            );
          })
          .join('') +
        '</div>'
      : '';

    var riskBox = showRisk
      ? '<div class="alert-box">⚠️ Producto digital. El trading conlleva riesgo — resultados pasados no garantizan rendimientos futuros.</div>'
      : '<div class="alert-box">⚠️ Producto digital — sin reembolsos una vez entregado el archivo.</div>';

    var buyBtnAttr =
      mode === 'live'
        ? " onclick=\"window.parent.postMessage({ type: 'vip-store:buy' }, '*')\""
        : ' disabled';

    var price = Number(product.price || 0);

    return (
      '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">' +
      '<style>' + CSS + '</style></head><body>' +
      '<div class="wrap" id="scrollArea">' +
      '  <div class="banner"><span>' + (showBestseller ? '🔥 Producto más vendido' : 'Descarga inmediata') + '</span></div>' +
      '  <div class="gallery">' +
      '    <div class="main-img" id="mainImgContainer">' +
      (showBestseller ? '<div class="bestseller">🔥 Más Vendido</div>' : '') +
      galleryImgs +
      '    </div>' +
      badgesCol +
      '  </div>' +
      dotsHtml +
      '  <div class="info">' +
      '    <div class="rating-row"><div class="stars">' + STAR_SVG.repeat(5) + '</div>' +
      (product.shortDesc ? '<span class="rev">' + esc(product.shortDesc) + '</span>' : '') + '</div>' +
      '    <h1 class="ptitle">' + esc(product.name || 'Producto sin nombre') + '</h1>' +
      (chipsHtml ? '<div class="chips">' + chipsHtml + '</div>' : '') +
      (benefitsHtml ? '<div class="benefits">' + benefitsHtml + '</div>' : '') +
      '  </div>' +
      '  <div class="desc-box">' + descParas + reqHtml + bottomBadges + riskBox + '</div>' +
      '</div>' +
      '<div class="cta top-in" id="ctaBlock">' +
      '  <button class="atc-btn"' + buyBtnAttr + '>Comprar ahora · $' + esc(price) + '</button>' +
      '  <div class="guarantee"><div class="g-dot">' + CHECK_SVG + '</div>Acceso inmediato a la descarga</div>' +
      '</div>' +
      '<script>' + SCRIPT + '<' + '/script>' +
      '</body></html>'
    );
  }

  global.buildProductLandingHTML = buildProductLandingHTML;
})(typeof window !== 'undefined' ? window : this);
