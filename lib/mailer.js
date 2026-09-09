// Envía el link de descarga por mail cuando se confirma un pago.
// Usa Resend (resend.com) — tiene plan gratis, no hace falta tarjeta.
// Si RESEND_API_KEY no está configurada, no rompe nada: solo no manda el mail.

export async function sendDownloadEmail(to, downloadUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return { skipped: true };

  const from = process.env.RESEND_FROM || 'VIP Scalper <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: 'Tu compra de VIP Scalper — link de descarga',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2>¡Pago confirmado!</h2>
            <p>Gracias por tu compra. Tu link de descarga:</p>
            <p style="margin:20px 0;">
              <a href="${downloadUrl}" style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Descargar VIPScalper.mq5
              </a>
            </p>
            <p style="color:#888;font-size:13px;">Este link vence en 1 hora. Si ya venció, escribinos a advancetrading.info@gmail.com y te lo reenviamos.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend error:', errText);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('Error enviando mail:', err.message);
    return { sent: false };
  }
}
