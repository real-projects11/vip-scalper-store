import { getContent, setContent } from '../../lib/product-content';
import { allowCors } from '../../lib/cors';

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const content = await getContent();
      res.status(200).json({ content });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const token = req.headers['x-admin-token'];
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    try {
      const content = await setContent(req.body || {});
      res.status(200).json({ content });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Método no permitido' });
}

export default allowCors(handler);
