import { $, $$, api, esc, sleep, startSnow, confetti, sound, buzz, soundToggle, wireTaps, toast, setupPwa, store, reducedMotion } from './common.js';
import { farmScene, dog, milkChurn } from './art.js';

const token = location.pathname.split('/')[2] || '';
let state = null;
let spoiler = store.get('spoiler') === '1';

setupPwa(`/admin/${token}`);
startSnow($('#snow'));
wireTaps();
soundToggle($('#soundBtn'));
$('#hero').innerHTML = farmScene();
$$('[data-dogs]').forEach((el) => (el.innerHTML = dog('emmi') + dog('micky')));
$('#stage').innerHTML = milkChurn();

const call = (path, body) => api(`/api/admin/${path}`, { method: body ? 'POST' : 'GET', body, admin: token });
const show = (id) => $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
const nameOf = (id) => state.participants.find((p) => p.id === id)?.name || '?';
const linkOf = (p) => `${location.origin}/w/${p.token}`;

const PALETTE = ['#d42a2a', '#1f6f43', '#c98a4b', '#2c5aa0', '#8a4b2a', '#7b3fa0', '#d07a12', '#2f9a5f'];
const colorFor = (s) => PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

// ------------------------------------------------------------ Laden
async function load() {
  try {
    state = await call('state');
  } catch (e) {
    if (e.status === 401) return show('s-gate');
    toast(e.message, 'err');
    return;
  }
  render();
}

function render() {
  renderSettings();
  if (state.drawnAt) {
    renderDone();
    show('s-done');
  } else {
    renderSetup();
    show('s-setup');
  }
}

// ------------------------------------------------------------ Einstellungen
function renderSettings() {
  const s = state.settings;
  $$('[data-settings]').forEach((host) => {
    host.innerHTML = `
      <span class="kicker">${state.drawnAt ? 'Infos für alle' : 'Schritt 3'}</span>
      <h2>Rahmenbedingungen 🎁</h2>
      <label class="field">Budget <span class="hint">– steht auf jedem Los</span>
        <input type="text" name="budget" maxlength="40" placeholder="z.B. 25 €" value="${esc(s.budget)}"></label>
      <label class="field">Bescherung <span class="hint">– mit Countdown auf dem Los</span>
        <input type="datetime-local" name="date" value="${esc(s.date && s.date.length === 10 ? s.date + 'T18:00' : s.date)}"></label>
      <label class="field">Nachricht an alle <span class="hint">– optional</span>
        <textarea name="message" maxlength="600" placeholder="z.B. Wir treffen uns an Heiligabend im Kuhstall. Bitte Gummistiefel mitbringen!">${esc(s.message)}</textarea></label>
      <button class="btn green small" type="button">Speichern</button>`;
    $('button', host).addEventListener('click', async () => {
      try {
        state = await call('settings', {
          budget: $('[name=budget]', host).value,
          date: $('[name=date]', host).value,
          message: $('[name=message]', host).value,
        });
        renderSettings();
        toast('Gespeichert – die Kühe haben es notiert 🐄');
      } catch (e) { toast(e.message, 'err'); }
    });
  });
}

// ------------------------------------------------------------ Vorbereitung
function renderSetup() {
  const ps = state.participants;
  $('#chips').innerHTML = ps.map((p) => `<span class="chip">${esc(p.name)}<button type="button" data-del="${p.id}" aria-label="${esc(p.name)} entfernen">✕</button></span>`).join('');
  $('#herdCount').textContent = ps.length
    ? `${ps.length} ${ps.length === 1 ? 'Wichtel' : 'Wichtel'} im Stall${ps.length < 3 ? ' – mindestens 3 braucht es.' : '.'}`
    : 'Noch ist der Stall leer. Muh?';
  const opts = ps.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('#exA').innerHTML = opts;
  $('#exB').innerHTML = opts;
  if (ps[1]) $('#exB').value = ps[1].id;
  $('#exList').innerHTML = state.exclusions.length
    ? state.exclusions.map(([a, b], i) => `<li><span>${esc(nameOf(a))} ✕ ${esc(nameOf(b))}</span><button class="linkish" data-ex="${i}" type="button">entfernen</button></li>`).join('')
    : '<li class="muted" style="justify-content:center">Keine Sperren – alle dürfen alle ziehen.</li>';
  $('#drawBtn').disabled = ps.length < 3;
  $('#drawHint').textContent = ps.length < 3 ? 'Erst ab 3 Leuten geht die Lostrommel an.' : `${ps.length} Lose liegen bereit.`;
  $('#spoilerChk').checked = spoiler;
}

