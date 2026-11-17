'use strict';
/*
 * Humberger Wichtelweihnacht – kleiner Wichtel-Server ohne Abhängigkeiten.
 * Daten liegen als JSON in DATA_DIR/db.json.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
// Nur hinter einem Reverse-Proxy (Pangolin/Traefik) auf 1 setzen: dann zählt die IP aus X-Forwarded-For
const TRUST_PROXY = process.env.TRUST_PROXY === '1';

const MAX_PEOPLE = 80;
const MAX_NAME = 40;

// ---------------------------------------------------------------- Datenbank
const newToken = (bytes = 12) => crypto.randomBytes(bytes).toString('base64url');

function emptyDb() {
  return {
    version: 1,
    adminToken: null,
    participants: [], // {id, name, token, openedAt, revealCount}
    exclusions: [], // [idA, idB]
    drawnAt: null,
    assignments: {}, // giverId -> receiverId
  };
}

function loadDb() {
  try {
    return { ...emptyDb(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error('db.json konnte nicht gelesen werden:', e.message);
      process.exit(1);
    }
    return emptyDb();
  }
}

let db = loadDb();
delete db.settings;
for (const p of db.participants) delete p.wishes;
function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, DB_FILE);
}

if (process.env.ADMIN_TOKEN) {
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(process.env.ADMIN_TOKEN)) {
    console.error('ADMIN_TOKEN muss 24–128 Zeichen lang sein (A–Z, a–z, 0–9, _ oder -). Tipp: openssl rand -base64 24 | tr "+/" "-_"');
    process.exit(1);
  }
  db.adminToken = process.env.ADMIN_TOKEN;
} else if (!db.adminToken) {
  db.adminToken = newToken(18);
  save();
}

// ---------------------------------------------------------------- Auslosung
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Bevorzugt einen einzigen großen Kreis (A→B→C→…→A), damit sich niemand gegenseitig beschenkt. */
function drawAssignments(ids, exclusions) {
  const blocked = new Set();
  for (const [a, b] of exclusions) {
    blocked.add(`${a}|${b}`);
    blocked.add(`${b}|${a}`);
  }
  const ok = (g, r) => g !== r && !blocked.has(`${g}|${r}`);

  for (let t = 0; t < 20000; t++) {
    const order = shuffle(ids);
    if (order.every((g, i) => ok(g, order[(i + 1) % order.length]))) {
      return Object.fromEntries(order.map((g, i) => [g, order[(i + 1) % order.length]]));
    }
  }
  // Fallback: beliebige gültige Zuordnung (kleinere Kreise erlaubt)
  for (let t = 0; t < 50000; t++) {
    const recv = shuffle(ids);
    if (ids.every((g, i) => ok(g, recv[i]))) {
      return Object.fromEntries(ids.map((g, i) => [g, recv[i]]));
    }
  }
  return null;
}

// ---------------------------------------------------------------- Rate-Limits (im Speicher)
const LIMITS = {
  all: { max: 600, win: 5 * 60e3 }, // alle Anfragen
  write: { max: 60, win: 5 * 60e3 }, // POSTs
  miss: { max: 20, win: 15 * 60e3 }, // falsche Wichtel-Links
  adminFail: { max: 10, win: 15 * 60e3 }, // falscher Admin-Token
};
const hits = new Map();
function bucket(kind, ip) {
  const now = Date.now();
  const key = `${kind}|${ip}`;
  let b = hits.get(key);
  if (!b || b.reset < now) {
    if (hits.size > 50000) hits.clear(); // Speicher-Notbremse
    b = { n: 0, reset: now + LIMITS[kind].win };
    hits.set(key, b);
  }
  return b;
}
const blocked = (kind, ip) => bucket(kind, ip).n >= LIMITS[kind].max;
const count = (kind, ip) => ++bucket(kind, ip).n > LIMITS[kind].max;
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of hits) if (b.reset < now) hits.delete(k);
}, 60e3).unref();

function clientIp(req) {
  if (TRUST_PROXY) {
    // Rechtester Eintrag = die Adresse, die der eigene Proxy gesehen hat (nicht vom Client fälschbar)
    const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (xff.length) return xff[xff.length - 1].slice(0, 64);
  }
  return req.socket.remoteAddress || '?';
}

