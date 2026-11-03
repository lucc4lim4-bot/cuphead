'use strict';
// ===== Projéteis inimigos e os três chefões =====

const BULLET_ART = {}; // artes extras registradas por outros arquivos

function makeBullet(o) {
  return Object.assign({ x: 0, y: 0, vx: 0, vy: 0, ay: 0, r: 12, pink: false, life: 12, t: 0, kind: 'ball', rot: 0 }, o);
}

function updateBullet(b, dt, f) {
  b.t += dt; b.life -= dt;
  if (b.upd) b.upd(b, dt, f);
  else { b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
  if (b.x < -260 || b.x > W + 260 || b.y > H + 200 || b.y < -400) b.life = 0;
}

// colisão do projétil com uma caixa
function bulletHits(b, box) {
  if (b.hit) return b.hit(b, box);
  return circRect(b.x, b.y, b.r, box.x, box.y, box.w, box.h);
}

function drawBullet(b) {
  ctx.save(); ctx.translate(b.x, b.y); ink(3);
  const pinkOr = (c) => (b.pink ? PINK : c);
  switch (b.kind) {
    case 'note': {
      ctx.rotate(Math.sin(b.t * 8) * 0.25);
      ellipse(0, 6, 11, 8, -0.4, pinkOr(INK));
      ctx.beginPath(); ctx.moveTo(9, 3); ctx.lineTo(9, -24); ctx.quadraticCurveTo(22, -16, 18, -4); ctx.lineWidth = 4; ctx.stroke();
      break;
    }
    case 'record': {
      ctx.rotate(b.t * (b.vx > 0 ? 9 : -9));
      circle(0, 0, b.r, '#16110d');
      ctx.strokeStyle = '#3d332b'; ctx.lineWidth = 1.5; circle(0, 0, b.r * 0.75, null); circle(0, 0, b.r * 0.55, null);
      ink(2); circle(0, 0, b.r * 0.32, pinkOr('#c8352b'));
      ctx.beginPath(); ctx.moveTo(-b.r * 0.8, -4); ctx.lineTo(-b.r * 0.4, -4); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      break;
    }
    case 'wave': {
      const h = 40;
      ctx.beginPath(); ctx.moveTo(-30, GY - b.y); ctx.quadraticCurveTo(-18, -h, 0, -h); ctx.quadraticCurveTo(18, -h, 30, GY - b.y);
      ctx.fillStyle = '#f4e1b0'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -h + 12); ctx.quadraticCurveTo(0, -h + 4, 12, -h + 12); ctx.lineWidth = 2; ctx.stroke();
      break;
    }
    case 'drop': {
      ctx.beginPath(); ctx.moveTo(0, -b.r * 1.9); ctx.bezierCurveTo(b.r, -b.r * 0.4, b.r, b.r, 0, b.r); ctx.bezierCurveTo(-b.r, b.r, -b.r, -b.r * 0.4, 0, -b.r * 1.9);
      ctx.fillStyle = pinkOr('#8fb4d4'); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-3, 0, 2, 4, 0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
      break;
    }
    case 'bolt': {
      ctx.translate(-b.x, -b.y);
      if (b.t < b.warn) {
        const on = Math.floor(b.t * 14) % 2;
        ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.strokeStyle = on ? 'rgba(255,230,90,.9)' : 'rgba(26,20,16,.6)';
        ctx.beginPath(); ctx.moveTo(b.x, b.top); ctx.lineTo(b.x, GY); ctx.stroke(); ctx.setLineDash([]);
        circle(b.x, GY - 6, 18 + Math.sin(b.t * 30) * 3, 'rgba(255,230,90,.35)', false);
      } else {
        const seg = 14, len = (GY - b.top) / seg;
        for (const [w, c] of [[30, INK], [22, '#ffe45c'], [8, '#ffffff']]) {
          ctx.beginPath(); ctx.moveTo(b.x, b.top);
          for (let i = 1; i <= seg; i++) ctx.lineTo(b.x + (i === seg ? 0 : rand(-18, 18)), b.top + i * len);
          ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineJoin = 'miter'; ctx.stroke();
        }
      }
      break;
    }
    case 'cloudlet': {
      const s = 1 + Math.sin(b.t * 6) * 0.05; ctx.scale(s, 1 / s);
      const c = b.pink ? '#ffb3d6' : '#d8d2c4';
      ink(3);
      for (const [x, y, r] of [[-14, 4, 13], [14, 4, 13], [0, -6, 17]]) circle(x, y, r, c);
      ctx.beginPath(); ctx.fillStyle = c; ctx.arc(-14, 4, 11, 0, TAU); ctx.arc(14, 4, 11, 0, TAU); ctx.arc(0, -6, 15, 0, TAU); ctx.fill();
      pieEye(-6, -2, 4, 5, Math.sign(b.vx) || 1, 0); pieEye(6, -2, 4, 5, Math.sign(b.vx) || 1, 0);
      ink(2.5); ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(-2, -6); ctx.moveTo(10, -9); ctx.lineTo(2, -6); ctx.stroke();
      break;
    }
    case 'hail': {
      circle(0, 0, b.r, pinkOr('#e8f2fa'));
      ctx.beginPath(); ctx.arc(-3, -3, b.r * 0.35, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
      break;
    }
    case 'gear': {
      ctx.rotate(b.t * (b.vx > 0 ? 6 : -6));
      const n = 10, R = b.r, r2 = b.r * 0.78;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a0 = (i / (n * 2)) * TAU, a1 = ((i + 1) / (n * 2)) * TAU, rr = i % 2 ? r2 : R;
        ctx.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr); ctx.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr);
      }
      ctx.closePath(); ctx.fillStyle = pinkOr('#c99a3a'); ctx.fill(); ctx.stroke();
      circle(0, 0, b.r * 0.4, '#8a6420');
      circle(0, 0, b.r * 0.15, INK);
      break;
    }
    case 'tick': {
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-2, -7); ctx.lineTo(-14, -2); ctx.lineTo(-14, 2); ctx.lineTo(-2, 7); ctx.closePath();
      ctx.fillStyle = pinkOr('#2b241d'); ctx.fill(); ctx.stroke();
      break;
    }
    case 'egg': {
      ctx.rotate(b.t * 7);
      ellipse(0, 0, b.r * 0.8, b.r, 0, pinkOr('#fff6e0'));
      ctx.fillStyle = b.pink ? '#c2307a' : '#a68a5a';
      circle(-3, -4, 2.5, ctx.fillStyle, false); circle(4, 3, 2, ctx.fillStyle, false);
      break;
    }
    default: if (BULLET_ART[b.kind]) BULLET_ART[b.kind](b, pinkOr); else circle(0, 0, b.r, pinkOr('#f0d060'));
  }
  ctx.restore();
}

