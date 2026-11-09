'use strict';
/* =========================================================
   Notitas — aprende piano y música jugando (estilo Duolingo)
   Todo corre en el navegador; el progreso se guarda en el
   dispositivo y se puede compartir con un enlace/código.
   ========================================================= */

// ---------------- Utilidades ----------------
let rand = Math.random;
const rnd = n => Math.floor(rand() * n);
const pick = a => a[rnd(a.length)];
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mulberry32(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }
const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function weekKey(d = new Date()) { const x = new Date(d); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return dayKey(x); }
function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv); }
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) { if (k == null || k === false) continue; el.append(k.nodeType ? k : String(k)); }
  return el;
}
function toast(msg, ms = 2600) {
  const t = h('div', { class: 'toast' }, msg);
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), ms);
}
function confetti() {
  const colors = ['#7c5cff', '#ec4899', '#fbbf24', '#22c55e', '#0ea5e9', '#f97316'];
  for (let i = 0; i < 70; i++) {
    const c = h('div', { class: 'confetti' });
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    c.style.animationDelay = Math.random() * .4 + 's';
    document.body.append(c);
    setTimeout(() => c.remove(), 3800);
  }
}

// ---------------- Estado ----------------
const KEY = 'notitas-v1';
const GOAL = 30; // XP diarios
const AVATARS = ['🦊', '🐱', '🐼', '🦄', '🐸', '🐯', '🐵', '🐧', '🦁', '🐨', '🐶', '🐰', '🐻', '🐙', '🦉'];
let state = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.players) return s; } catch (e) { /* vacío */ }
  return { players: {}, current: null, notation: 'latin', sound: true };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento */ } }
const me = () => state.players[state.current];
function newPlayer(name, avatar) {
  const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return { id, name, avatar, xp: 0, weekXp: 0, weekKey: weekKey(), streak: 0, lastDay: null, stars: {}, days: {}, daily: {}, duelBest: 0, perfects: 0, badges: [], unlockAll: false, upd: Date.now() };
}
function freshen(p) {
  if (p.weekKey !== weekKey()) { p.weekKey = weekKey(); p.weekXp = 0; }
  return p;
}
const streakOf = p => (p.lastDay === dayKey() || p.lastDay === yesterdayKey()) ? p.streak : 0;
const todayXp = p => p.days[dayKey()] || 0;
const level = p => 1 + Math.floor(p.xp / 100);

function addXp(p, xp) {
  freshen(p);
  p.xp += xp; p.weekXp += xp;
  const t = dayKey();
  p.days[t] = (p.days[t] || 0) + xp;
  const keys = Object.keys(p.days).sort();
  while (keys.length > 21) delete p.days[keys.shift()];
  if (p.lastDay !== t) { p.streak = p.lastDay === yesterdayKey() ? p.streak + 1 : 1; p.lastDay = t; }
  p.upd = Date.now();
  const fresh = BADGES.filter(b => !p.badges.includes(b.id) && b.test(p));
  fresh.forEach(b => p.badges.push(b.id));
  save();
  return fresh;
}

const BADGES = [
  { id: 'first', icon: '🎉', name: 'Primera lección', test: p => Object.keys(p.stars).length >= 1 },
  { id: 'perfect', icon: '💯', name: 'Lección perfecta', test: p => p.perfects >= 1 },
  { id: 'goal', icon: '🎯', name: 'Meta diaria', test: p => todayXp(p) >= GOAL },
  { id: 'streak3', icon: '🔥', name: 'Racha de 3 días', test: p => p.streak >= 3 },
  { id: 'streak7', icon: '🌋', name: 'Racha de 7 días', test: p => p.streak >= 7 },
  { id: 'xp100', icon: '⭐', name: '100 XP', test: p => p.xp >= 100 },
  { id: 'xp500', icon: '🌟', name: '500 XP', test: p => p.xp >= 500 },
  { id: 'xp1000', icon: '💫', name: '1000 XP', test: p => p.xp >= 1000 },
  { id: 'song', icon: '🎶', name: 'Primera canción', test: p => Object.keys(p.stars).some(k => k.startsWith('canciones')) },
  { id: 'daily', icon: '🏆', name: 'Retador', test: p => Object.keys(p.daily).length >= 1 },
  { id: 'fast', icon: '⚡', name: '200 pts en el reto', test: p => p.duelBest >= 200 },
  { id: 'chords', icon: '🎹', name: 'Acordista', test: p => Object.keys(p.stars).some(k => k.startsWith('acordes')) },
];

// ---------------- Música ----------------
const LATIN = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const ENG = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const pcName = pc => (state.notation === 'en' ? ENG : LATIN)[((pc % 12) + 12) % 12];
const noteName = m => pcName(m % 12);
const isBlack = m => !WHITE_PCS.includes(((m % 12) + 12) % 12);
const freq = m => 440 * 2 ** ((m - 69) / 12);
const stepOf = m => (Math.floor(m / 12) - 5) * 7 + WHITE_PCS.indexOf(m % 12); // Do4 = 0

let actx = null;
function audio() {
  if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; actx = new C(); }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(f, when, dur, vol, partials) {
  if (!state.sound) return;
  const c = audio(); if (!c) return;
  const t = c.currentTime + when;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(c.destination);
  for (const [mult, amp, type] of partials) {
    const o = c.createOscillator(); o.type = type; o.frequency.value = f * mult;
    const og = c.createGain(); og.gain.value = amp;
    o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05);
  }
}
const PIANO = [[1, 1, 'triangle'], [2, .4, 'sine'], [3, .15, 'sine'], [4, .06, 'sine']];
const playNote = (m, when = 0, dur = 1.3) => tone(freq(m), when, dur, 0.32, PIANO);
function playSeq(seq, gap = 0.42) { seq.forEach((n, i) => [].concat(n).forEach(m => playNote(m, i * gap))); return seq.length * gap * 1000; }
const playChord = notes => notes.forEach(m => playNote(m, 0, 1.6));
const sfx = {
  ok() { tone(880, 0, .18, .18, [[1, 1, 'sine']]); tone(1318.5, .09, .3, .18, [[1, 1, 'sine']]); },
  bad() { tone(196, 0, .28, .14, [[1, 1, 'square'], [1.01, .5, 'sawtooth']]); tone(155, .12, .3, .12, [[1, 1, 'square']]); },
  win() { [72, 76, 79, 84].forEach((m, i) => tone(freq(m), i * .12, .5, .2, [[1, 1, 'triangle'], [2, .3, 'sine']])); },
};
document.addEventListener('pointerdown', () => audio(), { once: true });

// ---------------- Componentes visuales ----------------
function piano({ lo = 60, hi = 71, labels = false, onKey, short = false } = {}) {
  const wrap = h('div', { class: 'piano' + (short ? ' short' : '') });
  const whites = []; for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
  const W = whites.length;
  const keys = {};
  const press = (m, el, e) => {
    e.preventDefault();
    playNote(m);
    el.classList.add('down'); setTimeout(() => el.classList.remove('down'), 160);
    onKey && onKey(m, el);
  };
  whites.forEach(m => {
    const k = h('button', { class: 'key white', 'aria-label': noteName(m) }, labels ? noteName(m) : '');
    k.addEventListener('pointerdown', e => press(m, k, e));
    keys[m] = k; wrap.append(k);
  });
  for (let m = lo; m <= hi; m++) {
    if (!isBlack(m)) continue;
    const i = whites.indexOf(m - 1); if (i < 0 || i === W - 1) continue;
    const w = 62 / W;
    const k = h('button', { class: 'key black', 'aria-label': noteName(m), style: { left: `calc(${(i + 1) / W * 100}% - ${w / 2}%)`, width: w + '%' } }, labels ? noteName(m) : '');
    k.addEventListener('pointerdown', e => press(m, k, e));
    keys[m] = k; wrap.append(k);
  }
  wrap.mark = (m, cls) => keys[m] && keys[m].classList.add(cls);
  wrap.unmark = cls => Object.values(keys).forEach(k => k.classList.remove(cls));
  wrap.flash = (m, cls, ms = 450) => { if (!keys[m]) return; keys[m].classList.add(cls); setTimeout(() => keys[m].classList.remove(cls), ms); };
  return wrap;
}
function rangeFor(notes, minWhites = 8) {
  let lo = Math.min(...notes), hi = Math.max(...notes);
  if (isBlack(lo)) lo--; if (isBlack(hi)) hi++;
  while (lo % 12 !== 0 && lo % 12 !== 5) lo--; // empezar en Do o Fa
  const count = () => { let c = 0; for (let m = lo; m <= hi; m++) if (!isBlack(m)) c++; return c; };
  while (count() < minWhites) { hi++; if (isBlack(hi)) hi++; }
  return [lo, hi];
}

