-- HOKUSAI · base de datos D1 (reservas + fidelidad)
-- Crear:  npx wrangler d1 execute hokusai --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS reservas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token       TEXT NOT NULL UNIQUE,          -- enlace privado del cliente
  fecha       TEXT NOT NULL,                 -- YYYY-MM-DD
  hora        TEXT NOT NULL,                 -- HH:MM
  adultos     INTEGER NOT NULL DEFAULT 0,
  ninos       INTEGER NOT NULL DEFAULT 0,
  bebes       INTEGER NOT NULL DEFAULT 0,
  nombre      TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  email       TEXT,
  comentarios TEXT,
  cumple      INTEGER NOT NULL DEFAULT 0,
  trona       INTEGER NOT NULL DEFAULT 0,
  carrito     INTEGER NOT NULL DEFAULT 0,
  estado      TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | confirmada | rechazada | cancelada
  tg_chat     TEXT,
  tg_msg      INTEGER,
  creada      TEXT NOT NULL DEFAULT (datetime('now')),
  gestionada_por TEXT
);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas (fecha, hora);

CREATE TABLE IF NOT EXISTS clientes (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo    TEXT NOT NULL UNIQUE,            -- va en el QR (HK-XXXXXX)
  token     TEXT NOT NULL UNIQUE,            -- enlace privado de la tarjeta
  nombre    TEXT NOT NULL,
  telefono  TEXT NOT NULL UNIQUE,            -- solo dígitos
  email     TEXT NOT NULL,
  promos    INTEGER NOT NULL DEFAULT 0,
  puntos    INTEGER NOT NULL DEFAULT 0,      -- saldo actual
  total     INTEGER NOT NULL DEFAULT 0,      -- puntos ganados en total (rango)
  creada    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movimientos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  puntos     INTEGER NOT NULL,               -- + suma, - canje
  importe    REAL,                           -- € de la cuenta (sumas)
  concepto   TEXT NOT NULL,
  staff      TEXT,
  creado     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mov_cliente ON movimientos (cliente_id, creado);

-- Qué tarjeta tiene "abierta" cada miembro del personal en el bot
CREATE TABLE IF NOT EXISTS bot_estado (
  chat_id  TEXT PRIMARY KEY,
  codigo   TEXT,
  modo     TEXT,
  actualizado TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Panel de admin ─────────────────────────────────────────
-- Horas cerradas a reservas (un registro por fecha+hora)
CREATE TABLE IF NOT EXISTS cierres (
  fecha TEXT NOT NULL,
  hora  TEXT NOT NULL,
  PRIMARY KEY (fecha, hora)
);
-- Estadísticas sin cookies: visitante = hash diario anónimo
CREATE TABLE IF NOT EXISTS visitas (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  dia      TEXT NOT NULL,
  visitante TEXT NOT NULL,
  pagina   TEXT NOT NULL,
  origen   TEXT NOT NULL,
  evento   TEXT,                 -- NULL = página vista; si no: llamar, whatsapp, como_llegar, reservar, instagram, tarjeta…
  creado   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visitas_dia ON visitas (dia);
