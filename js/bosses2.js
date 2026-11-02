'use strict';
// ===== Chefões 4, 5 e 6: Pianão Pafúncio, Mestre Cartola e Locomotiva Lola =====

const rectHit = (rx, ry, rw, rh, box) => rx < box.x + box.w && rx + rw > box.x && ry < box.y + box.h && ry + rh > box.y;
function steer(b, dt, tx, ty, rate) {
  const want = Math.atan2(ty - b.y, tx - b.x);
  let d = want - b.a; d = Math.atan2(Math.sin(d), Math.cos(d));
  b.a += clamp(d, -rate * dt, rate * dt);
}

// ====================== CHEFÃO 4: Pianão Pafúncio ======================
class Piano extends Boss {
  constructor() {
    super('Pianão Pafúncio', 460);
    this.x = 775; this.y = GY; this.lid = 0; this.open = 0;
  }
  hurtCircles() { return [{ x: this.x, y: this.y - 125, r: 108 }]; }
  dangerCircles() { return [{ x: this.x, y: this.y - 100, r: 90 }]; }
  update(dt, f) {
    this.lid = Math.max(0, this.lid - dt * 1.6); this.open = Math.max(0, this.open - dt * 1.8);
    this.baseUpdate(dt, f);
  }
  attack(f) {
    const p = this.phase, s = this.seq;
    if (p === 3 && s % 3 === 0) { this.gliss(f); this.cd = 3.6; return; }
    if (p >= 2 && s % 3 === 1) { this.hammers(f); this.cd = 2.6; return; }
    if (s % 2 === 0) { this.keyRain(f); this.cd = p === 1 ? 3.0 : 2.4; }
    else { this.planes(f, p === 1 ? 3 : 4); this.cd = 2.5; }
  }
  keyRain(f) {
    this.lid = 1; Snd.play('chord');
    const n = 11, x0 = 30, w = (680 - x0) / n, gap = 1 + ((Math.random() * (n - 3)) | 0);
    let pinkI = (gap + 3 + ((Math.random() * 4) | 0)) % n; if (pinkI === gap || pinkI === gap + 1) pinkI = (gap + 4) % n;
    for (let i = 0; i < n; i++) {
      if (i === gap || i === gap + 1) continue;
      f.eb.push(makeBullet({
        kind: 'key', x: x0 + w * i + w / 2, y: -40, r: 16, warn: 0.75 + i * 0.03, black: i % 2 === 1, pink: i === pinkI, life: 3,
        upd: (b, dt) => { if (b.t < b.warn) return; b.vy += 1500 * dt; b.y += b.vy * dt; if (b.y > GY - 30) { b.life = 0; Particles.puff(b.x, GY - 6, 2, 8); } },
        hit: (b, box) => b.t >= b.warn && rectHit(b.x - 12, b.y - 30, 24, 60, box),
      }));
    }
  }
  planes(f, n) {
    this.open = 1;
    for (let i = 0; i < n; i++) this.after(i * 0.35, () => {
      f.eb.push(makeBullet({
        kind: 'plane', x: this.x - 70, y: this.y - 250, r: 14, a: Math.PI + rand(-0.7, 0.1), sp: 215, pink: i === 1, life: 7,
        upd: (b, dt, f) => { if (b.t < 1.7) steer(b, dt, f.player.x, f.player.y - 40, 2.3); b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt; },
      }));
      Snd.play('shoot2');
    });
  }
  hammers(f) {
    this.open = 1; Snd.play('chord');
    let k = 0;
    for (let x = this.x - 140; x > 20; x -= 72, k++) {
      const d = k * 0.11;
      f.eb.push(makeBullet({
        kind: 'hammer', x, y: GY, r: 20, warn: 0.55 + d, life: 0.55 + d + 0.45, solid: true,
        hit: (b, box) => b.t >= b.warn && b.t < b.warn + 0.32 && rectHit(b.x - 20, GY - 72, 40, 72, box),
        upd: (b) => { if (!b.boom && b.t >= b.warn) { b.boom = true; Particles.puff(b.x, GY - 6, 2, 9, '#d8c09a'); } },
      }));
    }
  }
  gliss(f) {
    this.open = 1; this.lid = 1;
    const pinkAt = 2 + ((Math.random() * 4) | 0);
    for (let i = 0; i < 8; i++) this.after(0.6 + i * 0.55, () => {
      this.open = 1; Snd.play('shoot2');
      const low = i % 2 === 0;
      f.eb.push(makeBullet({
        kind: 'keyrow', x: this.x - 110, y: low ? GY - 14 : GY - 52, vx: -440, r: 14, pink: i === pinkAt, low,
        hit: (b, box) => rectHit(b.x - 30, b.y - 11, 60, 22, box),
      }));
    });
  }
}