// ---------- Base dos chefões ----------
class Boss {
  constructor(name, hp) {
    this.name = name; this.hp = this.max = hp; this.phase = 1; this.t = 0; this.flash = 0;
    this.dead = false; this.q = []; this.cd = 1.4; this.seq = 0; this.deathT = 0;
  }
  after(d, fn) { this.q.push({ d, fn }); }
  tickQ(dt) {
    for (const e of this.q) e.d -= dt;
    const due = this.q.filter((e) => e.d <= 0); this.q = this.q.filter((e) => e.d > 0);
    for (const e of due) if (!this.dead) e.fn();
  }
  damage(n, f) {
    if (this.dead) return;
    this.hp -= n; this.flash = 0.05;
    const r = this.hp / this.max, np = r <= 0.33 ? 3 : r <= 0.66 ? 2 : 1;
    if (np !== this.phase) { this.phase = np; f.shake = 10; Snd.play('honk'); if (this.onPhase) this.onPhase(np, f); }
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.q = []; f.win(); }
  }
  baseUpdate(dt, f) {
    this.t += dt; this.flash -= dt; this.windup = Math.max(0, (this.windup || 0) - dt * 2.5);
    const tp = f.player;
    if (tp) {
      this.lookX = lerp(this.lookX || 0, clamp((tp.x - this.x) / 220, -1, 1), dt * 5);
      this.lookY = lerp(this.lookY || 0, clamp((tp.y - 50 - this.y) / 220, -1, 1), dt * 5);
    }
    if (this.dead) { this.deathT += dt; return false; }
    if (this.phaseT > 0) { this.phaseT -= dt; return true; }
    this.tickQ(dt); this.cd -= dt;
    if (this.cd <= 0 && this.q.length === 0) { this.seq++; f.pickTarget(); this.windup = 1; this.attack(f); if (f.diff) this.cd *= f.diff.cd; }
    return true;
  }
  dangerCircles() { return []; }
  hurtCircles() { return []; }
}

