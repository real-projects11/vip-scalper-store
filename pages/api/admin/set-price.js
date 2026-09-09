import { setPrice } from '../../../lib/stats';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { price } = req.body || {};
  try {
    const newPrice = await setPrice(price);
    res.status(200).json({ ok: true, price: newPrice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
