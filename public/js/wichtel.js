import { $, $$, api, sleep, startSnow, confetti, sound, buzz, soundToggle, wireTaps, toast, setupPwa, store, reducedMotion } from './common.js';
import { farmScene, dog, cow, giftIcon } from './art.js';

const token = location.pathname.split('/')[2] || '';
const cacheKey = `wichtel:${token}`;
let me = null;
let result = null;

setupPwa(`/w/${token}`);
startSnow($('#snow'));
wireTaps();
soundToggle($('#soundBtn'));
$('#hero').innerHTML = farmScene();
$$('[data-dogs]').forEach((el) => (el.innerHTML = dog('emmi') + dog('micky')));
$$('[data-gift]').forEach((el) => (el.innerHTML = giftIcon()));
$$('[data-cow]').forEach((el) => (el.innerHTML = cow({ coat: 'braun', hat: 'santa' })));

function show(id) {
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  if (id !== 's-loading') $('#' + id).scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}
const setNames = () => $$('[data-name]').forEach((el) => (el.textContent = me.name));

// ------------------------------------------------------------ Start
async function init() {
  try {
    me = await api(`/api/w/${token}`);
  } catch (e) {
    const cached = JSON.parse(store.get(cacheKey) || 'null');
    if (e.status === 404 || !cached) return show('s-unknown');
    // Offline: zuletzt bekanntes Ergebnis anzeigen
    me = cached.me;
    result = cached.result;
    setNames();
    return showResult(false);
  }
  store.set('myLink', location.pathname);
  setNames();
  if (!me.drawn) return show('s-wait');
  show('s-ask');
}

// ------------------------------------------------------------ Sicherheitsfrage
$('#noBtn').addEventListener('click', () => {
  sound.bark();
  buzz([40, 60, 40]);
  show('s-nope');
  $('#s-nope').classList.add('shake');
  setTimeout(() => $('#s-nope').classList.remove('shake'), 600);
});
$('#backBtn').addEventListener('click', () => show('s-ask'));

$('#yesBtn').addEventListener('click', async () => {
  buzz(20);
  $('#yesBtn').disabled = true;
  try {
    const reveal = api(`/api/w/${token}/reveal`, { method: 'POST' });
    reveal.catch(() => {}); // Fehler wird unten beim await behandelt
    if (me.revealedBefore) {
      result = await reveal;
      persist();
      return showResult(false);
    }
    await securityCheck();
    result = await reveal;
    persist();
    startScratch();
  } catch (e) {
    toast(e.message, 'err');
    show('s-ask');
  } finally {
    $('#yesBtn').disabled = false;
  }
});

const persist = () => store.set(cacheKey, JSON.stringify({ me, result }));

const CHECKS = [
  ['🐕', 'Emmi macht extra ein Auge auf', 'Geruchsprobe: Plätzchen. Emmi schläft beruhigt weiter.'],
  ['🐾', 'Micky prüft den Pfotenabdruck', 'Daumen gilt als Pfote. Passt.'],
  ['🐄', 'Kuh Berta bestätigt per Muh', 'Muh-Faktor-Authentifizierung erfolgreich'],
  ['🎅', 'Abgleich mit der Liste vom Weihnachtsmann', 'Status: überwiegend artig'],
];

async function securityCheck() {
  show('s-check');
  const ul = $('#checks');
  ul.innerHTML = CHECKS.map(([i, t, s]) => `<li><span class="ico">${i}</span><span class="txt">${t}<small>${s}</small></span></li>`).join('');
  const items = $$('li', ul);
  const step = reducedMotion ? 250 : 950;
  for (let i = 0; i < items.length; i++) {
    items[i].classList.add('run');
    items[i].querySelector('.ico').textContent = '❄';
    if (i === 0) sound.bark();
    if (i === 2) sound.moo();
    await sleep(step);
    items[i].classList.replace('run', 'done');
    items[i].querySelector('.ico').textContent = '✓';
    $('#scanbar').style.width = `${((i + 1) / items.length) * 100}%`;
    buzz(12);
  }
  await sleep(450);
}

