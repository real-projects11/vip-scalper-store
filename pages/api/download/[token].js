import { verifyDownloadToken, getFileUrlForReservation } from '../../../lib/purchase';

export default async function handler(req, res) {
  const { token } = req.query;
  const reservationId = verifyDownloadToken(token);

  if (!reservationId) {
    res.status(403).send('Este link no es válido o ya venció. Volvé a la tienda para generar uno nuevo.');
    return;
  }

  const fileUrl = await getFileUrlForReservation(reservationId);
  if (!fileUrl) {
    res.status(404).send('No se encontró el archivo para esta compra. Escribinos y lo resolvemos.');
    return;
  }

  res.writeHead(302, { Location: fileUrl });
  res.end();
}
