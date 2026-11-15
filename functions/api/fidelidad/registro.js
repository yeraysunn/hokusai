// POST /api/fidelidad/registro {nombre, telefono, email, privacidad, promos, web} → crea la tarjeta
import { json, err, body, clean, digits, validEmail, token, codigoTarjeta, mail, plantillaMail, esc } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  const d = await body(request);
  if (!d) return err('Petición no válida.');
  if (d.web) return json({ ok: true, token: 'x' });
  const nombre = clean(d.nombre, 60), tel = digits(d.telefono).replace(/^34(?=\d{9}$)/, ''), email = clean(d.email, 120).toLowerCase();
  if (nombre.length < 2) return err('Escribe tu nombre.');
  if (tel.length < 9 || tel.length > 15) return err('Escribe un móvil válido.');
  if (!validEmail(email)) return err('Escribe un email válido: lo usamos para recuperar tu tarjeta.');
  if (!d.privacidad) return err('Tienes que aceptar la política de privacidad.');

  const ya = await env.DB.prepare('SELECT id FROM clientes WHERE telefono=?').bind(tel).first();
  if (ya) return err('Ese móvil ya tiene tarjeta. Usa «Ver mi tarjeta» y te la enviamos por email.', 409);

  let codigo, t = token(28);
  for (let i = 0; i < 5; i++) {
    codigo = codigoTarjeta();
    if (!(await env.DB.prepare('SELECT 1 FROM clientes WHERE codigo=?').bind(codigo).first())) break;
  }
  await env.DB.prepare('INSERT INTO clientes (codigo,token,nombre,telefono,email,promos) VALUES (?,?,?,?,?,?)').bind(codigo, t, nombre, tel, email, d.promos ? 1 : 0).run();

  const site = env.SITE_URL || new URL(request.url).origin;
  const link = `${site}/fidelidad/tarjeta/?t=${t}`;
  await mail(env, email, 'Tu tarjeta HOKUSAI ポイントカード', plantillaMail('¡Ya tienes tu tarjeta!',
    `<p style="margin:0 0 12px;font-size:16px">${esc(nombre)}, bienvenido/a al clan Hokusai 🍣</p><p style="margin:0;font-size:15px;line-height:1.55">Guarda este email: el botón abre tu tarjeta con tu QR. Enséñalo al pagar y suma <b>1.000 puntos por cada 10 €</b>.</p><p style="margin:12px 0 0;font-size:14px">Tu código: <b>${codigo}</b></p>`,
    { href: link, txt: 'ABRIR MI TARJETA' }));
  return json({ ok: true, token: t, enlace: link });
}
