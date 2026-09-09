import { redis } from './redis';

const KEY = 'product:content';

// Estos son exactamente los valores que ya tiene vip-scalper-conectado.html
// hoy — así el primer deploy no cambia nada visualmente hasta que edites algo.
export const DEFAULT_CONTENT = {
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
  // Si se completa, pisa el FILE_URL de la variable de entorno sin redeployar.
  fileUrl: '',
};

export async function getContent() {
  const raw = await redis.get(KEY);
  if (!raw) return { ...DEFAULT_CONTENT };
  const parsed = typeof raw === 'string' ? safeParse(raw) : raw;
  return { ...DEFAULT_CONTENT, ...(parsed || {}) };
}

export async function setContent(patch) {
  const current = await getContent();
  const next = { ...current, ...patch };
  await redis.set(KEY, JSON.stringify(next));
  return next;
}

function safeParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}
