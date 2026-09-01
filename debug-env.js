// Endpoint temporal SOLO para diagnóstico. Borralo (o el archivo entero)
// una vez que confirmemos que las variables están bien — no conviene
// dejarlo colgado en producción para siempre.
export default function handler(req, res) {
  res.status(200).json({
    vercelEnv: process.env.VERCEL_ENV || null,
    hasUpstashUrl: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    hasUpstashToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    hasWalletAddress: Boolean(process.env.WALLET_ADDRESS),
    hasFileUrl: Boolean(process.env.FILE_URL),
    hasAdminToken: Boolean(process.env.ADMIN_TOKEN),
    hasDownloadSecret: Boolean(process.env.DOWNLOAD_SECRET),
    hasProductPrice: Boolean(process.env.PRODUCT_PRICE),
  });
}
