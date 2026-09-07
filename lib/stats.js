import { redis } from './redis';
import { DEFAULT_PRICE } from './pricing';

const VISITS_KEY = 'stats:visits';
const SALES_KEY = 'stats:sales';
const REVENUE_KEY = 'stats:revenueTotal'; // suma de precios pagados, no de montos con decimales random
const PRICE_KEY = 'config:price';

export async function trackVisit() {
  await redis.incr(VISITS_KEY);
}

/** Llamado cuando una reserva se confirma como pagada */
export async function recordSale(price) {
  await Promise.all([
    redis.incr(SALES_KEY),
    redis.incrbyfloat(REVENUE_KEY, price),
  ]);
}

export async function getStats() {
  const [visits, sales, revenue, price] = await Promise.all([
    redis.get(VISITS_KEY),
    redis.get(SALES_KEY),
    redis.get(REVENUE_KEY),
    redis.get(PRICE_KEY),
  ]);
  return {
    visits: Number(visits) || 0,
    sales: Number(sales) || 0,
    revenue: Number(revenue) || 0,
    price: price ? Number(price) : DEFAULT_PRICE,
  };
}

export async function getPrice() {
  const v = await redis.get(PRICE_KEY);
  return v ? Number(v) : DEFAULT_PRICE;
}

export async function setPrice(newPrice) {
  const n = Number(newPrice);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Precio inválido');
  await redis.set(PRICE_KEY, String(n));
  return n;
}
