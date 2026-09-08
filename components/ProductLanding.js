import { useState } from 'react';

// --- Set fijo de íconos para chips/badges. Mismo criterio en todo el panel. ---
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
function Icon({ name, style }) {
  return <svg viewBox="0 0 24 24" style={style}>{ICON_PATHS[name] || ICON_PATHS.box}</svg>;
}

const ALERT_PRESETS = [
  { bg: '#fdf5d3', color: '#735a00' }, // amarillo (original)
  { bg: '#fde3e3', color: '#8a1f1f' }, // rojo
  { bg: '#e3f2ea', color: '#146b3a' }, // verde
  { bg: '#e6ecfd', color: '#20388a' }, // azul
  { bg: '#f1f1f1', color: '#333333' }, // gris
];

const STAR_PATH = 'M12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26';

// --- Bloque de texto "in-place": en modo editable es contentEditable, en modo
// lectura es un span/div normal. Guarda al perder el foco (blur). ---
function Editable({ tag = 'span', value, onSave, editable, style, className, multiline }) {
  if (!editable) {
    const Tag = tag;
    return <Tag className={className} style={style}>{multiline ? value.split('\n').map((l, i) => <p key={i}>{l}</p>) : value}</Tag>;
  }
  const Tag = tag;
  return (
    <Tag
      className={className}
      style={{ ...style, outline: 'none', cursor: 'text', boxShadow: '0 0 0 1.5px rgba(20,107,82,0.35)', borderRadius: 4 }}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onSave(e.currentTarget.innerText)}
    >
      {value}
    </Tag>
  );
}

// --- Lista editable genérica: uno por línea, con botón para borrar y uno para agregar ---
function EditableList({ items, onChange, editable, renderItem, addLabel }) {
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
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            style={removeBtnStyle}
            title="Quitar"
          >×</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, typeof items[0] === 'object' ? { icon: 'box', label: 'Nuevo' } : 'Nuevo ítem'])} style={addBtnStyle}>
        + {addLabel}
      </button>
    </>
  );
}

