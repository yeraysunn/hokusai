// POST /api/fidelidad/acceso {telefono} → reenvía el enlace de la tarjeta al email registrado
// (respuesta siempre igual, para no revelar qué móviles están registrados)
import { json, err, body, digits, mail, plantillaMail, esc } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  const d = await body(request);
  const tel = digits(d?.telefono).replace(/^34(?=\d{9}$)/, '');
  if (tel.length < 9) return err('Escribe tu móvil.');
  const c = await env.DB.prepare('SELECT * FROM clientes WHERE telefono=?').bind(tel).first();
  if (c) {
    const site = env.SITE_URL || new URL(request.url).origin;
    await mail(env, c.email, 'Tu tarjeta HOKUSAI', plantillaMail('Aquí tienes tu tarjeta',
      `<p style="margin:0;font-size:16px">${esc(c.nombre)}, pulsa el botón para abrir tu tarjeta de puntos.</p>`,
      { href: `${site}/fidelidad/tarjeta/?t=${c.token}`, txt: 'ABRIR MI TARJETA' }));
  }
  return json({ ok: true, mensaje: 'Si ese móvil tiene tarjeta, te hemos enviado el enlace a tu email.' });
}
