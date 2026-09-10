import { useEffect, useRef, useState } from 'react';

export const ICON_OPTIONS = ['box', 'grid', 'square', 'target', 'check', 'shield', 'bolt', 'clock'];
const ICON_PATHS = {
  box: <><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M12 7V5a2 2 0 00-4 0v2M12 7v10M12 17v2a2 2 0 004 0v-2" /></>,
  grid: <><path d="M3 3v18h18" /><path d="M18.7 8l-5.3 5.3-3.1-3.1L3 17.5" /></>,
  square: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12h8M12 8v8" /></>,
  target: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />,
  check: <polyline points="4,12 10,18 20,6" />,
  shield: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />,
  bolt: <polygon points="13,2 4,14 11,14 10,22 20,9 13,9" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
};
function Icon({ name, className }) {
  return <svg viewBox="0 0 24 24" className={className}>{ICON_PATHS[name] || ICON_PATHS.box}</svg>;
}

const ALERT_PRESETS = [
  { bg: '#fdf5d3', color: '#735a00' },
  { bg: '#fde3e3', color: '#8a1f1f' },
  { bg: '#e3f2ea', color: '#146b3a' },
  { bg: '#e6ecfd', color: '#20388a' },
  { bg: '#f1f1f1', color: '#333333' },
];
const STAR_PATH = 'M12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26';

