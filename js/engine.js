'use strict';
// ===== Núcleo: constantes, entrada, utilidades de desenho, efeitos de filme =====

const W = 960, H = 540, GY = 462, TAU = Math.PI * 2;
const INK = '#1a1410', CREAM = '#f4e7c5', PAPER = '#e9d6a8', PINK = '#ff5fa8';
const FONT_TITLE = '"Rye", Georgia, serif';
const FONT_TEXT = '"Special Elite", "Courier New", monospace';

const cv = document.getElementById('game');
let ctx = cv.getContext('2d');
function swapCtx(x) { ctx = x; }

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const ease = (t) => t * t * (3 - 2 * t);

// ---------- Armazenamento (com proteção) ----------
const Save = {
  data: { grades: {}, seenIntro: false, muted: false, binds: {}, opt: {} },
  load() { try { const s = localStorage.getItem('fosforo-save'); if (s) Object.assign(this.data, JSON.parse(s)); } catch (e) {} },
  write() { try { localStorage.setItem('fosforo-save', JSON.stringify(this.data)); } catch (e) {} },
};
Save.load();
// Níveis de dificuldade
const DIFFS = {
  easy: { name: 'Fácil', color: '#2f8a4a', lives: 4, hp: 0.72, cd: 1.4, speed: 0.82, maxGrade: 'B', desc: '4 PV · chefões mais fracos e lentos · nota máxima B' },
  normal: { name: 'Normal', color: '#3a6fb0', lives: 3, hp: 1, cd: 1, speed: 1, desc: '3 PV · o desafio pensado para o jogo' },
  hard: { name: 'Difícil', color: '#c8352b', lives: 3, hp: 1.3, cd: 0.78, speed: 1.15, desc: '3 PV · chefões mais resistentes, rápidos e agressivos' },
  nightmare: { name: 'Pesadelo', color: '#6a2a8a', lives: 1, hp: 1.45, cd: 0.68, speed: 1.25, desc: '1 PV · um toque e acabou. Boa sorte!' },
};
const DIFF_ORDER = ['easy', 'normal', 'hard', 'nightmare'];
const OPT_DEFAULTS = { dir: 'stick', diff: 'normal', music: 7, sfx: 8, shake: true, film: true, touch: 'auto', tOpacity: 0.55, tScale: 1, tPos: {} };
Save.data.opt = Object.assign({}, OPT_DEFAULTS, Save.data.opt || {});
const opt = () => Save.data.opt;
const curDiff = () => DIFFS[opt().diff] || DIFFS.normal;
function cycleDiff(d) { const i = DIFF_ORDER.indexOf(opt().diff); opt().diff = DIFF_ORDER[(Math.max(0, i) + d + DIFF_ORDER.length) % DIFF_ORDER.length]; Save.write(); }