// ====================== CHEFÃO 1: Gramofone Gustavo ======================
class Gramophone extends Boss {
  constructor() {
    super('Gramofone Gustavo', 430);
    this.x = 770; this.y = GY; this.face = -1; this.hop = null; this.mouth = 0; this.yoff = 0;
  }
  local(lx, ly) { return { x: this.x + lx * -this.face, y: this.y + this.yoff + ly }; }
  hornMouth() { return this.local(-98, -248); }
  hurtCircles() { const a = this.local(0, -82), b = this.local(-70, -240); return [{ x: a.x, y: a.y, r: 82 }, { x: b.x, y: b.y, r: 50 }]; }
  dangerCircles() { const a = this.local(0, -70); return [{ x: a.x, y: a.y, r: 66 }]; }
  update(dt, f) {
    this.mouth = Math.max(0, this.mouth - dt * 3);
    if (!this.baseUpdate(dt, f)) return;
    if (this.hop) {
      const h = this.hop; h.t += dt; const k = Math.min(1, h.t / h.dur);
      this.x = lerp(h.sx, h.tx, ease(k)); this.yoff = -Math.sin(Math.PI * k) * 230;
      if (k >= 1) {
        this.hop = null; this.yoff = 0; f.shake = 16; Snd.play('boom');
        Particles.puff(this.x - 60, GY - 10, 5, 18); Particles.puff(this.x + 60, GY - 10, 5, 18);
        for (const d of [-1, 1]) f.eb.push(makeBullet({ kind: 'wave', x: this.x + d * 90, y: GY - 20, vx: d * 380, r: 22 }));
        this.face = f.player.x < this.x ? -1 : 1;
      }
    } else if (this.phase === 3) this.face = f.player.x < this.x ? -1 : 1;
  }
  attack(f) {
    const p = this.phase;
    if (p === 3 && this.seq % 3 === 0) {
      const tx = this.x > W / 2 ? 190 : 770;
      this.hop = { t: 0, dur: 1.05, sx: this.x, tx }; Snd.play('jump'); this.cd = 2.2; return;
    }
    if (this.seq % 2 === 1) {
      const n = p === 1 ? 4 : 5, gap = p === 1 ? 0.42 : 0.34;
      for (let i = 0; i < n; i++) this.after(i * gap, () => this.note(f, i === 2));
      this.cd = n * gap + (p === 1 ? 1.5 : 1.0);
    } else if (p >= 2 && this.seq % 4 === 0) {
      this.after(0.5, () => this.blast(f)); this.cd = 2.0; this.mouth = 1;
    } else {
      const n = p === 1 ? 1 : 2;
      for (let i = 0; i < n; i++) this.after(i * 0.9, () => this.record(f, p >= 2));
      this.cd = 1.4 + n * 0.9;
    }
  }
  note(f, pink) {
    const m = this.hornMouth(); this.mouth = 1; Snd.play('honk');
    const tx = f.player.x, ty = f.player.y - 35;
    const a = Math.atan2(ty - m.y, tx - m.x), sp = this.phase === 1 ? 210 : 250;
    const dx = Math.cos(a), dy = Math.sin(a);
    f.eb.push(makeBullet({
      kind: 'note', x: m.x, y: m.y, r: 13, pink, ox: m.x, oy: m.y, vx: dx,
      upd: (b, dt) => { const d = b.t * sp, w = Math.sin(b.t * 6) * 34; b.x = b.ox + dx * d - dy * w; b.y = b.oy + dy * d + dx * w; },
    }));
  }
  blast(f) {
    const m = this.hornMouth(); Snd.play('honk'); f.shake = 5;
    const a0 = Math.atan2(f.player.y - 35 - m.y, f.player.x - m.x);
    for (let i = -2; i <= 2; i++) {
      const a = a0 + i * 0.22;
      f.eb.push(makeBullet({ kind: 'note', x: m.x, y: m.y, r: 13, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, pink: i === 0 }));
    }
  }
  record(f, bouncy) {
    const s = this.local(-90, -30); Snd.play('dash');
    f.eb.push(makeBullet({
      kind: 'record', x: s.x, y: GY - 24, r: 24, vx: this.face * (bouncy ? 330 : 300), vy: bouncy ? -520 : 0, ay: bouncy ? 1500 : 0, pink: Math.random() < 0.25,
      upd: (b, dt) => { b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > GY - b.r) { b.y = GY - b.r; if (b.ay) b.vy = -520; } },
    }));
  }
}

