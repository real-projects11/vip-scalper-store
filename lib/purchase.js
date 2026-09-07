import crypto from 'crypto';
import { redis } from './redis';
import { LOCK_MINUTES, uniqueAmount } from './pricing';
import { getRecentTrc20Transfers } from './tron';
import { recordSale } from './stats';
import { getProduct, incrementProductSold } from './products';

const WALLET = process.env.WALLET_ADDRESS;
const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET;
const DOWNLOAD_TOKEN_MINUTES = Number(process.env.DOWNLOAD_TOKEN_MINUTES || 60);

const PENDING_IDX = 'idx:reservations:pending';
const PAID_IDX = 'idx:reservations:paid';

function newId() {
  return crypto.randomBytes(8).toString('hex');
}

function reservationKey(id) {
  return `reservation:${id}`;
}

/** Arranca una compra de un producto puntual: precio y archivo se leen del producto */
export async function createReservation(productId, contact) {
  const product = await getProduct(productId);
  if (!product) throw new Error('Producto no encontrado');
  if (!product.active) throw new Error('Este producto no está disponible');

  const reservationId = newId();
  const amount = uniqueAmount(product.price);
  const now = Date.now();
  const expiresAt = now + LOCK_MINUTES * 60_000;

  await redis.hset(reservationKey(reservationId), {
    status: 'pending',
    productId: product.id,
    productName: product.name,
    fileUrl: product.fileUrl,
    amount: String(amount),
    price: String(product.price),
    contact: contact || '',
    createdAt: String(now),
    expiresAt: String(expiresAt),
  });
  // colchón de 1 min extra en el TTL de redis por si el chequeo tarda un toque
  await redis.expire(reservationKey(reservationId), LOCK_MINUTES * 60 + 60);
  await redis.zadd(PENDING_IDX, { score: now, member: reservationId });

  return { reservationId, amount, expiresAt, wallet: WALLET, productName: product.name };
}

/**
 * Llamado por el front mientras el comprador está en la pantalla del QR
 * (polling cada 5-8s). Cada llamada consulta TronGrid en vivo — no hace
 * falta cron. Si encuentra el pago, marca la reserva como pagada y devuelve
 * el token firmado para descargar el archivo.
 */
export async function checkAndConfirm(reservationId) {
  const key = reservationKey(reservationId);
  const r = await redis.hgetall(key);
  if (!r || !r.status) return { status: 'not_found' };

  if (r.status === 'paid') {
    return { status: 'paid', downloadToken: r.downloadToken };
  }

  if (Number(r.expiresAt) < Date.now()) {
    await redis.hset(key, { status: 'expired' });
    await redis.zrem(PENDING_IDX, reservationId);
    return { status: 'expired' };
  }

  const targetAmount = Number(r.amount);
  const createdAt = Number(r.createdAt);

  let transfers;
  try {
    transfers = await getRecentTrc20Transfers(WALLET);
  } catch (err) {
    // Si TronGrid falla o rate-limitea, no rompemos la compra: el front
    // va a reintentar en el próximo poll.
    return { status: 'pending', buyerConfirmed: !!r.buyerConfirmedAt };
  }

  const match = transfers.find((t) => {
    if (t.to !== WALLET) return false;
    // margen de 1 min hacia atrás por si el reloj del server y el de la
    // blockchain no coinciden exactamente
    if (Number(t.block_timestamp) < createdAt - 60_000) return false;
    const value = Number(t.value) / 1e6; // USDT TRC20 tiene 6 decimales
    return Math.abs(value - targetAmount) < 0.0000005;
  });

  if (!match) return { status: 'pending', buyerConfirmed: !!r.buyerConfirmedAt };

  // Evita que la misma transacción confirme dos reservas si por lo que sea
  // se llama checkAndConfirm() dos veces en paralelo.
  const usedKey = `usedtx:${match.transaction_id}`;
  const claimed = await redis.set(usedKey, reservationId, { nx: true, ex: 60 * 60 * 24 * 7 });
  if (!claimed) return { status: 'pending', buyerConfirmed: !!r.buyerConfirmedAt };

  return finalizePaid(key, reservationId, r, match.transaction_id);
}

