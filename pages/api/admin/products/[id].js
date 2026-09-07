import { updateProduct, getProduct } from '../../../../lib/products';

export default async function handler(req, res) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const product = await getProduct(id);
      if (!product) return res.status(404).json({ error: 'No encontrado' });
      res.status(200).json({ product });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const product = await updateProduct(id, req.body || {});
      res.status(200).json({ product });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Método no permitido' });
}
