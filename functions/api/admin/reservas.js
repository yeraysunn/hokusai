// GET  /api/admin/reservas?fecha=YYYY-MM-DD → reservas del día, horas cerradas y pendientes de otros días
// POST /api/admin/reservas {id, accion} → confirmar | cancelar | llego | no_vino | deshacer
import { json, err, body, clean, HORAS, ahoraMadrid, fechaLarga, personasTxt, telefonoTxt, refrescar, avisarCliente } from '../../_lib.js';

const ACCIONES = { confirmar: 'confirmada', cancelar: 'rechazada', llego: 'llego', no_vino: 'no_vino' };

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const hoy = ahoraMadrid().fecha;
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(q.get('fecha') || '') ? q.get('fecha') : hoy;
  const [{ results: reservas }, { results: cierres }, { results: otras }] = await Promise.all([
    env.DB.prepare(`SELECT id,fecha,hora,adultos,ninos,bebes,nombre,telefono,email,comentarios,cumple,trona,carrito,estado,gestionada_por,creada FROM reservas WHERE fecha=? ORDER BY hora, id`).bind(fecha).all(),
    env.DB.prepare('SELECT hora FROM cierres WHERE fecha=?').bind(fecha).all(),
    env.DB.prepare(`SELECT fecha, COUNT(*) n FROM reservas WHERE estado='pendiente' AND fecha>=? AND fecha<>? GROUP BY fecha ORDER BY fecha LIMIT 10`).bind(hoy, fecha).all()
  ]);
  const activas = reservas.filter(r => ['pendiente', 'confirmada', 'llego'].includes(r.estado));
  return json({
    ok: true, fecha, fechaTxt: fechaLarga(fecha), hoy, horas: HORAS,
    cerradas: cierres.map(c => c.hora), martes: new Date(fecha + 'T12:00:00Z').getUTCDay() === 2,
    reservas: reservas.map(r => ({ ...r, personas: personasTxt(r), tel: telefonoTxt(r.telefono), total: r.adultos + r.ninos + r.bebes })),
    resumen: {
      reservas: activas.length,
      personas: activas.reduce((s, r) => s + r.adultos + r.ninos + r.bebes, 0),
      mediodia: activas.filter(r => r.hora < '17:00').reduce((s, r) => s + r.adultos + r.ninos + r.bebes, 0),
      noche: activas.filter(r => r.hora >= '17:00').reduce((s, r) => s + r.adultos + r.ninos + r.bebes, 0),
      pendientes: reservas.filter(r => r.estado === 'pendiente').length
    },
    otrasPendientes: otras.map(o => ({ fecha: o.fecha, fechaTxt: fechaLarga(o.fecha), n: o.n }))
  });
}

export async function onRequestPost({ request, env }) {
  const d = await body(request);
  const id = parseInt(d?.id), accion = clean(d?.accion, 20);
  if (!id || !(accion in ACCIONES || accion === 'deshacer')) return err('Acción no válida.');
  const r = await env.DB.prepare('SELECT * FROM reservas WHERE id=?').bind(id).first();
  if (!r) return err('No existe esa reserva.', 404);

  let estado;
  if (accion === 'deshacer') {
    // llegó / no vino → vuelve a confirmada;  confirmada / rechazada → vuelve a pendiente
    estado = ['llego', 'no_vino'].includes(r.estado) ? 'confirmada' : ['confirmada', 'rechazada'].includes(r.estado) ? 'pendiente' : null;
    if (!estado) return err('No se puede deshacer.');
  } else {
    estado = ACCIONES[accion];
    if (r.estado === 'cancelada') return err('El cliente la canceló.');
  }
  const nr = { ...r, estado, gestionada_por: 'Panel' };
  await env.DB.prepare('UPDATE reservas SET estado=?, gestionada_por=? WHERE id=?').bind(estado, 'Panel', id).run();
  await refrescar(env, nr);
  // Email al cliente solo al pasar de pendiente a confirmada/rechazada
  if (r.estado === 'pendiente' && (estado === 'confirmada' || estado === 'rechazada')) await avisarCliente(env, nr);
  return json({ ok: true, estado });
}