// ---------- Entrada (até 2 jogadores: teclado dividido e controles) ----------
const keys = {}, pressed = {};                       // união de todos (usado nos menus)
const PIN = [{ held: {}, pressed: {} }, { held: {}, pressed: {} }]; // por jogador
const InputMode = { coop: false };
const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'shoot', 'dash', 'ex', 'lock'];
const ACTION_NAMES = { left: 'Esquerda', right: 'Direita', up: 'Cima / mirar', down: 'Baixo / agachar', jump: 'Pular / rebater', shoot: 'Atirar', dash: 'Dash', ex: 'EX / Super', lock: 'Travar mira' };
const DEFAULT_BINDS = {
  solo: { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], jump: ['KeyZ', 'Space', 'KeyJ'], shoot: ['KeyX', 'KeyK'], dash: ['KeyC', 'KeyL'], ex: ['KeyV', 'KeyI'], lock: ['ShiftLeft', 'ShiftRight'] },
  p1: { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], jump: ['KeyF', 'Space'], shoot: ['KeyG'], dash: ['KeyH'], ex: ['KeyR'], lock: ['KeyQ', 'ShiftLeft'] },
  p2: { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], jump: ['Numpad1', 'Comma'], shoot: ['Numpad2', 'Period'], dash: ['Numpad3', 'Slash', 'IntlRo'], ex: ['Numpad0', 'KeyL'], lock: ['NumpadDecimal', 'ShiftRight'] },
};
const RESERVED_KEYS = ['Enter', 'NumpadEnter', 'Escape', 'KeyP', 'KeyM', 'Tab'];
function getBinds(profile) { return Object.assign({}, DEFAULT_BINDS[profile], (Save.data.binds || {})[profile] || {}); }
let KEYMAP_SOLO = {}, KEYMAP_COOP = {};
function rebuildKeymaps() {
  KEYMAP_SOLO = {}; KEYMAP_COOP = {};
  for (const [a, codes] of Object.entries(getBinds('solo'))) for (const c of codes) KEYMAP_SOLO[c] = a;
  ['p1', 'p2'].forEach((pr, i) => { for (const [a, codes] of Object.entries(getBinds(pr))) for (const c of codes) KEYMAP_COOP[c] = [i, a]; });
}
function setBind(profile, action, code) {
  if (RESERVED_KEYS.includes(code)) return false;
  const binds = Save.data.binds || (Save.data.binds = {});
  for (const pr of profile === 'solo' ? ['solo'] : ['p1', 'p2']) {
    const b = getBinds(pr);
    for (const a in b) if (b[a].includes(code)) (binds[pr] || (binds[pr] = {}))[a] = b[a].filter((c) => c !== code);
  }
  (binds[profile] || (binds[profile] = {}))[action] = [code];
  Save.write(); rebuildKeymaps(); return true;
}
function resetBinds(profile) { if (Save.data.binds) delete Save.data.binds[profile]; Save.write(); rebuildKeymaps(); }
const KEY_LABELS = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Espaço', ShiftLeft: 'Shift esq.', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl esq.', ControlRight: 'Ctrl dir.', AltLeft: 'Alt', AltRight: 'AltGr', Comma: ',', Period: '.', Slash: '/', IntlRo: '/ (ABNT)', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`', Backspace: 'Apagar', CapsLock: 'Caps', NumpadDecimal: 'Num ,', NumpadAdd: 'Num +', NumpadSubtract: 'Num -' };
function keyName(code) {
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num' + code.slice(6);
  return code;
}
rebuildKeymaps();
const KEYMAP_GLOBAL = { Enter: 'start', NumpadEnter: 'start', Escape: 'pause', KeyP: 'pause', KeyM: 'mute' };
function mapKey(code) {
  if (KEYMAP_GLOBAL[code]) return [-1, KEYMAP_GLOBAL[code]];
  if (InputMode.coop) return KEYMAP_COOP[code] || null;
  return KEYMAP_SOLO[code] ? [0, KEYMAP_SOLO[code]] : null;
}
function press(p, a) {
  if (p >= 0) { const I = PIN[p]; if (!I.held[a]) I.pressed[a] = true; I.held[a] = true; }
  if (!keys[a]) pressed[a] = true; keys[a] = true;
}
function release(p, a) {
  if (p >= 0) PIN[p].held[a] = false;
  keys[a] = !!(PIN[0].held[a] || PIN[1].held[a]) && p >= 0;
}
function clearPressed() {
  for (const k in pressed) pressed[k] = false;
  for (const I of PIN) for (const k in I.pressed) I.pressed[k] = false;
}
const downCodes = {};
const KeyCapture = { fn: null };
addEventListener('keydown', (e) => {
  if (KeyCapture.fn) { e.preventDefault(); const f = KeyCapture.fn; KeyCapture.fn = null; f(e.code); return; }
  const m = mapKey(e.code);
  if (!m) return;
  e.preventDefault();
  Snd.init();
  if (e.repeat) return;
  downCodes[e.code] = m; press(m[0], m[1]);
});
addEventListener('keyup', (e) => { const m = downCodes[e.code] || mapKey(e.code); if (m) { release(m[0], m[1]); delete downCodes[e.code]; } });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; for (const I of PIN) for (const k in I.held) I.held[k] = false; });
const backPressed = () => pressed.pause;

// Controles (gamepad): controle 1 = jogador 1, controle 2 = jogador 2
const Pads = {
  state: [{}, {}],
  poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gi = 0;
    for (const gp of pads) {
      if (!gp || gi > 1) continue;
      const p = InputMode.coop ? gi : 0;
      const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const want = {
        left: ax < -0.4 || b(14), right: ax > 0.4 || b(15), up: ay < -0.5 || b(12), down: ay > 0.5 || b(13),
        jump: b(0), shoot: b(2) || b(7), ex: b(1) || b(3), dash: b(5) || b(4), lock: b(6), pause: b(9),
      };
      const st = this.state[gi];
      for (const a in want) {
        if (want[a] && !st[a]) { if (a === 'pause') press(-1, a); else press(p, a); Snd.init(); }
        else if (!want[a] && st[a]) release(a === 'pause' ? -1 : p, a);
        st[a] = want[a];
      }
      gi++;
    }
  },
};

// ---------- Controles de toque (posição, tamanho e opacidade configuráveis) ----------
const TOUCH_DEFAULT_POS = {
  up: [13, 63], left: [6, 79], right: [20, 79], down: [13, 93],
  stick: [13, 76], lock: [70, 92], shoot: [82, 86], jump: [93, 78], dash: [82, 66], ex: [93, 58], pause: [96, 8],
};
const capture = (el, id) => { try { el.setPointerCapture(id); } catch (e) { /* ponteiro já liberado */ } };
const DIR_NAMES = { stick: 'Joystick fixo', float: 'Joystick flutuante', pad: 'Setas' };
// Joystick virtual: converte a posição do polegar em esquerda/direita/cima/baixo (8 direções)
const Stick = {
  el: null, knob: null, zone: null, id: null, cx: 0, cy: 0, R: 1, dirs: { left: false, right: false, up: false, down: false },
  init(stage) {
    this.stage = stage; this.el = document.getElementById('stick'); this.zone = document.getElementById('stickzone');
    if (!this.el) return;
    this.knob = this.el.querySelector('.knob');
    let drag = null;
    this.el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); Snd.init();
      capture(this.el, e.pointerId);
      if (Touch.editing) { drag = e.pointerId; this.el.classList.add('active'); return; }
      if (opt().dir === 'float') this.begin(e, e.clientX, e.clientY); else this.begin(e);
    });
    this.el.addEventListener('pointermove', (e) => {
      if (drag === e.pointerId && Touch.editing) { Touch.dragTo('stick', e); return; }
      this.move(e);
    });
    const end = (e) => { if (drag === e.pointerId) { drag = null; this.el.classList.remove('active'); return; } this.end(e); };
    this.el.addEventListener('pointerup', end); this.el.addEventListener('pointercancel', end);
    this.el.addEventListener('contextmenu', (e) => e.preventDefault());
    // modo flutuante: o joystick nasce onde o polegar encosta
    this.zone.addEventListener('pointerdown', (e) => {
      if (Touch.editing || opt().dir !== 'float') return;
      e.preventDefault(); Snd.init(); capture(this.zone, e.pointerId); this.begin(e, e.clientX, e.clientY);
    });
    this.zone.addEventListener('pointermove', (e) => this.move(e));
    this.zone.addEventListener('pointerup', (e) => this.end(e)); this.zone.addEventListener('pointercancel', (e) => this.end(e));
  },
  begin(e, x, y) {
    if (this.id !== null) return;
    this.id = e.pointerId;
    if (x !== undefined) {
      const r = this.stage.getBoundingClientRect();
      this.el.style.left = ((x - r.left) / r.width) * 100 + '%'; this.el.style.top = ((y - r.top) / r.height) * 100 + '%';
      this.cx = x; this.cy = y;
    }
    const b = this.el.getBoundingClientRect();
    if (x === undefined) { this.cx = b.left + b.width / 2; this.cy = b.top + b.height / 2; }
    this.R = b.width / 2;
    this.el.classList.add('active'); this.el.style.opacity = Math.max(0.5, opt().tOpacity);
    this.move(e);
  },
  move(e) {
    if (e.pointerId !== this.id) return;
    let dx = e.clientX - this.cx, dy = e.clientY - this.cy;
    const m = Math.hypot(dx, dy), max = this.R * 0.8;
    if (m > max) { dx *= max / m; dy *= max / m; }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / max, ny = dy / max;
    this.set({ left: nx < -0.35, right: nx > 0.35, up: ny < -0.45, down: ny > 0.55 });
  },
  set(d) {
    for (const k in d) if (d[k] !== this.dirs[k]) { if (d[k]) press(0, k); else release(0, k); this.dirs[k] = d[k]; }
  },
  end(e) {
    if (e.pointerId !== this.id) return;
    this.id = null; this.knob.style.transform = 'translate(-50%, -50%)';
    this.set({ left: false, right: false, up: false, down: false });
    this.el.classList.remove('active'); Touch.apply();
  },
};
const Touch = {
  isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  editing: false,
  visible() { const m = opt().touch; return m === 'on' || (m === 'auto' && this.isTouchDevice) || this.editing; },
  apply() {
    document.body.classList.toggle('touch', this.visible());
    document.body.classList.toggle('editing', this.editing);
    const o = opt();
    document.querySelectorAll('#touch button[data-k]').forEach((b) => {
      const k = b.dataset.k, pos = (o.tPos && o.tPos[k]) || TOUCH_DEFAULT_POS[k];
      b.style.left = pos[0] + '%'; b.style.top = pos[1] + '%';
      b.style.setProperty('--s', o.tScale);
      b.style.opacity = this.editing ? Math.max(0.6, o.tOpacity) : o.tOpacity;
    });
    // joystick virtual
    const dm = o.dir || 'stick';
    for (const m of ['pad', 'stick', 'float']) document.body.classList.toggle('dir-' + m, dm === m);
    const st = document.getElementById('stick');
    if (st && Stick.id === null) {
      const pos = (o.tPos && o.tPos.stick) || TOUCH_DEFAULT_POS.stick;
      st.style.left = pos[0] + '%'; st.style.top = pos[1] + '%';
      st.style.setProperty('--s', o.tScale);
      st.style.opacity = this.editing ? Math.max(0.6, o.tOpacity) : (dm === 'float' ? o.tOpacity * 0.55 : o.tOpacity);
    }
    const db = document.getElementById('tb-dir'); if (db) db.textContent = 'Direção: ' + DIR_NAMES[dm];
    const op = document.getElementById('tb-opacity'), sz = document.getElementById('tb-size');
    if (op) op.value = Math.round(o.tOpacity * 100);
    if (sz) sz.value = Math.round(o.tScale * 100);
  },
  startEdit(onDone) { this.editing = true; this.onDone = onDone; this.backup = JSON.stringify({ p: opt().tPos, o: opt().tOpacity, s: opt().tScale, d: opt().dir }); this.apply(); },
  endEdit(save) {
    if (!save) { const b = JSON.parse(this.backup); opt().tPos = b.p || {}; opt().tOpacity = b.o; opt().tScale = b.s; opt().dir = b.d; }
    Save.write(); this.editing = false; this.apply(); const d = this.onDone; this.onDone = null; if (d) d();
  },
  dragTo(k, e) {
    const r = document.getElementById('stage').getBoundingClientRect();
    const x = clamp(((e.clientX - r.left) / r.width) * 100, 3, 97), y = clamp(((e.clientY - r.top) / r.height) * 100, 4, 96);
    opt().tPos = Object.assign({}, opt().tPos, { [k]: [Math.round(x * 10) / 10, Math.round(y * 10) / 10] });
    this.apply();
  },
  resetLayout() { opt().tPos = {}; opt().tOpacity = OPT_DEFAULTS.tOpacity; opt().tScale = 1; opt().dir = OPT_DEFAULTS.dir; this.apply(); },
  init() {
    const stage = document.getElementById('stage');
    document.querySelectorAll('#touch button[data-k]').forEach((b) => {
      const k = b.dataset.k;
      let drag = null;
      const down = (e) => {
        e.preventDefault(); Snd.init();
        if (this.editing) { capture(b, e.pointerId); drag = { id: e.pointerId }; b.classList.add('on'); return; }
        press(k === 'pause' ? -1 : 0, k); if (k === 'jump') press(-1, 'start'); b.classList.add('on');
      };
      const move = (e) => {
        if (!drag || !this.editing) return;
        this.dragTo(k, e);
      };
      const up = (e) => {
        e.preventDefault(); b.classList.remove('on');
        if (drag) { drag = null; return; }
        release(k === 'pause' ? -1 : 0, k); if (k === 'jump') release(-1, 'start');
      };
      b.addEventListener('pointerdown', down); b.addEventListener('pointermove', move);
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      b.addEventListener('pointerleave', (e) => { if (!drag) up(e); });
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
    on('tb-opacity', 'input', (e) => { opt().tOpacity = e.target.value / 100; this.apply(); });
    on('tb-size', 'input', (e) => { opt().tScale = e.target.value / 100; this.apply(); });
    on('tb-save', 'click', () => this.endEdit(true));
    on('tb-cancel', 'click', () => this.endEdit(false));
    on('tb-reset', 'click', () => this.resetLayout());
    on('tb-dir', 'click', () => { const m = ['stick', 'float', 'pad']; opt().dir = m[(m.indexOf(opt().dir) + 1) % 3]; this.apply(); });
    on('tb-flip', 'click', () => document.getElementById('touchbar').classList.toggle('bottom'));
    Stick.init(stage);
    cv.addEventListener('pointerdown', () => { if (this.editing) return; Snd.init(); press(-1, 'start'); setTimeout(() => release(-1, 'start'), 60); });
    this.apply();
  },
};
Touch.init();

// ---------- Utilidades de desenho ----------
function ink(w = 4) { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
function circle(x, y, r, fill, stroke = true) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) ctx.stroke();
}
function ellipse(x, y, rx, ry, rot, fill, stroke = true) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) ctx.stroke();
}
function rrect(x, y, w, h, r, fill, stroke = true) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) ctx.stroke();
}
// Olho "fatia de torta" clássico dos desenhos dos anos 30
function pieEye(x, y, rx, ry, lx = 0, ly = 0, blink = 0, lid = 0, lidCol = null, lidTilt = 0) {
  ink(Math.max(2.5, rx * 0.22));
  if (blink > 0.5) { ctx.beginPath(); ctx.moveTo(x - rx, y); ctx.quadraticCurveTo(x, y + ry * 0.5, x + rx, y); ctx.stroke(); return; }
  ellipse(x, y, rx, ry, 0, '#fffaf0');
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.clip();
  const px = x + lx * rx * 0.38, py = y + ly * ry * 0.3;
  ctx.beginPath(); ctx.ellipse(px, py, rx * 0.56, ry * 0.7, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, rx * 0.62, -1.25, -0.5); ctx.closePath(); ctx.fillStyle = '#fffaf0'; ctx.fill();
  ctx.beginPath(); ctx.arc(px - rx * 0.2, py + ry * 0.3, rx * 0.1, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
  // sombra interna no topo
  ctx.fillStyle = 'rgba(80,50,30,.18)'; ctx.beginPath(); ctx.ellipse(x, y - ry * 0.95, rx * 1.2, ry * 0.35, 0, 0, TAU); ctx.fill();
  if (lid > 0 && lidCol) {
    ctx.save(); ctx.translate(x, y - ry + ry * 2 * lid); ctx.rotate(lidTilt);
    ctx.fillStyle = lidCol; ctx.fillRect(-rx * 2, -ry * 3, rx * 4, ry * 3);
    ink(Math.max(2.5, rx * 0.22)); ctx.beginPath(); ctx.moveTo(-rx * 2, 0); ctx.lineTo(rx * 2, 0); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ink(Math.max(2.5, rx * 0.22)); ellipse(x, y, rx, ry, 0, null);
}
// Membro de "mangueira de borracha"
function hose(x1, y1, x2, y2, bend, w = 6, color = INK) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx - (dy / l) * bend, my + (dx / l) * bend, x2, y2);
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();
}
// Luva branca de desenho antigo: palma, polegar, dedos e punho
function glove(x, y, r = 8, rot = 0, fist = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ink(Math.max(2, r * 0.3));
  // punho com dobra
  ctx.beginPath(); ctx.ellipse(-r * 0.95, 0, r * 0.38, r * 0.72, 0, 0, TAU); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.stroke();
  // palma
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.9, 0, 0, TAU); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.stroke();
  // polegar
  ctx.beginPath(); ctx.ellipse(r * 0.15, -r * 0.82, r * 0.42, r * 0.32, -0.5, 0, TAU); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.stroke();
  if (!fist) { ctx.beginPath(); ctx.ellipse(r * 1.05, -r * 0.1, r * 0.55, r * 0.3, 0, 0, TAU); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.stroke(); }
  // sombra e costuras
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.9, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = 'rgba(120,90,60,.22)'; ctx.beginPath(); ctx.ellipse(r * 0.2, r * 0.6, r * 1.1, r * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.lineWidth = Math.max(1, r * 0.13);
  for (const k of [-0.25, 0.2]) { ctx.beginPath(); ctx.moveTo(r * 0.35, r * k); ctx.lineTo(r * 0.85, r * k); ctx.stroke(); }
  ctx.restore();
}
// Sapato grande e brilhante
function shoe(x, y, dir = 1, r = 9, col = '#3b2416') {
  ink(Math.max(2.5, r * 0.3));
  ctx.beginPath();
  ctx.moveTo(x - dir * r * 0.9, y);
  ctx.quadraticCurveTo(x - dir * r * 1.1, y - r * 1.3, x + dir * r * 0.4, y - r * 1.2);
  ctx.quadraticCurveTo(x + dir * r * 2.1, y - r * 1.05, x + dir * r * 2.0, y - r * 0.15);
  ctx.quadraticCurveTo(x + dir * r * 1.9, y + r * 0.1, x, y);
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  // sola
  ctx.beginPath(); ctx.moveTo(x - dir * r * 0.85, y - 1); ctx.lineTo(x + dir * r * 1.95, y - 1); ctx.lineWidth = Math.max(2, r * 0.25); ctx.strokeStyle = '#120a06'; ctx.stroke();
  // brilho
  ctx.beginPath(); ctx.ellipse(x + dir * r * 1.05, y - r * 0.8, r * 0.45, r * 0.18, dir * -0.2, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
}
// Sombreamento em "lua crescente": path() deve só adicionar subcaminhos (sem beginPath)
function shade(path, color = 'rgba(70,30,10,.28)', dx = -7, dy = -7) {
  ctx.save(); ctx.beginPath(); path(); ctx.clip();
  ctx.beginPath(); ctx.rect(-4000, -4000, 8000, 8000);
  ctx.save(); ctx.translate(dx, dy); path(); ctx.restore();
  ctx.fillStyle = color; ctx.fill('evenodd'); ctx.restore();
}
function shine(x, y, rx, ry, rot = -0.6, a = 0.55) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
}
const pCircle = (x, y, r) => () => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); };
const pEllipse = (x, y, rx, ry, rot = 0) => () => { ctx.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); };
const pRRect = (x, y, w, h, r) => () => { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
// Desenha e contorna um caminho, com sombra e brilho opcionais
function shape(path, fill, lw = 4, shadeCol, sdx, sdy) {
  ctx.beginPath(); path(); ctx.fillStyle = fill; ctx.fill();
  if (shadeCol !== false) shade(path, shadeCol || 'rgba(70,30,10,.25)', sdx ?? -7, sdy ?? -7);
  ink(lw); ctx.beginPath(); path(); ctx.stroke();
}
function groundShadow(x, w, a = 0.35) {
  ctx.beginPath(); ctx.ellipse(x, GY + 3, w, w * 0.18, 0, 0, TAU); ctx.fillStyle = `rgba(20,10,4,${a})`; ctx.fill();
}
function outlinedText(text, x, y, size, fill = CREAM, font = FONT_TITLE, align = 'center', lw = 0) {
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = lw || Math.max(4, size / 6); ctx.strokeStyle = INK;
  ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
}
function textBlock(text, x, y, maxW, lineH, size, color = INK, align = 'left') {
  ctx.font = `${size}px ${FONT_TEXT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lineH; } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lineH;
}
// Raios de sol giratórios (fundo de cartaz antigo)
function sunburst(cx, cy, t, c1, c2, n = 24) {
  ctx.fillStyle = c1; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = c2;
  for (let i = 0; i < n; i++) {
    const a = t + (i / n) * TAU;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 1400, a, a + TAU / n / 2); ctx.closePath(); ctx.fill();
  }
}

