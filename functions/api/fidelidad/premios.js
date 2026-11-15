// GET /api/fidelidad/premios → tienda de premios y rangos
import { json, PREMIOS, RANGOS, PUNTOS_POR_10 } from '../../_lib.js';
export const onRequestGet = () => json({ ok: true, porCada10: PUNTOS_POR_10, premios: PREMIOS, rangos: RANGOS });
