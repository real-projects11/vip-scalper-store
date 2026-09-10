import { redis } from '../../../lib/redis';
import { getProduct } from '../../../lib/products';

const SLUG = 'vip-scalper';

const CONTENT = {
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
  fileUrl: '',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const existing = await getProduct(SLUG);
  if (existing) {
    return res.status(200).json({ product: existing, alreadyExisted: true });
  }

  const now = Date.now();
  await redis.hset(`product:${SLUG}`, {
    active: '1',
    price: '25',
    sold: '0',
    createdAt: String(now),
    content: JSON.stringify(CONTENT),
  });
  await redis.zadd('idx:products', { score: now, member: SLUG });

  const product = await getProduct(SLUG);
  res.status(200).json({ product, alreadyExisted: false });
}
