import { redis } from './redis';
import { DEFAULT_PRICE } from './pricing';

const IDX = 'idx:products'; // zset: score = createdAt, member = slug
function key(slug) {
  return `product:${slug}`;
}

export const DEFAULT_CONTENT = {
  brandName: 'MI TIENDA',
  bannerText: 'Descarga Inmediata',
  bestseller: false,
  bestsellerText: '🔥 Producto Más Vendido',
  images: [],
  badges: [],
  stars: 5,
  reviewText: '',
  title: 'Producto sin nombre',
  chips: [],
  benefits: [],
  description: '',
  detailsList: [],
  requirements: [],
  alertText: '⚠️ Producto digital — sin reembolsos una vez entregado el archivo.',
  alertBg: '#fdf5d3',
  alertColor: '#735a00',
  buttonText: 'Comprar ahora',
  guaranteeText: 'Acceso inmediato a la descarga',
  fileUrl: '',
};

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // saca acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'producto';
}

async function uniqueSlug(base) {
  let slug = base;
  let n = 2;
  while (await redis.exists(key(slug))) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function safeParse(v) {
  try { return JSON.parse(v); } catch { return null; }
}
function parseField(v, fallback) {
  if (v === undefined || v === null) return fallback;
  if (typeof v === 'string') return safeParse(v) ?? fallback;
  return v; // ya venía deserializado
}

function serialize(slug, raw) {
  const content = parseField(raw.content, {});
  return {
    slug,
    active: raw.active === '1' || raw.active === 1 || raw.active === true,
    price: Number(raw.price) || 0,
    sold: Number(raw.sold) || 0,
    createdAt: Number(raw.createdAt) || 0,
    ...DEFAULT_CONTENT,
    ...content,
  };
}

export async function createProduct(name) {
  const base = slugify(name);
  const slug = await uniqueSlug(base);
  const now = Date.now();
  await redis.hset(key(slug), {
    active: '0',
    price: String(DEFAULT_PRICE),
    sold: '0',
    createdAt: String(now),
    content: JSON.stringify({ ...DEFAULT_CONTENT, title: name || DEFAULT_CONTENT.title }),
  });
  await redis.zadd(IDX, { score: now, member: slug });
  return getProduct(slug);
}

export async function getProduct(slug) {
  const raw = await redis.hgetall(key(slug));
  if (!raw || !raw.createdAt) return null;
  return serialize(slug, raw);
}

export async function listProducts() {
  const slugs = await redis.zrange(IDX, 0, -1, { rev: true });
  const out = [];
  for (const slug of slugs) {
    const p = await getProduct(slug);
    if (p) out.push(p);
  }
  return out;
}

export async function listActiveProducts() {
  return (await listProducts()).filter((p) => p.active);
}

/** fields puede traer active/price (van sueltos) y cualquier campo de contenido (van al blob JSON) */
export async function updateProduct(slug, fields) {
  const current = await getProduct(slug);
  if (!current) throw new Error('Producto no encontrado');

  const patch = {};
  if (fields.active !== undefined) patch.active = fields.active ? '1' : '0';
  if (fields.price !== undefined) patch.price = String(Number(fields.price) || 0);

  const { active, price, slug: _s, sold: _sold, createdAt: _c, ...contentFields } = fields;
  const nextContent = { ...current, ...contentFields };
  delete nextContent.slug;
  delete nextContent.active;
  delete nextContent.price;
  delete nextContent.sold;
  delete nextContent.createdAt;
  patch.content = JSON.stringify(nextContent);

  await redis.hset(key(slug), patch);
  return getProduct(slug);
}

export async function incrementSold(slug) {
  if (!slug) return;
  await redis.hincrby(key(slug), 'sold', 1).catch(() => {});
}
