import { verifyDownloadToken } from '../../../lib/purchase';

export default async function handler(req, res) {
  const { token } = req.query;
  const reservationId = verifyDownloadToken(token);

  if (!reservationId) {
    res.status(403).send('Este link no es válido o ya venció. Volvé a la tienda para generar uno nuevo.');
    return;
  }

  // FILE_URL tiene que ser el link de DESCARGA DIRECTA del archivo.
  // - Google Drive: https://drive.google.com/uc?export=download&id=TU_FILE_ID
  // - Dropbox: el link de compartir, pero terminando en ?dl=1 (no ?dl=0)
  const fileUrl = process.env.FILE_URL;
  res.writeHead(302, { Location: fileUrl });
  res.end();
}