// ====================== CHEFÃO 2: Nuvem Nimbo ======================
class Nimbo extends Boss {
  constructor() {
    super('Nuvem Nimbo', 390);
    this.x = W / 2 + 120; this.y = 120; this.puff = 0; this.windT = 0;
  }
  hurtCircles() { return [{ x: this.x, y: this.y, r: 92 }]; }
  dangerCircles() { return [{ x: this.x, y: this.y + 10, r: 70 }]; }
  update(dt, f) {
    this.puff = Math.max(0, this.puff - dt * 2);
    if (this.windT > 0) { this.windT -= dt; f.wind = this.windDir * 170; if (Math.random() < 0.4) Particles.add({ kind: 'puff', x: this.windDir > 0 ? -20 : W + 20, y: rand(150, GY), vx: this.windDir * 700, life: 1, size: 3, color: '#fff' }); }
    else f.wind = 0;
    if (!this.baseUpdate(dt, f)) { this.y += dt * 30; return; }
    const sp = this.phase === 3 ? 0.75 : 0.55;
    this.x = W / 2 + Math.sin(this.t * sp) * 280; this.y = 125 + Math.sin(this.t * 1.4) * 16;
  }
  attack(f) {
    const p = this.phase, s = this.seq;
    if (s % 3 === 0) { this.lightning(f, p === 3 ? 2 : 1); this.cd = p === 1 ? 2.2 : 1.8; return; }
    if (p >= 2 && s % 3 === 1 && f.eb.filter((b) => b.kind === 'cloudlet').length < 3) { this.minions(f); this.cd = 1.6; return; }
    if (p === 3 && s % 2 === 0) { this.hail(f); this.cd = 1.6; return; }
    this.rain(f, p); this.cd = p === 1 ? 2.6 : 2.2;
    if (p === 3) { this.windT = 2.8; this.windDir = Math.random() < 0.5 ? -1 : 1; this.puff = 1; }
  }
  rain(f, p) {
    const n = p === 1 ? 8 : 10;
    for (let i = 0; i < n; i++) this.after(i * 0.18, () => {
      f.eb.push(makeBullet({
        kind: 'drop', x: this.x + rand(-85, 85), y: this.y + 55, vy: 80, ay: 900, r: 10, pink: i % 5 === 4,
        upd: (b, dt) => { b.vy += b.ay * dt; b.y += b.vy * dt; b.x += (f.wind || 0) * 0.4 * dt; if (b.y > GY - 6) { b.life = 0; Particles.puff(b.x, GY - 4, 2, 6, '#cfe0ee'); } },
      }));
    });
  }
  lightning(f, n) {
    this.puff = 1;
    const xs = n === 1 ? [f.player.x] : [f.player.x, clamp(f.player.x + (f.player.x > W / 2 ? -200 : 200), 40, W - 40)];
    for (const x of xs) {
      const b = makeBullet({
        kind: 'bolt', x, y: GY / 2, top: this.y + 60, warn: 0.85, life: 0.85 + 0.32, solid: true,
        hit: (b, box) => b.t >= b.warn && box.x < b.x + 22 && box.x + box.w > b.x - 22,
        upd: (b) => { b.top = this.y + 60; if (!b.zapped && b.t >= b.warn) { b.zapped = true; Snd.play('zap'); f.shake = 8; Particles.puff(b.x, GY - 6, 4, 14, '#ffe45c'); } else if (!b.zapped && Math.floor(b.t * 7) !== Math.floor((b.t - 1 / 60) * 7)) Snd.play('warn'); },
      });
      f.eb.push(b);
    }
  }
  minions(f) {
    for (let i = 0; i < 2; i++) {
      const pink = i === 1;
      f.eb.push(makeBullet({
        kind: 'cloudlet', x: this.x + (i ? 60 : -60), y: this.y + 40, r: 22, pink, hp: 6, shootable: true, life: 10,
        upd: (b, dt, f) => {
          const tx = f.player.x, ty = f.player.y - 60; const a = Math.atan2(ty - b.y, tx - b.x), sp = 85;
          b.vx = lerp(b.vx, Math.cos(a) * sp, dt * 2); b.vy = lerp(b.vy, Math.sin(a) * sp, dt * 2);
          b.x += b.vx * dt; b.y += b.vy * dt + Math.sin(b.t * 4) * 0.5;
          if (b.life < 0.05) Particles.puff(b.x, b.y, 3, 12, '#d8d2c4');
        },
      }));
    }
  }
  hail(f) {
    this.puff = 1;
    const a0 = Math.atan2(f.player.y - 40 - this.y, f.player.x - this.x);
    for (let w = 0; w < 2; w++) this.after(w * 0.5, () => {
      for (let i = -3; i <= 3; i++) {
        const a = a0 + i * 0.18 + (w ? 0.09 : 0);
        f.eb.push(makeBullet({ kind: 'hail', x: this.x, y: this.y + 50, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 9, pink: i === 0 && w === 1 }));
      }
    });
  }
}

