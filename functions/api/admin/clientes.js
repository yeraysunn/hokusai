// GET  /api/admin/clientes?q=texto          → buscar socios (nombre, teléfono, código, email)
// GET  /api/admin/clientes?id=N             → ficha + movimientos
// POST /api/admin/clientes {id, accion:'sumar', importe} | {id, accion:'canjear', premio} | {id, accion:'ajustar', puntos, motivo}
import { json, err, body, clean, digits, rango, PREMIOS, PUNTOS_POR_10, telefonoTxt } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const id = parseInt(q.get('id'));
  if (id) {
    const c = await env.DB.prepare('SELECT * FROM clientes WHERE id=?').bind(id).first();
    if (!c) return err('No existe.', 404);
    const { results } = await env.DB.prepare('SELECT * FROM movimientos WHERE cliente_id=? ORDER BY id DESC LIMIT 50').bind(id).all();
    return json({ ok: true, cliente: ficha(c), movimientos: results, premios: PREMIOS });
  }
  const t = clean(q.get('q'), 60);
  const tot = await env.DB.prepare('SELECT COUNT(*) n, COALESCE(SUM(puntos),0) p, SUM(promos) promos FROM clientes').first();
  let rows;
  if (t) {
    const like = `%${t}%`, dig = digits(t);
    rows = (await env.DB.prepare(`SELECT * FROM clientes WHERE nombre LIKE ? OR email LIKE ? OR codigo LIKE ? ${dig.length >= 3 ? 'OR telefono LIKE ?' : ''} ORDER BY creada DESC LIMIT 50`)
      .bind(...[like, like, like.toUpperCase(), ...(dig.length >= 3 ? [`%${dig}%`] : [])]).all()).results;
  } else {
    rows = (await env.DB.prepare('SELECT * FROM clientes ORDER BY creada DESC LIMIT 50').all()).results;
  }
  return json({ ok: true, total: tot.n, puntosVivos: tot.p, conPromos: tot.promos || 0, clientes: rows.map(ficha) });
}

const ficha = c => ({ id: c.id, codigo: c.codigo, nombre: c.nombre, telefono: telefonoTxt(c.telefono), email: c.email, promos: !!c.promos, puntos: c.puntos, total: c.total, rango: rango(c.total), creada: c.creada });

export async function onRequestPost({ request, env }) {
  const d = await body(request);
  const id = parseInt(d?.id);
  const c = id && await env.DB.prepare('SELECT * FROM clientes WHERE id=?').bind(id).first();
  if (!c) return err('No existe ese cliente.', 404);

  if (d.accion === 'sumar') {
    const imp = parseFloat(String(d.importe).replace(',', '.'));
    if (!(imp > 0) || imp > 2000) return err('Importe no válido.');
    const pts = Math.floor(imp / 10) * PUNTOS_POR_10;
    if (!pts) return err('Menos de 10 €: no suma puntos.');
    await env.DB.batch([
      env.DB.prepare('UPDATE clientes SET puntos=puntos+?, total=total+? WHERE id=?').bind(pts, pts, id),
      env.DB.prepare('INSERT INTO movimientos (cliente_id,puntos,importe,concepto,staff) VALUES (?,?,?,?,?)').bind(id, pts, imp, 'Compra', 'Panel')
    ]);
    return json({ ok: true, mensaje: `+${pts} puntos` });
  }
  if (d.accion === 'canjear') {
    const p = PREMIOS.find(x => x.id === d.premio);
    if (!p) return err('Premio no válido.');
    const r = await env.DB.prepare('UPDATE clientes SET puntos=puntos-? WHERE id=? AND puntos>=?').bind(p.puntos, id, p.puntos).run();
    if (!r.meta.changes) return err('No tiene puntos suficientes.');
    await env.DB.prepare('INSERT INTO movimientos (cliente_id,puntos,concepto,staff) VALUES (?,?,?,?)').bind(id, -p.puntos, 'Canje: ' + p.nombre, 'Panel').run();
    return json({ ok: true, mensaje: `${p.nombre} canjeado` });
  }
  if (d.accion === 'ajustar') {
    const pts = parseInt(d.puntos);
    const motivo = clean(d.motivo, 80) || 'Ajuste manual';
    if (!pts || Math.abs(pts) > 100000) return err('Puntos no válidos.');
    if (c.puntos + pts < 0) return err('El saldo no puede quedar en negativo.');
    await env.DB.batch([
      env.DB.prepare('UPDATE clientes SET puntos=puntos+?, total=total+? WHERE id=?').bind(pts, pts > 0 ? pts : 0, id),
      env.DB.prepare('INSERT INTO movimientos (cliente_id,puntos,concepto,staff) VALUES (?,?,?,?)').bind(id, pts, 'Ajuste: ' + motivo, 'Panel')
    ]);
    return json({ ok: true, mensaje: 'Ajuste guardado' });
  }
  return err('Acción no válida.');
}
