# VIP Scalper — venta con pago USDT y liberación automática

Un solo producto (VIPScalper.mq5), precio editable, pago en USDT (TRC20). Al
confirmarse el pago en la blockchain — sin que hagas nada a mano — se libera
el link de descarga.

## Qué hay en esta carpeta

```
vip-scalper-store/
├── package.json
├── next.config.js          → hace que tu dominio muestre la landing directo
├── .env.example
├── lib/
│   ├── redis.js            → cliente de Upstash
│   ├── cors.js              → permite llamar la API desde otro dominio si hiciera falta
│   ├── pricing.js          → precio por defecto + generador de monto único
│   ├── stats.js            → visitas, ventas, ingresos, precio editable
│   ├── tron.js              → consulta a TronGrid
│   └── purchase.js         → toda la lógica: reservar, verificar pago, firmar token
├── pages/
│   ├── admin.js             → panel: visitas / ventas / precio
│   └── api/
│       ├── reserve.js                    → POST: inicia una compra
│       ├── track-visit.js                → POST: cuenta una visita
│       ├── status/[reservationId].js     → GET: pollea y verifica el pago
│       ├── download/[token].js           → GET: valida token y redirige al archivo
│       └── admin/
│           ├── stats.js                  → GET protegido: métricas
│           └── set-price.js              → POST protegido: cambia el precio
└── public/
    ├── vip-scalper-conectado.html   → la landing (tu diseño, ya con el botón conectado)
    └── buy-modal.js                  → el checkout: QR, polling, descarga
```

## Cómo funciona el flujo de pago

1. Comprador toca **"DESCARGAR BOT AHORA"** → `buy-modal.js` llama a
   `POST /api/reserve`, que genera un monto único con 6 decimales (para poder
   identificar el pago sin memo, ya que USDT-TRC20 no tiene) y una reserva
   con 18 minutos para pagar.
2. Se abre el modal con el QR + wallet + monto exacto, y arranca un polling
   cada 6 segundos a `/api/status/[reservationId]`.
3. Cada llamada de polling consulta TronGrid en vivo (últimas transferencias
   USDT-TRC20 a tu wallet) buscando una que matchee el monto exacto. Si la
   encuentra, marca la reserva como pagada y devuelve un token de descarga
   firmado (vence en 1 hora).
4. El modal muestra el botón de descarga, apuntando a
   `/api/download/[token]`, que valida el token y redirige al archivo.

No hay paso manual en ningún punto — no hay botón "ya pagué" que revisar vos,
no hace falta cron.

---

## Paso a paso para instalarlo

### 1. Subir el código a GitHub
- Descomprimí el ZIP.
- Creá un repo nuevo en GitHub (podés hacerlo vacío, sin README).
- Subí el contenido de la carpeta (no la carpeta en sí, sino lo que está
  adentro) a la raíz del repo. Por ejemplo, desde tu terminal, parado dentro
  de la carpeta descomprimida:
  ```
  git init
  git add .
  git commit -m "primer commit"
  git branch -M main
  git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
  git push -u origin main
  ```
  (o subilo directo desde la web de GitHub con "Add file → Upload files" si
  no querés usar la terminal)

### 2. Importar en Vercel
- Entrá a vercel.com → **Add New → Project**.
- Elegí el repo que acabás de subir. Vercel detecta que es Next.js solo, no
  toques nada del build.
- Todavía no le des "Deploy" definitivo — primero seguí al paso 3 para no
  tener que redeployar dos veces (aunque tampoco pasa nada si lo hacés, un
  redeploy es gratis e instantáneo).

### 3. Conectar la base de datos (Redis)
- En tu proyecto de Vercel → **Storage** → **Create Database** → **Upstash
  Redis** (hay un plan gratis que alcanza de sobra).
- Al crearla, Vercel completa solo `UPSTASH_REDIS_REST_URL` y
  `UPSTASH_REDIS_REST_TOKEN` en las variables de entorno del proyecto.

