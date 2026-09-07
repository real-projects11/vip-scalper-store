import { createReservation } from '../../lib/purchase';
import { allowCors } from '../../lib/cors';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { productId, contact } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'Falta productId' });

  try {
    const result = await createReservation(productId, contact);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export default allowCors(handler);