// ---------------------------------------------------------------- Helfer
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
function json(res, status, data) {
  send(res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
}

function readBody(req) {
  // Nur echtes JSON annehmen: erzwingt bei fremden Seiten einen CORS-Preflight (Schutz gegen CSRF)
  if (!/^application\/json(;|$)/i.test(req.headers['content-type'] || '')) {
    return Promise.reject(Object.assign(new Error('Nur JSON erlaubt'), { status: 415 }));
  }
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) {
        req.removeAllListeners('data');
        reject(Object.assign(new Error('Anfrage zu groß'), { status: 413 }));
      } else chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
        resolve(data);
      } catch {
        reject(Object.assign(new Error('Ungültiges JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

const cleanName = (n) => String(n ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
const byId = (id) => db.participants.find((p) => p.id === id);

function adminState() {
  return {
    drawnAt: db.drawnAt,
    participants: db.participants.map((p) => ({
      id: p.id,
      name: p.name,
      token: p.token,
      openedAt: p.openedAt || null,
      revealCount: p.revealCount || 0,
      receiverId: db.assignments[p.id] || null,
    })),
    exclusions: db.exclusions,
  };
}

// ---------------------------------------------------------------- API
// parts: ['api', 'w', token, action] (öffentlich unter /w/api/…) oder ['api', 'admin', action]
async function handleApi(req, res, parts, ip) {
  const method = req.method;
  if (method !== 'GET' && method !== 'POST') return json(res, 405, { error: 'nicht erlaubt' });
  if (method === 'POST' && count('write', ip)) return json(res, 429, { error: 'Langsam, die Kühe kommen nicht hinterher. Bitte kurz warten.' });

  // ---------- Wichtel (Teilnehmer)
  if (parts[1] === 'w' && parts[2]) {
    if (blocked('miss', ip)) return json(res, 429, { error: 'Zu viele falsche Links. Emmi macht kurz Pause – später nochmal.' });
    const p = db.participants.find((x) => safeEqual(x.token, parts[2]));
    if (!p) {
      count('miss', ip);
      return json(res, 404, { error: 'unbekannt' });
    }
    const action = parts[3] || '';

    if (method === 'GET' && action === '') {
      return json(res, 200, {
        name: p.name,
        drawn: Boolean(db.drawnAt),
        revealedBefore: Boolean(p.openedAt),
        count: db.participants.length,
      });
    }
    if (method === 'POST' && action === 'reveal') {
      if (!db.drawnAt) return json(res, 409, { error: 'noch nicht ausgelost' });
      const r = byId(db.assignments[p.id]);
      if (!r) return json(res, 500, { error: 'Zuordnung fehlt' });
      if (!p.openedAt) p.openedAt = new Date().toISOString();
      p.revealCount = (p.revealCount || 0) + 1;
      save();
      return json(res, 200, { receiver: r.name });
    }
    return json(res, 405, { error: 'nicht erlaubt' });
  }

  // ---------- Admin
  if (parts[1] === 'admin') {
    if (blocked('adminFail', ip)) return json(res, 429, { error: 'Zu viele Fehlversuche. Micky bewacht die Tür – später nochmal.' });
    const token = req.headers['x-admin-token'] || '';
    if (!safeEqual(token, db.adminToken)) {
      if (count('adminFail', ip)) console.warn(`⚠️  Viele falsche Admin-Versuche von ${ip}`);
      return json(res, 401, { error: 'Kein Zutritt' });
    }
    const action = parts[2] || '';

    if (method === 'GET' && action === 'state') return json(res, 200, adminState());

    const body = method === 'POST' ? await readBody(req) : {};

    if (method === 'POST' && action === 'participants') {
      if (db.drawnAt) return json(res, 409, { error: 'Schon ausgelost – erst zurücksetzen.' });
      const names = (Array.isArray(body.names) ? body.names : []).map(cleanName).filter(Boolean);
      const seen = new Set();
      for (const n of names) {
        const k = n.toLocaleLowerCase('de');
        if (seen.has(k)) return json(res, 400, { error: `„${n}“ steht doppelt drin. Zwei Kühe mit gleichem Namen verwirren den Stall.` });
        seen.add(k);
      }
      if (names.length > MAX_PEOPLE) return json(res, 400, { error: `Maximal ${MAX_PEOPLE} Leute – so groß ist nicht mal der Stall.` });
      // Bestehende Personen (gleicher Name) behalten ihren Link
      const old = new Map(db.participants.map((p) => [p.name.toLocaleLowerCase('de'), p]));
      db.participants = names.map((name) => {
        const prev = old.get(name.toLocaleLowerCase('de'));
        return prev ? { ...prev, name } : { id: newToken(6), name, token: newToken(12), openedAt: null, revealCount: 0 };
      });
      const ids = new Set(db.participants.map((p) => p.id));
      const excl = Array.isArray(body.exclusions) ? body.exclusions : db.exclusions;
      db.exclusions = excl
        .filter((e) => Array.isArray(e) && e.length === 2 && e[0] !== e[1] && ids.has(e[0]) && ids.has(e[1]))
        .filter((e, i, all) => all.findIndex((f) => (f[0] === e[0] && f[1] === e[1]) || (f[0] === e[1] && f[1] === e[0])) === i);
      save();
      return json(res, 200, adminState());
    }

    if (method === 'POST' && action === 'draw') {
      if (db.drawnAt) return json(res, 409, { error: 'Es wurde schon ausgelost.' });
      if (db.participants.length < 3) return json(res, 400, { error: 'Mindestens 3 Leute, sonst ist das kein Wichteln, sondern ein Tauschgeschäft.' });
      const a = drawAssignments(db.participants.map((p) => p.id), db.exclusions);
      if (!a) return json(res, 400, { error: 'Mit diesen Ausschlüssen geht die Auslosung nicht auf – selbst die Kühe sind ratlos. Bitte Ausschlüsse lockern.' });
      db.assignments = a;
      db.drawnAt = new Date().toISOString();
      for (const p of db.participants) {
        p.openedAt = null;
        p.revealCount = 0;
      }
      save();
      return json(res, 200, adminState());
    }

    if (method === 'POST' && action === 'reset') {
      if (body.confirm !== 'NEU AUSLOSEN') return json(res, 400, { error: 'Bestätigung fehlt.' });
      db.assignments = {};
      db.drawnAt = null;
      for (const p of db.participants) {
        p.openedAt = null;
        p.revealCount = 0;
        if (body.newLinks) p.token = newToken(12);
      }
      save();
      return json(res, 200, adminState());
    }
    return json(res, 404, { error: 'unbekannt' });
  }
  return json(res, 404, { error: 'unbekannt' });
}

// ---------------------------------------------------------------- Statische Dateien
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

function serveFile(res, rel, cache = 'no-cache', status = 200, extra = {}) {
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 404, 'Nicht gefunden');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Nicht gefunden', { 'Content-Type': 'text/plain; charset=utf-8' });
    send(res, status, data, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': cache, ...extra });
  });
}

// WhatsApp & Co. brauchen für das Vorschaubild eine vollständige Adresse
let wichtelHtml;
function serveWichtelPage(res) {
  if (!wichtelHtml) {
    wichtelHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'wichtel.html'), 'utf8');
    if (PUBLIC_URL) wichtelHtml = wichtelHtml.replace('content="/w/static/img/og.png"', `content="${PUBLIC_URL}/w/static/img/og.png"`);
  }
  send(res, 200, wichtelHtml, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
}

function manifest(res, url) {
  const start = url.searchParams.get('start') || '/';
  const valid = /^\/(w|admin)\/[A-Za-z0-9_-]{8,64}$/.test(start) ? start : '/';
  const isAdmin = valid.startsWith('/admin/');
  const body = {
    id: valid,
    name: isAdmin ? 'Wichtel-Zentrale' : 'Humberger Wichtelweihnacht',
    short_name: isAdmin ? 'Wichtel-Admin' : 'Wichteln',
    description: 'Bio-zertifiziertes Wichteln vom Humberger Hof – mit Kühen, Hörnern und zwei sehr wachsamen Hunden.',
    start_url: valid,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'de',
    background_color: '#0b1630',
    theme_color: '#0b1630',
    icons: [
      { src: '/w/static/img/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/w/static/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/w/static/img/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  send(res, 200, JSON.stringify(body), { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-cache' });
}

// ---------------------------------------------------------------- Router
const server = http.createServer(async (req, res) => {
  const ip = clientIp(req);
  if (count('all', ip)) return send(res, 429, 'Zu viele Anfragen', { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' });
  if (req.url.length > 2048) return send(res, 414, 'URL zu lang');
  let url;
  try {
    url = new URL(req.url, 'http://x');
  } catch {
    return send(res, 400, 'Ungültige Anfrage');
  }
  const p = url.pathname;
  try {
    // ===== Öffentlich (Pangolin-Regel „/w/*“ ohne Login): alles, was ein Wichtel-Link braucht
    if (p.startsWith('/w/api/')) return await handleApi(req, res, ['api', 'w', ...p.split('/').filter(Boolean).slice(2)], ip);
    if (p.startsWith('/w/') && req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Nicht erlaubt');
    if (/^\/w\/static\/(css|js|fonts|img)\/[A-Za-z0-9._-]+$/.test(p) && !p.includes('..')) return serveFile(res, p.slice(10), 'public, max-age=3600');
    if (p === '/w/sw.js') return serveFile(res, 'sw.js', 'no-cache', 200, { 'Service-Worker-Allowed': '/' });
    if (p === '/w/manifest.webmanifest') return manifest(res, url);
    if (/^\/w\/[A-Za-z0-9_-]{16,64}\/?$/.test(p) || p === '/w/shell') return serveWichtelPage(res);
    if (p.startsWith('/w/')) return send(res, 404, 'Nicht gefunden', { 'Content-Type': 'text/plain; charset=utf-8' });

    // ===== Hinter dem Pangolin-Login (zusätzlich durch den Admin-Token geschützt)
    if (p.startsWith('/api/admin/')) return await handleApi(req, res, p.split('/').filter(Boolean), ip);
    if (p.startsWith('/api/')) return json(res, 404, { error: 'unbekannt' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Nicht erlaubt');
    if (p === '/' || p === '/index.html') return serveFile(res, 'index.html');
    if (/^\/admin\/[A-Za-z0-9_-]+\/?$/.test(p)) return serveFile(res, 'admin.html');
    if (p === '/favicon.ico' || p === '/favicon.svg') return serveFile(res, 'img/icon.svg', 'public, max-age=86400');
    if (p === '/apple-touch-icon.png' || p === '/apple-touch-icon-precomposed.png') return serveFile(res, 'img/apple-touch-icon.png', 'public, max-age=86400');
    if (p === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /\n', { 'Content-Type': 'text/plain' });
    if (p === '/healthz') return send(res, 200, 'muh', { 'Content-Type': 'text/plain' });

    return serveFile(res, 'index.html', 'no-cache', 404);
  } catch (e) {
    if (!e.status) console.error(e);
    if (!res.headersSent) {
      if (e.status === 413) res.setHeader('Connection', 'close');
      json(res, e.status || 500, { error: e.status ? e.message : 'Da ist was im Stall umgefallen.' });
    }
    if (e.status === 413) res.on('finish', () => req.destroy());
  }
});

// Schutz gegen langsame/hängende Verbindungen (Slowloris & Co.)
server.headersTimeout = 10e3;
server.requestTimeout = 15e3;
server.keepAliveTimeout = 5e3;
server.maxHeadersCount = 50;
server.maxConnections = 500;

server.listen(PORT, () => {
  const base = PUBLIC_URL || `http://localhost:${PORT}`;
  console.log('🐄  Humberger Wichtelweihnacht läuft auf Port', PORT);
  console.log('🔑  Admin-Link:', `${base}/admin/${db.adminToken}`);
  if (!TRUST_PROXY) console.log('ℹ️  TRUST_PROXY ist aus – Rate-Limits gelten pro direkter Verbindung.');
});

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));