function staffSVG(notes, { labels = false } = {}) {
  const n = notes.length, W = Math.max(220, 92 + n * 46), H = 150;
  const y = s => 104 - (s - 2) * 6;
  const ink = '#2b2340';
  let s = `<svg class="staff" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="pentagrama">`;
  for (let st = 2; st <= 10; st += 2) s += `<line x1="8" x2="${W - 8}" y1="${y(st)}" y2="${y(st)}" stroke="${ink}" stroke-width="1.6"/>`;
  s += `<text class="clef" x="12" y="${y(2) + 13}" font-size="78" fill="${ink}">𝄞</text>`;
  notes.forEach((m, i) => {
    const st = stepOf(m), cx = 96 + i * 46, cy = y(st);
    for (let ls = 0; ls >= st; ls -= 2) s += `<line x1="${cx - 13}" x2="${cx + 13}" y1="${y(ls)}" y2="${y(ls)}" stroke="${ink}" stroke-width="1.6"/>`;
    for (let ls = 12; ls <= st; ls += 2) s += `<line x1="${cx - 13}" x2="${cx + 13}" y1="${y(ls)}" y2="${y(ls)}" stroke="${ink}" stroke-width="1.6"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="7.6" ry="5.6" transform="rotate(-20 ${cx} ${cy})" fill="${ink}"/>`;
    s += st < 6 ? `<line x1="${cx + 6.8}" x2="${cx + 6.8}" y1="${cy - 1}" y2="${cy - 38}" stroke="${ink}" stroke-width="1.8"/>`
      : `<line x1="${cx - 6.8}" x2="${cx - 6.8}" y1="${cy + 1}" y2="${cy + 38}" stroke="${ink}" stroke-width="1.8"/>`;
    if (labels) s += `<text x="${cx}" y="${H - 6}" text-anchor="middle" font-size="15" font-weight="800" fill="#7c5cff">${noteName(m)}</text>`;
  });
  return h('div', { class: 'center', html: s + '</svg>' }).firstChild;
}

const FIG = { w: { name: 'Redonda', beats: 4 }, h: { name: 'Blanca', beats: 2 }, q: { name: 'Negra', beats: 1 }, e: { name: 'Corchea', beats: 0.5 } };
const FKEYS = ['w', 'h', 'q', 'e'];
const fmtBeats = b => (Math.floor(b) ? Math.floor(b) : '') + (b % 1 ? '½' : '') || '0';
function figSVG(k) {
  const ink = '#2b2340';
  let s = `<svg class="fig" viewBox="0 0 40 72" xmlns="http://www.w3.org/2000/svg">`;
  if (k === 'w') s += `<ellipse cx="20" cy="56" rx="10" ry="6.5" fill="none" stroke="${ink}" stroke-width="3.4"/>`;
  else {
    s += `<ellipse cx="17" cy="57" rx="8.5" ry="6" transform="rotate(-20 17 57)" ${k === 'h' ? `fill="none" stroke="${ink}" stroke-width="2.8"` : `fill="${ink}"`}/>`;
    s += `<line x1="24.6" x2="24.6" y1="55" y2="10" stroke="${ink}" stroke-width="2.4"/>`;
    if (k === 'e') s += `<path d="M24.6 10 C 27 22, 38 25, 35 42 C 33 31, 29 28, 24.6 26 Z" fill="${ink}"/>`;
  }
  return h('div', { html: s + '</svg>' }).firstChild;
}

// ---------------- Generadores de ejercicios ----------------
function noteChoices(target, pool, n = 4) {
  const tpc = target % 12;
  let others = [...new Set(pool.map(m => m % 12))].filter(pc => pc !== tpc);
  if (others.length < n - 1) others = others.concat(WHITE_PCS.filter(pc => pc !== tpc && !others.includes(pc)));
  return shuffle([tpc, ...shuffle(others).slice(0, n - 1)]);
}
function numChoices(total) {
  const cand = [total + 1, total - 1, total + .5, total - .5, total + 2].filter(x => x > 0);
  return shuffle([total, ...shuffle(cand).slice(0, 3)]);
}
const chordNotes = c => (c.type === 'm' ? [0, 3, 7] : [0, 4, 7]).map(i => c.root + i);
const chordName = c => pcName(c.root) + (c.type === 'm' ? ' menor' : ' mayor');

const GEN = {
  keyFind: o => ({ kind: 'keyFind', target: pick(o.pool), lo: o.lo ?? 60, hi: o.hi ?? 71 }),
  keyName: o => { const t = pick(o.pool); return { kind: 'keyName', target: t, lo: o.lo ?? 60, hi: o.hi ?? 71, opts: noteChoices(t, o.pool) }; },
  staffRead: o => { const t = pick(o.pool); return { kind: 'staffRead', target: t, opts: noteChoices(t, o.pool) }; },
  staffToKey: o => { const t = pick(o.pool); const [lo, hi] = rangeFor(o.pool, 8); return { kind: 'staffToKey', target: t, lo, hi }; },
  earHighLow: o => { const min = o.min || 5, max = o.max || 12; const a = 57 + rnd(14); const d = min + rnd(max - min + 1); const up = rand() < .5; return { kind: 'earHighLow', a, b: up ? a + d : a - d, up }; },
  earSame: o => { const a = 57 + rnd(14); const same = rand() < .5; const d = (1 + rnd(o.max || 4)) * (rand() < .5 ? 1 : -1); return { kind: 'earSame', a, b: same ? a : a + d, same }; },
  earContour: o => { const up = rand() < .5; const len = 3 + rnd(2); let n = 60 + rnd(7); const seq = [n]; for (let i = 1; i < len; i++) { n += (up ? 1 : -1) * (1 + rnd(o.step || 3)); seq.push(n); } return { kind: 'earContour', seq, up }; },
  rhythmName: () => ({ kind: 'rhythmName', fig: pick(FKEYS), opts: shuffle(FKEYS) }),
  rhythmValue: () => ({ kind: 'rhythmValue', fig: pick(FKEYS) }),
  rhythmSum: o => { const k = 2 + rnd(o.max ? o.max - 1 : 2); const figs = Array.from({ length: k }, () => pick(o.figs || FKEYS)); const total = figs.reduce((s, f) => s + FIG[f].beats, 0); return { kind: 'rhythmSum', figs, total, opts: numChoices(total) }; },
  chordBuild: o => ({ kind: 'chordBuild', chord: pick(o.chords), hint: !!o.hint }),
};
const SCALE = [60, 62, 64, 65, 67, 69, 71];
const W1 = [60, 62, 64], W2 = [60, 62, 64, 65, 67], W3 = SCALE;
const BLK = [61, 63, 66, 68, 70], ALL12 = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71];
const STAFF_HI = [72, 74, 76, 77, 79], STAFF_ALL = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];
const MAJ = [{ root: 60 }, { root: 65 }, { root: 67 }], MAJ2 = [...MAJ, { root: 62 }, { root: 64 }, { root: 69 }];
const MIN = [{ root: 69, type: 'm' }, { root: 62, type: 'm' }, { root: 64, type: 'm' }];

