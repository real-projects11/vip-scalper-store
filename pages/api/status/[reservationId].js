import { checkAndConfirm } from '../../../lib/purchase';
import { allowCors } from '../../../lib/cors';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { reservationId } = req.query;
  try {
    const result = await checkAndConfirm(reservationId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default allowCors(handler);