const removeBtnStyle = { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#c0392b', color: '#fff', fontSize: 11, lineHeight: '18px', cursor: 'pointer', padding: 0 };
const addBtnStyle = { fontSize: 11, fontWeight: 700, color: '#146B52', background: 'none', border: '1.5px dashed #146B52', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', margin: '4px 0' };

function IconPicker({ current, onPick, onClose }) {
  return (
    <div style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 6, display: 'flex', gap: 4, boxShadow: '0 6px 20px rgba(0,0,0,.15)' }}>
      {ICON_OPTIONS.map((key) => (
        <button
          key={key}
          onClick={() => { onPick(key); onClose(); }}
          style={{ width: 26, height: 26, border: key === current ? '1.5px solid #146B52' : '1px solid #eee', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name={key} style={{ width: 14, height: 14, stroke: '#111', fill: 'none', strokeWidth: 1.6 }} />
        </button>
      ))}
    </div>
  );
}

export default function ProductLanding({ content, editable = false, onChange, mode = 'preview' }) {
  const [pickerFor, setPickerFor] = useState(null); // 'chip-0' | 'badge-1' | null
  const [alertPickerOpen, setAlertPickerOpen] = useState(false);
  const [btnPopoverOpen, setBtnPopoverOpen] = useState(false);
  const c = content;

  function patch(fields) {
    onChange({ ...c, ...fields });
  }

  const images = (c.images || []).filter(Boolean);
  const galleryImgs = images.length ? images : [null];

  return (
    <div style={S.phone}>
      <div style={S.banner}>
        <span style={S.bannerArrow}>←</span>
        <div style={S.bannerContent}>
          <svg viewBox="0 0 24 16" style={{ width: 17, height: 17, stroke: '#111', fill: 'none', strokeWidth: 1.6 }}><rect x="1" y="1" width="22" height="12" rx="2" /><path d="M1 5h7M1 9h5" /><circle cx="19" cy="9" r="2" /></svg>
          <Editable editable={editable} value={c.bannerText} onSave={(v) => patch({ bannerText: v })} style={S.bannerSpan} />
        </div>
        <span style={S.bannerArrow}>→</span>
      </div>

      <nav style={S.navbar}>
        <div style={S.ham}><span style={S.hamLine} /><span style={S.hamLine} /><span style={S.hamLine} /></div>
        <Editable editable={editable} value={c.brandName} onSave={(v) => patch({ brandName: v })} style={S.logo} />
        <div style={{ display: 'flex', gap: 12 }}>
          <svg viewBox="0 0 24 24" style={S.navIco}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          <svg viewBox="0 0 24 24" style={S.navIco}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
        </div>
      </nav>

      <div style={S.scrollArea}>
        <div style={S.gallery}>
          <div style={S.mainImg}>
            {editable && (
              <button onClick={() => patch({ bestseller: !c.bestseller })} style={{ ...S.bestsellerToggle, background: c.bestseller ? '#146B52' : '#999' }}>
                {c.bestseller ? 'Bestseller ON' : 'Bestseller OFF'}
              </button>
            )}
            {c.bestseller && (
              <div style={S.bestseller}>
                <Editable editable={editable} value={c.bestsellerText} onSave={(v) => patch({ bestsellerText: v })} />
              </div>
            )}
            {galleryImgs.map((src, i) =>
              src ? (
                <img key={i} src={src} alt="" style={{ ...S.productImg, opacity: i === 0 ? 1 : 0 }} />
              ) : (
                <div key={i} style={S.placeholder}>Sin imagen cargada</div>
              )
            )}
            {editable && (
              <div style={S.imgEditBar}>
                <input
                  placeholder="Pegar URL de imagen y Enter"
                  style={S.imgInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      patch({ images: [...images, e.currentTarget.value.trim()] });
                      e.currentTarget.value = '';
                    }
                  }}
                />
                {images.map((img, i) => (
                  <span key={i} style={S.imgChip}>
                    {img.slice(0, 22)}…
                    <button onClick={() => patch({ images: images.filter((_, idx) => idx !== i) })} style={S.imgChipX}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={S.badgesCol}>
            <EditableList
              items={c.badges}
              onChange={(v) => patch({ badges: v })}
              editable={editable}
              addLabel="badge"
              renderItem={(b, i, save) => (
                <div key={i} style={S.badge}>
                  <span style={{ position: 'relative' }}>
                    <button
                      onClick={() => editable && setPickerFor(pickerFor === `badge-${i}` ? null : `badge-${i}`)}
                      style={S.iconBtn}
                      disabled={!editable}
                    >
                      <Icon name={b.icon} style={S.badgeIconSvg} />
                    </button>
                    {pickerFor === `badge-${i}` && (
                      <IconPicker current={b.icon} onPick={(icon) => save({ ...b, icon })} onClose={() => setPickerFor(null)} />
                    )}
                  </span>
                  <Editable editable={editable} value={b.label} onSave={(v) => save({ ...b, label: v })} style={S.badgeSpan} multiline />
                </div>
              )}
            />
          </div>
        </div>

        {galleryImgs.length > 1 && (
          <div style={S.dots}>{galleryImgs.map((_, i) => <div key={i} style={{ ...S.dot, background: i === 0 ? '#111' : '#ccc' }} />)}</div>
        )}

        <div style={S.info}>
          <div style={S.ratingRow}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <svg
                  key={n}
                  viewBox="0 0 24 24"
                  onClick={() => editable && patch({ stars: n })}
                  style={{ width: 15, height: 15, fill: n <= c.stars ? '#FFC107' : '#e6e6e6', stroke: '#FFC107', strokeWidth: 1.4, cursor: editable ? 'pointer' : 'default' }}
                >
                  <polygon points={STAR_PATH} />
                </svg>
              ))}
            </div>
            <Editable editable={editable} value={c.reviewText} onSave={(v) => patch({ reviewText: v })} style={S.rev} />
          </div>

          <Editable tag="h1" editable={editable} value={c.title} onSave={(v) => patch({ title: v })} style={S.ptitle} />

          <div style={S.chipsRow}>
            <EditableList
              items={c.chips}
              onChange={(v) => patch({ chips: v })}
              editable={editable}
              addLabel="chip"
              renderItem={(ch, i, save) => (
                <div key={i} style={S.chip}>
                  <span style={{ position: 'relative' }}>
                    <button onClick={() => editable && setPickerFor(pickerFor === `chip-${i}` ? null : `chip-${i}`)} style={S.iconBtnSmall} disabled={!editable}>
                      <Icon name={ch.icon} style={S.chipIconSvg} />
                    </button>
                    {pickerFor === `chip-${i}` && (
                      <IconPicker current={ch.icon} onPick={(icon) => save({ ...ch, icon })} onClose={() => setPickerFor(null)} />
                    )}
                  </span>
                  <Editable editable={editable} value={ch.label} onSave={(v) => save({ ...ch, label: v })} />
                </div>
              )}
            />
          </div>

          <div style={S.benefits}>
            <EditableList
              items={c.benefits}
              onChange={(v) => patch({ benefits: v })}
              editable={editable}
              addLabel="beneficio"
              renderItem={(b, i, save) => (
                <div key={i} style={S.ben}>
                  <div style={S.chk}><svg viewBox="0 0 12 12" style={{ width: 7, height: 7, stroke: '#fff', fill: 'none', strokeWidth: 2.5 }}><polyline points="2,6 5,9 10,3" /></svg></div>
                  <Editable editable={editable} value={b} onSave={save} />
                </div>
              )}
            />
          </div>
        </div>

        <div style={S.descBox}>
          <Editable tag="div" editable={editable} value={c.description} onSave={(v) => patch({ description: v })} multiline />

          <div style={{ marginTop: editable ? 8 : 0 }}>
            <EditableList
              items={c.detailsList}
              onChange={(v) => patch({ detailsList: v })}
              editable={editable}
              addLabel="detalle"
              renderItem={(d, i, save) => <div key={i} style={S.liLike}><Editable editable={editable} value={d} onSave={save} /></div>}
            />
          </div>

          {(c.requirements.length > 0 || editable) && (
            <div style={{ marginTop: 12 }}>
              {(c.requirements.length > 0 || editable) && <div style={S.reqTitle}>Requisitos</div>}
              <EditableList
                items={c.requirements}
                onChange={(v) => patch({ requirements: v })}
                editable={editable}
                addLabel="requisito"
                renderItem={(r, i, save) => <div key={i} style={S.liDisc}><Editable editable={editable} value={r} onSave={save} /></div>}
              />
            </div>
          )}

          <div style={S.bottomBadgesWrap}>
            {c.badges.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div style={S.bDivider} />}
                <div style={S.bBadge}>
                  <Icon name={b.icon} style={S.bBadgeSvg} />
                  <span style={S.bBadgeSpan}>{b.label.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <div
              style={{ ...S.alertBox, background: c.alertBg, color: c.alertColor, cursor: editable ? 'pointer' : 'default' }}
              onClick={() => editable && setAlertPickerOpen((o) => !o)}
            >
              <Editable editable={editable} value={c.alertText} onSave={(v) => patch({ alertText: v })} />
            </div>
            {alertPickerOpen && (
              <div style={S.colorPicker}>
                {ALERT_PRESETS.map((p, i) => (
                  <button key={i} onClick={() => { patch({ alertBg: p.bg, alertColor: p.color }); setAlertPickerOpen(false); }} style={{ ...S.colorSwatch, background: p.bg, border: `1.5px solid ${p.color}` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={S.cta}>
        <div style={{ position: 'relative' }}>
          <button
            id={editable ? undefined : 'atc-btn'}
            style={S.atcBtn}
            disabled={editable || mode === 'preview'}
            onClick={() => editable && setBtnPopoverOpen((o) => !o)}
          >
            {c.buttonText}
          </button>
          {editable && btnPopoverOpen && (
            <div style={S.btnPopover}>
              <label style={S.popLabel}>Texto del botón</label>
              <input style={S.popInput} value={c.buttonText} onChange={(e) => patch({ buttonText: e.target.value })} />
              <label style={S.popLabel}>Link de descarga (pisa el FILE_URL de entorno)</label>
              <input style={S.popInput} placeholder="https://drive.google.com/..." value={c.fileUrl} onChange={(e) => patch({ fileUrl: e.target.value })} />
              <button style={S.popClose} onClick={() => setBtnPopoverOpen(false)}>Listo</button>
            </div>
          )}
        </div>
        <div style={S.guarantee}>
          <div style={S.gDot}><svg viewBox="0 0 12 12" style={{ width: 10, height: 10, stroke: '#fff', fill: 'none', strokeWidth: 2.5 }}><polyline points="2,6 5,9 10,3" /></svg></div>
          <Editable editable={editable} value={c.guaranteeText} onSave={(v) => patch({ guaranteeText: v })} />
        </div>
      </div>
    </div>
  );
}

const S = {
  phone: { width: 375, maxWidth: '100%', height: 780, background: '#fff', borderRadius: 40, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: "'Inter', sans-serif", margin: '0 auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' },
  banner: { background: '#f7f7f7', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '5px 18px' },
  bannerArrow: { fontSize: 14, color: '#bbb', width: 20 },
  bannerContent: { display: 'flex', alignItems: 'center', gap: 7, flex: 1, justifyContent: 'center' },
  bannerSpan: { fontSize: 11, fontWeight: 500, color: '#111' },
  navbar: { background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid #ebebeb' },
  ham: { display: 'flex', flexDirection: 'column', gap: 5 },
  hamLine: { display: 'block', width: 22, height: 2, background: '#111', borderRadius: 2 },
  logo: { fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: '#111' },
  navIco: { width: 22, height: 22, stroke: '#111', fill: 'none', strokeWidth: 1.6 },
  scrollArea: { flex: 1, overflowY: 'auto', background: '#fff', paddingBottom: 90 },
  gallery: { display: 'flex', gap: 9, padding: '12px 14px 0', alignItems: 'flex-start' },
  mainImg: { flex: 1, background: '#000', borderRadius: 14, border: '1.5px solid #ddd', position: 'relative', height: 280, overflow: 'hidden' },
  bestseller: { position: 'absolute', top: 10, left: 10, background: '#fff', borderRadius: 20, padding: '5px 11px', fontSize: 11, fontWeight: 700, zIndex: 2 },
  bestsellerToggle: { position: 'absolute', top: 10, right: 10, zIndex: 3, border: 'none', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '4px 8px', cursor: 'pointer' },
  productImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' },
  placeholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12, background: '#151515' },
  imgEditBar: { position: 'absolute', bottom: 4, left: 4, right: 4, display: 'flex', flexWrap: 'wrap', gap: 4, zIndex: 4 },
  imgInput: { width: '100%', fontSize: 10, padding: 5, borderRadius: 6, border: 'none' },
  imgChip: { fontSize: 9, background: 'rgba(255,255,255,.9)', borderRadius: 10, padding: '2px 6px' },
  imgChipX: { border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4, fontWeight: 700 },
  badgesCol: { display: 'flex', flexDirection: 'column', gap: 8, width: 82, flexShrink: 0, height: 280, justifyContent: 'space-between' },
  badge: { background: '#1c1c1c', borderRadius: 12, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 4px' },
  badgeIconSvg: { width: 22, height: 22, stroke: '#fff', fill: 'none', strokeWidth: 1.5 },
  badgeSpan: { color: '#fff', fontSize: 9, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 },
  iconBtn: { background: 'none', border: 'none', padding: 0, cursor: 'pointer' },
  iconBtnSmall: { background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' },
  dots: { display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 14px 6px' },
  dot: { width: 6.5, height: 6.5, borderRadius: '50%' },
  info: { padding: '6px 20px 0' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 },
  rev: { fontSize: 11, color: '#999' },
  ptitle: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', lineHeight: 1.15, marginBottom: 12, display: 'block' },
  chipsRow: { display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' },
  chip: { display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #d8d8d8', borderRadius: 24, padding: '5px 12px', fontSize: 11, color: '#111' },
  chipIconSvg: { width: 11, height: 11, stroke: '#111', fill: 'none', strokeWidth: 1.5 },
  benefits: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  ben: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#111' },
  chk: { width: 15, height: 15, background: '#111', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  descBox: { padding: '0 20px 10px', fontSize: 12, color: '#333', lineHeight: 1.6 },
  liLike: { marginBottom: 6 },
  liDisc: { marginBottom: 6, paddingLeft: 14, position: 'relative' },
  reqTitle: { fontSize: 10.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 },
  bottomBadgesWrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 5px', padding: '0 5px' },
  bBadge: { width: 72, height: 72, border: '1px solid #d8d8d8', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 },
  bBadgeSvg: { width: 22, height: 22, stroke: '#111', fill: 'none', strokeWidth: 1.5 },
  bBadgeSpan: { fontSize: 9, fontWeight: 600, color: '#111', textAlign: 'center', lineHeight: 1.2 },
  bDivider: { width: 1.5, height: 32, background: '#eaeaea', marginRight: 8 },
  alertBox: { padding: '10px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 500, marginTop: 14, textAlign: 'center' },
  colorPicker: { position: 'absolute', top: '100%', left: 0, marginTop: 6, display: 'flex', gap: 6, background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 8, boxShadow: '0 6px 20px rgba(0,0,0,.15)', zIndex: 20 },
  colorSwatch: { width: 22, height: 22, borderRadius: '50%', cursor: 'pointer' },
  cta: { position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 35%, #fff 50%)', padding: '30px 18px 16px' },
  atcBtn: { width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 40, padding: 13, fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 6 },
  btnPopover: { position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 10, boxShadow: '0 6px 20px rgba(0,0,0,.15)', zIndex: 20 },
  popLabel: { fontSize: 9.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: 3, marginTop: 6 },
  popInput: { width: '100%', padding: 7, borderRadius: 6, border: '1px solid #ddd', fontSize: 12, boxSizing: 'border-box' },
  popClose: { marginTop: 8, width: '100%', padding: 7, background: '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  guarantee: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 11.5, color: '#111' },
  gDot: { width: 18, height: 18, background: '#111', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};