// ---------------- Contenido ----------------
const THEORY = [
  [['¿Cuántas líneas tiene el pentagrama?', '5', ['4', '6', '7']],
  ['Después de Si viene…', 'Do', ['La', 'Re', 'Mi']],
  ['¿Cuántas notas hay sin contar las teclas negras?', '7', ['5', '8', '12']],
  ['Las teclas negras van en grupos de…', '2 y 3', ['1 y 2', '3 y 4', '2 y 4']],
  ['En el piano, el dedo 1 es…', 'El pulgar', ['El meñique', 'El índice', 'El anular']],
  ['En el piano, el dedo 5 es…', 'El meñique', ['El pulgar', 'El medio', 'El índice']],
  ['¿Qué nota está justo a la izquierda de 2 teclas negras?', 'Do', ['Fa', 'Mi', 'Si']]],
  [['¿Qué hace un sostenido ♯?', 'Sube medio tono', ['Baja medio tono', 'Alarga la nota', 'Repite la nota']],
  ['¿Qué hace un bemol ♭?', 'Baja medio tono', ['Sube medio tono', 'Hace silencio', 'Toca más fuerte']],
  ['La clave de sol nos dice dónde está…', 'La nota Sol', ['La nota Do', 'El tempo', 'El volumen']],
  ['Un silencio en música significa…', 'No tocar un ratito', ['Tocar suave', 'Tocar rápido', 'Repetir']],
  ['En un compás de 4/4, ¿cuántos tiempos hay?', '4', ['2', '3', '8']],
  ['¿Qué figura dura más?', 'Redonda', ['Blanca', 'Negra', 'Corchea']],
  ['Dos corcheas duran lo mismo que…', 'Una negra', ['Una blanca', 'Una redonda', 'Tres negras']]],
  [['¿Qué significa forte (f)?', 'Fuerte', ['Suave', 'Rápido', 'Lento']],
  ['¿Qué significa piano (p)?', 'Suave', ['Fuerte', 'Rápido', 'Agudo']],
  ['¿Qué significa allegro?', 'Rápido y alegre', ['Muy lento', 'Suave', 'Triste']],
  ['¿Qué significa adagio?', 'Lento', ['Rápido', 'Fuerte', 'Saltado']],
  ['Crescendo significa…', 'Ir subiendo el volumen', ['Ir bajando el volumen', 'Parar', 'Tocar más grave']],
  ['El tempo es…', 'La velocidad de la música', ['El volumen', 'La nota más aguda', 'Un tipo de piano']],
  ['¿Cuántas teclas tiene un piano normal?', '88', ['52', '64', '100']]],
];
const theoryLesson = bank => () => shuffle(bank).slice(0, 6).map(([q, a, w]) => ({ kind: 'theory', q, a, opts: shuffle([a, ...w]) }));

const SONGS = {
  estrellita: { phrases: [[60, 60, 67, 67, 69, 69, 67], [65, 65, 64, 64, 62, 62, 60], [67, 67, 65, 65, 64, 64, 62]], full: [0, 1, 2, 2, 0, 1] },
  maria: { phrases: [[64, 62, 60, 62, 64, 64, 64], [62, 62, 62, 64, 67, 67], [64, 62, 60, 62, 64, 64, 64, 64], [62, 62, 64, 62, 60]], full: [0, 1, 2, 3] },
  martinillo: { phrases: [[60, 62, 64, 60], [64, 65, 67], [67, 69, 67, 65, 64, 60], [60, 55, 60]], full: [0, 0, 1, 1, 2, 2, 3, 3] },
  alegria: { phrases: [[64, 64, 65, 67, 67, 65, 64, 62], [60, 60, 62, 64, 64, 62, 62], [60, 60, 62, 64, 62, 60, 60]], full: [0, 1, 0, 2] },
  cumple: { phrases: [[60, 60, 62, 60, 65, 64], [60, 60, 62, 60, 67, 65], [60, 60, 72, 69, 65, 64, 62], [70, 70, 69, 65, 67, 65]], full: [0, 1, 2, 3] },
};
function songLesson(song) {
  return () => {
    const all = song.phrases.flat();
    const [lo, hi] = rangeFor(all, 8);
    const list = [{ kind: 'info', icon: '🎶', text: 'Escucha cada frase y luego tócala. Las notas aparecen arriba; si te equivocas, la tecla correcta brillará ✨', piano: { lo, hi } }];
    song.phrases.forEach((p, i) => list.push({ kind: 'melody', notes: p, lo, hi, title: `Frase ${i + 1} de ${song.phrases.length}` }));
    list.push({ kind: 'melody', notes: song.full.flatMap(i => song.phrases[i]), lo, hi, title: '¡Ahora la canción completa!' });
    return list;
  };
}

