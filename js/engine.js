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

// ---------- Entrada ----------
const keys = {}, pressed = {};
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  KeyZ: 'jump', Space: 'jump', KeyJ: 'jump',
  KeyX: 'shoot', KeyK: 'shoot',
  KeyC: 'dash', KeyL: 'dash',
  KeyV: 'ex', KeyI: 'ex',
  ShiftLeft: 'lock', ShiftRight: 'lock',
  Enter: 'start', Escape: 'pause', KeyP: 'pause', KeyM: 'mute',
};
function press(a) { if (!keys[a]) pressed[a] = true; keys[a] = true; }
function release(a) { keys[a] = false; }
addEventListener('keydown', (e) => {
  const a = KEYMAP[e.code];
  if (!a) return;
  e.preventDefault();
  if (!e.repeat) press(a);
  Snd.init();
});
addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a) release(a); });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const confirmPressed = () => pressed.jump || pressed.start || pressed.shoot;
const backPressed = () => pressed.pause;

// Controles de toque
(function setupTouch() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;
  document.body.classList.add('touch');
  document.querySelectorAll('#touch button').forEach((b) => {
    const k = b.dataset.k;
    const down = (e) => { e.preventDefault(); Snd.init(); press(k); if (k === 'jump') press('start'); b.classList.add('on'); };
    const up = (e) => { e.preventDefault(); release(k); if (k === 'jump') release('start'); b.classList.remove('on'); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
  });
  cv.addEventListener('pointerdown', () => { Snd.init(); press('start'); setTimeout(() => release('start'), 60); });
})();

// ---------- Armazenamento (com proteção) ----------
const Save = {
  data: { grades: {}, seenIntro: false, muted: false },
  load() { try { const s = localStorage.getItem('fosforo-save'); if (s) Object.assign(this.data, JSON.parse(s)); } catch (e) {} },
  write() { try { localStorage.setItem('fosforo-save', JSON.stringify(this.data)); } catch (e) {} },
};
Save.load();

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
function pieEye(x, y, rx, ry, lx = 0, ly = 0, blink = 0) {
  ink(3);
  if (blink > 0.5) { ctx.beginPath(); ctx.moveTo(x - rx, y); ctx.quadraticCurveTo(x, y + ry * 0.5, x + rx, y); ctx.stroke(); return; }
  ellipse(x, y, rx, ry, 0, '#fffaf0');
  const px = x + lx * rx * 0.35, py = y + ly * ry * 0.3;
  ctx.beginPath(); ctx.ellipse(px, py, rx * 0.55, ry * 0.68, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, rx * 0.6, -1.2, -0.55); ctx.closePath(); ctx.fillStyle = '#fffaf0'; ctx.fill();
}
// Membro de "mangueira de borracha"
function hose(x1, y1, x2, y2, bend, w = 6, color = INK) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx - (dy / l) * bend, my + (dx / l) * bend, x2, y2);
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();
}
function glove(x, y, r = 8, rot = 0) {
  ink(3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ellipse(0, 0, r * 1.15, r, 0, '#fffaf0');
  ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.5); ctx.lineTo(-r * 0.3, r * 0.5); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}
function shoe(x, y, dir = 1, r = 9) {
  ink(3);
  ellipse(x + dir * 4, y - r * 0.55, r * 1.35, r * 0.75, 0, '#3b2416');
  ctx.beginPath(); ctx.ellipse(x + dir * 7, y - r * 0.85, r * 0.35, r * 0.18, 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
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
