// Ruta de UN SOLO USO para precargar el producto "VIP Scalper" con los datos
// que ya estaban en vip-scalper-conectado.html (la landing original que armó
// Pablo), para no tener que tipearlos a mano en el panel.
//
// Cómo usarla (una vez que esté deployado):
//   curl -X POST https://TU-DOMINIO.vercel.app/api/admin/seed-vip-scalper \
//     -H "x-admin-token: TU_ADMIN_TOKEN"
//
// Ojo: cada vez que la llames crea un producto NUEVO (no actualiza uno
// existente) — usala una sola vez. Después de correrla podés borrar este
// archivo si querés, no es necesaria para el funcionamiento normal de la
// tienda.

import { createProduct, updateProduct } from '../../../lib/products';

const VIP_SCALPER_DATA = {
  name: 'VIP Scalper — Bot de Grid Automatizado',
  shortDesc: 'Compatible con MetaTrader 5',
  price: 0, // ← completá el precio real desde el panel después de crearlo
  images: [
    'https://i.ibb.co/PZttFfmy/1000451361.png',
    'https://i.ibb.co/jvpsR2JR/1000451362.png',
    'https://i.ibb.co/BKVBPSTg/1000451363.png',
  ],
  description:
    'Bot de trading totalmente automatizado, diseñado para MetaTrader 5. Corre una estrategia de grid de precisión en el timeframe M1, en cualquier activo con spread bajo o cero, colocando órdenes de compra y venta en intervalos de precio definidos y cerrando todas las posiciones al alcanzar el objetivo de ganancia. No necesita intervención manual — solo configurás, activás, y lo dejás operar.\n📦 Incluye: archivo VIPScalper.mq5 + manual de instalación paso a paso.\n⚙️ Parámetros que controlás: GridSpacing, GridLevels, LotSize, GridProfitTarget, GridLossLimit, MaxDrawdown.',
  benefits: [
    'Corre una estrategia de grid de precisión en el timeframe M1.',
    'Abre y cierra órdenes automáticamente al alcanzar el objetivo de ganancia.',
    'Controlás GridSpacing, LotSize, GridProfitTarget y más.',
  ],
  requirements: [
    'MetaTrader 5 (MT5)',
    'Cuenta con spread bajo o cero en el símbolo elegido',
    'Conexión a internet estable',
    'Trading algorítmico habilitado en MT5',
  ],
  chips: ['Archivo MQ5', 'MT5'],
  fileUrl: '', // ← pegá acá el link de descarga real del .mq5
  active: true,
};

export default async function handler(req, res) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido — usá POST' });
  }

  try {
    const draft = await createProduct();
    const product = await updateProduct(draft.id, VIP_SCALPER_DATA);
    res.status(200).json({ ok: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