function L(title, items, opt = {}) { return { title, items, n: opt.n || 8, intro: opt.intro, build: opt.build }; }
const UNITS = [
  {
    id: 'teclado', title: 'El teclado', icon: '🎹', color: '#7c5cff', desc: 'Las teclas blancas', lessons: [
      L('Do, Re, Mi', [['keyFind', { pool: W1 }], ['keyName', { pool: W1 }]], { intro: { icon: '🎹', text: 'Las teclas negras van en grupos de 2 y de 3. El Do siempre está justo a la izquierda del grupo de 2 negras. ¡Toca las teclas para escucharlas!', piano: { lo: 60, hi: 71, labels: true, hl: W1 } } }),
      L('Fa y Sol', [['keyFind', { pool: W2 }], ['keyName', { pool: W2 }]], { intro: { icon: '👀', text: 'Fa está justo a la izquierda del grupo de 3 teclas negras. Después de Fa viene Sol.', piano: { lo: 60, hi: 71, labels: true, hl: [65, 67] } } }),
      L('Las 7 notas', [['keyFind', { pool: W3 }], ['keyName', { pool: W3 }]], { intro: { icon: '🌈', text: 'Do, Re, Mi, Fa, Sol, La, Si… ¡y vuelve a empezar en Do! Son 7 notas que se repiten por todo el piano.', piano: { lo: 60, hi: 72, labels: true, hl: W3 } } }),
    ],
  },
  {
    id: 'negras', title: 'Teclas negras', icon: '⚫', color: '#ec4899', desc: 'Sostenidos ♯', lessons: [
      L('Do♯ y Re♯', [['keyFind', { pool: [61, 63] }], ['keyName', { pool: [60, 61, 62, 63, 64] }]], { intro: { icon: '♯', text: 'Sostenido (♯) = un poquito más agudo. Do♯ es la tecla negra justo a la derecha de Do.', piano: { lo: 60, hi: 71, labels: true, hl: [61, 63] } } }),
      L('Las 3 negras', [['keyFind', { pool: [66, 68, 70] }], ['keyName', { pool: [65, 66, 67, 68, 69, 70, 71] }]], { intro: { icon: '🖤', text: 'El grupo de 3 negras: Fa♯, Sol♯ y La♯.', piano: { lo: 60, hi: 71, labels: true, hl: [66, 68, 70] } } }),
      L('¡Todas!', [['keyFind', { pool: ALL12 }], ['keyName', { pool: ALL12 }]]),
    ],
  },
  {
    id: 'pentagrama', title: 'Leer notas', icon: '🎼', color: '#0ea5e9', desc: 'El pentagrama', lessons: [
      L('Do, Re, Mi', [['staffRead', { pool: W1 }], ['staffToKey', { pool: W1 }]], { intro: { icon: '🎼', text: 'Las notas se escriben en 5 líneas: el pentagrama. Cuanto más arriba, más aguda. El Do lleva una rayita extra abajo.', staff: W1 } }),
      L('Hasta Sol', [['staffRead', { pool: W2 }], ['staffToKey', { pool: W2 }]], { intro: { icon: '🪜', text: 'Línea, espacio, línea, espacio… ¡las notas suben como una escalera!', staff: W2 } }),
      L('Hasta Si', [['staffRead', { pool: W3 }], ['staffToKey', { pool: W3 }]], { intro: { icon: '🎯', text: 'Así se ven las 7 notas en el pentagrama.', staff: W3 } }),
    ],
  },
  {
    id: 'agudas', title: 'Más arriba', icon: '🚀', color: '#14b8a6', desc: 'Notas agudas', lessons: [
      L('Do agudo', [['staffRead', { pool: [71, 72, 74, 76] }], ['staffToKey', { pool: [71, 72, 74, 76] }]], { intro: { icon: '🚀', text: 'Después de Si empieza otra vez Do, ¡pero más agudo!', staff: [71, 72, 74, 76] } }),
      L('Hasta Sol agudo', [['staffRead', { pool: STAFF_HI }], ['staffToKey', { pool: STAFF_HI }]], { intro: { icon: '⛰️', text: 'Fa agudo está en la línea de arriba del todo.', staff: STAFF_HI } }),
      L('Mezcla total', [['staffRead', { pool: STAFF_ALL }]], { n: 10 }),
    ],
  },
  {
    id: 'oido', title: 'Oído de oro', icon: '👂', color: '#f59e0b', desc: 'Escuchar y adivinar', lessons: [
      L('Agudo o grave', [['earHighLow', { min: 7, max: 12 }]], { intro: { icon: '🐦', text: 'Agudo = sonido alto, como un pajarito 🐦. Grave = sonido bajo, como un oso 🐻. ¡Escucha con atención!' } }),
      L('¿Sube o baja?', [['earContour', { step: 3 }], ['earHighLow', { min: 4, max: 8 }]]),
      L('¿Iguales?', [['earSame', { max: 3 }], ['earHighLow', { min: 1, max: 4 }], ['earContour', { step: 2 }]]),
    ],
  },
  {
    id: 'ritmo', title: 'Ritmo', icon: '🥁', color: '#ef4444', desc: 'Figuras y tiempos', lessons: [
      L('Las figuras', [['rhythmName', {}]], { n: 6, intro: { icon: '🥁', text: 'Las figuras dicen cuánto dura cada nota. Redonda = 4 tiempos, Blanca = 2, Negra = 1 y Corchea = ½.', figs: true } }),
      L('¿Cuánto dura?', [['rhythmValue', {}], ['rhythmName', {}]]),
      L('Sumar tiempos', [['rhythmSum', { figs: ['h', 'q', 'e'] }], ['rhythmSum', { max: 3 }], ['rhythmValue', {}]]),
    ],
  },
  {
    id: 'acordes', title: 'Acordes', icon: '🎵', color: '#22c55e', desc: 'Varias notas a la vez', lessons: [
      L('Do, Fa, Sol mayor', [['chordBuild', { chords: MAJ, hint: true }]], { n: 6, intro: { icon: '🤝', text: 'Un acorde son 3 notas a la vez: toca una, salta una, toca otra, salta otra, toca otra. Do mayor = Do + Mi + Sol.', piano: { lo: 60, hi: 76, labels: true, hl: [60, 64, 67] } } }),
      L('Sin pistas', [['chordBuild', { chords: MAJ2 }]], { n: 6 }),
      L('Acordes menores', [['chordBuild', { chords: MIN, hint: true }]], { n: 6, intro: { icon: '🌧️', text: 'Los acordes menores suenan más tristes. La menor = La + Do + Mi (¡solo teclas blancas!).', piano: { lo: 60, hi: 76, labels: true, hl: [69, 72, 76] } } }),
    ],
  },
  {
    id: 'canciones', title: 'Canciones', icon: '🎤', color: '#f97316', desc: '¡Toca de verdad!', lessons: [
      L('Estrellita', [], { build: songLesson(SONGS.estrellita) }),
      L('María tenía un corderito', [], { build: songLesson(SONGS.maria) }),
      L('Martinillo', [], { build: songLesson(SONGS.martinillo) }),
      L('Himno de la alegría', [], { build: songLesson(SONGS.alegria) }),
      L('Cumpleaños feliz', [], { build: songLesson(SONGS.cumple) }),
    ],
  },
  {
    id: 'teoria', title: 'Teoría', icon: '📖', color: '#6366f1', desc: 'Datos de músico', lessons: [
      L('Lo básico', [], { build: theoryLesson(THEORY[0]) }),
      L('Signos', [], { build: theoryLesson(THEORY[1]) }),
      L('Palabras italianas', [], { build: theoryLesson(THEORY[2]) }),
    ],
  },
];
const FLAT = UNITS.flatMap(u => u.lessons.map((l, i) => ({ unit: u, li: i, id: `${u.id}-${i}`, lesson: l })));
const CHALLENGE_POOL = [['keyName', { pool: W3 }], ['keyFind', { pool: W3 }], ['staffRead', { pool: W3 }], ['staffRead', { pool: STAFF_ALL }], ['rhythmValue', {}], ['earHighLow', { min: 3, max: 12 }], ['keyName', { pool: ALL12 }], ['rhythmName', {}]];

function buildLesson(lesson) {
  if (lesson.build) return lesson.build();
  const list = [];
  if (lesson.intro) list.push({ kind: 'info', ...lesson.intro });
  let last = '';
  for (let i = 0; i < lesson.n; i++) {
    let ex, tries = 0;
    do { const [k, o] = pick(lesson.items); ex = GEN[k](o); } while (JSON.stringify(ex) === last && ++tries < 6);
    last = JSON.stringify(ex); list.push(ex);
  }
  return list;
}

// ---------------- Renderizado de ejercicios ----------------
const title = t => h('h2', { class: 'q-title' }, t);
function options(labels, correct, ctl, answerText, { text = false, one = false, after } = {}) {
  const grid = h('div', { class: 'opts' + (one ? ' one' : '') });
  labels.forEach((lab, i) => {
    const b = h('button', {
      class: 'opt' + (text ? ' text' : ''), onClick() {
        if (ctl.locked) return;
        const ok = i === correct;
        b.classList.add(ok ? 'good' : 'bad');
        if (!ok) grid.children[correct].classList.add('good');
        after && after();
        ctl.done(ok, answerText);
      },
    }, lab);
    grid.append(b);
  });
  return grid;
}
const listenBtn = fn => { const b = h('button', { class: 'listen', 'aria-label': 'Escuchar', onClick: fn }, '🔊'); setTimeout(fn, 350); return b; };