// ---------- Partículas ----------
const Particles = {
  list: [],
  add(p) { this.list.push(Object.assign({ vx: 0, vy: 0, life: 0.5, size: 10, rot: 0, vr: 0, g: 0 }, p, { max: p.life || 0.5 })); },
  puff(x, y, n = 5, size = 14, color = '#fffaf0') {
    for (let i = 0; i < n; i++) this.add({ kind: 'puff', x: x + rand(-8, 8), y: y + rand(-8, 8), vx: rand(-80, 80), vy: rand(-80, 20), life: rand(0.35, 0.6), size: size * rand(0.7, 1.2), color });
  },
  stars(x, y, n = 6, color = '#ffd84a') {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(120, 320); this.add({ kind: 'star', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.55), size: rand(6, 11), vr: rand(-10, 10), color }); }
  },
  update(dt) {
    for (const p of this.list) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96; p.rot += p.vr * dt; }
    this.list = this.list.filter((p) => p.life > 0);
  },
  draw() {
    for (const p of this.list) {
      const k = p.life / p.max;
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.6);
      if (p.kind === 'puff') { ink(2.5); circle(p.x, p.y, p.size * (1.4 - k * 0.6), p.color); }
      else if (p.kind === 'star') { ctx.translate(p.x, p.y); ctx.rotate(p.rot); star(0, 0, p.size * k + 2, p.color); }
      else if (p.kind === 'text') { outlinedText(p.text, p.x, p.y, p.size, p.color); }
      ctx.restore();
    }
  },
  clear() { this.list = []; },
};
function star(x, y, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ink(2); ctx.stroke();
}

