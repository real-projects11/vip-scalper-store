import { verifyDownloadToken } from '../../../lib/purchase';
import { redis } from '../../../lib/redis';
import { getProduct } from '../../../lib/products';

export default async function handler(req, res) {
  const { token } = req.query;
  const reservationId = verifyDownloadToken(token);

  if (!reservationId) {
    res.status(403).send('Este link no es válido o ya venció. Volvé a la tienda para generar uno nuevo.');
    return;
  }

  const r = await redis.hgetall(`reservation:${reservationId}`);
  const product = r?.productSlug ? await getProduct(r.productSlug) : null;

  // El link de descarga se edita desde el panel de cada producto (botón de
  // la landing) sin redeployar. Si por lo que sea no hay uno cargado, cae al
  // FILE_URL de entorno como último recurso.
  const fileUrl = product?.fileUrl || process.env.FILE_URL;
  if (!fileUrl) {
    res.status(500).send('El producto no tiene un archivo de descarga configurado.');
    return;
  }
  res.writeHead(302, { Location: fileUrl });
  res.end();
}
