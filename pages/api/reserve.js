import { createReservation } from '../../lib/purchase';
import { allowCors } from '../../lib/cors';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { contact } = req.body || {};
  try {
    const result = await createReservation(contact);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default allowCors(handler);
