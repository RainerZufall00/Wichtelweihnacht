// Gemeinsame Helfer: Schnee, Konfetti, Muh-Synthesizer, API, Toasts, PWA
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
export { store };

// ------------------------------------------------------------ API
export async function api(path, { method = 'GET', body, admin } = {}) {
  const headers = {};
  if (method !== 'GET') body = body || {}; // Server akzeptiert nur JSON
  if (body) headers['Content-Type'] = 'application/json';
  if (admin) headers['X-Admin-Token'] = admin;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw Object.assign(new Error(data.error || `Fehler ${res.status}`), { status: res.status });
  return data;
}

// ------------------------------------------------------------ Schnee
export function startSnow(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, flakes;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  function resize() {
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    const n = Math.round(Math.min(110, (innerWidth * innerHeight) / 9000));
    flakes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: (Math.random() * 2.2 + 0.8) * dpr, s: Math.random() * 0.6 + 0.3, d: Math.random() * Math.PI * 2,
    }));
  }
  resize();
  addEventListener('resize', resize);
  if (reducedMotion) flakes = flakes.slice(0, 30);
  let t = 0;
  (function frame() {
    t += 0.01;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const f of flakes) {
      if (!reducedMotion) {
        f.y += f.s * dpr;
        f.x += Math.sin(t + f.d) * 0.4 * dpr;
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
      }
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reducedMotion) requestAnimationFrame(frame);
  })();
}

// ------------------------------------------------------------ Konfetti
export function confetti({ count = 140, emojis = ['🐄', '🎁', '⭐', '❄️', '🎄', '🐾'] } = {}) {
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  const colors = ['#d42a2a', '#f2c14e', '#1f6f43', '#ffffff', '#5ad1ff', '#ff8fb1'];
  const parts = Array.from({ length: reducedMotion ? 30 : count }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: (fromLeft ? 0.1 : 0.9) * c.width,
      y: c.height * 0.75,
      vx: (fromLeft ? 1 : -1) * (Math.random() * 9 + 3) * dpr,
      vy: -(Math.random() * 16 + 10) * dpr,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      size: (Math.random() * 8 + 6) * dpr,
      color: colors[i % colors.length],
      emoji: Math.random() < 0.22 ? emojis[Math.floor(Math.random() * emojis.length)] : null,
    };
  });
  const start = performance.now();
  (function frame(now) {
    const el = now - start;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.vy += 0.32 * dpr;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - el / 4200);
      if (p.emoji) {
        ctx.font = `${p.size * 2.2}px serif`;
        ctx.fillText(p.emoji, 0, 0);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    if (el < 4200) requestAnimationFrame(frame);
    else c.remove();
  })(start);
}

// ------------------------------------------------------------ Sound (WebAudio-Synth, keine Dateien)
let actx;
const soundOn = () => store.get('sound') !== 'off';
function ac() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

export const sound = {
  get enabled() { return soundOn(); },
  toggle() { store.set('sound', soundOn() ? 'off' : 'on'); return soundOn(); },
  moo() {
    if (!soundOn()) return;
    const a = ac(), t = a.currentTime, dur = 1.5 + Math.random() * 0.4;
    const out = a.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(0.32, t + 0.15);
    out.gain.setValueAtTime(0.3, t + dur - 0.4);
    out.gain.linearRampToValueAtTime(0, t + dur);
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(350, t);
    lp.frequency.linearRampToValueAtTime(900, t + 0.35);
    lp.frequency.linearRampToValueAtTime(450, t + dur);
    lp.connect(out).connect(a.destination);
    const base = 130 + Math.random() * 30;
    for (const det of [0, 7]) {
      const o = a.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = det;
      o.frequency.setValueAtTime(base * 0.85, t);
      o.frequency.linearRampToValueAtTime(base, t + 0.25);
      o.frequency.linearRampToValueAtTime(base * 0.72, t + dur);
      const vib = a.createOscillator(), vg = a.createGain();
      vib.frequency.value = 5;
      vg.gain.value = 3;
      vib.connect(vg).connect(o.frequency);
      o.connect(lp);
      o.start(t); vib.start(t);
      o.stop(t + dur); vib.stop(t + dur);
    }
  },
  bark() {
    if (!soundOn()) return;
    const a = ac();
    [0, 0.22].forEach((off) => {
      const t = a.currentTime + off;
      const o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = 'square';
      o.frequency.setValueAtTime(520, t);
      o.frequency.exponentialRampToValueAtTime(230, t + 0.12);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.2;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.35, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(f).connect(g).connect(a.destination);
      o.start(t); o.stop(t + 0.16);
    });
  },
  bells() {
    if (!soundOn()) return;
    const a = ac();
    [784, 988, 1175, 1568, 1319, 1568].forEach((freq, i) => {
      const t = a.currentTime + i * 0.11;
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + 1);
    });
  },
  tick() {
    if (!soundOn()) return;
    const a = ac(), t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'triangle';
    o.frequency.value = 1800 + Math.random() * 400;
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + 0.06);
  },
};

export const buzz = (p = 15) => { try { navigator.vibrate?.(p); } catch {} };

export function soundToggle(btn) {
  const paint = () => { btn.textContent = sound.enabled ? '🔊' : '🔇'; btn.setAttribute('aria-label', sound.enabled ? 'Ton aus' : 'Ton an'); };
  paint();
  btn.addEventListener('click', () => { sound.toggle(); paint(); if (sound.enabled) sound.moo(); });
}

// ------------------------------------------------------------ Antippbare Tiere
export function wireTaps(root = document) {
  root.addEventListener('click', (e) => {
    const g = e.target.closest('.tap');
    if (!g) return;
    const kind = g.dataset.sound;
    if (kind === 'moo') sound.moo();
    if (kind === 'bark') sound.bark();
    buzz(20);
    g.classList.remove('wiggle');
    void g.getBBox?.();
    g.classList.add('wiggle');
    const says = (g.dataset.say || (kind === 'moo' ? 'Muuuh!' : 'Wuff!')).split('|');
    const i = Number(g.dataset.i || 0);
    g.dataset.i = (i + 1) % says.length;
    bubble(says[i], e.clientX, e.clientY);
  });
}

export function bubble(text, x, y) {
  const b = document.createElement('div');
  b.className = 'say';
  b.textContent = text;
  b.style.left = `${Math.min(Math.max(x, 130), innerWidth - 130)}px`;
  b.style.top = `${y}px`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 2600);
}

// ------------------------------------------------------------ Toast
export function toast(msg, kind = 'ok') {
  let host = $('.toasts');
  if (!host) { host = document.createElement('div'); host.className = 'toasts'; document.body.appendChild(host); }
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}

// ------------------------------------------------------------ PWA
export function setupPwa(startPath) {
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = `/manifest.webmanifest${startPath ? `?start=${encodeURIComponent(startPath)}` : ''}`;
  document.head.appendChild(link);
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
}