// --- CSS real de vip-scalper-conectado.html, sin retocar ningún valor,
// solo escopeado bajo .plp para no filtrarse al resto del panel. Las clases
// son EXACTAMENTE las mismas que en el HTML original. ---
const BASE_CSS = `
  .plp, .plp *, .plp *::before, .plp *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
  .plp .phone { width: 375px; height: 780px; background: #fff; border-radius: 50px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; position: relative; }
  .plp .banner { background: #f7f7f7; border-bottom: 1px solid #e8e8e8; display: flex; align-items: center; padding: 5px 18px; flex-shrink: 0; gap: 0; }
  .plp .banner-arrow { font-size: 14px; color: #bbb; width: 20px; }
  .plp .banner-content { display: flex; align-items: center; gap: 7px; flex: 1; justify-content: center; }
  .plp .banner-content svg { width: 17px; height: 17px; stroke: #111; fill: none; stroke-width: 1.6; }
  .plp .banner-content span { font-size: 11px; font-weight: 500; color: #111; letter-spacing: -0.01em; }
  .plp .navbar { background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; border-bottom: 1px solid #ebebeb; flex-shrink: 0; }
  .plp .ham { display: flex; flex-direction: column; gap: 5px; }
  .plp .ham span { display: block; width: 22px; height: 2px; background: #111; border-radius: 2px; }
  .plp .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.04em; color: #111; }
  .plp .nav-right { display: flex; gap: 12px; }
  .plp .nav-ico svg { width: 22px; height: 22px; stroke: #111; fill: none; stroke-width: 1.6; }
  .plp .scroll-area { flex: 1; overflow-y: auto; background: #fff; padding-bottom: 90px; scrollbar-width: none; }
  .plp .scroll-area::-webkit-scrollbar { display: none; }
  .plp .gallery { display: flex; gap: 9px; padding: 12px 14px 0; align-items: flex-start; }
  .plp .main-img { flex: 1; background: #000; border-radius: 14px; border: 1.5px solid #ddd; position: relative; height: 300px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .plp .bestseller { position: absolute; top: 10px; left: 10px; background: #fff; border-radius: 20px; padding: 5px 11px 5px 8px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); z-index: 2; }
  .plp .product-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.5s ease; }
  .plp .product-img.active { opacity: 1; }
  .plp .placeholder { display: flex; align-items: center; justify-content: center; color: #888; font-size: 12px; background: #151515; }
  .plp .badges { display: flex; flex-direction: column; gap: 8px; width: 82px; flex-shrink: 0; height: 300px; justify-content: space-between; }
  .plp .badge { background: #1c1c1c; border-radius: 12px; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 6px 4px; position: relative; }
  .plp .badge svg { width: 24px; height: 24px; stroke: #fff; fill: none; stroke-width: 1.5; }
  .plp .badge span { color: #fff; font-size: 9px; font-weight: 500; text-align: center; line-height: 1.3; }
  .plp .dots { display: flex; justify-content: center; gap: 6px; padding: 8px 14px 6px; margin-right: 105px; }
  .plp .dot { width: 6.5px; height: 6.5px; border-radius: 50%; background: #ccc; }
  .plp .dot.active { background: #111; }
  .plp .info { padding: 4px 20px 0; }
  .plp .rating-row { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
  .plp .stars { display: flex; gap: 4px; }
  .plp .star { width: 13px; height: 13px; fill: #FFC107; stroke: #FFC107; stroke-width: 1.4; }
  .plp .star.off { fill: #e6e6e6; }
  .plp .rev { font-size: 11px; color: #999; font-weight: 400; }
  .plp .ptitle { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #111; line-height: 1.1; margin-bottom: 12px; display: block; }
  .plp .chips { display: flex; gap: 7px; margin-bottom: 14px; flex-wrap: wrap; }
  .plp .chip { display: flex; align-items: center; gap: 5px; border: 1px solid #d8d8d8; border-radius: 24px; padding: 5px 12px; font-size: 11px; color: #111; position: relative; }
  .plp .chip svg { width: 11px; height: 11px; stroke: #111; fill: none; stroke-width: 1.5; }
  .plp .kcal-box { font-size: 7px; font-weight: 700; border: 1.5px solid #111; padding: 1px 3px; border-radius: 3px; flex-shrink: 0; }
  .plp .benefits { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .plp .ben { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #111; }
  .plp .chk { width: 15px; height: 15px; background: #111; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .plp .desc-box { padding: 0 20px 10px; font-size: 12px; color: #333; line-height: 1.6; }
  .plp .desc-box p { margin-bottom: 12px; }
  .plp .desc-box ul { margin-bottom: 16px; padding: 0; list-style: none; }
  .plp .desc-box li { margin-bottom: 6px; }
  .plp .req-title { font-size: 10.5px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  .plp .alert-box { background: #fdf5d3; color: #735a00; padding: 10px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 500; margin-top: 14px; margin-bottom: 0; text-align: center; }
  .plp .bottom-badges-wrap { display: flex; align-items: center; justify-content: space-between; margin: 20px 0 5px; padding: 0 5px; }
  .plp .b-badge { width: 76px; height: 76px; border: 1px solid #d8d8d8; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: transparent; }
  .plp .b-badge svg { width: 24px; height: 24px; stroke: #111; fill: none; stroke-width: 1.5; }
  .plp .b-badge span { font-size: 9px; font-weight: 600; color: #111; text-align: center; line-height: 1.2; letter-spacing: -0.01em; }
  .plp .b-divider { width: 1.5px; height: 32px; background: #eaeaea; }
  .plp .cta { position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 35%, #fff 50%); padding: 30px 18px 16px; z-index: 10; }
  .plp .atc-btn { width: 100%; background: #111; color: #fff; border: none; border-radius: 40px; padding: 13px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; margin-bottom: 6px; }
  .plp .guarantee { display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 11.5px; color: #111; }
  .plp .g-dot { width: 18px; height: 18px; background: #111; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .plp .g-dot svg { width: 10px; height: 10px; stroke: #fff; fill: none; stroke-width: 2.5; }
  @keyframes plpSlideInTop { 0% { opacity: 0; transform: translateX(-30px) translateY(10px); } 100% { opacity: 1; transform: translateX(0) translateY(0); } }
  @keyframes plpSlideOutTop { 0% { opacity: 1; transform: translateX(0) translateY(0); } 100% { opacity: 0; transform: translateX(-30px) translateY(10px); } }
  @keyframes plpSlideInBottom { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes plpSlideOutBottom { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(15px); } }
  .plp .cta.top-in { animation: plpSlideInTop 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  .plp .cta.top-out { animation: plpSlideOutTop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  .plp .cta.bottom-in { animation: plpSlideInBottom 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  .plp .cta.bottom-out { animation: plpSlideOutBottom 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  /* --- Ganchos de edición (no existen en el HTML original) --- */
  .plp .editable { outline: none; cursor: text; }
  .plp .editable.on { box-shadow: 0 0 0 1.5px rgba(20,107,82,.4); border-radius: 4px; }
  .plp .edit-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; border: none; background: #c0392b; color: #fff; font-size: 11px; line-height: 18px; cursor: pointer; padding: 0; z-index: 5; }
  .plp .edit-add { font-size: 11px; font-weight: 700; color: #146B52; background: none; border: 1.5px dashed #146B52; border-radius: 8px; padding: 5px 10px; cursor: pointer; margin: 4px 0; }
  .plp .edit-iconbtn { background: none; border: none; padding: 0; cursor: pointer; display: flex; }
  .plp .edit-iconpicker { position: absolute; z-index: 50; top: 100%; left: 0; margin-top: 4px; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 6px; display: flex; gap: 4px; box-shadow: 0 6px 20px rgba(0,0,0,.15); }
  .plp .edit-iconpicker button { width: 26px; height: 26px; border: 1px solid #eee; border-radius: 6px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .plp .edit-iconpicker svg { width: 14px; height: 14px; stroke: #111; fill: none; stroke-width: 1.6; }
  .plp .edit-colorpicker { position: absolute; top: 100%; left: 0; margin-top: 6px; display: flex; gap: 6px; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.15); z-index: 20; }
  .plp .edit-swatch { width: 22px; height: 22px; border-radius: 50%; cursor: pointer; }
  .plp .edit-btnpop { position: absolute; bottom: 100%; left: 0; right: 0; margin-bottom: 8px; background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 10px; box-shadow: 0 6px 20px rgba(0,0,0,.15); z-index: 20; }
  .plp .edit-btnpop label { font-size: 9.5px; font-weight: 700; color: #999; text-transform: uppercase; display: block; margin-bottom: 3px; margin-top: 6px; }
  .plp .edit-btnpop input { width: 100%; padding: 7px; border-radius: 6px; border: 1px solid #ddd; font-size: 12px; box-sizing: border-box; }
  .plp .edit-btnpop .close { margin-top: 8px; width: 100%; padding: 7px; background: #111; color: #fff; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
  .plp .edit-imgbar { position: absolute; bottom: 4px; left: 4px; right: 4px; display: flex; flex-wrap: wrap; gap: 4px; z-index: 4; }
  .plp .edit-imgbar input { width: 100%; font-size: 10px; padding: 5px; border-radius: 6px; border: none; }
  .plp .edit-imgchip { font-size: 9px; background: rgba(255,255,255,.9); border-radius: 10px; padding: 2px 6px; }
  .plp .edit-imgchip button { border: none; background: none; cursor: pointer; margin-left: 4px; font-weight: 700; }
  .plp .edit-bestseller-toggle { position: absolute; top: 10px; right: 10px; z-index: 3; border: none; color: #fff; font-size: 9px; font-weight: 700; border-radius: 20px; padding: 4px 8px; cursor: pointer; }

  /* --- Marco de iPhone alrededor del mockup --- */
  .plp .iphone-frame { width: 391px; padding: 6px; background: linear-gradient(160deg, #3a3a3c, #1c1c1e); border-radius: 54px; box-shadow: 0 40px 90px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.08); position: relative; margin: 0 auto; }
  .plp .iphone-frame .side-btn { position: absolute; background: #2c2c2e; border-radius: 3px; }
  .plp .iphone-frame .side-btn.power { right: -3px; top: 150px; width: 3px; height: 70px; }
  .plp .iphone-frame .side-btn.vol-up { left: -3px; top: 110px; width: 3px; height: 34px; }
  .plp .iphone-frame .side-btn.vol-down { left: -3px; top: 150px; width: 3px; height: 34px; }
  .plp .iphone-frame .phone { border-radius: 48px; }
`;