// ------------------------------------------------------------ Rubbellos
function drawFur(ctx, w, h, dpr) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fbf7ef';
  ctx.fillRect(0, 0, w, h);
  const spots = ['#2b2623', '#8a4b2a', '#2b2623'];
  for (let i = 0; i < 9; i++) {
    const cx = Math.random() * w, cy = Math.random() * h;
    const r = (Math.random() * 0.14 + 0.1) * Math.min(w, h) * 1.3;
    ctx.fillStyle = spots[i % spots.length];
    ctx.beginPath();
    const n = 9;
    const pts = Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2;
      const rr = r * (0.65 + Math.random() * 0.5);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    });
    ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let k = 0; k < n; k++) {
      const p = pts[k], q = pts[(k + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.fill();
  }
  // Label
  const label = '✨ Hier rubbeln ✨';
  ctx.font = `600 ${20 * dpr}px Fredoka, sans-serif`;
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(255,250,240,.93)';
  const bw = tw + 36 * dpr, bh = 46 * dpr;
  ctx.beginPath();
  ctx.roundRect((w - bw) / 2, (h - bh) / 2, bw, bh, 23 * dpr);
  ctx.fill();
  ctx.fillStyle = '#1f6f43';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, h / 2 + 1 * dpr);
}

function startScratch() {
  $('#who').textContent = result.receiver;
  show('s-scratch');
  const wrap = $('#scratchWrap');
  wrap.classList.remove('revealed');
  const cv = $('#scratch');
  cv.classList.remove('gone');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = wrap.getBoundingClientRect();
  cv.width = rect.width * dpr;
  cv.height = rect.height * dpr;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  drawFur(ctx, cv.width, cv.height, dpr);

  let drawing = false, last = null, moves = 0, done = false, lastTick = 0;
  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr];
  };
  const scratchLine = (a, b) => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 46 * dpr;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };
  const cleared = () => {
    const { data } = ctx.getImageData(0, 0, cv.width, cv.height);
    let clear = 0, total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) { total++; if (data[i] < 40) clear++; }
    return clear / total;
  };
  const finish = () => {
    if (done) return;
    done = true;
    cv.classList.add('gone');
    wrap.classList.add('revealed');
    sound.bells();
    buzz([30, 50, 30, 50, 80]);
    confetti();
    setTimeout(() => showResult(true), 2600);
  };
  cv.onpointerdown = (e) => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); scratchLine(last, [last[0] + 0.1, last[1]]); };
  cv.onpointermove = (e) => {
    if (!drawing || done) return;
    const p = pos(e);
    scratchLine(last, p);
    last = p;
    const now = performance.now();
    if (now - lastTick > 70) { sound.tick(); lastTick = now; buzz(4); }
    if (++moves % 12 === 0 && cleared() > 0.45) finish();
  };
  cv.onpointerup = cv.onpointercancel = () => { drawing = false; if (!done && cleared() > 0.45) finish(); };
  $('#lazyBtn').onclick = finish;
}

// ------------------------------------------------------------ Ergebnis
function showResult(celebrate) {
  $('#resultName').textContent = result.receiver;
  $('#herdLine').textContent = `Du bist einer von ${me.count} Wichteln im Humberger Stall.`;
  show('s-result');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (celebrate) setTimeout(() => sound.moo(), 300);
}

$('#againBtn').addEventListener('click', () => startScratch());

// ------------------------------------------------------------ Installieren
let deferred;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  $('#installBtn').hidden = false;
  $('#installHint').textContent = 'Ein Tipp und dein Los wohnt als App auf deinem Startbildschirm.';
});
$('#installBtn').addEventListener('click', async () => {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  $('#installBtn').hidden = true;
});
if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
  $('#installHint').innerHTML = 'In Safari unten auf <b>Teilen</b> ⬆️ tippen und <b>„Zum Home-Bildschirm“</b> wählen.';
}
if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
  $('#installHint').textContent = 'Läuft schon als App. Sehr professionell, die Kühe sind beeindruckt.';
}

init();
