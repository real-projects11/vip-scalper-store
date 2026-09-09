// Ruta de UN SOLO USO para precargar el producto "VIP Scalper" con el
// contenido REAL que ya tenías armado en el sistema viejo de un solo
// producto (lib/product-content.js) — ahora convertido en un producto más
// dentro del sistema multi-producto nuevo.
//
// Cómo usarla: andá a /admin-seed en el navegador, pegá tu ADMIN_TOKEN y
// tocá el botón. No hace falta terminal.
//
// Es seguro tocarla más de una vez: si el producto ya existe (por título),
// no crea un duplicado.

import { createProduct, updateProduct, listProducts } from '../../../lib/products';

const VIP_SCALPER_CONTENT = {
  brandName: 'VIP SCALPER®',
  bannerText: 'Descarga Inmediata del Bot',
  bestseller: true,
  bestsellerText: '🔥 Bot Más Vendido',
  images: [
    'https://i.ibb.co/PZttFfmy/1000451361.png',
    'https://i.ibb.co/jvpsR2JR/1000451362.png',
    'https://i.ibb.co/BKVBPSTg/1000451363.png',
  ],
  badges: [
    { icon: 'grid', label: 'Grid\nAutomático' },
    { icon: 'square', label: 'Timeframe\nM1' },
    { icon: 'target', label: 'Listo\npara MT5' },
  ],
  stars: 5,
  reviewText: 'Compatible con MetaTrader 5',
  title: 'VIP Scalper — Bot de Grid Automatizado',
  chips: [
    { icon: 'box', label: 'Archivo MQ5' },
    { badgeText: 'MT5', label: 'MT5 Estrategia de Grid' },
  ],
  benefits: [
    'Corre una estrategia de grid de precisión en el timeframe M1.',
    'Abre y cierra órdenes automáticamente al alcanzar el objetivo de ganancia.',
    'Controlás GridSpacing, LotSize, GridProfitTarget y más.',
  ],
  description:
    '📈 VIP Scalper — Bot de Grid Automatizado\nBot de trading totalmente automatizado, diseñado para MetaTrader 5. Corre una estrategia de grid de precisión en el timeframe M1, en cualquier activo con spread bajo o cero, colocando órdenes de compra y venta en intervalos de precio definidos y cerrando todas las posiciones al alcanzar el objetivo de ganancia. No necesita intervención manual — solo configurás, activás, y lo dejás operar.',
  detailsList: [
    '📦 Incluye: archivo VIPScalper.mq5 + manual de instalación paso a paso.',
    '⚙️ Parámetros que controlás: GridSpacing, GridLevels, LotSize, GridProfitTarget, GridLossLimit, MaxDrawdown.',
  ],
  requirements: [
    '💻 Requiere: MetaTrader 5 (MT5)',
    '📊 Cuenta con spread bajo o cero en el símbolo elegido',
    '🌐 Conexión a internet estable',
    '🔓 Trading algorítmico habilitado en MT5',
  ],
  alertText: '⚠️ Producto digital. El trading conlleva riesgo — resultados pasados no garantizan rendimientos futuros.',
  alertBg: '#fdf5d3',
  alertColor: '#735a00',
  buttonText: 'DESCARGAR BOT AHORA',
  guaranteeText: 'Acceso inmediato al archivo .mq5',
  fileUrl: '', // ← pegá acá el link de descarga real del .mq5 desde /admin/edit
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
    const existing = (await listProducts()).find((p) => p.title === VIP_SCALPER_CONTENT.title);
    if (existing) {
      return res.status(200).json({ ok: true, alreadyExisted: true, product: existing });
    }
    const draft = await createProduct(VIP_SCALPER_CONTENT.title);
    const product = await updateProduct(draft.slug, { ...VIP_SCALPER_CONTENT, active: true, price: 25 });
    res.status(200).json({ ok: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