function cls(...xs) { return xs.filter(Boolean).join(' '); }

function Editable({ tag = 'span', value, onSave, editable, className, multiline }) {
  const Tag = tag;
  if (!editable) {
    return <Tag className={className}>{multiline ? value.split('\n').map((l, i) => <p key={i}>{l}</p>) : value}</Tag>;
  }
  return (
    <Tag
      className={cls(className, 'editable', 'on')}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onSave(e.currentTarget.innerText)}
    >
      {value}
    </Tag>
  );
}

function EditableList({ items, onChange, editable, renderItem, addLabel, newItem }) {
  if (!editable) return <>{items.map((it, i) => renderItem(it, i))}</>;
  return (
    <>
      {items.map((it, i) => (
        <div key={i} style={{ position: 'relative' }}>
          {renderItem(it, i, (val) => {
            const next = [...items];
            next[i] = val;
            onChange(next);
          })}
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="edit-remove" title="Quitar">×</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, newItem])} className="edit-add">
        + {addLabel}
      </button>
    </>
  );
}

function IconPicker({ current, onPick, onClose }) {
  return (
    <div className="edit-iconpicker">
      {ICON_OPTIONS.map((key) => (
        <button key={key} onClick={() => { onPick(key); onClose(); }} style={{ borderColor: key === current ? '#146B52' : '#eee' }}>
          <Icon name={key} />
        </button>
      ))}
    </div>
  );
}

