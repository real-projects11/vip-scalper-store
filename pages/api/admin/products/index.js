import { getAllProductsAdmin, createProduct } from '../../../../lib/products';

export default async function handler(req, res) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    try {
      const products = await getAllProductsAdmin();
      res.status(200).json({ products });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const product = await createProduct();
      res.status(200).json({ product });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Método no permitido' });
}