// Änderungen nacheinander abarbeiten, damit sich schnelle Eingaben nicht überholen
let queue = Promise.resolve();
const names = () => state.participants.map((p) => p.name);
function saveHerd(makeNames, makeExcl = () => state.exclusions) {
  const job = queue.then(async () => {
    try {
      state = await call('participants', { names: makeNames(), exclusions: makeExcl() });
      renderSetup();
      return true;
    } catch (e) {
      toast(e.message, 'err');
      return false;
    }
  });
  queue = job;
  return job;
}

async function addNames() {
  const raw = $('#nameInput').value;
  const add = raw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  if (!add.length) return;
  $('#nameInput').value = '';
  $('#nameInput').focus();
  if (await saveHerd(() => [...names(), ...add])) {
    sound.tick();
    buzz(10);
  } else if (!$('#nameInput').value) {
    $('#nameInput').value = raw;
  }
}
$('#addBtn').addEventListener('click', addNames);
$('#nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addNames(); } });
$('#nameInput').addEventListener('paste', () => setTimeout(() => { if (/[\n,;]/.test($('#nameInput').value)) addNames(); }, 0));
$('#chips').addEventListener('click', (e) => {
  const id = e.target.dataset.del;
  if (!id) return;
  saveHerd(() => state.participants.filter((p) => p.id !== id).map((p) => p.name), () => state.exclusions.filter((x) => !x.includes(id)));
});
$('#exAdd').addEventListener('click', () => {
  const a = $('#exA').value, b = $('#exB').value;
  if (!a || !b || a === b) return toast('Man kann sich nicht selbst sperren. Das macht schon die Auslosung.', 'err');
  if (state.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return toast('Die zwei sind schon gesperrt.');
  saveHerd(names, () => [...state.exclusions, [a, b]]);
});
$('#exList').addEventListener('click', (e) => {
  const i = e.target.dataset.ex;
  if (i === undefined) return;
  saveHerd(names, () => state.exclusions.filter((_, k) => k !== Number(i)));
});
$('#spoilerChk').addEventListener('change', (e) => { spoiler = e.target.checked; store.set('spoiler', spoiler ? '1' : '0'); });

// ------------------------------------------------------------ Die große Show
const STATUS = [
  'Kühe werden zur Abstimmung gerufen …',
  'Emmi schnüffelt an jedem Los …',
  'Micky bewacht die Milchkanne. Grimmig.',
  'Lose werden im Mondlicht gemolken …',
  'Kuh Berta hat ein Los gefressen. Wird nachgedruckt …',
  'Demeter-konforme Durchmischung läuft …',
  'Hörner-Check: alle noch dran ✓',
  'Fast fertig. Bitte nicht muhen …',
];

$('#drawBtn').addEventListener('click', async () => {
  const showEl = $('#show');
  const grid = $('#revealGrid');
  grid.innerHTML = '';
  $('#showClose').hidden = true;
  $('#meterBox').hidden = false;
  $('#stage').hidden = false;
  showEl.classList.add('on', 'rolling');
  document.body.style.overflow = 'hidden';
  sound.moo();
  buzz(30);

  const drawP = call('draw', {});
  drawP.catch(() => {});
  const slipNames = names();
  const total = reducedMotion ? 1200 : 5200;
  const t0 = performance.now();
  let si = 0;
  $('#showStatus').textContent = STATUS[0];
  const slipTimer = setInterval(() => {
    const s = document.createElement('div');
    s.className = 'slip';
    s.textContent = slipNames[Math.floor(Math.random() * slipNames.length)];
    s.style.setProperty('--dx', `${(Math.random() - 0.5) * 340}px`);
    s.style.setProperty('--dy', `${-120 - Math.random() * 160}px`);
    s.style.setProperty('--rot', `${(Math.random() - 0.5) * 120}deg`);
    $('#stage').appendChild(s);
    setTimeout(() => s.remove(), 1500);
    sound.tick();
  }, 170);
  const statusTimer = setInterval(() => { si = (si + 1) % STATUS.length; $('#showStatus').textContent = STATUS[si]; }, 900);
  const meterTimer = setInterval(() => { $('#meter').style.width = `${Math.min(100, ((performance.now() - t0) / total) * 100)}%`; }, 100);

  let err = null;
  try {
    state = await drawP;
  } catch (e) { err = e; }
  await sleep(Math.max(0, total - (performance.now() - t0)));
  clearInterval(slipTimer); clearInterval(statusTimer); clearInterval(meterTimer);
  showEl.classList.remove('rolling');

  if (err) {
    showEl.classList.remove('on');
    document.body.style.overflow = '';
    sound.bark();
    return toast(err.message, 'err');
  }

  $('#meterBox').hidden = true;
  $('#stage').hidden = true;
  $('#showStatus').innerHTML = '<span style="font-family:Xmas,Fredoka;font-size:40px">Muuuh! Ausgelost! 🎉</span>';
  sound.bells();
  confetti({ count: 200 });
  buzz([40, 40, 40, 40, 120]);
  grid.classList.toggle('spoiler', spoiler);
  const ordered = orderedChain();
  grid.innerHTML = ordered.map((p) => `<div class="flip"><span>🎁 ${esc(p.name)}</span><span>→</span><span class="to"${spoiler ? ' style="filter:blur(7px)"' : ''}>${esc(nameOf(p.receiverId))}</span></div>`).join('');
  const cards = $$('.flip', grid);
  for (const c of cards) {
    await sleep(reducedMotion ? 0 : 260);
    c.classList.add('in');
    sound.tick();
  }
  $('#showClose').hidden = false;
});

$('#showClose').addEventListener('click', () => {
  $('#show').classList.remove('on');
  document.body.style.overflow = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ------------------------------------------------------------ Nach der Auslosung
/** Teilnehmer in Kettenreihenfolge (A→B→C…), ggf. mehrere Kreise. */
function cycles() {
  const left = new Set(state.participants.map((p) => p.id));
  const out = [];
  while (left.size) {
    let cur = [...left][0];
    const cyc = [];
    while (left.has(cur)) { left.delete(cur); cyc.push(cur); cur = state.participants.find((p) => p.id === cur).receiverId; }
    out.push(cyc);
  }
  return out;
}
const orderedChain = () => cycles().flat().map((id) => state.participants.find((p) => p.id === id));

function renderDone() {
  const ps = state.participants;
  const opened = ps.filter((p) => p.openedAt).length;
  $('#drawnAt').textContent = new Date(state.drawnAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
  $('#stPeople').textContent = ps.length;
  $('#stOpened').textContent = opened;
  $('#stWishes').textContent = ps.filter((p) => p.hasWishes).length;
  $('#progress').style.width = `${(opened / ps.length) * 100}%`;
  $('#progressText').textContent =
    opened === ps.length ? 'Alle haben ihr Los gesehen. Die Herde ist bereit! 🐄🎄' : `Noch ${ps.length - opened} ${ps.length - opened === 1 ? 'Los' : 'Lose'} ungeöffnet im Stall.`;

  $('#pairsCard').classList.toggle('spoiler', spoiler);
  $('#peopleCard').classList.toggle('spoiler', spoiler);
  $('#spoilerBtn').textContent = spoiler ? '👀 Zeigen' : '🙈 Verstecken';
  $('#chain').innerHTML = cycles()
    .map((c) => `<div class="chain">${[...c, c[0]].map((id, i) => `${i ? '<span class="a">→</span>' : ''}<span class="n">${esc(nameOf(id))}</span>`).join('')}</div>`)
    .join('');

  $('#people').innerHTML = ps
    .map((p) => `<li class="person">
      <span class="avatar" style="background:${colorFor(p.name)}">${esc(p.name[0].toUpperCase())}</span>
      <span class="nm">${esc(p.name)} ${p.openedAt ? `<span class="badge ok" title="${esc(new Date(p.openedAt).toLocaleString('de-DE'))}">✓ geöffnet</span>` : '<span class="badge">✉️ ungeöffnet</span>'}${p.hasWishes ? '<span class="badge ok">📜 Wünsche</span>' : ''}</span>
      <span class="pair">beschenkt <b>${esc(nameOf(p.receiverId))}</b></span>
      <span class="acts">
        <button class="btn small" data-share="${p.id}" type="button">📤 Teilen</button>
        <button class="btn ghost small" data-copy="${p.id}" type="button">📋 Kopieren</button>
        <button class="btn green small" data-wa="${p.id}" type="button">💬 WhatsApp</button>
      </span>
    </li>`)
    .join('');
  $('#live').hidden = false;
}

const shareText = (p) =>
  `Moin ${p.name}! 🎄🐄\nDie Humberger Wichtelweihnacht ist ausgelost. Hier ist dein ganz persönliches Los – nicht weitergeben, sonst bellt Micky:\n${linkOf(p)}`;

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

$('#people').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  const b = e.target.closest('.pair b');
  if (b) { b.classList.toggle('peek'); return; }
  if (!btn) return;
  const p = state.participants.find((x) => x.id === (btn.dataset.share || btn.dataset.copy || btn.dataset.wa));
  if (!p) return;
  buzz(10);
  if (btn.dataset.share) {
    if (navigator.share) {
      try { await navigator.share({ title: 'Humberger Wichtelweihnacht', text: shareText(p) }); } catch {}
    } else {
      await copy(shareText(p));
      toast(`Nachricht für ${p.name} kopiert 📋`);
    }
  } else if (btn.dataset.copy) {
    await copy(linkOf(p));
    toast(`Link von ${p.name} kopiert 📋`);
  } else if (btn.dataset.wa) {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(p))}`, '_blank', 'noopener');
  }
});
$('#chain').addEventListener('click', (e) => { if (e.target.classList.contains('n')) e.target.style.filter = e.target.style.filter ? '' : 'none'; });

$('#copyAll').addEventListener('click', async () => {
  const text = `🎄 Humberger Wichtelweihnacht – persönliche Links\n\n${state.participants.map((p) => `${p.name}: ${linkOf(p)}`).join('\n')}`;
  await copy(text);
  toast('Alle Links kopiert 📋');
});

$('#spoilerBtn').addEventListener('click', () => {
  spoiler = !spoiler;
  store.set('spoiler', spoiler ? '1' : '0');
  renderDone();
});

$('#resetBtn').addEventListener('click', async () => {
  if ($('#resetText').value.trim().toUpperCase() !== 'NEU AUSLOSEN') {
    $('#resetText').focus();
    return toast('Bitte „NEU AUSLOSEN“ eintippen.', 'err');
  }
  try {
    state = await call('reset', { confirm: 'NEU AUSLOSEN', newLinks: $('#newLinks').checked });
    $('#resetText').value = '';
    sound.moo();
    toast('Zurückgesetzt. Die Kühe vergessen alles. Fast.');
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) { toast(e.message, 'err'); }
});

// Live-Status: alle 20 s schauen, wer schon geöffnet hat
setInterval(async () => {
  if (!state?.drawnAt || document.hidden || $('#show').classList.contains('on')) return;
  try {
    const before = state.participants.filter((p) => p.openedAt).length;
    state = await call('state');
    if (!state.drawnAt) return render();
    const after = state.participants.filter((p) => p.openedAt).length;
    renderDone();
    if (after > before) { toast('👀 Jemand hat gerade sein Los geöffnet!'); sound.moo(); }
  } catch {}
}, 20000);

load();