const RENDER = {
  info(ex, box, ctl) {
    const card = h('div', { class: 'info-card' }, ex.icon && h('span', { class: 'ii' }, ex.icon), ex.text);
    box.append(card);
    if (ex.staff) box.append(staffSVG(ex.staff, { labels: true }), h('button', { class: 'btn ghost small', onClick: () => playSeq(ex.staff, .5) }, '🔊 Escuchar'));
    if (ex.figs) box.append(h('div', { class: 'figs' }, FKEYS.map(k => h('div', { class: 'fig-lbl' }, figSVG(k), FIG[k].name, h('span', { class: 'muted' }, fmtBeats(FIG[k].beats) + ' t')))));
    if (ex.piano) { const p = piano({ ...ex.piano, labels: ex.piano.labels ?? true }); (ex.piano.hl || []).forEach(m => p.mark(m, 'hl')); box.append(p); }
    box.append(h('div', { style: { 'margin-top': 'auto' } }), h('button', { class: 'btn block', onClick: () => ctl.done(true) }, '¡Entendido! 👍'));
  },
  keyFind(ex, box, ctl) {
    box.append(title('Toca la tecla'), h('div', { class: 'big-name' }, noteName(ex.target)));
    const p = piano({
      lo: ex.lo, hi: ex.hi, onKey(m) {
        if (ctl.locked) return;
        const ok = m % 12 === ex.target % 12;
        p.mark(m, ok ? 'good' : 'bad'); if (!ok) p.mark(ex.target, 'good');
        ctl.done(ok, noteName(ex.target));
      },
    });
    box.append(h('div', { style: { 'margin-top': 'auto' } }), p);
  },
  keyName(ex, box, ctl) {
    const p = piano({ lo: ex.lo, hi: ex.hi }); p.mark(ex.target, 'hl');
    box.append(title('¿Qué nota es la tecla amarilla?'), p,
      options(ex.opts.map(pcName), ex.opts.indexOf(ex.target % 12), ctl, noteName(ex.target)));
    setTimeout(() => playNote(ex.target), 250);
  },
  staffRead(ex, box, ctl) {
    box.append(title('¿Qué nota es?'), staffSVG([ex.target]),
      options(ex.opts.map(pcName), ex.opts.indexOf(ex.target % 12), ctl, noteName(ex.target), { after: () => playNote(ex.target) }));
  },
  staffToKey(ex, box, ctl) {
    box.append(title('Toca esta nota en el piano'), staffSVG([ex.target]));
    const p = piano({
      lo: ex.lo, hi: ex.hi, short: true, onKey(m) {
        if (ctl.locked) return;
        const ok = m % 12 === ex.target % 12;
        p.mark(m, ok ? 'good' : 'bad'); if (!ok) p.mark(ex.target, 'good');
        ctl.done(ok, noteName(ex.target));
      },
    });
    box.append(h('div', { style: { 'margin-top': 'auto' } }), p);
  },
  earHighLow(ex, box, ctl) {
    box.append(title('¿La 2ª nota es más aguda o más grave?'), listenBtn(() => playSeq([ex.a, ex.b], .7)),
      options(['⬆️ Más aguda', '⬇️ Más grave'], ex.up ? 0 : 1, ctl, ex.up ? 'Más aguda ⬆️' : 'Más grave ⬇️', { one: true, text: true }));
  },
  earSame(ex, box, ctl) {
    box.append(title('¿Las dos notas son iguales?'), listenBtn(() => playSeq([ex.a, ex.b], .7)),
      options(['🟰 Iguales', '↔️ Diferentes'], ex.same ? 0 : 1, ctl, ex.same ? 'Iguales' : 'Diferentes', { one: true, text: true }));
  },
  earContour(ex, box, ctl) {
    box.append(title('¿La melodía sube o baja?'), listenBtn(() => playSeq(ex.seq, .4)),
      options(['↗️ Sube', '↘️ Baja'], ex.up ? 0 : 1, ctl, ex.up ? 'Sube ↗️' : 'Baja ↘️', { one: true, text: true }));
  },
  rhythmName(ex, box, ctl) {
    box.append(title('¿Cómo se llama esta figura?'), h('div', { class: 'figs' }, figSVG(ex.fig)),
      options(ex.opts.map(k => FIG[k].name), ex.opts.indexOf(ex.fig), ctl, FIG[ex.fig].name, { text: true }));
  },
  rhythmValue(ex, box, ctl) {
    box.append(title('¿Cuántos tiempos dura?'), h('div', { class: 'figs' }, figSVG(ex.fig)),
      options(FKEYS.map(k => fmtBeats(FIG[k].beats)), FKEYS.indexOf(ex.fig), ctl, fmtBeats(FIG[ex.fig].beats) + ' tiempos'));
  },
  rhythmSum(ex, box, ctl) {
    const row = h('div', { class: 'figs' });
    ex.figs.forEach((f, i) => { if (i) row.append(h('span', { class: 'plus' }, '+')); row.append(figSVG(f)); });
    box.append(title('¿Cuántos tiempos suman?'), row,
      options(ex.opts.map(fmtBeats), ex.opts.indexOf(ex.total), ctl, fmtBeats(ex.total) + ' tiempos'));
  },
  chordBuild(ex, box, ctl) {
    const target = chordNotes(ex.chord), pcs = target.map(m => m % 12);
    const sel = new Set();
    const check = h('button', { class: 'btn block', disabled: true }, 'Comprobar');
    box.append(title('Toca el acorde de'), h('div', { class: 'big-name' }, chordName(ex.chord)));
    if (ex.hint) box.append(h('div', { class: 'hint-chips' }, target.map(m => h('span', { class: 'chip' }, noteName(m)))));
    else box.append(h('p', { class: 'muted center' }, 'Elige 3 teclas 🎹'));
    const p = piano({
      lo: 60, hi: 76, onKey(m, el) {
        if (ctl.locked) return;
        if (sel.has(m)) { sel.delete(m); el.classList.remove('sel'); }
        else if (sel.size < 3) { sel.add(m); el.classList.add('sel'); }
        check.disabled = sel.size !== 3;
      },
    });
    check.addEventListener('click', () => {
      if (ctl.locked || sel.size !== 3) return;
      const chosen = [...sel].map(m => m % 12);
      const ok = pcs.every(pc => chosen.includes(pc));
      p.unmark('sel');
      sel.forEach(m => p.mark(m, pcs.includes(m % 12) ? 'good' : 'bad'));
      if (!ok) target.forEach(m => p.mark(m, 'good'));
      playChord(ok ? [...sel] : target);
      ctl.done(ok, target.map(noteName).join(' + '));
    });
    box.append(h('div', { style: { 'margin-top': 'auto' } }), p, check);
  },
  melody(ex, box, ctl) {
    let pos = 0, mistakes = 0;
    const allowed = Math.max(2, Math.ceil(ex.notes.length / 6));
    const chips = ex.notes.map(m => h('span', { class: 'chip' }, noteName(m)));
    const p = piano({
      lo: ex.lo, hi: ex.hi, labels: true, onKey(m) {
        if (ctl.locked || pos >= ex.notes.length) return;
        if (m === ex.notes[pos]) {
          chips[pos].classList.add('done'); p.unmark('next'); pos++;
          if (pos === ex.notes.length) { const ok = mistakes <= allowed; chips.forEach(c => c.classList.remove('cur')); setTimeout(() => ctl.done(ok, ok ? null : `Tuviste ${mistakes} errores. ¡Vamos otra vez!`), 350); }
          else update();
        } else {
          mistakes++; p.flash(m, 'bad');
          chips[pos].classList.remove('shake'); void chips[pos].offsetWidth; chips[pos].classList.add('shake');
          p.mark(ex.notes[pos], 'next');
        }
      },
    });
    const update = () => chips.forEach((c, i) => c.classList.toggle('cur', i === pos));
    update();
    box.append(title(ex.title), h('div', { class: 'chips' }, chips),
      h('div', { class: 'row' }, h('button', { class: 'btn ghost small', onClick: () => playSeq(ex.notes, .42) }, '🔊 Escuchar')),
      h('div', { style: { 'margin-top': 'auto' } }), p);
    if (ex.notes.length <= 8) setTimeout(() => playSeq(ex.notes, .42), 300);
  },
  theory(ex, box, ctl) {
    box.append(title(ex.q), h('div', { class: 'info-card center', style: { 'font-size': '50px' } }, '🤔'),
      options(ex.opts, ex.opts.indexOf(ex.a), ctl, ex.a, { text: true, one: true }));
  },
};

// ---------------- Pantallas ----------------
const app = document.getElementById('app');
let cleanup = null;
let tab = 'home';
function screen(el) {
  if (cleanup) { cleanup(); cleanup = null; }
  app.innerHTML = ''; app.append(el); window.scrollTo(0, 0);
}
function go(t) {
  if (!me()) return profilesScreen();
  tab = t || tab;
  ({ home: homeScreen, reto: challengeScreen, liga: leagueScreen, perfil: profileScreen })[tab]();
}
function topbar() {
  const p = freshen(me()); const s = streakOf(p);
  return h('header', { class: 'topbar' },
    h('button', { class: 'player-chip', onClick: profilesScreen }, h('span', { class: 'av' }, p.avatar), p.name),
    h('div', { class: 'stats' },
      h('span', { class: 'stat fire' + (s ? '' : ' off'), title: 'Racha' }, '🔥 ' + s),
      h('span', { class: 'stat star', title: 'XP' }, '⭐ ' + p.xp)));
}
function tabbar() {
  const tabs = [['home', '🏠', 'Aprender'], ['reto', '⚡', 'Reto'], ['liga', '👑', 'Liga'], ['perfil', '😊', 'Perfil']];
  return h('nav', { class: 'tabbar' }, h('div', { class: 'tabbar-inner' }, tabs.map(([id, ic, lb]) =>
    h('button', { class: 'tab' + (tab === id ? ' active' : ''), onClick: () => go(id) }, h('span', { class: 'ti' }, ic), lb))));
}
const shell = (...content) => h('div', {}, topbar(), h('main', { class: 'page' }, content), tabbar());

function isUnlocked(p, idx) { return p.unlockAll || idx === 0 || (p.stars[FLAT[idx - 1].id] || 0) > 0; }

