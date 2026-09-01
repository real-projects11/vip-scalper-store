import crypto from 'crypto';
import { redis } from './redis';
import { LOCK_MINUTES, uniqueAmount } from './pricing';
import { getRecentTrc20Transfers } from './tron';
import { getPrice, recordSale } from './stats';

const WALLET = process.env.WALLET_ADDRESS;
const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET;
const DOWNLOAD_TOKEN_MINUTES = Number(process.env.DOWNLOAD_TOKEN_MINUTES || 60);

function newId() {
  return crypto.randomBytes(8).toString('hex');
}

function reservationKey(id) {
  return `reservation:${id}`;
}

/** Arranca una compra: genera un monto único con 6 decimales y un lock de LOCK_MINUTES */
export async function createReservation() {
  const reservationId = newId();
  const price = await getPrice();
  const amount = uniqueAmount(price);
  const now = Date.now();
  const expiresAt = now + LOCK_MINUTES * 60_000;

  await redis.hset(reservationKey(reservationId), {
    status: 'pending',
    amount: String(amount),
    price: String(price),
    createdAt: String(now),
    expiresAt: String(expiresAt),
  });
  // colchón de 1 min extra en el TTL de redis por si el chequeo tarda un toque
  await redis.expire(reservationKey(reservationId), LOCK_MINUTES * 60 + 60);

  return { reservationId, amount, expiresAt, wallet: WALLET };
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
    return { status: 'pending' };
  }

  const match = transfers.find((t) => {
    if (t.to !== WALLET) return false;
    // margen de 1 min hacia atrás por si el reloj del server y el de la
    // blockchain no coinciden exactamente
    if (Number(t.block_timestamp) < createdAt - 60_000) return false;
    const value = Number(t.value) / 1e6; // USDT TRC20 tiene 6 decimales
    return Math.abs(value - targetAmount) < 0.0000005;
  });

  if (!match) return { status: 'pending' };

  // Evita que la misma transacción confirme dos reservas si por lo que sea
  // se llama checkAndConfirm() dos veces en paralelo.
  const usedKey = `usedtx:${match.transaction_id}`;
  const claimed = await redis.set(usedKey, reservationId, { nx: true, ex: 60 * 60 * 24 * 7 });
  if (!claimed) return { status: 'pending' };

  const downloadToken = signDownloadToken(reservationId);
  await redis.hset(key, {
    status: 'paid',
    paidAt: String(Date.now()),
    txId: match.transaction_id,
    downloadToken,
  });
  await redis.persist(key); // saca el TTL, la reserva pagada queda para siempre como registro
  await recordSale(Number(r.price) || targetAmount);

  return { status: 'paid', downloadToken };
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