export default function ProductLanding({ content, editable = false, onChange, mode = 'preview', frame = true }) {
  const [pickerFor, setPickerFor] = useState(null);
  const [alertPickerOpen, setAlertPickerOpen] = useState(false);
  const [btnPopoverOpen, setBtnPopoverOpen] = useState(false);
  const scrollRef = useRef(null);
  const ctaRef = useRef(null);
  const c = content;

  function patch(fields) { onChange({ ...c, ...fields }); }

  const images = (c.images || []).filter(Boolean);
  const galleryImgs = images.length ? images : [null];

  // Reproduce el show/hide del CTA al hacer scroll — solo en modo lectura
  // (en edición lo dejamos siempre visible para poder tocarlo).
  useEffect(() => {
    if (editable) return;
    const area = scrollRef.current;
    const cta = ctaRef.current;
    if (!area || !cta) return;
    let state = 'top';
    function onScroll() {
      const st = area.scrollTop;
      const max = area.scrollHeight - area.clientHeight;
      if (st <= 20 && state !== 'top') { cta.className = 'cta top-in'; state = 'top'; }
      else if (st >= max - 20 && state !== 'bottom') { cta.className = 'cta bottom-in'; state = 'bottom'; }
      else if (st > 20 && st < max - 20 && state !== 'middle') {
        cta.className = state === 'top' ? 'cta top-out' : 'cta bottom-out';
        state = 'middle';
      }
    }
    area.addEventListener('scroll', onScroll);
    return () => area.removeEventListener('scroll', onScroll);
  }, [editable]);

  // Carrusel automático — solo en modo lectura.
  useEffect(() => {
    if (editable || galleryImgs.length <= 1) return;
    const root = scrollRef.current?.closest('.phone');
    if (!root) return;
    let idx = 0;
    const id = setInterval(() => {
      const imgs = root.querySelectorAll('.product-img');
      const dots = root.querySelectorAll('.dot');
      if (!imgs.length) return;
      imgs[idx].classList.remove('active');
      if (dots[idx]) dots[idx].classList.remove('active');
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add('active');
      if (dots[idx]) dots[idx].classList.add('active');
    }, 3000);
    return () => clearInterval(id);
  }, [editable, galleryImgs.length]);

  const gallerySection = (
    <div className={cls('col-media')}>
      <div className="gallery">
        <div className="main-img">
          {editable && (
            <button onClick={() => patch({ bestseller: !c.bestseller })} className="edit-bestseller-toggle" style={{ background: c.bestseller ? '#146B52' : '#999' }}>
              {c.bestseller ? 'Bestseller ON' : 'Bestseller OFF'}
            </button>
          )}
          {c.bestseller && <div className="bestseller"><Editable editable={editable} value={c.bestsellerText} onSave={(v) => patch({ bestsellerText: v })} /></div>}
          {galleryImgs.map((src, i) =>
            src ? <img key={i} className={cls('product-img', i === 0 && 'active')} src={src} alt="" /> : <div key={i} className="product-img active placeholder">Sin imagen cargada</div>
          )}
          {editable && (
            <div className="edit-imgbar">
              <input
                placeholder="Pegar URL de imagen y Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    patch({ images: [...images, e.currentTarget.value.trim()] });
                    e.currentTarget.value = '';
                  }
                }}
              />
              {images.map((img, i) => (
                <span key={i} className="edit-imgchip">{img.slice(0, 20)}…<button onClick={() => patch({ images: images.filter((_, idx) => idx !== i) })}>×</button></span>
              ))}
            </div>
          )}
        </div>
        <div className="badges">
          <EditableList
            items={c.badges} onChange={(v) => patch({ badges: v })} editable={editable} addLabel="badge"
            newItem={{ icon: 'box', label: 'Nuevo' }}
            renderItem={(b, i, save) => (
              <div key={i} className="badge">
                <span style={{ position: 'relative' }}>
                  <button onClick={() => editable && setPickerFor(pickerFor === `badge-${i}` ? null : `badge-${i}`)} className="edit-iconbtn" disabled={!editable}>
                    <Icon name={b.icon} />
                  </button>
                  {pickerFor === `badge-${i}` && <IconPicker current={b.icon} onPick={(icon) => save({ ...b, icon })} onClose={() => setPickerFor(null)} />}
                </span>
                <Editable editable={editable} value={b.label} onSave={(v) => save({ ...b, label: v })} multiline />
              </div>
            )}
          />
        </div>
      </div>
      {galleryImgs.length > 1 && (
        <div className="dots">{galleryImgs.map((_, i) => <div key={i} className={cls('dot', i === 0 && 'active')} />)}</div>
      )}
    </div>
  );

  const infoSection = (
    <div className="col-info">
      <div className="info">
        <div className="rating-row">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <svg key={n} viewBox="0 0 24 24" className={cls('star', n > c.stars && 'off')} style={{ cursor: editable ? 'pointer' : 'default' }} onClick={() => editable && patch({ stars: n })}>
                <polygon points={STAR_PATH} />
              </svg>
            ))}
          </div>
          <Editable editable={editable} value={c.reviewText} onSave={(v) => patch({ reviewText: v })} className="rev" />
        </div>

        <Editable tag="h1" editable={editable} value={c.title} onSave={(v) => patch({ title: v })} className="ptitle" />

        <div className="chips">
          <EditableList
            items={c.chips} onChange={(v) => patch({ chips: v })} editable={editable} addLabel="chip"
            newItem={{ icon: 'box', label: 'Nuevo' }}
            renderItem={(ch, i, save) => (
              <div key={i} className="chip">
                {ch.badgeText ? (
                  <span className="kcal-box">{ch.badgeText}</span>
                ) : (
                  <span style={{ position: 'relative', display: 'flex' }}>
                    <button onClick={() => editable && setPickerFor(pickerFor === `chip-${i}` ? null : `chip-${i}`)} className="edit-iconbtn" disabled={!editable}>
                      <Icon name={ch.icon} />
                    </button>
                    {pickerFor === `chip-${i}` && <IconPicker current={ch.icon} onPick={(icon) => save({ ...ch, icon })} onClose={() => setPickerFor(null)} />}
                  </span>
                )}
                <Editable editable={editable} value={ch.label} onSave={(v) => save({ ...ch, label: v })} />
                {editable && (
                  <button
                    className="edit-add"
                    style={{ margin: 0, padding: '2px 6px', fontSize: 9 }}
                    title={ch.badgeText ? 'Usar ícono en vez de etiqueta' : 'Usar etiqueta tipo "MT5" en vez de ícono'}
                    onClick={() => save(ch.badgeText ? { icon: ch.icon || 'box', label: ch.label } : { badgeText: 'MT5', label: ch.label })}
                  >
                    {ch.badgeText ? '🖼' : 'AB'}
                  </button>
                )}
              </div>
            )}
          />
        </div>

        <div className="benefits">
          <EditableList
            items={c.benefits} onChange={(v) => patch({ benefits: v })} editable={editable} addLabel="beneficio"
            newItem="Nuevo beneficio"
            renderItem={(b, i, save) => (
              <div key={i} className="ben">
                <div className="chk"><svg viewBox="0 0 12 12" style={{ width: 7, height: 7, stroke: '#fff', fill: 'none', strokeWidth: 2.5 }}><polyline points="2,6 5,9 10,3" /></svg></div>
                <Editable editable={editable} value={b} onSave={save} />
              </div>
            )}
          />
        </div>
      </div>

      <div className="desc-box">
        <Editable tag="div" editable={editable} value={c.description} onSave={(v) => patch({ description: v })} multiline />

        {(c.detailsList.length > 0 || editable) && (
          <ul>
            <EditableList
              items={c.detailsList} onChange={(v) => patch({ detailsList: v })} editable={editable} addLabel="detalle"
              newItem="Nuevo detalle"
              renderItem={(d, i, save) => <li key={i}><Editable editable={editable} value={d} onSave={save} /></li>}
            />
          </ul>
        )}

        {(c.requirements.length > 0 || editable) && (
          <>
            <div className="req-title">Requisitos</div>
            <ul>
              <EditableList
                items={c.requirements} onChange={(v) => patch({ requirements: v })} editable={editable} addLabel="requisito"
                newItem="Nuevo requisito"
                renderItem={(r, i, save) => <li key={i}><Editable editable={editable} value={r} onSave={save} /></li>}
              />
            </ul>
          </>
        )}

        <div className="bottom-badges-wrap">
          {c.badges.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div className="b-divider" />}
              <div className="b-badge">
                <Icon name={b.icon} />
                <span>{b.label.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <div className="alert-box" style={{ background: c.alertBg, color: c.alertColor, cursor: editable ? 'pointer' : 'default' }} onClick={() => editable && setAlertPickerOpen((o) => !o)}>
            <Editable editable={editable} value={c.alertText} onSave={(v) => patch({ alertText: v })} />
          </div>
          {alertPickerOpen && (
            <div className="edit-colorpicker">
              {ALERT_PRESETS.map((p, i) => (
                <button key={i} className="edit-swatch" style={{ background: p.bg, border: `1.5px solid ${p.color}` }} onClick={() => { patch({ alertBg: p.bg, alertColor: p.color }); setAlertPickerOpen(false); }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ctaSection = (
    <div className="cta top-in" ref={ctaRef}>
      <div style={{ position: 'relative' }}>
        <button
          id={editable ? undefined : 'atc-btn'}
          className="atc-btn"
          disabled={!editable && mode === 'preview'}
          onClick={() => editable && setBtnPopoverOpen((o) => !o)}
        >
          {c.buttonText}
        </button>
        {editable && btnPopoverOpen && (
          <div className="edit-btnpop">
            <label>Texto del botón</label>
            <input value={c.buttonText} onChange={(e) => patch({ buttonText: e.target.value })} />
            <label>Link de descarga (pisa el FILE_URL de entorno)</label>
            <input placeholder="https://drive.google.com/..." value={c.fileUrl} onChange={(e) => patch({ fileUrl: e.target.value })} />
            <button className="close" onClick={() => setBtnPopoverOpen(false)}>Listo</button>
          </div>
        )}
      </div>
      <div className="guarantee">
        <div className="g-dot"><svg viewBox="0 0 12 12" style={{ width: 10, height: 10, stroke: '#fff', fill: 'none', strokeWidth: 2.5 }}><polyline points="2,6 5,9 10,3" /></svg></div>
        <Editable editable={editable} value={c.guaranteeText} onSave={(v) => patch({ guaranteeText: v })} />
      </div>
    </div>
  );

  const phoneEl = (
    <div className="phone">
      <div className="banner">
        <span className="banner-arrow">←</span>
        <div className="banner-content">
          <svg viewBox="0 0 24 16"><rect x="1" y="1" width="22" height="12" rx="2" /><path d="M1 5h7M1 9h5" /><circle cx="19" cy="9" r="2" /></svg>
          <Editable editable={editable} value={c.bannerText} onSave={(v) => patch({ bannerText: v })} />
        </div>
        <span className="banner-arrow" style={{ textAlign: 'right' }}>→</span>
      </div>
      <nav className="navbar">
        <div className="ham"><span /><span /><span /></div>
        <Editable editable={editable} value={c.brandName} onSave={(v) => patch({ brandName: v })} className="logo" />
        <div className="nav-right">
          <div className="nav-ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg></div>
          <div className="nav-ico"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg></div>
        </div>
      </nav>
      <div className="scroll-area" ref={scrollRef}>
        {gallerySection}
        {infoSection}
      </div>
      {ctaSection}
    </div>
  );

  return (
    <div className="plp">
      <style>{BASE_CSS}</style>
      {frame ? (
        <div className="iphone-frame">
          <div className="side-btn power" />
          <div className="side-btn vol-up" />
          <div className="side-btn vol-down" />
          {phoneEl}
        </div>
      ) : (
        phoneEl
      )}
    </div>
  );
}