function homeScreen() {
  const p = me(); const tx = todayXp(p);
  const goal = h('div', { class: 'card goal' }, h('span', { class: 'gi' }, tx >= GOAL ? '🏅' : '🎯'),
    h('div', { class: 'gb' }, h('h3', {}, tx >= GOAL ? '¡Meta de hoy cumplida!' : 'Meta de hoy'),
      h('div', { class: 'progress' }, h('div', { style: { width: Math.min(100, tx / GOAL * 100) + '%' } })),
      h('div', { class: 'muted', style: { 'margin-top': '6px', 'font-weight': '700' } }, `${tx} / ${GOAL} XP`)));
  const offs = [0, 46, 70, 46, 0, -46, -70, -46];
  let currentNode = null, idx = 0;
  const firstTodo = FLAT.findIndex(f => !(p.stars[f.id] > 0));
  const units = UNITS.map(u => {
    const nodes = u.lessons.map((l, li) => {
      const i = idx++; const f = FLAT[i];
      const unlocked = isUnlocked(p, i); const stars = p.stars[f.id] || 0; const isCur = i === firstTodo && unlocked;
      const btn = h('button', { class: 'node' + (unlocked ? '' : ' locked') + (isCur ? ' current' : ''), 'aria-label': l.title, onClick: () => unlocked ? runLesson(u, li) : toast('🔒 Completa la lección anterior para desbloquear') },
        unlocked ? (stars ? '✓' : (isCur ? '★' : u.icon)) : '🔒');
      const wrap = h('div', { class: 'node-wrap', style: { transform: `translateX(${offs[i % offs.length]}px)` } },
        isCur && h('div', { class: 'start-bubble' }, '¡EMPIEZA!'), btn,
        h('div', { class: 'node-stars' }, stars ? '⭐'.repeat(stars) : ''),
        h('div', { class: 'node-label' + (unlocked ? '' : ' locked') }, l.title));
      if (isCur) currentNode = wrap;
      return wrap;
    });
    return h('section', { style: { '--c': u.color } },
      h('div', { class: 'unit-head' }, h('span', { class: 'ui' }, u.icon), h('div', {}, h('h2', {}, u.title), h('p', {}, u.desc))),
      h('div', { class: 'path' }, nodes));
  });
  screen(shell(goal, units));
  if (currentNode && firstTodo > 0) setTimeout(() => currentNode.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80);
}

// ---------------- Lección ----------------
const PRAISE = ['¡Excelente!', '¡Genial!', '¡Muy bien!', '¡Perfecto!', '¡Bravo!', '¡Increíble!', '¡Así se hace!', '¡Eres una estrella!'];
function runLesson(unit, li) {
  const lesson = unit.lessons[li]; const id = `${unit.id}-${li}`;
  const queue = buildLesson(lesson);
  const total = queue.filter(e => e.kind !== 'info').length;
  const S = { hearts: /[?&]practica/.test(location.search) ? 99 : 3, done: 0, firstTry: 0, mistakes: 0, combo: 0, bestCombo: 0, retried: new Set() };
  let i = 0;
  const bar = h('div', { class: 'bar-fill' });
  const hearts = h('div', { class: 'hearts' });
  const body = h('div', { class: 'lesson-body' });
  const foot = h('div', { class: 'lesson-foot' });
  const exit = () => { if (S.done === 0 || confirm('¿Salir de la lección? Perderás el progreso de esta lección.')) go('home'); };
  screen(h('div', { class: 'lesson', style: { '--c': unit.color } },
    h('div', { class: 'lesson-top' }, h('button', { class: 'icon-btn', onClick: exit, 'aria-label': 'Salir' }, '✕'), h('div', { class: 'bar' }, bar), hearts),
    body, foot));
  const drawTop = () => { bar.style.width = (S.done / total * 100) + '%'; hearts.textContent = '❤️ ' + S.hearts; };
  function next() {
    drawTop();
    if (i >= queue.length) return finish();
    const ex = queue[i++];
    body.innerHTML = ''; foot.innerHTML = ''; foot.className = 'lesson-foot';
    const ctl = { locked: false, done(ok, ans) { if (ctl.locked) return; ctl.locked = true; result(ex, ok, ans); } };
    const box = h('div', { class: 'ex fade-in' });
    body.append(box);
    RENDER[ex.kind](ex, box, ctl);
  }
  function result(ex, ok, ans) {
    if (ex.kind === 'info') return next();
    if (ok) { S.done++; S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo); if (!S.retried.has(ex)) S.firstTry++; sfx.ok(); }
    else {
      S.mistakes++; S.combo = 0; S.hearts--; sfx.bad();
      if (!S.retried.has(ex)) { S.retried.add(ex); queue.push(ex); } else S.done++;
    }
    drawTop();
    foot.className = 'lesson-foot ' + (ok ? 'ok' : 'bad');
    const msg = ok ? h('div', { class: 'fb-msg' }, pick(PRAISE), S.combo >= 3 && h('small', {}, `🔥 ¡${S.combo} seguidas!`))
      : h('div', { class: 'fb-msg' }, ans ? 'Respuesta correcta:' : '¡Casi!', h('small', {}, ans || 'Inténtalo otra vez más adelante'));
    const cont = h('button', { class: 'btn block ' + (ok ? 'ok' : 'bad'), onClick: () => S.hearts <= 0 ? fail() : next() }, 'Continuar');
    foot.append(msg, cont);
    cont.focus({ preventScroll: true });
  }
  function fail() {
    screen(h('div', { class: 'lesson', style: { '--c': unit.color } }, h('div', { class: 'end' },
      h('div', { class: 'big' }, '💔'), h('h1', {}, '¡Te quedaste sin corazones!'),
      h('p', { class: 'muted' }, 'No pasa nada, así se aprende. ¿Lo intentas otra vez?'),
      h('button', { class: 'btn block', onClick: () => runLesson(unit, li) }, 'Reintentar'),
      h('button', { class: 'btn ghost block', onClick: () => go('home') }, 'Volver'))));
  }
  function finish() {
    const p = me();
    const perfect = S.mistakes === 0;
    const stars = perfect ? 3 : S.mistakes <= 2 ? 2 : 1;
    const xp = 10 + S.firstTry + (perfect ? 5 : 0);
    const prevGoal = todayXp(p) >= GOAL;
    p.stars[id] = Math.max(p.stars[id] || 0, stars);
    if (perfect) p.perfects = (p.perfects || 0) + 1;
    const fresh = addXp(p, xp);
    sfx.win(); confetti();
    const goalNow = !prevGoal && todayXp(p) >= GOAL;
    screen(h('div', { class: 'lesson', style: { '--c': unit.color } }, h('div', { class: 'end' },
      h('div', { class: 'big' }, perfect ? '🏆' : '🎉'),
      h('h1', {}, perfect ? '¡Lección perfecta!' : '¡Lección completada!'),
      h('div', { class: 'stars-big' }, [1, 2, 3].map(n => h('span', { class: n <= stars ? '' : 'off' }, '⭐'))),
      h('div', { class: 'tiles' },
        h('div', { class: 'tile' }, h('div', { class: 'tl' }, 'XP'), h('div', { class: 'tv' }, '+' + xp)),
        h('div', { class: 'tile', style: { '--tc': '#22c55e' } }, h('div', { class: 'tl' }, 'Aciertos'), h('div', { class: 'tv' }, Math.round(S.firstTry / total * 100) + '%')),
        h('div', { class: 'tile', style: { '--tc': '#f97316' } }, h('div', { class: 'tl' }, 'Combo'), h('div', { class: 'tv' }, '🔥' + S.bestCombo))),
      goalNow && h('div', { class: 'card', style: { width: '100%' } }, '🎯 ¡Cumpliste la meta de hoy! Racha: 🔥 ' + p.streak),
      fresh.length > 0 && h('div', { class: 'card', style: { width: '100%' } }, h('h3', {}, '¡Nueva medalla!'), fresh.map(b => h('div', { style: { 'font-size': '20px', 'font-weight': '800' } }, b.icon + ' ' + b.name))),
      h('button', { class: 'btn block', onClick: () => go('home') }, 'Continuar'))));
  }
  next();
}

