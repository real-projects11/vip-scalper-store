# Advance Store — tienda multi-producto con pago en USDT

Home con varios productos, cada uno gestionado desde `/admin` (nombre,
precio, imágenes, descripción, archivo). Pago en USDT (TRC20), liberación
automática por blockchain o manual desde el panel como respaldo.

## Qué hay en esta carpeta

```
vip-scalper-store/
├── package.json
├── next.config.js          → la raíz del dominio muestra el home directo
├── .env.example
├── lib/
│   ├── redis.js            → cliente de Upstash
│   ├── cors.js             → CORS para llamar la API desde otro dominio
│   ├── pricing.js          → generador de monto único + minutos de lock
│   ├── stats.js            → visitas, ventas, ingresos globales del sitio
│   ├── products.js         → CRUD de productos (crear, editar, activar)
│   ├── tron.js              → consulta a TronGrid
│   └── purchase.js         → reservar, verificar pago, firmar token, historial
├── pages/
│   ├── admin.js             → panel: stats, productos, pendientes, historial
│   └── api/
│       ├── products.js                    → GET público: productos activos
│       ├── reserve.js                     → POST: inicia una compra de un producto
│       ├── track-visit.js                 → POST: cuenta una visita
│       ├── mark-paid/[reservationId].js   → POST: comprador avisa "ya pagué"
│       ├── status/[reservationId].js      → GET: pollea y verifica el pago
│       ├── download/[token].js            → GET: valida token, redirige al archivo
│       └── admin/
│           ├── stats.js                   → GET protegido: métricas del sitio
│           ├── pending.js                 → GET protegido: pagos pendientes
│           ├── sales.js                   → GET protegido: historial de ventas
│           ├── confirm/[reservationId].js → POST protegido: confirmar a mano
│           └── products/
│               ├── index.js               → GET listar todos / POST crear nuevo
│               └── [id].js                → GET uno / POST editar campos
└── public/
    ├── index.html            → el home (navbar, hamburguesa, grid de productos)
    └── store.js              → toda la lógica: listado, detalle, checkout
```

## Cómo funciona

### El catálogo
- Cada producto vive en Redis con: nombre, descripción corta (para la card),
  descripción larga, precio, imágenes, beneficios, requisitos, chips, link
  de descarga, y si está **activo** o no.
- Un producto **inactivo (borrador)** existe en el panel pero no aparece en
  el home. Lo cargás con calma, y cuando está listo lo activás con un botón
  — ahí aparece solo en la tienda.
- El home (`/`) pide `GET /api/products`, que solo devuelve los activos.

### El flujo de compra
1. Comprador toca una card → se abre el **detalle** del producto (imagen,
   descripción, beneficios, requisitos) con un botón "Comprar $X".
2. **Términos y condiciones** — checkbox obligatorio antes de avanzar.
3. **Contacto** — pide un email (se guarda con la reserva).
4. `POST /api/reserve` con el `productId` — genera un monto único con 6
   decimales (así se identifica el pago sin memo, ya que USDT-TRC20 no
   tiene) y muestra el QR + wallet + timer de 18 minutos.
5. En paralelo, un polling cada 6s a `/api/status/[reservationId]` consulta
   TronGrid en vivo. Si el monto matchea, libera la descarga solo.
6. Si el comprador toca **"Ya pagué"**, pasa a una pantalla de espera (el
   polling sigue corriendo igual de fondo) — solo es un aviso para que el
   panel lo priorice, no libera nada por sí solo.
7. Si la detección automática no llega a tiempo, confirmás **a mano desde
   el panel** con el mismo resultado final.

El archivo que se entrega es siempre el que tenía cargado el producto en el
momento exacto de la compra (queda "fotografiado" en la reserva) — si
después cambiás el link del producto, no afecta compras ya confirmadas.

---

## Paso a paso para instalarlo

### 1. Subir el código a GitHub
Descomprimí el ZIP y subí el contenido de la carpeta (no la carpeta en sí) a
la raíz de tu repo:
```
git init
git add .
git commit -m "tienda multi-producto"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Importar en Vercel
**Add New → Project** → elegís el repo. Detecta Next.js solo.

### 3. Conectar Redis
**Storage → Create Database → Upstash Redis** (plan gratis alcanza). Se
completan solas `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.

### 4. Cargar tus variables de entorno
En Settings → Environment Variables (ver `.env.example` para la lista
completa): `WALLET_ADDRESS`, `LOCK_MINUTES`, `DOWNLOAD_SECRET`,
`DOWNLOAD_TOKEN_MINUTES`, `ADMIN_TOKEN`, y opcionalmente
`TRONGRID_API_KEY`. **Ya no hace falta `PRODUCT_PRICE` ni ningún link de
archivo acá** — eso se carga por producto desde el panel.

### 5. Deploy
Al terminar, entrá a la URL. Vas a ver el home vacío ("Todavía no hay
productos disponibles") — es esperable, todavía no cargaste ninguno.

### 6. Cargar tu primer producto (VIP Scalper)
Entrá a `tu-proyecto.vercel.app/admin`, pegá tu `ADMIN_TOKEN`, tocá
**"+ Nuevo producto"**, tocá **"Editar"** en el que se creó, y completá:

| Campo | Valor sugerido |
|---|---|
| Nombre | VIP Scalper — Bot de Grid Automatizado |
| Descripción corta | Bot de trading automatizado para MetaTrader 5 |
| Precio | 25 |
| Imágenes | las 3 URLs que ya tenías (una por línea) |
| Descripción larga | el texto de grid/M1/parámetros que ya habíamos escrito |
| Beneficios | uno por línea, ej: "Corre una estrategia de grid de precisión en M1." |
| Requisitos | uno por línea, ej: "Requiere MetaTrader 5 (MT5)" |
| Chips | Archivo MQ5, Estrategia de Grid |
| Link de descarga | tu link de Dropbox con `?dl=1` al final |

Guardás, tocás **"Activar"**, y ya aparece en el home.

### 7. Probarlo antes de compartirlo
Abrí el home, tocá el producto, seguí el flujo completo, y mandá el monto
exacto desde una wallet con USDT-TRC20 para confirmar que la descarga se
libera sola.

---

## Panel de admin

- **Stats**: visitas, ventas, ingresos, conversión — de todo el sitio.
- **Productos**: crear, editar cualquier campo, y activar/desactivar. Un
  producto nuevo arranca como borrador (invisible) hasta que lo actives.
- **Pagos pendientes**: cada reserva activa con producto, monto, contacto, y
  destacados arriba los que avisaron "ya pagué". Botón para confirmar a
  mano.
- **Historial de compras**: producto, fecha, monto, contacto, y si se
  confirmó automático o a mano — de ahí sacás el email para reenviar el
  archivo si alguien te escribe.

## Notas importantes

- **Wallet compartida**: todos los productos cobran a la misma
  `WALLET_ADDRESS`. El monto único con 6 decimales es lo que distingue una
  compra de otra, así que no hay conflicto entre productos.
- **Rate limit de TronGrid**: con poco tráfico simultáneo no es problema; si
  crece, cargá `TRONGRID_API_KEY`.
- El token de descarga dura 1 hora (`DOWNLOAD_TOKEN_MINUTES`). Si un
  comprador lo pierde, hoy no hay forma de regenerarlo solo — usás el
  contacto del historial para reenviárselo vos a mano.
- El envío de mail sigue siendo manual por ahora: el contacto queda
  guardado en el panel, vos lo ves y le escribís.