BULLET_ART.key = (b, pinkOr) => {
  if (b.t < b.warn) {
    ctx.restore(); ctx.save();
    const k = b.t / b.warn;
    ctx.beginPath(); ctx.ellipse(b.x, GY + 2, 10 + k * 14, 4 + k * 3, 0, 0, TAU); ctx.fillStyle = `rgba(20,10,4,${0.15 + k * 0.35})`; ctx.fill();
    return;
  }
  ink(3); rrect(-12, -30, 24, 60, 4, pinkOr(b.black ? '#1e1712' : '#fffaf0'));
  if (!b.black && !b.pink) { ctx.fillStyle = 'rgba(120,90,60,.2)'; ctx.fillRect(4, -26, 6, 52); }
  shine(-5, -18, 2, 8, 0, b.black ? 0.35 : 0.6);
};
BULLET_ART.plane = (b, pinkOr) => {
  ctx.rotate(b.a);
  ink(2.5);
  ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-14, -12); ctx.lineTo(-8, 0); ctx.lineTo(-14, 12); ctx.closePath(); ctx.fillStyle = pinkOr('#fbf4e2'); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-8, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(26,20,16,.5)'; ctx.lineWidth = 1;
  for (const y of [-6, -3]) { ctx.beginPath(); ctx.moveTo(-10, y); ctx.lineTo(4, y * 0.4); ctx.stroke(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-6, -5, 1.6, 0, TAU); ctx.fill();
};
BULLET_ART.hammer = (b) => {
  if (b.t < b.warn) {
    const sh = Math.sin(b.t * 60) * 2;
    ink(2.5); ctx.beginPath(); ctx.moveTo(-18 + sh, -2); ctx.lineTo(-6, -8); ctx.lineTo(2, -1); ctx.lineTo(10 + sh, -9); ctx.lineTo(18, -2); ctx.stroke();
    if (Math.random() < 0.3) circle(rand(-14, 14), -rand(2, 10), rand(1, 3), '#d8c09a', false);
    return;
  }
  const k = clamp((b.t - b.warn) / 0.12, 0, 1) * clamp((b.warn + 0.4 - b.t) / 0.12, 0, 1);
  const h = 70 * k;
  ink(3); ctx.fillStyle = '#c9a26a'; ctx.fillRect(-4, -h, 8, h); ctx.strokeRect(-4, -h, 8, h);
  rrect(-20, -h - 18, 40, 22, 9, '#a8322a'); shine(-10, -h - 12, 6, 2.5, 0, 0.45);
};
BULLET_ART.keyrow = (b, pinkOr) => {
  ink(3); rrect(-30, -11, 60, 22, 4, pinkOr('#fffaf0'));
  ctx.fillStyle = '#1e1712'; ctx.fillRect(-30, -11, 22, 22);
  ctx.strokeStyle = 'rgba(26,20,16,.5)'; ctx.lineWidth = 2;
  for (const y of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(34, y); ctx.lineTo(50 + Math.random() * 10, y); ctx.stroke(); }
};

Piano.prototype.draw = function () {
  groundShadow(this.x, 140, 0.4);
  ctx.save(); ctx.translate(this.x, this.y);
  if (this.dead) ctx.translate(rand(-5, 5), rand(-3, 3));
  const w = this.windup || 0, p = this.phase, fl = this.flash > 0;
  const sq = 1 + Math.sin(this.t * 6) * 0.02 - w * 0.04 + this.open * 0.03; ctx.scale(1 / sq, sq);
  const lx = this.lookX || 0, ly = this.lookY || 0;
  const wood = fl ? '#8a5a40' : '#4a2a1c', wood2 = fl ? '#9d6a4c' : '#5e3826';
  // pernas e sapatos
  const st = Math.sin(this.t * 6) * 3;
  hose(-70, -24, -80, -6 + st, 8, 10); hose(70, -24, 76, -6 - st, -8, 10);
  shoe(-72, 0, -1, 14, '#1a1210'); shoe(84, 0, -1, 14, '#1a1210');
  // braço de trás com partitura
  const ab = Math.sin(this.t * 5) * 8;
  hose(110, -150, 150, -205 + ab, -14, 10);
  ctx.save(); ctx.translate(150, -230 + ab); ctx.rotate(0.2); ink(3); rrect(-22, -28, 44, 56, 3, '#fbf4e2');
  ctx.strokeStyle = 'rgba(26,20,16,.55)'; ctx.lineWidth = 1; for (let y = -20; y <= 20; y += 8) { ctx.beginPath(); ctx.moveTo(-16, y); ctx.lineTo(16, y); ctx.stroke(); }
  ctx.fillStyle = INK; for (const [x, y] of [[-8, -18], [2, -10], [10, 6], [-6, 14]]) { ctx.beginPath(); ctx.ellipse(x, y, 3, 2.2, -0.4, 0, TAU); ctx.fill(); }
  ctx.restore(); glove(150, -205 + ab, 13, -1.3);
  // corpo
  shape(pRRect(-118, -238, 236, 216, 14), wood, 6, 'rgba(0,0,0,.4)', -14, -8);
  ctx.strokeStyle = 'rgba(255,220,180,.12)'; ctx.lineWidth = 2;
  for (const yy of [-225, -110, -40]) { ctx.beginPath(); ctx.moveTo(-104, yy); ctx.bezierCurveTo(-40, yy - 3, 30, yy + 3, 104, yy); ctx.stroke(); }
  // painel superior
  shape(pRRect(-100, -222, 200, 96, 10), wood2, 4, 'rgba(0,0,0,.3)', 6, 6);
  // candelabros
  for (const cx of [-108, 108]) {
    ink(3); ctx.beginPath(); ctx.moveTo(cx, -170); ctx.lineTo(cx + Math.sign(cx) * 14, -170); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#e0b04a'; ctx.stroke();
    ink(2.5); rrect(cx + Math.sign(cx) * 14 - 5, -194, 10, 24, 2, '#fbf4e2');
    drawFlame(cx + Math.sign(cx) * 14, -198, 0.45, this.t + cx, ['#d8341c', '#ff8a1e', '#ffe56a']);
  }
  // olhos
  const blink = (this.t % 3.9) > 3.75 ? 1 : 0, lid = p === 1 ? 0.12 : 0.32;
  pieEye(-38, -172, 21, 27, lx, ly, blink, lid, wood2, 0.28); pieEye(32, -172, 21, 27, lx, ly, blink, lid, wood2, -0.28);
  if (p === 1) { brow(-64, -210, -16, -208, 8); brow(10, -208, 58, -210, 8); } else { brow(-66, -214, -14, -196, 9); brow(8, -196, 60, -214, 9); }
  // boca-teclado
  const op = this.open * 26 + w * 6 + (this.dead ? 22 : 0) + (p === 3 ? 6 : 0);
  const my = -116;
  ink(4); rrect(-104, my - 6, 208, 12, 4, '#2a1a12');
  ctx.save(); ctx.beginPath(); ctx.rect(-100, my, 200, 34 + op); ctx.fillStyle = '#2a0d08'; ctx.fill(); ctx.clip();
  ctx.fillStyle = '#c23a3a'; ctx.beginPath(); ctx.ellipse(0, my + 26 + op * 0.8, 50, 16, 0, 0, TAU); ctx.fill();
  // teclas brancas (maxilar de baixo)
  const ky = my + op;
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(-100, ky, 200, 34);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; for (let x = -100; x <= 100; x += 14.3) { ctx.beginPath(); ctx.moveTo(x, ky); ctx.lineTo(x, ky + 34); ctx.stroke(); }
  // teclas pretas (dentes de cima)
  ctx.fillStyle = '#1e1712'; for (let i = 0; i < 14; i++) { if ([2, 6, 9, 13].includes(i)) continue; ctx.fillRect(-100 + i * 14.3 + 9, my, 9, 20); }
  ctx.restore(); ink(4); ctx.strokeRect(-100, my, 200, 34 + op);
  // painel inferior e pedais
  shape(pRRect(-100, -76 + op * 0.3, 200, 48, 8), wood2, 4, 'rgba(0,0,0,.3)', 6, 6);
  for (const px of [-22, 0, 22]) { ink(2.5); rrect(px - 6, -34 + op * 0.3, 12, 8, 3, '#e0b04a'); }
  // tampa (sobrancelha que levanta)
  ctx.save(); ctx.translate(118, -238); ctx.rotate(-this.lid * 0.2);
  shape(pRRect(-250, -16, 256, 18, 6), wood, 5, 'rgba(0,0,0,.35)', 0, -6);
  shine(-200, -10, 40, 2.5, 0, 0.25);
  ctx.restore();
  if (p === 3) { crack(-110, -230, 46, 0.9, 4); crack(96, -60, 30, 2.4, 2); }
  // braço da frente regendo
  const cw = Math.sin(this.t * 9) * 0.5;
  const hf = { x: -150 + Math.cos(cw) * 8, y: -140 + Math.sin(cw) * 22 };
  hose(-112, -120, hf.x, hf.y, 12, 10); glove(hf.x, hf.y, 13, -2.4, true);
  ctx.restore();
};