// ---------------- Reto diario (contrarreloj, mismas preguntas para todos) ----------------
function todayRanking() {
  const t = dayKey();
  return Object.values(state.players).map(p => ({ p, s: p.daily[t] })).filter(r => r.s != null).sort((a, b) => b.s - a.s);
}
function challengeScreen() {
  const p = me(); const t = dayKey(); const mine = p.daily[t];
  const ranking = todayRanking();
  screen(shell(
    h('h1', { class: 'title' }, '⚡ Reto del día'),
    h('p', { class: 'muted' }, '60 segundos. ¡Responde todo lo que puedas! Hoy todos tienen las mismas preguntas: gana quien haga más puntos. Cada error resta 3 segundos.'),
    h('div', { class: 'card center' },
      h('div', { style: { 'font-size': '60px' } }, '⏱️'),
      mine != null ? h('h3', {}, `Tu mejor puntaje de hoy: ${mine}`) : h('h3', {}, '¡Aún no juegas hoy!'),
      h('p', { class: 'muted' }, `Récord personal: ${p.duelBest || 0}`),
      h('button', { class: 'btn gold block', onClick: runChallenge }, mine != null ? '¡Mejorar mi puntaje!' : '¡Jugar ahora!')),
    h('div', { class: 'card' }, h('h3', {}, '🏁 Ranking de hoy'),
      ranking.length ? ranking.map((r, i) => rankRow(r.p, i, r.s + ' pts')) : h('p', { class: 'muted' }, 'Nadie ha jugado todavía hoy. ¡Sé la primera persona!'),
      h('p', { class: 'muted', style: { 'font-size': '13px' } }, '¿Juegan en dispositivos distintos? Compartan su progreso desde la pestaña Liga.'))));
}
function runChallenge() {
  rand = mulberry32(hashStr('notitas-' + dayKey()));
  const qs = []; for (let k = 0; k < 150; k++) { const [g, o] = CHALLENGE_POOL[rnd(CHALLENGE_POOL.length)]; qs.push(GEN[g](o)); }
  rand = Math.random;
  let score = 0, combo = 0, i = 0, timeLeft = 60, right = 0, wrong = 0, over = false;
  const bar = h('div', { class: 'bar-fill timer', style: { width: '100%' } });
  const scoreEl = h('div', { class: 'score' }, '0');
  const comboEl = h('div', { class: 'combo' });
  const body = h('div', { class: 'lesson-body' });
  screen(h('div', { class: 'lesson', style: { '--c': '#f59e0b' } },
    h('div', { class: 'lesson-top' }, h('button', { class: 'icon-btn', onClick: () => go('reto'), 'aria-label': 'Salir' }, '✕'), h('div', { class: 'bar' }, bar), scoreEl),
    comboEl, body));
  const timer = setInterval(() => { timeLeft -= .1; bar.style.width = Math.max(0, timeLeft / 60 * 100) + '%'; if (timeLeft <= 0) end(); }, 100);
  cleanup = () => { over = true; clearInterval(timer); };
  function next() {
    if (over) return;
    const ex = qs[i++ % qs.length];
    body.innerHTML = '';
    const box = h('div', { class: 'ex fade-in' }); body.append(box);
    const ctl = {
      locked: false, done(ok) {
        if (ctl.locked || over) return; ctl.locked = true;
        if (ok) { combo++; right++; score += 10 + Math.min(combo - 1, 5) * 2; sfx.ok(); box.classList.add('flash-ok'); }
        else { combo = 0; wrong++; timeLeft -= 3; sfx.bad(); box.classList.add('flash-bad'); }
        scoreEl.textContent = score;
        comboEl.textContent = combo >= 2 ? `🔥 Combo x${combo}` : '';
        setTimeout(next, ok ? 300 : 900);
      },
    };
    RENDER[ex.kind](ex, box, ctl);
  }
  function end() {
    if (over) return; cleanup(); cleanup = null;
    const p = me(); const t = dayKey();
    const prevBest = p.daily[t];
    p.daily[t] = Math.max(prevBest ?? 0, score);
    const record = score > (p.duelBest || 0);
    p.duelBest = Math.max(p.duelBest || 0, score);
    const xp = 5 + Math.min(25, Math.floor(score / 20));
    const fresh = addXp(p, xp);
    sfx.win(); if (record || score >= 100) confetti();
    const ranking = todayRanking();
    screen(h('div', { class: 'lesson', style: { '--c': '#f59e0b' } }, h('div', { class: 'end' },
      h('div', { class: 'big' }, record ? '🥇' : '⏱️'),
      h('h1', {}, record ? '¡Nuevo récord!' : '¡Tiempo!'),
      h('div', { class: 'tiles' },
        h('div', { class: 'tile' }, h('div', { class: 'tl' }, 'Puntos'), h('div', { class: 'tv' }, score)),
        h('div', { class: 'tile', style: { '--tc': '#22c55e' } }, h('div', { class: 'tl' }, 'Aciertos'), h('div', { class: 'tv' }, right)),
        h('div', { class: 'tile', style: { '--tc': '#7c5cff' } }, h('div', { class: 'tl' }, 'XP'), h('div', { class: 'tv' }, '+' + xp))),
      h('div', { class: 'card', style: { width: '100%', 'text-align': 'left' } }, h('h3', {}, '🏁 Ranking de hoy'), ranking.map((r, k) => rankRow(r.p, k, r.s + ' pts'))),
      fresh.length > 0 && h('div', { class: 'card', style: { width: '100%' } }, h('h3', {}, '¡Nueva medalla!'), fresh.map(b => h('div', { style: { 'font-weight': '800' } }, b.icon + ' ' + b.name))),
      h('button', { class: 'btn gold block', onClick: runChallenge }, 'Jugar otra vez'),
      h('button', { class: 'btn ghost block', onClick: () => go('reto') }, 'Salir'))));
  }
  next();
}

// ---------------- Liga y sincronización ----------------
const MEDALS = ['🥇', '🥈', '🥉'];
function rankRow(p, i, pts, sub) {
  return h('div', { class: 'rank' + (p.id === state.current ? ' me' : '') },
    h('div', { class: 'pos' }, MEDALS[i] || i + 1), h('div', { class: 'av' }, p.avatar),
    h('div', { class: 'nm' }, p.name, sub && h('small', {}, sub)), h('div', { class: 'pts' }, pts));
}
const b64e = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
function exportCode(p) {
  const { unlockAll, ...data } = p;
  return 'NOTITAS-' + b64e(JSON.stringify({ v: 1, p: data }));
}
function mergePlayer(a, b) {
  if (!a) return { ...b, unlockAll: false };
  const r = { ...a };
  if ((b.upd || 0) > (a.upd || 0)) { r.name = b.name; r.avatar = b.avatar; r.upd = b.upd; }
  r.xp = Math.max(a.xp, b.xp);
  if (a.weekKey === b.weekKey) r.weekXp = Math.max(a.weekXp, b.weekXp); else if (b.weekKey > a.weekKey) { r.weekKey = b.weekKey; r.weekXp = b.weekXp; }
  if ((b.lastDay || '') > (a.lastDay || '')) { r.lastDay = b.lastDay; r.streak = b.streak; } else if (b.lastDay === a.lastDay) r.streak = Math.max(a.streak, b.streak);
  const maxMap = (x = {}, y = {}) => { const o = { ...x }; for (const k in y) o[k] = Math.max(o[k] || 0, y[k]); return o; };
  r.stars = maxMap(a.stars, b.stars); r.days = maxMap(a.days, b.days); r.daily = maxMap(a.daily, b.daily);
  r.duelBest = Math.max(a.duelBest || 0, b.duelBest || 0); r.perfects = Math.max(a.perfects || 0, b.perfects || 0);
  r.badges = [...new Set([...(a.badges || []), ...(b.badges || [])])];
  return r;
}
function importCode(text) {
  const m = String(text).match(/NOTITAS-([A-Za-z0-9_-]+)/);
  if (!m) throw new Error('código');
  const { p } = JSON.parse(b64d(m[1]));
  if (!p || !p.id || !p.name) throw new Error('datos');
  state.players[p.id] = mergePlayer(state.players[p.id], p);
  save();
  return state.players[p.id];
}
function leagueScreen() {
  const players = Object.values(state.players).map(freshen);
  const byWeek = [...players].sort((a, b) => b.weekXp - a.weekXp || b.xp - a.xp);
  const daysLeft = 7 - (new Date().getDay() + 6) % 7;
  const p = me();
  const code = exportCode(p);
  const link = location.href.split('#')[0] + '#sync=' + code;
  const area = h('textarea', { class: 'field', placeholder: 'Pega aquí el código o enlace NOTITAS-…' });
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Notitas', text: `¡Mira mi progreso en Notitas! ${p.avatar} ${p.name}`, url: link }); return; }
    } catch (e) { if (e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(link); toast('📋 Enlace copiado. Envíalo por mensaje al otro dispositivo.'); }
    catch (e) { area.value = link; area.select(); toast('Copia el texto del recuadro'); }
  };
  screen(shell(
    h('h1', { class: 'title' }, '👑 Liga de la semana'),
    h('p', { class: 'muted' }, `Gana quien sume más XP esta semana. Se reinicia en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}.`),
    byWeek.map((x, i) => rankRow(x, i, x.weekXp + ' XP', `🔥 ${streakOf(x)} · ⭐ ${x.xp} total · Nivel ${level(x)}`)),
    players.length < 2 && h('div', { class: 'card center' }, h('p', {}, '¡Agrega a otra persona para competir! 👨‍👧'), h('button', { class: 'btn small', onClick: () => createScreen() }, '＋ Nuevo jugador')),
    h('div', { class: 'card' },
      h('h3', {}, '📱 Jugar en varios dispositivos'),
      h('p', { class: 'muted' }, 'Cada dispositivo guarda su propio progreso. Para que la liga muestre a todos, envía tu progreso al otro dispositivo (por WhatsApp, iMessage, AirDrop…) y ábrelo allí. Hazlo cuando quieran comparar.'),
      h('div', { class: 'stack' },
        h('button', { class: 'btn block', onClick: share }, `📤 Enviar progreso de ${p.name}`),
        area,
        h('button', {
          class: 'btn ghost block', onClick() {
            try { const r = importCode(area.value); toast(`✅ Progreso de ${r.avatar} ${r.name} actualizado`); leagueScreen(); }
            catch (e) { toast('😕 Ese código no es válido'); }
          },
        }, '📥 Recibir progreso')))));
}

