// Contrato oficial de USDT en la red Tron (TRC20). Es siempre el mismo, no cambia.
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

/**
 * Trae las últimas transferencias USDT-TRC20 recibidas por tu wallet.
 * Usar una API key de TronGrid (gratis, se saca en https://www.trongrid.io/)
 * es opcional pero recomendado: sin ella el rate limit es mucho más bajo y
 * con varias compras simultáneas polleando podrías empezar a recibir 429s.
 */
export async function getRecentTrc20Transfers(wallet) {
  const url = `https://api.trongrid.io/v1/accounts/${wallet}/transactions/trc20?limit=30&contract_address=${USDT_CONTRACT}&only_confirmed=true&only_to=true`;

  const headers = {};
  if (process.env.TRONGRID_API_KEY) {
    headers['TRON-PRO-API-KEY'] = process.env.TRONGRID_API_KEY;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`TronGrid respondió ${res.status}`);
  }
  const data = await res.json();
  return data.data || [];
}
