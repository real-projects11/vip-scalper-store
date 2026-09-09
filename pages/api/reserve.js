import { createReservation } from '../../lib/purchase';
import { allowCors } from '../../lib/cors';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { contact, productId } = req.body || {};
  try {
    const result = await createReservation(contact, productId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export default allowCors(handler);