// ====================== CHEFÃO 5: Mestre Cartola ======================
const MAGIC_SPOTS = [[730, 230], [480, 165], [230, 230]];
class Magician extends Boss {
  constructor() {
    super('Mestre Cartola', 450);
    this.spot = 0; this.bx = 730; this.by = 230; this.x = 730; this.y = 230; this.tp = null; this.vis = 1; this.suckT = 0; this.wand = 0;
  }
  hurtCircles() { return this.vis < 0.5 ? [] : [{ x: this.x, y: this.y - 10, r: 92 }]; }
  dangerCircles() { return this.vis < 0.8 ? [] : [{ x: this.x, y: this.y, r: 70 }]; }
  update(dt, f) {
    this.wand = Math.max(0, this.wand - dt * 2);
    if (this.dead) { this.tp = null; this.vis = 1; }
    if (this.phase === 3 && !this.dead && Math.random() < 0.06) Particles.puff(this.x + rand(-40, 40), this.y - 125, 1, 8, '#8a8580');
    if (this.suckT > 0) { this.suckT -= dt; f.wind = Math.sign(this.x - f.player.x) * 125; } else if (!this.dead) f.wind = 0;
    if (this.tp) {
      const tp = this.tp; tp.t += dt;
      this.vis = tp.t < 0.3 ? 1 - tp.t / 0.3 : Math.min(1, (tp.t - 0.45) / 0.3);
      if (tp.t >= 0.4 && !tp.moved) { tp.moved = true; [this.bx, this.by] = MAGIC_SPOTS[tp.to]; this.spot = tp.to; Particles.puff(this.bx, this.by, 10, 22, '#f4e7ff'); Snd.play('poof'); }
      if (tp.t >= 0.8) { this.tp = null; this.vis = 1; }
    }
    if (!this.baseUpdate(dt, f)) { f.wind = 0; return; }
    this.x = this.bx + Math.sin(this.t * 1.3) * 18; this.y = this.by + Math.sin(this.t * 2.2) * 12;
  }
  attack(f) {
    const p = this.phase, s = this.seq;
    if (p >= 2 && s % 3 === 0) { this.teleport(f); this.cd = 1.0; return; }
    if (p === 3 && s % 3 === 1) { this.wandStars(f); this.cd = 2.6; return; }
    if (p >= 2 && s % 2 === 0) { this.doves(f); this.cd = 2.8; return; }
    if (s % 2) { this.cards(f, p); this.cd = p === 1 ? 2.2 : 1.8; }
    else { this.rabbits(f); this.cd = 2.6; }
  }
  teleport(f) {
    const options = [0, 1, 2].filter((i) => i !== this.spot && Math.abs(MAGIC_SPOTS[i][0] - f.player.x) > 170);
    this.tp = { t: 0, to: options.length ? pick(options) : (this.spot + 1) % 3 };
    Particles.puff(this.x, this.y, 10, 22, '#f4e7ff'); Snd.play('poof');
  }
  cards(f, p) {
    this.wand = 1;
    const waves = p === 1 ? 1 : 2;
    for (let w = 0; w < waves; w++) this.after(w * 0.6, () => {
      const a0 = Math.atan2(f.player.y - 40 - this.y, f.player.x - this.x);
      for (let i = -2; i <= 2; i++) {
        const a = a0 + i * 0.2 + (w ? 0.1 : 0);
        f.eb.push(makeBullet({ kind: 'card', x: this.x, y: this.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 13, pink: i === 0, suit: i === 0 ? '♥' : pick(['♠', '♣', '♦']) }));
      }
      Snd.play('shoot2');
    });
  }
  rabbits(f) {
    for (let i = 0; i < 2; i++) this.after(i * 0.5, () => {
      const dir = f.player.x < this.x ? -1 : 1;
      f.eb.push(makeBullet({
        kind: 'rabbit', x: this.x, y: this.y - 100, vx: dir * rand(170, 240), vy: -520, ay: 1500, r: 20, hp: 5, shootable: true, life: 9, pink: i === 1 && Math.random() < 0.5,
        upd: (b, dt, f) => {
          b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y > GY - b.r) { b.y = GY - b.r; b.vy = -rand(380, 480); b.vx = Math.sign(f.player.x - b.x || 1) * rand(160, 230); Particles.puff(b.x, GY - 4, 1, 7); }
          b.x = clamp(b.x, 20, W - 20);
          if (b.life < 0.05) Particles.puff(b.x, b.y, 3, 10);
        },
      }));
      Snd.play('jump');
    });
  }
  doves(f) {
    const fromLeft = this.x < W / 2;
    const lanes = [GY - 26, GY - 125, GY - 225];
    const pinkI = (Math.random() * 4) | 0;
    for (let i = 0; i < 4; i++) this.after(i * 0.45, () => {
      const lane = lanes[i % 3], dir = fromLeft ? 1 : -1;
      f.eb.push(makeBullet({
        kind: 'dove', x: fromLeft ? -30 : W + 30, y: lane, oy: lane, vx: dir * 300, r: 16, pink: i === pinkI,
        upd: (b, dt) => { b.x += b.vx * dt; b.y = b.oy + Math.sin(b.t * 6) * 18; },
      }));
    });
  }
  wandStars(f) {
    this.wand = 1; this.suckT = 2.6;
    for (let i = 0; i < 2; i++) this.after(i * 0.6, () => {
      f.eb.push(makeBullet({
        kind: 'wstar', x: this.x - 70, y: this.y - 20, r: 16, a: Math.PI + rand(-0.6, 0.6), sp: 175, hp: 4, shootable: true, life: 6,
        upd: (b, dt, f) => { if (b.t < 3) steer(b, dt, f.player.x, f.player.y - 35, 1.7); b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt; if (Math.random() < 0.3) Particles.add({ kind: 'star', x: b.x, y: b.y, life: 0.3, size: 4, color: '#ffd84a' }); },
      }));
      Snd.play('ex');
    });
    for (let i = 0; i < 3; i++) this.after(0.9 + i * 0.5, () => this.cards(f, 1));
  }
}

