import { verifyDownloadToken } from '../../../lib/purchase';
import { getContent } from '../../../lib/product-content';

export default async function handler(req, res) {
  const { token } = req.query;
  const reservationId = verifyDownloadToken(token);

  if (!reservationId) {
    res.status(403).send('Este link no es válido o ya venció. Volvé a la tienda para generar uno nuevo.');
    return;
  }

  // El link de descarga se puede editar desde el panel (botón de la landing)
  // sin redeployar. Si no se cargó ninguno ahí, cae al FILE_URL de entorno.
  // - Google Drive: https://drive.google.com/uc?export=download&id=TU_FILE_ID
  // - Dropbox: el link de compartir, pero terminando en ?dl=1 (no ?dl=0)
  const content = await getContent();
  const fileUrl = content.fileUrl || process.env.FILE_URL;
  res.writeHead(302, { Location: fileUrl });
  res.end();
}
