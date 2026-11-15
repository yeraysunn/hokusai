# Reservas con Telegram + Tarjeta de puntos · HOKUSAI

## Cómo funciona
- **/reservar** → el cliente elige día, hora y personas → se guarda en D1 → llega al grupo de Telegram con ✅ Confirmar / ❌ Rechazar → el cliente recibe un email y tiene `/reserva/?t=…` para ver o cancelar.
- **Bot** (solo personal): `/hoy`, `/manana`, `/dia 2026-12-24`, `/id`, `/ayuda`.
- **/fidelidad** (PRIVADA hasta la señal) → registro → tarjeta anime con QR en `/fidelidad/tarjeta/?t=…`.
  Al pagar, el camarero escanea el QR con la cámara del móvil → se abre el bot con la tarjeta → ➕ Sumar compra (escribe el importe) o 🎁 Canjear. `/puntos HK-XXXXXX 45,90` como atajo, `/deshacer` para corregir.
- Premios, rangos y puntos por cada 10 €: `functions/_lib.js` (PREMIOS, RANGOS, PUNTOS_POR_10).

## Puesta en marcha (una vez)
1. Bot: en Telegram habla con @BotFather → /newbot → guarda el token y el usuario del bot.
2. Crea un grupo "Reservas Hokusai", añade el bot.
3. Base de datos:
   npx wrangler login
   npx wrangler d1 create hokusai          → copia el id en wrangler.toml
   npx wrangler d1 execute hokusai --remote --file=schema.sql
4. Secretos (en el proyecto de Cloudflare Pages):
   npx wrangler pages secret put TELEGRAM_BOT_TOKEN
   npx wrangler pages secret put TELEGRAM_WEBHOOK_SECRET   (texto largo aleatorio)
   npx wrangler pages secret put BOT_USERNAME
   npx wrangler pages secret put RESEND_API_KEY
   npx wrangler pages secret put MAIL_FROM                 (ej: HOKUSAI <reservas@hokusaisushi.es>)
   npx wrangler pages secret put FIDELIDAD_PREVIEW_KEY     (clave para verla en privado)
5. Despliega (npx wrangler pages deploy) y abre una vez:
   https://hokusaisalou.com/api/telegram/setup?key=TU_WEBHOOK_SECRET
6. Escribe /id en el grupo y en privado al bot → guarda TELEGRAM_CHAT_ID (grupo) y TELEGRAM_STAFF_IDS (ids del personal, con comas). Vuelve a desplegar.

## Ver la tarjeta antes de lanzarla
https://hokusaisalou.com/fidelidad/?preview=TU_FIDELIDAD_PREVIEW_KEY  (queda guardado 30 días en ese navegador)

## Lanzar la tarjeta (la señal)
En wrangler.toml: FIDELIDAD_ACTIVA = "1" → desplegar. Después enlazarla desde la home.
