import { trackVisit } from '../../lib/stats';
import { allowCors } from '../../lib/cors';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    await trackVisit();
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default allowCors(handler);
