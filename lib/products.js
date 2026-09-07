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
    chips: parseJsonArray(p.chips),
    fileUrl: p.fileUrl || '',
    active: isActive(p.active),
    sold: Number(p.sold) || 0,
    createdAt: Number(p.createdAt) || 0,
    updatedAt: Number(p.updatedAt) || 0,
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
    chips: '[]',
    fileUrl: '',
    active: '0',
    sold: '0',
    createdAt: String(now),
    updatedAt: String(now),
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
  if (fields.chips !== undefined) patch.chips = JSON.stringify(fields.chips);
  if (fields.fileUrl !== undefined) patch.fileUrl = String(fields.fileUrl);

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