// ====================== CHEFÃO 3: Rei Relógio ======================
class ClockKing extends Boss {
  constructor() {
    super('Rei Relógio', 480);
    this.x = 735; this.y = 215; this.hand = 0; this.pend = null; this.door = 0; this.spin = 0;
  }
  hurtCircles() { return [{ x: this.x, y: this.y, r: 112 }, { x: this.x, y: this.y + 175, r: 80 }]; }
  dangerCircles() {
    const d = [{ x: this.x, y: this.y, r: 95 }];
    if (this.pend) { const b = this.bob(); d.push({ x: b.x, y: b.y, r: 36 }); }
    return d;
  }
  bob() { const p = this.pend; return { x: 470 + Math.sin(p.a) * p.len, y: -40 + Math.cos(p.a) * p.len }; }
  onPhase(p, f) {
    if (p === 2) this.pend = { t: 0, a: 0, len: 60 };
    if (p === 3) { if (this.pend) { const b = this.bob(); Particles.puff(b.x, b.y, 8, 20); } this.pend = null; Snd.play('bell'); }
  }
  update(dt, f) {
    this.door = Math.max(0, this.door - dt * 1.5);
    this.spin = Math.max(0, this.spin - dt);
    this.hand += dt * (0.8 + this.spin * 6);
    if (this.pend) { const p = this.pend; p.t += dt; p.len = Math.min(472, p.len + dt * 260); p.a = Math.sin(p.t * TAU / 3.4) * 0.74; }
    if (!this.baseUpdate(dt, f)) return;
    this.y = 215 + Math.sin(this.t * 1.6) * 12;
  }
  attack(f) {
    const p = this.phase, s = this.seq;
    if (p === 1) { if (s % 2) { this.gears(f, 3, 300); this.cd = 3.6; } else { this.spiral(f, 3, 10); this.cd = 2.6; } return; }
    if (p === 2) { if (s % 2) { this.spiral(f, 2, 8); this.cd = 2.6; } else { this.gears(f, 1, 280); this.cd = 2.4; } return; }
    if (s % 3 === 0) { this.cuckoo(f); this.cd = 2.4; }
    else if (s % 3 === 1) { this.gears(f, 3, 360); this.cd = 2.6; }
    else { this.spiral(f, 4, 11); this.cd = 2.4; }
  }
  gears(f, n, sp) {
    for (let i = 0; i < n; i++) this.after(i * 0.85, () => {
      const bounce = i === n - 1 && n > 1, fromLeft = this.phase === 3 && i === 1;
      const x = fromLeft ? -40 : W + 40, dir = fromLeft ? 1 : -1;
      f.eb.push(makeBullet({
        kind: 'gear', x, y: GY - 28, r: 28, vx: dir * sp, vy: bounce ? -200 : 0, ay: bounce ? 1500 : 0, pink: i === 1 && !fromLeft && Math.random() < 0.5,
        upd: (b, dt) => { b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > GY - b.r) { b.y = GY - b.r; if (b.ay) b.vy = -640; } },
      }));
      Snd.play('dash');
    });
  }
  spiral(f, waves, n) {
    this.spin = 1.2;
    for (let w = 0; w < waves; w++) this.after(w * 0.45, () => {
      const off = this.t * 1.7 + w * 0.3; Snd.play('warn');
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * TAU;
        f.eb.push(makeBullet({ kind: 'tick', x: this.x + Math.cos(a) * 60, y: this.y + Math.sin(a) * 60, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 10, pink: i === 0 }));
      }
    });
  }
  cuckoo(f) {
    this.door = 1; this.after(0.3, () => Snd.play('cuckoo'));
    for (let i = 0; i < 3; i++) this.after(0.45 + i * 0.4, () => {
      const sx = this.x + 112, sy = this.y - 96, T = 1.05, g = 950;
      const tx = f.player.x + rand(-40, 40) + (i - 1) * 60, ty = GY - 15;
      f.eb.push(makeBullet({ kind: 'egg', x: sx, y: sy, r: 13, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * g * T * T) / T, ay: g, pink: i === 1,
        upd: (b, dt) => { b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > GY - 10) { b.life = 0; Particles.puff(b.x, GY - 8, 3, 9, '#fff6e0'); } } }));
    });
  }
}

const BOSSES = [
  { id: 'gramofone', make: () => new Gramophone(), name: 'Gramofone Gustavo', place: 'Salão de Música Vinil', song: 'boss1', bg: 'hall', par: 110, short: 'Salão', quote: '"Quem não dança, rola!"' },
  { id: 'nimbo', make: () => new Nimbo(), name: 'Nuvem Nimbo', place: 'Telhados da Vila', song: 'boss2', bg: 'roofs', par: 120, short: 'Telhados', quote: '"Hoje a previsão é de TEMPESTADE!"' },
  { id: 'relogio', make: () => new ClockKing(), name: 'Rei Relógio', place: 'Torre do Relógio', song: 'boss3', bg: 'tower', par: 135, arenaR: 620, short: 'Torre', quote: '"Seu tempo acabou, palitinho!"' },
];