// ---------------- Perfil ----------------
function profileScreen() {
  const p = me();
  const done = Object.keys(p.stars).length;
  const seg = (opts, val, set) => h('div', { class: 'seg' }, opts.map(([v, l]) => h('button', { class: val === v ? 'on' : '', onClick: () => { set(v); save(); profileScreen(); } }, l)));
  screen(shell(
    h('div', { class: 'center' }, h('div', { style: { 'font-size': '72px' } }, p.avatar), h('h1', { class: 'title' }, p.name), h('p', { class: 'muted', style: { 'font-weight': '800' } }, `Nivel ${level(p)} · ${p.xp} XP`)),
    h('div', { class: 'tiles' },
      h('div', { class: 'tile', style: { '--tc': '#f97316' } }, h('div', { class: 'tl' }, 'Racha'), h('div', { class: 'tv' }, '🔥' + streakOf(p))),
      h('div', { class: 'tile', style: { '--tc': '#22c55e' } }, h('div', { class: 'tl' }, 'Lecciones'), h('div', { class: 'tv' }, `${done}/${FLAT.length}`)),
      h('div', { class: 'tile' }, h('div', { class: 'tl' }, 'Récord reto'), h('div', { class: 'tv' }, p.duelBest || 0))),
    h('div', { class: 'card' }, h('h3', {}, '🏅 Medallas'),
      h('div', { class: 'badges' }, BADGES.map(b => h('div', { class: 'badge' + (p.badges.includes(b.id) ? '' : ' off') }, h('span', { class: 'bi' }, b.icon), b.name)))),
    h('div', { class: 'card' }, h('h3', {}, '⚙️ Ajustes'),
      h('div', { class: 'setting' }, 'Nombres de notas', seg([['latin', 'Do Re Mi'], ['en', 'C D E']], state.notation, v => state.notation = v)),
      h('div', { class: 'setting' }, 'Sonido', seg([[true, '🔊 Sí'], [false, '🔇 No']], state.sound, v => state.sound = v)),
      h('div', { class: 'setting' }, h('span', {}, 'Desbloquear todo', h('br'), h('small', { class: 'muted' }, 'Para saltar lecciones que ya sabes')), seg([[true, 'Sí'], [false, 'No']], !!p.unlockAll, v => p.unlockAll = v)),
      h('div', { class: 'setting' }, h('span', { class: 'muted' }, 'Si no se oye en iPhone/iPad, revisa que no esté en modo silencio.'))),
    h('div', { class: 'stack' },
      h('button', { class: 'btn ghost block', onClick: profilesScreen }, '👥 Cambiar de jugador'),
      h('button', {
        class: 'btn bad block', onClick() {
          if (!confirm(`¿Borrar a ${p.name} de este dispositivo? Se perderá su progreso.`)) return;
          delete state.players[p.id]; state.current = Object.keys(state.players)[0] || null; save(); state.current ? go('home') : profilesScreen();
        },
      }, '🗑️ Borrar jugador'))));
}

function profilesScreen() {
  const players = Object.values(state.players);
  if (!players.length) return createScreen(true);
  screen(h('main', { class: 'page', style: { 'padding-top': 'calc(env(safe-area-inset-top) + 24px)' } },
    h('div', { class: 'center' }, h('div', { style: { 'font-size': '64px' } }, '🎹'), h('h1', { class: 'title' }, '¿Quién va a jugar?')),
    h('div', { class: 'players', style: { 'margin-top': '18px' } },
      players.map(p => h('button', { class: 'pcard', onClick: () => { state.current = p.id; save(); tab = 'home'; go('home'); } },
        h('span', { class: 'av' }, p.avatar), p.name, h('small', {}, `Nivel ${level(p)} · 🔥 ${streakOf(p)}`))),
      h('button', { class: 'pcard', onClick: () => createScreen() }, h('span', { class: 'av' }, '＋'), 'Nuevo', h('small', {}, 'jugador')))));
}

function createScreen(first = false) {
  let avatar = AVATARS[Object.keys(state.players).length % AVATARS.length];
  const name = h('input', { class: 'field', placeholder: 'Nombre', maxlength: 16, autocomplete: 'off' });
  const grid = h('div', { class: 'avatars' }, AVATARS.map(a => h('button', {
    class: 'avatar-opt' + (a === avatar ? ' sel' : ''), onClick(e) { avatar = a; grid.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); e.currentTarget.classList.add('sel'); },
  }, a)));
  const create = () => {
    const n = name.value.trim(); if (!n) { name.focus(); return toast('Escribe un nombre ✏️'); }
    const p = newPlayer(n, avatar); state.players[p.id] = p; state.current = p.id; save(); tab = 'home';
    toast(`¡Hola ${n}! ${avatar}`); go('home');
  };
  name.addEventListener('keydown', e => { if (e.key === 'Enter') create(); });
  screen(h('main', { class: 'page', style: { 'padding-top': 'calc(env(safe-area-inset-top) + 24px)' } },
    first ? h('div', { class: 'center' }, h('div', { style: { 'font-size': '72px' } }, '🎹🎶'), h('h1', { class: 'title' }, '¡Bienvenidos a Notitas!'),
      h('p', { class: 'muted' }, 'Aprende piano y música con retos cortos. Crea un jugador para cada persona (por ejemplo, tú y tu hija) y compitan en la liga semanal. 🏆'))
      : h('h1', { class: 'title' }, 'Nuevo jugador'),
    h('div', { class: 'card stack' }, h('h3', {}, '¿Cómo te llamas?'), name, h('h3', {}, 'Elige tu personaje'), grid),
    h('button', { class: 'btn block', onClick: create }, '¡Listo! 🚀'),
    !first && h('button', { class: 'btn ghost block', style: { 'margin-top': '10px' }, onClick: profilesScreen }, 'Cancelar')));
}

// ---------------- Inicio ----------------
function handleSync() {
  if (!location.hash.startsWith('#sync=')) return false;
  try { const r = importCode(decodeURIComponent(location.hash.slice(6))); setTimeout(() => toast(`✅ Progreso de ${r.avatar} ${r.name} recibido`), 300); }
  catch (e) { setTimeout(() => toast('😕 El enlace de progreso no es válido'), 300); }
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}
function boot() {
  if (handleSync() && me()) tab = 'liga';
  if (me()) go(tab); else profilesScreen();
}
window.addEventListener('hashchange', () => { if (handleSync()) { if (me()) go('liga'); else profilesScreen(); } });
boot();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
