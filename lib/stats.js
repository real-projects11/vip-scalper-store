import { redis } from './redis';

const VISITS_KEY = 'stats:visits';
const SALES_KEY = 'stats:sales';
const REVENUE_KEY = 'stats:revenueTotal';

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
  const [visits, sales, revenue] = await Promise.all([
    redis.get(VISITS_KEY),
    redis.get(SALES_KEY),
    redis.get(REVENUE_KEY),
  ]);
  return {
    visits: Number(visits) || 0,
    sales: Number(sales) || 0,
    revenue: Number(revenue) || 0,
  };
}