### 4. Cargar tus propias variables de entorno
En Vercel → tu proyecto → **Settings → Environment Variables**, cargá estas
(están todas listadas en `.env.example`):

| Variable | Valor |
|---|---|
| `WALLET_ADDRESS` | `TWgMxmdpLPcD3MZh7TJgecSpyEgARezJH9` |
| `PRODUCT_PRICE` | `25` |
| `LOCK_MINUTES` | `18` |
| `DOWNLOAD_SECRET` | un string random largo — generalo con `openssl rand -hex 32` en tu terminal, o cualquier generador de passwords online |
| `DOWNLOAD_TOKEN_MINUTES` | `60` |
| `FILE_URL` | `https://www.dropbox.com/scl/fi/2vxbvy04kgwjh5cnblcjl/VIPScalper.mq5?rlkey=46yf5l728ho4ozn6val6mus0l&st=w5n7hgpi&dl=1` |
| `TRONGRID_API_KEY` | opcional — te la sacás gratis en trongrid.io, recomendado para no toparte con el rate limit público |
| `ADMIN_TOKEN` | un string random — es tu "contraseña" para entrar a `/admin`. Generalo igual que `DOWNLOAD_SECRET` |

### 5. Deploy
- Le das **Deploy**. Cuando termina, Vercel te da una URL tipo
  `tu-proyecto.vercel.app`.
- Entrá a esa URL: gracias al `next.config.js` que ya viene armado, en la
  raíz del dominio se ve directo la landing de VIP Scalper (no hace falta
  que entres a `/vip-scalper-conectado.html`).

### 6. Probarlo antes de compartirlo
- Abrí la URL, tocá **"DESCARGAR BOT AHORA"**.
- Te debería aparecer el modal con el QR y el monto (algo como
  `$25.XXXXXX`).
- Mandá ese monto exacto a tu wallet desde cualquier billetera con USDT-TRC20
  (puede ser una transferencia chica de prueba si querés — el sistema no
  distingue "de prueba", cualquier monto que matchee libera la descarga).
- A los pocos segundos el modal debería cambiar solo al botón de descarga.

### 7. Dominio propio (opcional)
- Si querés que se vea en tu dominio (ej. `vipscalper.com`) en vez de
  `.vercel.app`: Vercel → tu proyecto → **Settings → Domains** → agregás el
  dominio y seguís las instrucciones para apuntar el DNS.

---

## Panel de admin

Entrá a `tu-proyecto.vercel.app/admin`, pegá tu `ADMIN_TOKEN`, y vas a ver:

- **Visitas** — se cuentan solas cada vez que alguien carga la landing.
- **Ventas** e **Ingresos** — se suman solos cada vez que se confirma un pago.
- **Precio** — editable ahí mismo. Al guardar, todas las compras nuevas usan
  el precio nuevo al instante, sin redeploy.

## Notas importantes

- **Archivo en Dropbox**: ya tiene el `?dl=1` al final, que es lo que hace
  que descargue directo en vez de mostrar la vista previa. Si en algún
  momento cambiás el archivo y generás un link nuevo desde Dropbox, acordate
  de cambiar el `?dl=0` final a `?dl=1`.
- **Rate limit de TronGrid**: con pocas compras simultáneas no es problema.
  Si en algún momento tenés mucho tráfico en simultáneo, cargá
  `TRONGRID_API_KEY` (paso 4) para tener un límite más alto.
- El token de descarga dura 1 hora (`DOWNLOAD_TOKEN_MINUTES`) — pasado ese
  tiempo el link deja de funcionar, para que no quede un link público dando
  vueltas para siempre. Si un comprador lo pierde, hoy no hay forma de
  regenerarlo desde el panel — es un tema pendiente para una v2 (guardar un
  contacto en la reserva y armar un "reenviar mi compra").
