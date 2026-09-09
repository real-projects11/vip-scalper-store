import { listActiveProducts } from '../../lib/products';
import { allowCors } from '../../lib/cors';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const products = await listActiveProducts();
    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default allowCors(handler);
