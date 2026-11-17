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

const MAX_PEOPLE = 80;
const MAX_NAME = 40;
const MAX_WISH = 1500;

// ---------------------------------------------------------------- Datenbank
const newToken = (bytes = 12) => crypto.randomBytes(bytes).toString('base64url');

function emptyDb() {
  return {
    version: 1,
    adminToken: null,
    settings: { budget: '25 €', date: `${new Date().getFullYear()}-12-24T18:00`, message: '' },
    participants: [], // {id, name, token, wishes, openedAt, revealCount}
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
function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

if (process.env.ADMIN_TOKEN) {
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
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
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
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) {
        reject(Object.assign(new Error('zu groß'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Ungültiges JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

const cleanName = (n) => String(n ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
const cleanText = (t, max) => String(t ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, max);
const byId = (id) => db.participants.find((p) => p.id === id);

function adminState() {
  return {
    settings: db.settings,
    drawnAt: db.drawnAt,
    participants: db.participants.map((p) => ({
      id: p.id,
      name: p.name,
      token: p.token,
      openedAt: p.openedAt || null,
      revealCount: p.revealCount || 0,
      hasWishes: Boolean(p.wishes && p.wishes.trim()),
      receiverId: db.assignments[p.id] || null,
    })),
    exclusions: db.exclusions,
  };
}

// ---------------------------------------------------------------- API
async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]
  const method = req.method;

  // ---------- Wichtel (Teilnehmer)
  if (parts[1] === 'w' && parts[2]) {
    const p = db.participants.find((x) => safeEqual(x.token, parts[2]));
    if (!p) return json(res, 404, { error: 'unbekannt' });
    const action = parts[3] || '';

    if (method === 'GET' && action === '') {
      return json(res, 200, {
        name: p.name,
        drawn: Boolean(db.drawnAt),
        revealedBefore: Boolean(p.openedAt),
        settings: db.settings,
        wishes: p.wishes || '',
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
      return json(res, 200, { receiver: r.name, receiverWishes: r.wishes || '' });
    }
    if (method === 'POST' && action === 'wishes') {
      const body = await readBody(req);
      p.wishes = cleanText(body.wishes, MAX_WISH);
      save();
      return json(res, 200, { ok: true, wishes: p.wishes });
    }
    return json(res, 405, { error: 'nicht erlaubt' });
  }

  // ---------- Admin
  if (parts[1] === 'admin') {
    const token = req.headers['x-admin-token'] || '';
    if (!safeEqual(token, db.adminToken)) return json(res, 401, { error: 'Kein Zutritt' });
    const action = parts[2] || '';

    if (method === 'GET' && action === 'state') return json(res, 200, adminState());

    const body = method === 'POST' ? await readBody(req) : {};

    if (method === 'POST' && action === 'settings') {
      db.settings = {
        budget: cleanText(body.budget, 40).trim(),
        date: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(body.date || '') ? body.date : '',
        message: cleanText(body.message, 600),
      };
      save();
      return json(res, 200, adminState());
    }

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
        return prev ? { ...prev, name } : { id: newToken(6), name, token: newToken(12), wishes: '', openedAt: null, revealCount: 0 };
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

function serveFile(res, rel, cache = 'no-cache', status = 200) {
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 404, 'Nicht gefunden');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Nicht gefunden', { 'Content-Type': 'text/plain; charset=utf-8' });
    send(res, status, data, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': cache });
  });
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
      { src: '/static/img/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/static/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/static/img/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  send(res, 200, JSON.stringify(body), { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-cache' });
}

// ---------------------------------------------------------------- Router
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Nicht erlaubt');

    if (p === '/' || p === '/index.html') return serveFile(res, 'index.html');
    if (/^\/w\/[A-Za-z0-9_-]+\/?$/.test(p) || p === '/shell/wichtel') return serveFile(res, 'wichtel.html');
    if (/^\/admin\/[A-Za-z0-9_-]+\/?$/.test(p) || p === '/shell/admin') return serveFile(res, 'admin.html');
    if (p === '/sw.js') return serveFile(res, 'sw.js', 'no-cache', 200);
    if (p === '/manifest.webmanifest') return manifest(res, url);
    if (p === '/favicon.ico' || p === '/favicon.svg') return serveFile(res, 'img/icon.svg', 'public, max-age=86400');
    if (p === '/apple-touch-icon.png' || p === '/apple-touch-icon-precomposed.png') return serveFile(res, 'img/apple-touch-icon.png', 'public, max-age=86400');
    if (p === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /\n', { 'Content-Type': 'text/plain' });
    if (p === '/healthz') return send(res, 200, 'muh', { 'Content-Type': 'text/plain' });
    if (p.startsWith('/static/')) return serveFile(res, decodeURIComponent(p.slice(8)), 'public, max-age=3600');

    return serveFile(res, 'index.html', 'no-cache', 404);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, e.status || 500, { error: e.status ? e.message : 'Da ist was im Stall umgefallen.' });
  }
});

server.listen(PORT, () => {
  const base = PUBLIC_URL || `http://localhost:${PORT}`;
  console.log('🐄  Humberger Wichtelweihnacht läuft auf Port', PORT);
  console.log('🔑  Admin-Link:', `${base}/admin/${db.adminToken}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));