/** El comprador avisa "ya pagué" — no cambia el estado, solo lo marca para que el panel lo priorice */
export async function markBuyerPaid(reservationId) {
  const key = reservationKey(reservationId);
  const r = await redis.hgetall(key);
  if (!r || !r.status) throw new Error('Reserva no encontrada');
  if (r.status === 'paid') return { status: 'paid', downloadToken: r.downloadToken };

  await redis.hset(key, { buyerConfirmedAt: String(Date.now()) });
  return { status: r.status };
}

/** Admin confirma a mano (vio el pago en la wallet pero por lo que sea la detección automática no llegó) */
export async function adminConfirmPayment(reservationId) {
  const key = reservationKey(reservationId);
  const r = await redis.hgetall(key);
  if (!r || !r.status) throw new Error('Reserva no encontrada');
  if (r.status === 'paid') return { status: 'paid', downloadToken: r.downloadToken };

  return finalizePaid(key, reservationId, r, 'manual-admin');
}

async function finalizePaid(key, reservationId, r, txId) {
  const downloadToken = signDownloadToken(reservationId);
  await redis.hset(key, {
    status: 'paid',
    paidAt: String(Date.now()),
    txId,
    downloadToken,
  });
  await redis.persist(key); // saca el TTL, la reserva pagada queda para siempre como registro
  await recordSale(Number(r.price) || Number(r.amount));
  await incrementProductSold(r.productId);
  await redis.zrem(PENDING_IDX, reservationId);
  await redis.zadd(PAID_IDX, { score: Date.now(), member: reservationId });

  return { status: 'paid', downloadToken };
}

/** El link real del archivo se resuelve siempre desde la reserva (snapshot al momento de comprar), nunca desde el producto en vivo */
export async function getFileUrlForReservation(reservationId) {
  const r = await redis.hgetall(reservationKey(reservationId));
  if (!r || r.status !== 'paid') return null;
  return r.fileUrl || null;
}

/** Para el panel: reservas pendientes (con quién avisó "ya pagué" primero) */
export async function getPendingReservations() {
  const ids = await redis.zrange(PENDING_IDX, 0, -1, { rev: true });
  const results = [];
  for (const id of ids) {
    const r = await redis.hgetall(reservationKey(id));
    if (!r || !r.status || r.status !== 'pending') {
      await redis.zrem(PENDING_IDX, id);
      continue;
    }
    if (Number(r.expiresAt) < Date.now()) {
      await redis.hset(reservationKey(id), { status: 'expired' });
      await redis.zrem(PENDING_IDX, id);
      continue;
    }
    results.push({
      reservationId: id,
      productName: r.productName || '—',
      amount: Number(r.amount),
      price: Number(r.price) || Number(r.amount),
      contact: r.contact || null,
      createdAt: Number(r.createdAt),
      expiresAt: Number(r.expiresAt),
      buyerConfirmedAt: r.buyerConfirmedAt ? Number(r.buyerConfirmedAt) : null,
    });
  }
  results.sort((a, b) => (b.buyerConfirmedAt || 0) - (a.buyerConfirmedAt || 0));
  return results;
}

/** Para el panel: historial de compras confirmadas */
export async function getSalesHistory(limit = 50) {
  const ids = await redis.zrange(PAID_IDX, 0, limit - 1, { rev: true });
  const results = [];
  for (const id of ids) {
    const r = await redis.hgetall(reservationKey(id));
    if (!r) continue;
    results.push({
      reservationId: id,
      productName: r.productName || '—',
      amount: Number(r.amount),
      price: Number(r.price) || Number(r.amount),
      contact: r.contact || null,
      paidAt: r.paidAt ? Number(r.paidAt) : null,
      txId: r.txId || null,
    });
  }
  return results;
}

/** Token firmado (HMAC) con expiración — así el link de descarga no queda abierto para siempre */
function signDownloadToken(reservationId) {
  const exp = Date.now() + DOWNLOAD_TOKEN_MINUTES * 60_000;
  const payload = `${reservationId}.${exp}`;
  const sig = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyDownloadToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [reservationId, exp, sig] = decoded.split('.');
    const payload = `${reservationId}.${exp}`;
    const expected = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex');
    if (sig !== expected) return null;
    if (Date.now() > Number(exp)) return null;
    return reservationId;
  } catch {
    return null;
  }
}