// ---------- Efeito de filme antigo ----------
const Film = {
  grains: [], vignette: null, frame: 0,
  init() {
    for (let g = 0; g < 4; g++) {
      const c = document.createElement('canvas'); c.width = 240; c.height = 135;
      const x = c.getContext('2d'); const img = x.createImageData(240, 135);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = Math.random() < 0.5 ? 26 : 0;
      }
      x.putImageData(img, 0, 0); this.grains.push(c);
    }
    const v = document.createElement('canvas'); v.width = W; v.height = H;
    const vx = v.getContext('2d');
    const g = vx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(30,18,8,0)'); g.addColorStop(1, 'rgba(30,18,8,0.75)');
    vx.fillStyle = g; vx.fillRect(0, 0, W, H);
    this.vignette = v;
  },
  draw(dt) {
    this.frame++;
    if (!opt().film) { ctx.drawImage(this.vignette, 0, 0); return; }
    // tom sépia quente
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,226,170,0.28)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.grains[(this.frame >> 1) % 4], 0, 0, W, H);
    // riscos e poeira
    if (Math.random() < 0.08) { ctx.strokeStyle = 'rgba(20,10,0,.35)'; ctx.lineWidth = 1; const x = rand(0, W); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + rand(-6, 6), H); ctx.stroke(); }
    if (Math.random() < 0.15) { ctx.fillStyle = 'rgba(20,10,0,.5)'; circle(rand(0, W), rand(0, H), rand(1, 2.5), 'rgba(20,10,0,.5)', false); }
    // tremulação de brilho
    ctx.fillStyle = `rgba(255,240,210,${Math.random() * 0.035})`; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(this.vignette, 0, 0);
    ctx.restore();
  },
};
