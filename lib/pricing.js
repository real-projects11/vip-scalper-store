// Precio por defecto del archivo digital (en USDT). Se puede sobreescribir
// desde el panel de admin sin tocar variables de entorno ni redeployar —
// ver lib/stats.js (getPrice/setPrice).
export const DEFAULT_PRICE = Number(process.env.PRODUCT_PRICE || 5);

// Minutos que tiene el comprador para pagar antes de que la reserva expire
export const LOCK_MINUTES = Number(process.env.LOCK_MINUTES || 18);

export function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

// Genera un monto único con 6 decimales para poder identificar CADA compra
// sin depender de memo (USDT TRC20 no tiene memo). Misma lógica que en cima.
export function uniqueAmount(baseAmount) {
  const micro = Math.floor(Math.random() * 900000) + 50000; // 0.050000 a 0.949999
  return round6(baseAmount + micro / 1000000);
}