BULLET_ART.card = (b) => {
  ctx.rotate(b.t * 9);
  ink(2.5); rrect(-10, -14, 20, 28, 3, b.pink ? '#ffd0e6' : '#fffaf0');
  ctx.font = `16px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = b.pink ? PINK : (b.suit === '♦' ? '#c8352b' : INK); ctx.fillText(b.suit, 0, 1);
};
BULLET_ART.rabbit = (b, pinkOr) => {
  const f = b.vx < 0 ? 1 : -1; ctx.scale(f, 1);
  const st = b.vy < 0 ? 1.1 : 0.92; ctx.scale(1 / st, st);
  const c = pinkOr('#fffaf0');
  ink(3);
  for (const ex of [4, -6]) { ctx.save(); ctx.translate(ex, -18); ctx.rotate(ex > 0 ? 0.3 : -0.2); ellipse(0, -12, 5, 14, 0, c); ellipse(0, -12, 2.5, 9, 0, '#ffb3c8', false); ctx.restore(); }
  ellipse(0, 0, 20, 17, 0, c);
  shade(pEllipse(0, 0, 20, 17), 'rgba(80,60,40,.2)', -5, -4);
  ink(3); ellipse(0, 0, 20, 17, 0, null);
  pieEye(-7, -3, 4.5, 6, -1, 0); pieEye(4, -3, 4.5, 6, -1, 0);
  circle(-12, 4, 3, '#ff8fb0'); ctx.beginPath(); ctx.moveTo(-12, 7); ctx.lineTo(-12, 10); ctx.stroke();
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(-15, 10, 6, 5); ctx.strokeRect(-15, 10, 6, 5);
  circle(17, 5, 6, c);
};
BULLET_ART.dove = (b, pinkOr) => {
  if (b.vx > 0) ctx.scale(-1, 1);
  const flap = Math.sin(b.t * 18);
  const c = pinkOr('#fbfbf6');
  ink(3);
  ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(14, -24 * flap - 4, 26, -18 * flap); ctx.quadraticCurveTo(14, -4, 8, 4); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
  ellipse(4, 2, 18, 11, 0.1, c);
  ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(32, -6); ctx.lineTo(30, 8); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
  circle(-12, -4, 8, c);
  ctx.beginPath(); ctx.moveTo(-19, -4); ctx.lineTo(-27, -1); ctx.lineTo(-19, 1); ctx.closePath(); ctx.fillStyle = '#f2a33a'; ctx.fill(); ctx.stroke();
  pieEye(-13, -6, 2.5, 3.5, -1, 0);
};
BULLET_ART.wstar = (b) => {
  ctx.rotate(b.t * 5);
  star(0, 0, b.r + 4 + Math.sin(b.t * 12) * 2, '#ffd84a');
  pieEye(-4, -1, 2.5, 3.5, 0, 0); pieEye(4, -1, 2.5, 3.5, 0, 0);
};

Magician.prototype.draw = function () {
  if (this.vis <= 0.02) return;
  const w = this.windup || 0, p = this.phase, fl = this.flash > 0;
  // linhas de sucção
  if (this.suckT > 0) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,240,255,.45)'; ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + this.t * 2, r = 260 - ((this.t * 300 + i * 40) % 220); ctx.beginPath(); ctx.arc(this.x, this.y, r, a, a + 0.5); ctx.stroke(); }
    ctx.restore();
  }
  ctx.save(); ctx.translate(this.x, this.y);
  if (this.dead) { ctx.translate(rand(-5, 5), rand(-4, 4)); ctx.rotate(Math.sin(this.t * 22) * 0.06); }
  const s = this.vis * (1 + Math.sin(this.t * 3) * 0.02 - w * 0.05); ctx.scale(s, s * (1 + w * 0.06));
  ctx.rotate(Math.sin(this.t * 1.7) * 0.05 + (p === 3 ? -0.08 : 0));
  // gravata borboleta flutuante
  const by = 82 + Math.sin(this.t * 3) * 4;
  ink(3.5);
  ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(-26, by - 13); ctx.lineTo(-26, by + 13); ctx.closePath(); ctx.fillStyle = '#c8352b'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(26, by - 13); ctx.lineTo(26, by + 13); ctx.closePath(); ctx.fill(); ctx.stroke();
  circle(0, by, 6, '#e0443a');
  // aba
  ink(6); ellipse(0, 46, 108, 22, 0, '#1b1716');
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(-30, 40, 60, 6, 0, 0, TAU); ctx.fill();
  // copa
  const dent = p === 3 ? 14 : 0;
  const crown = () => { ctx.moveTo(-74, 44); ctx.lineTo(-84, -118); ctx.quadraticCurveTo(-30, -130 + dent, 0, -124 + dent); ctx.quadraticCurveTo(30, -130, 84, -118); ctx.lineTo(74, 44); ctx.closePath(); };
  shape(crown, fl ? '#4a4040' : '#231d1c', 6, 'rgba(0,0,0,.45)', -14, 0);
  shine(-52, -40, 8, 60, 0.03, 0.18);
  // faixa
  ctx.save(); ctx.beginPath(); crown(); ctx.clip();
  ctx.fillStyle = p >= 2 ? '#d9a441' : '#b8322a'; ctx.fillRect(-100, 2, 200, 30);
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-100, 6); ctx.lineTo(100, 6); ctx.stroke();
  ctx.restore(); ink(4); ctx.beginPath(); ctx.moveTo(-78, 2); ctx.lineTo(78, 2); ctx.moveTo(-77, 32); ctx.lineTo(77, 32); ctx.stroke();
  // carta enfiada na faixa
  ctx.save(); ctx.translate(56, -2); ctx.rotate(0.3); ink(2.5); rrect(-9, -16, 18, 24, 2, '#fffaf0'); ctx.fillStyle = '#c8352b'; ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.fillText('♥', 0, -2); ctx.restore();
  // rosto
  const lx = this.lookX || 0, ly = this.lookY || 0, blink = (this.t % 3.4) > 3.27 ? 1 : 0;
  const lid = p === 1 ? 0.15 : 0.35;
  pieEye(-30, -55, 18, 24, lx, ly, blink, lid, '#231d1c', 0.3); pieEye(28, -55, 18, 24, lx, ly, blink, lid, '#231d1c', -0.3);
  ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  const bh = p === 1 ? 0 : 10;
  ctx.beginPath(); ctx.moveTo(-54, -92); ctx.quadraticCurveTo(-32, -100, -10, -88 + bh); ctx.moveTo(8, -88 + bh); ctx.quadraticCurveTo(30, -100, 52, -92); ctx.stroke();
  // bigode e sorriso
  ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.bezierCurveTo(-18, -34, -40, -10, -52, -26); ctx.bezierCurveTo(-42, -4, -16, -12, 0, -16); ctx.bezierCurveTo(16, -12, 42, -4, 52, -26); ctx.bezierCurveTo(40, -10, 18, -34, 0, -24); ctx.fill(); ctx.stroke();
  const mo = 4 + w * 10 + (this.dead ? 12 : 0);
  ink(3.5); ctx.beginPath(); ctx.moveTo(-26, -12); ctx.quadraticCurveTo(0, -4 + mo * 2, 26, -12); ctx.quadraticCurveTo(0, -8 + mo, -26, -12); ctx.fillStyle = '#5a1020'; ctx.fill(); ctx.stroke();
  // luvas flutuantes com varinha
  const hy = Math.sin(this.t * 3) * 10, wr = -0.6 - this.wand * 0.9;
  const lh = { x: -120, y: 0 + hy - this.wand * 30 };
  ctx.save(); ctx.translate(lh.x, lh.y); ctx.rotate(wr);
  ink(4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, 0); ctx.lineWidth = 8; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#1b1716'; ctx.stroke();
  ink(2.5); rrect(-66, -4.5, 14, 9, 2, '#fffaf0');
  if (this.wand > 0.2) star(-70, 0, 9 + this.wand * 6, '#ffd84a');
  ctx.restore();
  glove(lh.x, lh.y, 14, Math.PI + wr, true);
  glove(120, -6 - hy, 14, 0.4 + Math.sin(this.t * 4) * 0.3);
  ctx.restore();
};

// ====================== CHEFÃO 6: Locomotiva Lola ======================
class Train extends Boss {
  constructor() {
    super('Locomotiva Lola', 500);
    this.x = 820; this.y = GY; this.blow = 0; this.wheelA = 0; this.smokeT = 0;
  }
  face() { return { x: this.x - 165, y: this.y - 150 }; }
  hurtCircles() { const fc = this.face(); return [{ x: fc.x, y: fc.y, r: 82 }, { x: this.x - 40, y: this.y - 160, r: 80 }, { x: this.x - 185, y: this.y - 55, r: 55 }]; }
  dangerCircles() { const fc = this.face(); return [{ x: fc.x, y: fc.y + 10, r: 70 }, { x: this.x - 215, y: this.y - 40, r: 38 }]; }
  update(dt, f) {
    this.blow = Math.max(0, this.blow - dt * 2); this.wheelA += dt * (3 + this.phase);
    this.smokeT -= dt;
    if (this.smokeT <= 0 && !this.dead) { this.smokeT = 0.35; Particles.add({ kind: 'puff', x: this.x - 110 + rand(-6, 6), y: this.y - 318, vx: rand(-40, 10), vy: -90, life: 1.1, size: 16, color: this.phase === 3 ? '#6a6460' : '#d8d2c8' }); }
    this.baseUpdate(dt, f);
  }
  attack(f) {
    const p = this.phase, s = this.seq;
    if (p === 3 && s % 3 === 0) { this.wagons(f); this.cd = 3.4; return; }
    if (p >= 2 && s % 3 === 1) { this.steam(f, p); this.cd = 2.6; return; }
    if (p >= 2 && s % 4 === 2) { this.wheels(f); this.cd = 2.4; return; }
    if (s % 2) { this.rings(f, p); this.cd = 2.6; }
    else { this.coal(f); this.cd = 2.4; }
  }
  rings(f, p) {
    this.blow = 1; Snd.play('whistle');
    const n = p === 1 ? 3 : 4;
    for (let i = 0; i < n; i++) this.after(i * 0.55, () => {
      const sx = this.x - 110, sy = this.y - 320, a = Math.atan2(f.player.y - 60 - sy, f.player.x - sx);
      f.eb.push(makeBullet({
        kind: 'ring', x: sx, y: sy, a, sp: 190, r: 18, pink: i === 1, life: 8,
        upd: (b, dt) => { b.r = Math.min(34, 18 + b.t * 9); b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt + Math.sin(b.t * 5) * 0.8; },
      }));
    });
  }
  coal(f) {
    this.blow = 1;
    for (let i = 0; i < 3; i++) this.after(i * 0.35, () => {
      const sx = this.x - 110, sy = this.y - 300, T = 1.0, g = 1000;
      const tx = clamp(f.player.x + (i - 1) * 90 + rand(-20, 20), 30, 600), ty = GY - 14;
      f.eb.push(makeBullet({
        kind: 'coal', x: sx, y: sy, r: 14, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * g * T * T) / T, ay: g, pink: i === 1 && Math.random() < 0.6,
        upd: (b, dt, f) => {
          b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y > GY - 14) {
            b.life = 0; Particles.puff(b.x, GY - 8, 3, 10, '#5a504a');
            for (const d of [-1, 1]) f.eb.push(makeBullet({ kind: 'ember2', x: b.x, y: GY - 9, vx: d * 210, r: 9, life: 1.6 }));
          }
        },
      }));
    });
  }
  steam(f, p) {
    Snd.play('whistle'); this.blow = 1;
    const xs = [f.player.x, f.player.x - 190, f.player.x + 190].filter((x) => x > 30 && x < 610).slice(0, p === 3 ? 3 : 2);
    xs.forEach((x, i) => f.eb.push(makeBullet({
      kind: 'steam', x, y: GY, r: 30, warn: 0.85 + i * 0.15, life: 0.85 + i * 0.15 + 0.65, solid: true,
      hit: (b, box) => b.t >= b.warn + 0.05 && rectHit(b.x - 28, 0, 56, GY, box),
      upd: (b) => { if (!b.go && b.t >= b.warn) { b.go = true; Snd.play('dash'); } },
    })));
  }
  wheels(f) {
    for (let i = 0; i < 2; i++) this.after(i * 0.8, () => {
      f.eb.push(makeBullet({
        kind: 'wheel', x: this.x - 200, y: GY - 36, r: 36, vx: -330, vy: i ? -500 : 0, ay: i ? 1500 : 0,
        upd: (b, dt) => { b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > GY - b.r) { b.y = GY - b.r; if (b.ay) b.vy = -560; } },
      }));
      Snd.play('boom');
    });
  }
  wagons(f) {
    Snd.play('whistle'); this.blow = 1;
    for (let i = 0; i < 2; i++) this.after(0.8 + i * 1.5, () => {
      f.eb.push(makeBullet({ kind: 'wagon', x: this.x - 150, y: GY - 30, vx: -470, r: 30, pink: false, solid: true, hit: (b, box) => rectHit(b.x - 52, GY - 56, 104, 56, box) }));
      Snd.play('dash'); f.shake = 5;
    });
  }
}

BULLET_ART.ring = (b, pinkOr) => {
  ctx.lineWidth = 15; ctx.strokeStyle = INK; ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 0.75, 0, 0, TAU); ctx.stroke();
  ctx.lineWidth = 9; ctx.strokeStyle = pinkOr('#e4ded4'); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 0.75, 0, 3.6, 4.6); ctx.stroke();
};
BULLET_ART.coal = (b, pinkOr) => {
  ctx.rotate(b.t * 6); ink(3);
  ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, r = b.r * (i % 2 ? 0.8 : 1.05); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
  ctx.fillStyle = pinkOr('#2a2422'); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.arc(3, 3, 3.5, 0, TAU); ctx.fill();
};
BULLET_ART.ember2 = (b) => { drawFlame(0, 4, 0.5, b.t * 3, ['#d8341c', '#ff8a1e', '#ffe56a']); };
BULLET_ART.steam = (b) => {
  ctx.restore(); ctx.save();
  // respiradouro no chão
  ink(3); rrect(b.x - 24, GY - 6, 48, 10, 3, '#5a5450');
  if (b.t < b.warn) {
    if (Math.random() < 0.5) Particles.add({ kind: 'puff', x: b.x + rand(-14, 14), y: GY - 10, vy: -60, life: 0.5, size: 6, color: '#f2efe8' });
    return;
  }
  const k = Math.min(1, (b.t - b.warn) / 0.12) * Math.min(1, (b.life) / 0.15);
  ctx.globalAlpha = k;
  for (let y = GY - 20; y > -40; y -= 34) {
    const wv = Math.sin(y * 0.05 + b.t * 20) * 6, r = 30 + Math.sin(y + b.t * 30) * 4;
    ink(4); circle(b.x + wv, y, r, '#f6f3ee');
  }
  ctx.fillStyle = '#f6f3ee'; ctx.fillRect(b.x - 24, -40, 48, GY - 20 + 40);
};
BULLET_ART.wheel = (b) => {
  ctx.rotate(b.t * -8);
  ink(5); circle(0, 0, b.r, '#b8322a'); circle(0, 0, b.r * 0.78, '#2a2422');
  ctx.strokeStyle = '#b8322a'; ctx.lineWidth = 5; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * b.r * 0.75, Math.sin(a) * b.r * 0.75); ctx.stroke(); }
  ink(3); circle(0, 0, 8, '#e0b04a');
};
BULLET_ART.wagon = (b) => {
  const y0 = GY - b.y;
  ink(4); rrect(-52, y0 - 56, 104, 40, 5, '#6b4423');
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; for (const x of [-26, 0, 26]) { ctx.beginPath(); ctx.moveTo(x, y0 - 54); ctx.lineTo(x, y0 - 18); ctx.stroke(); }
  ctx.fillStyle = '#2a2422'; for (const x of [-34, -14, 6, 26]) { ctx.beginPath(); ctx.arc(x, y0 - 58, 12, 0, TAU); ctx.fill(); }
  ink(3); for (const x of [-30, 30]) { ctx.save(); ctx.translate(x, y0 - 12); ctx.rotate(b.t * -12); circle(0, 0, 12, '#2a2422'); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.strokeStyle = '#b8322a'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = 'rgba(26,20,16,.45)'; ctx.lineWidth = 3; for (const y of [-40, -28]) { ctx.beginPath(); ctx.moveTo(56, y0 + y); ctx.lineTo(80 + Math.random() * 20, y0 + y); ctx.stroke(); }
};

Train.prototype.draw = function () {
  ctx.save(); ctx.translate(this.x, this.y);
  if (this.dead) ctx.translate(rand(-5, 5), rand(-3, 3));
  const w = this.windup || 0, p = this.phase, fl = this.flash > 0;
  const chug = Math.abs(Math.sin(this.t * 8)) * -3;
  const red = fl ? '#e06a5a' : '#b8322a', dark = fl ? '#6a6670' : '#33313a', gold = '#e0b04a';
  // rodas
  const wheel = (x, y, r) => {
    ink(5); circle(x, y, r, red); circle(x, y, r * 0.8, '#1f1d22');
    ctx.save(); ctx.translate(x, y); ctx.rotate(-this.wheelA);
    ctx.strokeStyle = red; ctx.lineWidth = 5; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); ctx.stroke(); }
    ctx.restore(); ink(3); circle(x, y, r * 0.22, gold);
  };
  wheel(-150, -28, 26); wheel(-50, -46, 44); wheel(60, -46, 44);
  // biela
  const ox = Math.cos(-this.wheelA) * 22, oy = Math.sin(-this.wheelA) * 22;
  ink(4); ctx.beginPath(); ctx.moveTo(-50 + ox, -46 + oy); ctx.lineTo(60 + ox, -46 + oy); ctx.lineWidth = 9; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#c9c9c9'; ctx.stroke();
  ctx.translate(0, chug);
  // cabine
  shape(pRRect(30, -300, 160, 220, 10), red, 6, 'rgba(60,0,0,.35)', -12, 0);
  ink(5); rrect(50, -270, 70, 70, 8, '#ffe9a8'); ctx.beginPath(); ctx.moveTo(85, -270); ctx.lineTo(85, -200); ctx.stroke();
  shine(64, -258, 8, 14, -0.4, 0.5);
  shape(pRRect(16, -318, 190, 26, 8), dark, 5, 'rgba(0,0,0,.35)', 0, -5);
  // caldeira
  const boiler = pRRect(-190, -215, 240, 130, 50);
  shape(boiler, red, 6, 'rgba(60,0,0,.38)', 0, -18);
  for (const bx of [-120, -40, 30]) { ink(4); ctx.fillStyle = gold; ctx.fillRect(bx, -213, 10, 126); ctx.strokeRect(bx, -213, 10, 126); }
  shine(-90, -196, 70, 6, 0, 0.3);
  // chaminé
  const stack = () => { ctx.moveTo(-128, -214); ctx.lineTo(-124, -268); ctx.lineTo(-146, -306); ctx.lineTo(-74, -306); ctx.lineTo(-96, -268); ctx.lineTo(-92, -214); ctx.closePath(); };
  shape(stack, dark, 5, 'rgba(0,0,0,.4)', -8, 0);
  ink(5); rrect(-152, -318, 84, 14, 5, gold);
  // cúpula do sino
  ink(5); ctx.beginPath(); ctx.arc(-20, -214, 24, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = gold; ctx.fill(); ctx.stroke(); shine(-28, -226, 6, 3);
  // limpa-trilhos
  ink(5); ctx.beginPath(); ctx.moveTo(-180, -70); ctx.lineTo(-252, 0 - chug); ctx.lineTo(-180, 0 - chug); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3; for (const k of [0.3, 0.55, 0.8]) { ctx.beginPath(); ctx.moveTo(-180, -70 + 70 * k); ctx.lineTo(-180 - 72 * k, -chug); ctx.stroke(); }
  // farol
  ink(4); circle(-165, -238, 18, '#fff3b0'); circle(-165, -238, 10, '#ffffff', false);
  ctx.fillStyle = 'rgba(255,240,150,.18)'; ctx.beginPath(); ctx.moveTo(-170, -250); ctx.lineTo(-560, -330); ctx.lineTo(-560, -150); ctx.lineTo(-170, -226); ctx.fill();
  // frente (rosto)
  const fc = { x: -165, y: -150 };
  ink(7); circle(fc.x, fc.y, 82, dark);
  shade(pCircle(fc.x, fc.y, 82), 'rgba(0,0,0,.35)', -10, -10);
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ctx.beginPath(); ctx.arc(fc.x + Math.cos(a) * 72, fc.y + Math.sin(a) * 72, 3, 0, TAU); ctx.stroke(); }
  const lx = this.lookX || 0, ly = this.lookY || 0, blink = (this.t % 3.7) > 3.55 ? 1 : 0, lid = p === 1 ? 0.1 : 0.3;
  pieEye(fc.x - 30, fc.y - 22, 19, 25, lx, ly, blink, lid, dark, 0.3); pieEye(fc.x + 26, fc.y - 22, 19, 25, lx, ly, blink, lid, dark, -0.3);
  if (!blink) { ink(3); for (const ex of [fc.x - 30, fc.x + 26]) for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(ex + k * 9, fc.y - 46); ctx.lineTo(ex + k * 13, fc.y - 56); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(255,120,120,.4)'; ctx.beginPath(); ctx.ellipse(fc.x - 54, fc.y + 18, 13, 8, 0, 0, TAU); ctx.ellipse(fc.x + 50, fc.y + 18, 13, 8, 0, 0, TAU); ctx.fill();
  const mo = 6 + this.blow * 18 + w * 6 + (this.dead ? 16 : 0);
  ctx.save(); ctx.beginPath(); ctx.ellipse(fc.x - 2, fc.y + 32, 28, mo, 0, 0, TAU); ctx.fillStyle = '#3b0d0d'; ctx.fill(); ctx.clip();
  ctx.fillStyle = '#d6555a'; ctx.beginPath(); ctx.ellipse(fc.x - 2, fc.y + 32 + mo, 18, mo * 0.7, 0, 0, TAU); ctx.fill();
  if (p >= 2) teethRow(fc.x - 24, fc.y + 32 - mo, 44, Math.min(8, mo * 0.5), 5);
  ctx.restore(); ink(4.5); ellipse(fc.x - 2, fc.y + 32, 28, mo, 0, null);
  if (p === 3) { crack(fc.x + 40, fc.y - 70, 34, 2.2, 3); crack(-60, -100, 30, 1.2, 7); }
  // braço com luva acenando o apito
  const wv = Math.sin(this.t * 4) * 10;
  hose(-60, -130, -110, -70 + wv, 12, 10); glove(-112, -68 + wv, 14, 2.6, true);
  ctx.restore();
};

// ---------- Cenários dos novos chefões ----------
function buildBackgrounds2(build) {
  BG.pit = build(() => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3b2140'); g.addColorStop(1, '#5c3346'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,220,180,.06)'; for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 30, GY);
    // quadros
    for (const [x, y, w2, h2] of [[90, 90, 120, 150], [300, 70, 100, 120], [880, 110, 70, 90]]) {
      ink(5); ctx.fillStyle = '#c99a3a'; ctx.fillRect(x - 10, y - 10, w2 + 20, h2 + 20); ctx.strokeRect(x - 10, y - 10, w2 + 20, h2 + 20);
      ctx.fillStyle = '#e9d6a8'; ctx.fillRect(x, y, w2, h2); ctx.strokeRect(x, y, w2, h2);
      ctx.fillStyle = INK; ctx.font = `${h2 * 0.6}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', x + w2 / 2, y + h2 / 2);
    }
    // lustre
    ink(4); ctx.beginPath(); ctx.moveTo(560, 0); ctx.lineTo(560, 60); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(560, 75, 70, 18, 0, 0, Math.PI); ctx.fillStyle = '#e0b04a'; ctx.fill(); ctx.stroke();
    for (const dx of [-60, -30, 0, 30, 60]) { circle(560 + dx, 70, 6, '#fff3b0'); }
    ctx.fillStyle = 'rgba(255,240,180,.1)'; ctx.beginPath(); ctx.moveTo(500, 90); ctx.lineTo(380, GY); ctx.lineTo(740, GY); ctx.lineTo(620, 90); ctx.fill();
    // piso
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(0, GY, W, H - GY); ink(5); ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; for (let x = -20; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x - 20, H); ctx.stroke(); }
    ctx.fillStyle = '#c99a3a'; ctx.fillRect(0, GY + 2, W, 5);
  });
  BG.circus = build(() => {
    ctx.fillStyle = '#e9d6a8'; ctx.fillRect(0, 0, W, H);
    for (let i = -8; i < 9; i++) { ctx.beginPath(); ctx.moveTo(W / 2, -60); ctx.lineTo(W / 2 + i * 120 - 60, GY); ctx.lineTo(W / 2 + i * 120, GY); ctx.closePath(); ctx.fillStyle = i % 2 ? '#c8352b' : '#f2e3c0'; ctx.fill(); }
    ctx.fillStyle = 'rgba(30,10,0,.25)'; ctx.fillRect(0, 0, W, GY);
    // bandeirinhas
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 60); ctx.quadraticCurveTo(W / 2, 140, W, 60); ctx.stroke();
    for (let i = 0; i < 16; i++) { const x = 30 + i * 60, y = 60 + Math.sin((x / W) * Math.PI) * 40; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 26); ctx.closePath(); ctx.fillStyle = ['#ffd84a', '#3a7bd5', '#c8352b'][i % 3]; ctx.fill(); ink(2); ctx.stroke(); }
    // holofote
    ctx.fillStyle = 'rgba(255,250,210,.16)'; ctx.beginPath(); ctx.moveTo(470, 0); ctx.lineTo(240, GY); ctx.lineTo(720, GY); ctx.lineTo(510, 0); ctx.fill();
    // picadeiro
    ctx.fillStyle = '#c99a5a'; ctx.fillRect(0, GY, W, H - GY);
    ink(5); ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    ctx.fillStyle = '#c8352b'; ctx.fillRect(0, GY + 2, W, 14); ctx.strokeRect(-5, GY + 2, W + 10, 14);
    ctx.fillStyle = '#ffd84a'; for (let x = 10; x < W; x += 40) { ctx.beginPath(); ctx.arc(x, GY + 9, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(120,80,30,.4)'; for (let i = 0; i < 120; i++) ctx.fillRect(Math.random() * W, GY + 20 + Math.random() * 60, 3, 2);
  });
  BG.station = build(() => {
    const g = ctx.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#e8955a'); g.addColorStop(1, '#f7d79a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    circle(300, 250, 90, '#ffe6a0', false);
    ctx.fillStyle = 'rgba(255,240,200,.4)'; ctx.beginPath(); ctx.arc(300, 250, 120, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b8754a'; ctx.beginPath(); ctx.moveTo(0, 360); for (let x = 0; x <= W; x += 80) ctx.quadraticCurveTo(x + 40, 300 + Math.sin(x) * 30, x + 80, 350); ctx.lineTo(W, GY); ctx.lineTo(0, GY); ctx.fill();
    // cobertura da estação
    ink(5); ctx.fillStyle = '#7a3b2a'; ctx.beginPath(); ctx.moveTo(-10, 120); ctx.lineTo(560, 120); ctx.lineTo(540, 150); ctx.lineTo(-10, 150); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const x of [60, 300, 520]) { ctx.fillStyle = '#4a3a30'; ctx.fillRect(x - 6, 150, 12, GY - 150); ctx.strokeRect(x - 6, 150, 12, GY - 150); }
    ink(4); rrect(170, 170, 200, 46, 6, '#2a3a2a'); ctx.fillStyle = '#f4e7c5'; ctx.font = `22px ${FONT_TITLE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VILA VINIL', 270, 194);
    // relógio da estação
    ink(4); circle(430, 200, 22, '#fffaf0'); ctx.beginPath(); ctx.moveTo(430, 200); ctx.lineTo(430, 186); ctx.moveTo(430, 200); ctx.lineTo(440, 204); ctx.stroke();
    // plataforma e trilhos
    ctx.fillStyle = '#8a8478'; ctx.fillRect(0, GY, W, H - GY); ink(5); ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(0, GY + 4, W, 5);
  });
}

BOSSES.push(
  { id: 'piano', make: () => new Piano(), name: 'Pianão Pafúncio', place: 'Teatro Tecla de Ouro', song: 'boss4', bg: 'pit', par: 125, arenaR: 690, short: 'Teatro', quote: '"Vou te ensinar a dançar conforme a música!"' },
  { id: 'cartola', make: () => new Magician(), name: 'Mestre Cartola', place: 'Circo Abracadabra', song: 'boss5', bg: 'circus', par: 130, short: 'Circo', quote: '"Para o meu próximo truque... você SOME!"' },
  { id: 'locomotiva', make: () => new Train(), name: 'Locomotiva Lola', place: 'Estação Vila Vinil', song: 'boss6', bg: 'station', par: 140, arenaR: 600, short: 'Estação', quote: '"Piuí! Saia dos trilhos, pequenino!"' },
);
