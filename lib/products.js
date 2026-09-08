import crypto from 'crypto';
import { redis } from './redis';

const ALL_IDX = 'idx:products:all';
const ACTIVE_IDX = 'idx:products:active';

function productKey(id) {
  return `product:${id}`;
}

function newId() {
  return crypto.randomBytes(6).toString('hex');
}

function parseJsonArray(v) {
  if (Array.isArray(v)) return v;
  if (!v || typeof v !== 'string') return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isActive(v) {
  return v === '1' || v === 1 || v === true;
}

// Chips y badges son listas de { label, icon } — mismo problema de
// "traducción automática" de Redis que parseJsonArray, así que se cubren
// los dos casos (ya viene como array de objetos, o como texto JSON).
const ICON_KEYS = ['box', 'grid', 'square', 'target', 'check', 'shield', 'bolt', 'clock'];
function parseIconList(v) {
  const arr = parseJsonArray(v);
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const icon = ICON_KEYS.includes(item.icon) ? item.icon : 'box';
      const label = String(item.label || '').trim();
      return label ? { label, icon } : null;
    })
    .filter(Boolean);
}

function serialize(p) {
  return {
    id: p.id,
    name: p.name || '',
    shortDesc: p.shortDesc || '',
    price: Number(p.price) || 0,
    images: parseJsonArray(p.images),
    description: p.description || '',
    benefits: parseJsonArray(p.benefits),
    requirements: parseJsonArray(p.requirements),
    detailsList: parseJsonArray(p.detailsList),
    chips: parseIconList(p.chips),
    badges: parseIconList(p.badges),
    fileUrl: p.fileUrl || '',
    active: isActive(p.active),
    sold: Number(p.sold) || 0,
    createdAt: Number(p.createdAt) || 0,
    updatedAt: Number(p.updatedAt) || 0,
    // --- Clon 1:1 de la landing real ---
    brandName: p.brandName || 'MI TIENDA',
    bannerText: p.bannerText || 'Descarga Inmediata',
    stars: Math.min(5, Math.max(0, Number(p.stars ?? 5) || 0)),
    bestseller: isActive(p.bestseller),
    bestsellerText: p.bestsellerText || '🔥 Producto Más Vendido',
    ctaText: p.ctaText || 'Comprar ahora',
    guaranteeText: p.guaranteeText || 'Acceso inmediato a la descarga',
  };
}

/** Crea un producto en borrador — vacío, no se muestra hasta que lo actives */
export async function createProduct() {
  const id = newId();
  const now = Date.now();
  await redis.hset(productKey(id), {
    id,
    name: 'Producto nuevo (sin nombre)',
    shortDesc: '',
    price: '0',
    images: '[]',
    description: '',
    benefits: '[]',
    requirements: '[]',
    detailsList: '[]',
    chips: '[]',
    badges: '[]',
    fileUrl: '',
    active: '0',
    sold: '0',
    createdAt: String(now),
    updatedAt: String(now),
    brandName: 'MI TIENDA',
    bannerText: 'Descarga Inmediata',
    stars: '5',
    bestseller: '0',
    bestsellerText: '🔥 Producto Más Vendido',
    ctaText: 'Comprar ahora',
    guaranteeText: 'Acceso inmediato a la descarga',
  });
  await redis.zadd(ALL_IDX, { score: now, member: id });
  return serialize(await redis.hgetall(productKey(id)));
}

/** Actualiza los campos que vengan en el body — no pisa lo que no se manda */
export async function updateProduct(id, fields) {
  const key = productKey(id);
  const existing = await redis.hgetall(key);
  if (!existing || !existing.id) throw new Error('Producto no encontrado');

  const patch = { updatedAt: String(Date.now()) };
  if (fields.name !== undefined) patch.name = String(fields.name);
  if (fields.shortDesc !== undefined) patch.shortDesc = String(fields.shortDesc);
  if (fields.price !== undefined) patch.price = String(Number(fields.price) || 0);
  if (fields.images !== undefined) patch.images = JSON.stringify(fields.images);
  if (fields.description !== undefined) patch.description = String(fields.description);
  if (fields.benefits !== undefined) patch.benefits = JSON.stringify(fields.benefits);
  if (fields.requirements !== undefined) patch.requirements = JSON.stringify(fields.requirements);
  if (fields.detailsList !== undefined) patch.detailsList = JSON.stringify(fields.detailsList);
  if (fields.chips !== undefined) patch.chips = JSON.stringify(fields.chips);
  if (fields.badges !== undefined) patch.badges = JSON.stringify(fields.badges);
  if (fields.fileUrl !== undefined) patch.fileUrl = String(fields.fileUrl);
  if (fields.brandName !== undefined) patch.brandName = String(fields.brandName);
  if (fields.bannerText !== undefined) patch.bannerText = String(fields.bannerText);
  if (fields.stars !== undefined) patch.stars = String(Math.min(5, Math.max(0, Number(fields.stars) || 0)));
  if (fields.bestseller !== undefined) patch.bestseller = fields.bestseller ? '1' : '0';
  if (fields.bestsellerText !== undefined) patch.bestsellerText = String(fields.bestsellerText);
  if (fields.ctaText !== undefined) patch.ctaText = String(fields.ctaText);
  if (fields.guaranteeText !== undefined) patch.guaranteeText = String(fields.guaranteeText);

  await redis.hset(key, patch);

  if (fields.active !== undefined) {
    const wantActive = !!fields.active;
    await redis.hset(key, { active: wantActive ? '1' : '0' });
    if (wantActive) await redis.zadd(ACTIVE_IDX, { score: Date.now(), member: id });
    else await redis.zrem(ACTIVE_IDX, id);
  }

  return serialize(await redis.hgetall(key));
}

export async function incrementProductSold(id) {
  if (!id) return;
  await redis.hincrby(productKey(id), 'sold', 1);
}

/** Para el panel: todos los productos, activos y borradores */
export async function getAllProductsAdmin() {
  const ids = await redis.zrange(ALL_IDX, 0, -1, { rev: true });
  const results = [];
  for (const id of ids) {
    const p = await redis.hgetall(productKey(id));
    if (p && p.id) results.push(serialize(p));
  }
  return results;
}

/** Para el home: solo los productos activos */
export async function getActiveProducts() {
  const ids = await redis.zrange(ACTIVE_IDX, 0, -1, { rev: true });
  const results = [];
  for (const id of ids) {
    const p = await redis.hgetall(productKey(id));
    if (p && p.id && isActive(p.active)) results.push(serialize(p));
  }
  return results;
}

export async function getProduct(id) {
  const p = await redis.hgetall(productKey(id));
  if (!p || !p.id) return null;
  return serialize(p);
}
