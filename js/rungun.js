'use strict';
// ===== Fases Run 'n' Gun de moedas =====
// Corrida lateral sem tempo limite: poços, plataformas, inimigos comuns e checkpoints.
// Cada fase tem 6 moedas que só podem ser pegas uma vez (a economia é finita) e termina
// num mini-boss de pouca vida, que usa o mesmo sistema de luta dos chefões.

const COINS_PER_LEVEL = 6;
const LEVELS = [
  { id: 'rg_telhados', name: 'Corrida nos Telhados', theme: 'roofs', skin: 'roof', len: 7800, seed: 7, song: 'boss2', bg: 'roofs',
    make: () => new MiniPigeon(), miniName: 'Pombo Valentão', quote: '"Aqui é território de pombo!"' },
  { id: 'rg_bastidores', name: 'Corrida pelos Bastidores', theme: 'hall', skin: 'hall', len: 8400, seed: 19, song: 'boss1', bg: 'hall',
    make: () => new MiniDrum(), miniName: 'Tambor Trovão', quote: '"BUM! BUM! Sai da frente!"' },
  { id: 'rg_engrenagem', name: 'Corrida pela Engrenagem', theme: 'tower', skin: 'tower', len: 9000, seed: 31, song: 'boss3', bg: 'tower',
    make: () => new MiniCuckoo(), miniName: 'Cuco Maluco', quote: '"Cucu! Cucu! Hora do ovo!"' },
];

// ---------- geração da fase: módulos sorteados com semente fixa (a fase é sempre a mesma) ----------
function buildLevel(L) {
  const rnd = mulberry32(L.seed), R = (a, b) => a + rnd() * (b - a), choose = (arr) => arr[(rnd() * arr.length) | 0];
  const lv = { platforms: [], pits: [], enemies: [], coins: [], hearts: [], cps: [] };
  const mods = [];
  let x = 760, last = '';
  const maxX = L.len - W - 200;                      // a última tela é a arena do mini-boss
  const kinds = ['walkers', 'pit', 'stairs', 'turrets', 'fliers', 'highroad'];
  while (x < maxX - 700) {
    let k = choose(kinds); while (k === last) k = choose(kinds); last = k;
    const m = { kind: k, x0: x, w: 0, spot: null };
    if (k === 'walkers') {
      const n = 2 + ((rnd() * 2) | 0);
      for (let i = 0; i < n; i++) lv.enemies.push({ type: 'walker', x: x + 170 + i * 200, y: GY });
      m.w = 170 + n * 200 + 60; m.spot = [x + m.w / 2, GY - 64];
    } else if (k === 'pit') {
      const pw = Math.round(R(130, 170));
      lv.pits.push([x + 240, pw]); lv.platforms.push([x + 240 + pw / 2 - 48, GY - 105, 96]);
      lv.enemies.push({ type: 'flier', x: x + 240 + pw + 220, y: GY - 160 });
      m.w = 240 + pw + 260; m.spot = [x + 240 + pw / 2, GY - 105 - 34];
    } else if (k === 'stairs') {
      const ys = [GY - 85, GY - 140, GY - 90];
      ys.forEach((py, i) => lv.platforms.push([x + 150 + i * 200, py, 130]));
      lv.enemies.push({ type: 'walker', x: x + 150, y: GY }, { type: 'flier', x: x + 520, y: GY - 210 });
      m.w = 150 + 3 * 200 + 60; m.spot = [x + 150 + 200 + 65, GY - 140 - 30];
    } else if (k === 'turrets') {
      lv.enemies.push({ type: 'turret', x: x + 260, y: GY }, { type: 'turret', x: x + 640, y: GY });
      m.w = 860; m.spot = [x + 450, GY - 64];
    } else if (k === 'fliers') {
      for (let i = 0; i < 3; i++) lv.enemies.push({ type: 'flier', x: x + 220 + i * 230, y: GY - 120 - (i % 2) * 80 });
      lv.enemies.push({ type: 'walker', x: x + 700, y: GY });
      m.w = 860; m.spot = [x + 480, GY - 175];
    } else {
      lv.platforms.push([x + 220, GY - 105, 400]);
      lv.enemies.push({ type: 'walker', x: x + 420, y: GY }, { type: 'turret', x: x + 760, y: GY });
      m.w = 920; m.spot = [x + 420, GY - 105 - 34];
    }
    mods.push(m); x += m.w;
  }
  // 6 moedas espalhadas pelos módulos (uma por módulo, bem distribuídas)
  const step = mods.length / COINS_PER_LEVEL;
  for (let c = 0; c < COINS_PER_LEVEL; c++) { const m = mods[Math.min(mods.length - 1, Math.floor(c * step + step / 2))]; lv.coins.push({ x: m.spot[0], y: m.spot[1], i: c }); }
  // corações a cada ~3 módulos e checkpoints a cada ~2
  mods.forEach((m, i) => {
    if (i % 3 === 2) lv.hearts.push({ x: m.x0 + 90, y: GY - 62 });
    if (i % 2 === 1) lv.cps.push(m.x0 + 70);
  });
  lv.enemies.sort((a, b) => a.x - b.x);
  return lv;
}

// ---------- inimigos comuns ----------
class RGEnemy {
  constructor(o) {
    Object.assign(this, { x: 0, y: GY, t: rand(0, 3), flash: 0, dead: false, dir: -1, cd: rand(0.6, 1.6) }, o);
    this.sx = this.x; this.by = this.y;
    const T = { walker: { hp: 2, w: 40, h: 46 }, flier: { hp: 1, w: 40, h: 34 }, turret: { hp: 4, w: 46, h: 62 } }[this.type];
    Object.assign(this, T);
  }
  box() { return this.type === 'flier' ? { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h } : { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
  hurtCircles() { const b = this.box(); return [{ x: b.x + b.w / 2, y: b.y + b.h / 2, r: Math.max(b.w, b.h) * 0.55 }]; }
  damage(n, f) {
    this.hp -= n; this.flash = 0.07;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true; Snd.play('boom'); const c = this.hurtCircles()[0];
      Particles.puff(c.x, c.y, 5, 16); Particles.stars(c.x, c.y, 7, '#ffd84a');
      if (this.type === 'walker' && Math.random() < 0.1) f.level.hearts.push({ x: c.x, y: GY - 62 });  // às vezes solta um coração
    }
  }
  update(dt, f) {
    this.t += dt; this.flash -= dt;
    if (this.type === 'walker') {
      this.x += this.dir * 58 * dt;
      if (this.x < this.sx - 90) this.dir = 1; else if (this.x > this.sx + 90) this.dir = -1;
    } else if (this.type === 'flier') {
      this.x -= 62 * dt; this.y = this.by + Math.sin(this.t * 2.6) * 38;
    } else {
      this.cd -= dt;
      const tg = f.player;
      if (this.cd <= 0 && this.x > f.camX + 30 && this.x < f.camX + W - 30 && tg) {
        this.cd = 2.6 * f.diff.cd;
        const sx = this.x, sy = this.y - 48, a = Math.atan2(tg.y - 40 - sy, tg.x - sx);
        f.eb.push(makeBullet({ kind: 'rgball', x: sx, y: sy, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, r: 10, life: 6 }));
        Snd.play('shoot2'); this.kick = 1;
      }
      this.kick = Math.max(0, (this.kick || 0) - dt * 5);
    }
  }
  draw(skin) {
    ctx.save(); ctx.translate(this.x, this.y);
    if (this.flash > 0) { ctx.globalAlpha = 0.65; }
    const t = this.t;
    if (this.type === 'walker') {
      ctx.scale(-this.dir, 1);
      const step = Math.sin(t * 9) * 4;
      shoe(-8 + step, 0, 1, 6, '#2a1a10'); shoe(8 - step, 0, 1, 6, '#2a1a10');
      if (skin === 'roof') {            // gato de telhado
        ctx.beginPath(); ctx.moveTo(-18, -22); ctx.quadraticCurveTo(-34, -40 + Math.sin(t * 5) * 4, -26, -52); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#8a8f9a'; ctx.stroke();
        ink(3); ellipse(0, -22, 20, 15, 0, '#8a8f9a'); shine(-6, -28, 7, 3, -0.4, 0.4);
        circle(10, -40, 14, '#8a8f9a');
        for (const ex of [4, 16]) { ctx.beginPath(); ctx.moveTo(ex - 5, -50); ctx.lineTo(ex, -64); ctx.lineTo(ex + 5, -50); ctx.closePath(); ctx.fillStyle = '#8a8f9a'; ctx.fill(); ink(2.5); ctx.stroke(); }
        pieEye(6, -41, 4, 5.5, 1, 0, 0, 0.35, '#8a8f9a', 0.3); pieEye(15, -41, 4, 5.5, 1, 0, 0, 0.35, '#8a8f9a', -0.3);
        ink(1.8); for (const dy of [-1, 3]) { ctx.beginPath(); ctx.moveTo(18, -34 + dy); ctx.lineTo(30, -36 + dy * 2); ctx.stroke(); }
      } else if (skin === 'hall') {     // tambor soldadinho
        ink(3); rrect(-18, -46, 36, 38, 6, '#c8352b'); shade(pRRect(-18, -46, 36, 38, 6), 'rgba(60,0,0,.3)', -6, -5);
        ctx.fillStyle = '#e0b04a'; ctx.fillRect(-18, -46, 36, 6); ctx.fillRect(-18, -14, 36, 6); ink(3); ctx.strokeRect(-18, -46, 36, 6); ctx.strokeRect(-18, -14, 36, 6);
        ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-16, -40); ctx.lineTo(-8, -14); ctx.lineTo(0, -40); ctx.lineTo(8, -14); ctx.lineTo(16, -40); ctx.stroke();
        pieEye(-5, -28, 4.5, 6, 1, 0); pieEye(7, -28, 4.5, 6, 1, 0);
        ink(3); ctx.beginPath(); ctx.moveTo(-10, -52); ctx.lineTo(-24, -66 + Math.sin(t * 9) * 4); ctx.moveTo(10, -52); ctx.lineTo(24, -66 - Math.sin(t * 9) * 4); ctx.stroke();
      } else {                          // engrenagem-aranha
        ink(2.5); for (let i = 0; i < 4; i++) { const a = Math.PI * (0.15 + i * 0.23) + Math.sin(t * 8 + i) * 0.15; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(Math.cos(a) * 26 - 6, -22 + Math.sin(a) * 24); ctx.lineWidth = 3; ctx.stroke(); }
        ctx.save(); ctx.translate(0, -30); ctx.rotate(t * 2);
        ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, rr = i % 2 ? 17 : 22; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = '#c99a3a'; ctx.fill(); ink(3); ctx.stroke(); ctx.restore();
        pieEye(-5, -31, 4.5, 6, 1, 0); pieEye(7, -31, 4.5, 6, 1, 0);
      }
    } else if (this.type === 'flier') {
      const fl = Math.sin(t * 16);
      ctx.scale(-1, 1);
      ink(3);
      ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-10, -26 * fl - 6, -26, -20 * fl); ctx.quadraticCurveTo(-14, -2, -4, 4); ctx.closePath(); ctx.fillStyle = skin === 'tower' ? '#4a3a30' : '#e8e6ea'; ctx.fill(); ctx.stroke();
      if (skin === 'roof') { ellipse(0, 0, 18, 12, 0.1, '#9aa0b0'); shine(-5, -5, 5, 2.5, -0.4, 0.5); circle(14, -6, 8, '#9aa0b0'); ctx.beginPath(); ctx.moveTo(21, -6); ctx.lineTo(30, -3); ctx.lineTo(21, -1); ctx.closePath(); ctx.fillStyle = '#f2a33a'; ctx.fill(); ink(2.5); ctx.stroke(); pieEye(14, -8, 3, 4, 1, 0, 0, 0.35, '#9aa0b0', 0.3); }
      else if (skin === 'hall') { ctx.fillStyle = INK; ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', 0, 2); pieEye(-1, 8, 3, 4, 1, 0); }
      else { ink(3); circle(0, 0, 14, '#fffaf0'); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -9); ctx.moveTo(0, 0); ctx.lineTo(6, 3); ctx.stroke(); }
    } else {
      // torreta: base, cano e rosto, com recuo ao atirar
      ink(4);
      if (skin === 'roof') { rrect(-20, -50, 40, 50, 4, '#9c4a30'); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; for (const yy of [-36, -22, -8]) { ctx.beginPath(); ctx.moveTo(-20, yy); ctx.lineTo(20, yy); ctx.stroke(); } ink(4); rrect(-24, -60, 48, 12, 3, '#3a2a22'); }
      else if (skin === 'hall') { rrect(-22, -54, 44, 54, 6, '#3a2a22'); circle(0, -30, 16, '#1a1410'); circle(0, -30, 7, '#5a4a40'); ink(4); rrect(-24, -60, 48, 8, 3, '#e0b04a'); }
      else { rrect(-20, -46, 40, 46, 6, '#6b4423'); ink(4); circle(0, -52, 14, '#c99a3a'); ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(0, -60); ctx.moveTo(0, -52); ctx.lineTo(7, -50); ctx.stroke(); }
      const k = this.kick || 0;
      pieEye(-7, -36 + k * 2, 5, 7, -1, 0, 0, 0.3, skin === 'roof' ? '#9c4a30' : '#3a2a22', 0.3); pieEye(7, -36 + k * 2, 5, 7, -1, 0, 0, 0.3, skin === 'roof' ? '#9c4a30' : '#3a2a22', -0.3);
      ink(3); ctx.beginPath(); ctx.ellipse(0, -20, 8, 4 + k * 5, 0, 0, TAU); ctx.fillStyle = '#3b0d08'; ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
}
BULLET_ART.rgball = (b) => { ink(3); circle(0, 0, b.r, '#e2523a'); circle(0, 0, b.r * 0.55, '#ffb347', false); shine(-b.r * 0.35, -b.r * 0.4, b.r * 0.3, b.r * 0.18, -0.5, 0.8); };

// ---------- mini-bosses (pouca vida, um padrão simples) ----------
class MiniPigeon extends Boss {
  constructor() { super('Pombo Valentão', 60); this.mini = true; this.x = 770; this.y = GY - 140; this.bx = 770; this.chg = null; this.wing = 0; }
  hurtCircles() { return [{ x: this.x, y: this.y, r: 58 }]; }
  dangerCircles() { return [{ x: this.x, y: this.y + 4, r: 46 }]; }
  update(dt, f) {
    this.wing += dt * (this.chg ? 22 : 11);
    if (!this.dead) {
      if (this.chg) {
        const c = this.chg; c.t += dt;
        if (c.t < 0.9) { this.x = c.sx + Math.sin(c.t * 60) * 3; this.y = lerp(this.y, GY - 150, dt * 6); }                 // aviso: treme e sobe
        else if (c.t < 1.9) { this.x = lerp(c.sx, c.tx, ease(c.t - 0.9)); this.y = lerp(this.y, GY - 44, dt * 10); }      // voo rasante: pule!
        else if (c.t < 2.9) { this.x = lerp(c.tx, this.bx, ease(c.t - 1.9)); this.y = lerp(this.y, GY - 140, dt * 5); }
        else this.chg = null;
      } else { this.x = this.bx + Math.sin(this.t * 1.3) * 28; this.y = GY - 140 + Math.sin(this.t * 2.4) * 14; }
    } else this.y += dt * 80;
    this.baseUpdate(dt, f);
  }
  attack(f) {
    if (this.seq % 3 === 0 && !this.chg) { this.chg = { t: 0, sx: this.x, tx: 90 }; this.cd = 4.2; Snd.play('honk'); return; }
    this.after(0, () => this.feathers(f)); this.after(0.7, () => this.feathers(f)); this.cd = 2.6;
  }
  feathers(f) {
    const a0 = Math.atan2(f.player.y - 40 - this.y, f.player.x - this.x); Snd.play('shoot2');
    for (const da of [-0.25, 0, 0.25]) f.eb.push(makeBullet({ kind: 'tick', x: this.x - 30, y: this.y + 10, vx: Math.cos(a0 + da) * 250, vy: Math.sin(a0 + da) * 250, r: 10 }));
  }
  draw() {
    ctx.save(); ctx.translate(this.x, this.y); if (this.dead) ctx.translate(rand(-4, 4), rand(-3, 3));
    const fl = this.flash > 0, w = Math.sin(this.wing), body = fl ? '#d4dae6' : '#8f9bb5', wing = fl ? '#f0f2f8' : '#b8c0d6';
    if (this.chg && this.chg.t < 0.9) { ctx.strokeStyle = 'rgba(255,60,40,.7)'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(-50, 100); ctx.lineTo(-700, 100); ctx.stroke(); ctx.setLineDash([]); }
    // asa de trás
    ink(4); ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(50, -70 * w - 10, 90, -50 * w + 10); ctx.quadraticCurveTo(50, -10, 22, 22); ctx.closePath(); ctx.fillStyle = wing; ctx.fill(); ctx.stroke();
    // corpo
    shape(pEllipse(0, 4, 54, 44), body, 5, 'rgba(20,30,60,.3)', -8, -6); shine(-22, -18, 14, 6, -0.5, 0.45);
    ctx.beginPath(); ctx.ellipse(8, 22, 34, 20, 0, 0, TAU); ctx.fillStyle = fl ? '#fff' : '#d6dcec'; ctx.fill();
    // pescoço iridescente
    ink(3); ctx.beginPath(); ctx.ellipse(-30, -22, 26, 12, 0.2, 0, TAU); ctx.fillStyle = '#7ec8a0'; ctx.fill(); ctx.stroke();
    // cabeça e bico
    shape(pCircle(-36, -34, 26), body, 4.5, 'rgba(20,30,60,.3)', -6, -6);
    ink(4); ctx.beginPath(); ctx.moveTo(-58, -34); ctx.lineTo(-84, -26); ctx.lineTo(-58, -20); ctx.closePath(); ctx.fillStyle = '#f2a33a'; ctx.fill(); ctx.stroke();
    pieEye(-38, -40, 9, 11, -1, 0.3, (this.t % 3.5) > 3.36 ? 1 : 0, 0.35, body, 0.3);
    ink(5); ctx.beginPath(); ctx.moveTo(-52, -58); ctx.lineTo(-26, -50); ctx.stroke();
    // asa da frente
    ink(4); ctx.beginPath(); ctx.moveTo(14, -6); ctx.quadraticCurveTo(-20, -56 * -w - 6, -56, -40 * -w + 14); ctx.quadraticCurveTo(-20, 2, -2, 26); ctx.closePath(); ctx.fillStyle = wing; ctx.fill(); ctx.stroke();
    // patas
    ink(4); for (const dx of [-8, 14]) { ctx.beginPath(); ctx.moveTo(dx, 44); ctx.lineTo(dx - 4, 60); ctx.moveTo(dx - 12, 62); ctx.lineTo(dx + 8, 62); ctx.stroke(); }
    ctx.restore();
  }
}
class MiniDrum extends Boss {
  constructor() { super('Tambor Trovão', 70); this.mini = true; this.x = 770; this.yoff = 0; this.hop = null; this.sq = 0; }
  hurtCircles() { return [{ x: this.x, y: GY - 62 + this.yoff, r: 64 }]; }
  dangerCircles() { return [{ x: this.x, y: GY - 56 + this.yoff, r: 54 }]; }
  update(dt, f) {
    if (this.hop && !this.dead) {
      const h = this.hop; h.t += dt; const k = Math.min(1, h.t / h.dur);
      this.x = lerp(h.sx, h.tx, ease(k)); this.yoff = -Math.sin(Math.PI * k) * 200;
      if (k >= 1) {
        this.hop = null; this.yoff = 0; this.sq = 1; f.shake = 12; Snd.play('boom'); Particles.puff(this.x - 50, GY - 8, 4, 16); Particles.puff(this.x + 50, GY - 8, 4, 16);
        for (const d of [-1, 1]) f.eb.push(makeBullet({ kind: 'wave', x: this.x + d * 70, y: GY - 20, vx: d * 330, r: 20 }));
      }
    }
    this.sq = Math.max(0, this.sq - dt * 3);
    this.baseUpdate(dt, f);
  }
  attack(f) {
    if (this.seq % 2 === 1) { const tx = this.x > W / 2 ? 190 : 770; this.hop = { t: 0, dur: 0.95, sx: this.x, tx }; Snd.play('jump'); this.cd = 2.6; return; }
    for (let i = 0; i < 3; i++) this.after(i * 0.4, () => {
      const sx = this.x, sy = GY - 130 + this.yoff, a = Math.atan2(f.player.y - 40 - sy, f.player.x - sx);
      f.eb.push(makeBullet({ kind: 'note', x: sx, y: sy, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, r: 13 })); Snd.play('honk');
    });
    this.cd = 2.8;
  }
  draw() {
    const fl = this.flash > 0; groundShadow(this.x, 80, 0.35);
    ctx.save(); ctx.translate(this.x, GY + this.yoff); if (this.dead) ctx.translate(rand(-4, 4), rand(-3, 3));
    const sq = 1 - this.sq * 0.12 + Math.sin(this.t * 6) * 0.015; ctx.scale(1 / sq, sq);
    const st = this.hop ? -10 : Math.sin(this.t * 8) * 3;
    hose(-30, -22, -34, -4 + st, 6, 9); hose(30, -22, 34, -4 - st, -6, 9); shoe(-34, st * 0.4, -1, 13, '#2a1a10'); shoe(40, -st * 0.4, -1, 13, '#2a1a10');
    const body = () => { ctx.moveTo(-58, -20); ctx.lineTo(-58, -112); ctx.lineTo(58, -112); ctx.lineTo(58, -20); ctx.closePath(); };
    shape(body, fl ? '#e86a5a' : '#c8352b', 6, 'rgba(60,0,0,.35)', -12, -4);
    ctx.save(); ctx.beginPath(); body(); ctx.clip(); ctx.strokeStyle = 'rgba(255,246,224,.85)'; ctx.lineWidth = 5;
    ctx.beginPath(); for (let i = -4; i <= 4; i++) { ctx.moveTo(i * 14, -112); ctx.lineTo(i * 14 + 14, -20); ctx.moveTo(i * 14 + 14, -112); ctx.lineTo(i * 14, -20); } ctx.stroke(); ctx.restore();
    ink(5); ellipse(0, -112, 58, 14, 0, '#fff6e0'); ellipse(0, -20, 58, 12, 0, '#e0b04a', false); ctx.beginPath(); ctx.ellipse(0, -20, 58, 12, 0, 0, Math.PI); ctx.stroke();
    for (const yy of [-112, -20]) for (let i = -5; i <= 5; i++) circle(i * 11, yy + (yy < -50 ? 12 : 10), 3, '#e0b04a');
    // rosto
    ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.ellipse(0, -66, 38, 28, 0, 0, TAU); ctx.fill(); ink(4); ctx.stroke();
    const blink = (this.t % 3.2) > 3.06 ? 1 : 0;
    pieEye(-14, -70, 10, 13, -1, 0.2, blink, 0.3, '#fff6e0', 0.3); pieEye(14, -70, 10, 13, -1, 0.2, blink, 0.3, '#fff6e0', -0.3);
    ink(5); ctx.beginPath(); ctx.moveTo(-26, -88); ctx.lineTo(-6, -82); ctx.moveTo(26, -88); ctx.lineTo(6, -82); ctx.stroke();
    ink(4); ellipse(0, -48, 14, 6 + (this.windup || 0) * 7, 0, '#3b120c');
    // braços com baquetas
    const sw = Math.sin(this.t * 10) * 14;
    hose(-56, -80, -92, -108 - sw, -10, 9); glove(-94, -110 - sw, 12, -2.2, true); ink(5); ctx.beginPath(); ctx.moveTo(-98, -116 - sw); ctx.lineTo(-112, -146 - sw); ctx.stroke(); circle(-114, -150 - sw, 6, '#e0b04a');
    hose(56, -80, 92, -108 + sw, 10, 9); glove(94, -110 + sw, 12, -0.9, true); ink(5); ctx.beginPath(); ctx.moveTo(98, -116 + sw); ctx.lineTo(112, -146 + sw); ctx.stroke(); circle(114, -150 + sw, 6, '#e0b04a');
    ctx.restore();
  }
}
class MiniCuckoo extends Boss {
  constructor() { super('Cuco Maluco', 80); this.mini = true; this.x = 760; this.y = GY - 150; this.door = 0; }
  hurtCircles() { return [{ x: this.x, y: this.y - 10, r: 74 }]; }
  dangerCircles() { return [{ x: this.x, y: this.y, r: 58 }]; }
  update(dt, f) { this.door = Math.max(0, this.door - dt * 1.4); this.y = GY - 150 + Math.sin(this.t * 1.8) * 10 + (this.dead ? this.deathT * 60 : 0); this.baseUpdate(dt, f); }
  attack(f) {
    this.door = 1;
    if (this.seq % 2 === 1) { for (let i = 0; i < 3; i++) this.after(0.4 + i * 0.4, () => this.egg(f, i)); this.cd = 3; return; }
    Snd.play('cuckoo'); this.after(0.5, () => this.gear(f)); this.after(1.7, () => this.gear(f)); this.cd = 3.2;
  }
  egg(f, i) {
    Snd.play('cuckoo');
    const sx = this.x - 40, sy = this.y - 30, T = 1.05, g = 950, tx = f.player.x + (i - 1) * 70, ty = GY - 15;
    f.eb.push(makeBullet({ kind: 'egg', x: sx, y: sy, r: 13, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * g * T * T) / T, ay: g,
      upd: (b, dt) => { b.vy += b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > GY - 10) { b.life = 0; Particles.puff(b.x, GY - 8, 3, 9, '#fff6e0'); } } }));
  }
  gear(f) {
    Snd.play('dash');
    f.eb.push(makeBullet({ kind: 'gear', x: this.x - 60, y: GY - 28, r: 28, vx: -300, vy: 0, ay: 0,
      upd: (b, dt) => { b.x += b.vx * dt; b.y = GY - b.r; } }));
  }
  draw() {
    const fl = this.flash > 0; ctx.save(); ctx.translate(this.x, this.y); if (this.dead) ctx.translate(rand(-4, 4), rand(-3, 3));
    // pesos e corrente
    for (const dx of [-30, 30]) { ink(3); ctx.beginPath(); ctx.moveTo(dx, 60); ctx.lineTo(dx, 100 + Math.sin(this.t * 2 + dx) * 4); ctx.stroke(); ink(3); circle(dx, 112 + Math.sin(this.t * 2 + dx) * 4, 12, '#c99a3a'); }
    // casa do relógio
    const house = () => { ctx.moveTo(-70, 60); ctx.lineTo(-70, -30); ctx.lineTo(0, -92); ctx.lineTo(70, -30); ctx.lineTo(70, 60); ctx.closePath(); };
    shape(house, fl ? '#a8744c' : '#7a4a2a', 6, 'rgba(30,10,0,.4)', -12, -6);
    ctx.strokeStyle = 'rgba(255,220,170,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-58, 50); ctx.lineTo(-58, -22); ctx.stroke();
    // portinha do cuco
    ink(4); rrect(-22, -76, 44, 34, 4, '#2a1a10');
    const d = Math.min(1, this.door * 2);
    ctx.save(); ctx.beginPath(); ctx.rect(-20, -74, 40, 30); ctx.clip(); ctx.translate(-10 * (1 - d), 22 * (1 - d) - 4);
    ink(3); circle(-8, -56, 13, '#8fc0b0'); ctx.beginPath(); ctx.moveTo(-19, -57); ctx.lineTo(-34, -53); ctx.lineTo(-19, -49); ctx.closePath(); ctx.fillStyle = '#f2a33a'; ctx.fill(); ctx.stroke(); pieEye(-10, -59, 3.5, 5, -1, 0); ctx.restore();
    // mostrador
    ink(5); circle(0, 4, 40, '#fbf2dc'); ctx.strokeStyle = INK; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.lineWidth = i % 3 ? 1.5 : 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 31, 4 + Math.sin(a) * 31); ctx.lineTo(Math.cos(a) * 37, 4 + Math.sin(a) * 37); ctx.stroke(); }
    const lx = this.lookX || 0; pieEye(-14, -2, 9, 12, lx, 0.2, 0, 0.3, '#fbf2dc', 0.3); pieEye(14, -2, 9, 12, lx, 0.2, 0, 0.3, '#fbf2dc', -0.3);
    ink(5); ctx.beginPath(); ctx.moveTo(-26, -20); ctx.lineTo(-6, -12); ctx.moveTo(26, -20); ctx.lineTo(6, -12); ctx.stroke();
    ink(4); ctx.beginPath(); ctx.arc(0, 26, 11, 0.3, Math.PI - 0.3); ctx.stroke();
    // pêndulo
    ctx.save(); ctx.translate(0, 46); ctx.rotate(Math.sin(this.t * 3) * 0.4); ink(4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 44); ctx.stroke(); circle(0, 50, 11, '#e0b04a'); ctx.restore();
    ctx.restore();
  }
}

// ---------- a cena da fase ----------
const RG_GROUND = { roofs: { fill: '#7b3b2a', top: '#a85a3e', line: 'rgba(0,0,0,.35)' }, hall: { fill: '#a0612f', top: '#e6c27a', line: 'rgba(0,0,0,.3)' }, tower: { fill: '#6b4423', top: '#8a5c33', line: 'rgba(0,0,0,.3)' } };
class RunGun extends Fight {
  constructor(lvl, opts = {}) {
    const L = LEVELS[lvl];
    super(lvl, L);
    this.lvl = lvl; this.L = L; this.level = buildLevel(L);
    this.rec = Save.data.rg[L.id] || (Save.data.rg[L.id] = { got: [], done: false });
    this.phaseKind = 'run'; this.state = 'play'; this.showBossBar = false;
    this.camX = 0; this.baseOff = 0; this.maxCam = L.len - W; this.arenaL = 0; this.arenaR = L.len;
    this.enemies = []; this.spawnI = 0; this.cpX = 140; this.cpReached = -1; this.coinsRun = 0; this.rt = 0; this.stats.time = 0;
    this.miniDef = { id: L.id + '_mini', name: L.miniName, quote: L.quote, song: L.song, bg: L.bg, make: L.make };
    this.floorAt = (x, y, prevY) => {
      for (const [px, py, pw] of this.level.platforms) if (x > px - 4 && x < px + pw + 4 && prevY <= py + 6 && y >= py) return py;
      if (y >= GY) { for (const [qx, qw] of this.level.pits) if (x > qx + 10 && x < qx + qw - 10) return null; return GY; }
      return null;
    };
    for (const p of this.players) p.safe = { x: p.x, y: GY };
    Music.play('map');
    if (opts.boss) { this.camX = this.maxCam; this.rt = 99; this.players.forEach((p, i) => { p.x = this.maxCam + 160 + i * 60; }); this.startBoss(); }
  }
  targets() { return this.phaseKind === 'run' ? this.enemies.filter((e) => !e.dead) : super.targets(); }
  dangerList() { return this.phaseKind === 'run' ? [] : this.boss.dangerCircles(); }
  restart() { Game.go(new RunGun(this.lvl, { boss: this.phaseKind === 'boss' })); }
  exitToMap() { Game.go(MapScene.rg(this.lvl)); }
  finish() { Game.go(new RGResults(this.lvl, this.coinsRun)); }
  scrollX() { return this.camX + this.baseOff; }

  // ----- da corrida para o mini-boss: a tela vira a arena e as coordenadas voltam para [0, W] -----
  startBoss() {
    const dx = this.camX;
    this.baseOff += dx; for (const p of this.players) { p.x -= dx; p.safe = { x: p.x, y: GY }; }
    this.camX = 0; this.arenaL = 0; this.arenaR = W; this.floorAt = null; this.phaseKind = 'boss';
    this.enemies = []; this.eb = []; this.pb = []; this.level = Object.assign({}, this.level, { platforms: [], pits: [], hearts: [], coins: [], cps: [] });
    this.def = this.miniDef; this.state = 'intro'; this.stateT = 0; this.landed = false; this.showBossBar = true; this.paused = false;
    this.banner = null; Music.play(this.miniDef.song);
  }
  respawnAll() {
    this.eb = []; this.pb = []; this.banner = { text: 'DE VOLTA AO CHECKPOINT!', t: 1.6 }; Snd.play('revive');
    this.players.forEach((p, i) => { p.respawn(this.cpX + i * 50, GY, this.diff.lives + (p.charm === 'c_heart' ? 1 : 0)); p.safe = { x: p.x, y: GY }; });
    this.camX = clamp(this.cpX - W * 0.4, 0, this.maxCam);
    this.enemies = this.enemies.filter((e) => e.x > this.camX + W + 80); this.spawnI = this.level.enemies.findIndex((e) => e.x > this.camX + W + 80); if (this.spawnI < 0) this.spawnI = this.level.enemies.length;
  }

  update(dt) {
    if (this.phaseKind === 'boss') { this.camX = 0; super.update(dt); return; }
    if (this.sub) { this.sub.update(dt); return; }
    if (this.paused) return this.updatePause();
    if (backPressed()) { this.paused = true; this.menuSel = 0; Snd.play('select'); return; }
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.t += dt; this.rt += dt; this.shake = Math.max(0, this.shake - dt * 40);
    Particles.update(dt); if (this.banner) this.banner.t -= dt;
    if (this.rt < 2.2) { for (const p of this.players) { p.anim += dt; p.ready = true; } return; }   // cartão de título
    for (const p of this.players) p.ready = false;
    this.stats.time += dt;
    for (const p of this.players) {
      p.update(dt, this);
      if (p.alive && p.onGround && p.dashT <= 0) { const q = this.floorAt(p.x - 54, p.y, p.y), r = this.floorAt(p.x + 54, p.y, p.y); if (q !== null && r !== null) p.safe = { x: p.x, y: p.y }; }
      if (p.alive && !p.ghost && p.y > GY + 150) {                         // caiu num poço: perde 1 PV e volta ao último ponto seguro
        p.inv = 0; p.hurt(this);
        if (p.alive) p.respawn(p.safe.x - 40, p.safe.y, 0); else p.y = GY + 400;
        p.inv = Math.max(p.inv, 1.8);
      }
    }
    // câmera segue quem está mais à frente; ninguém fica para trás da tela
    const ref = this.players.filter((p) => p.alive).length ? this.players.filter((p) => p.alive) : this.players;
    const lead = Math.max(...ref.map((p) => p.x));
    this.camX = clamp(lerp(this.camX, lead - W * 0.4, 1 - Math.pow(0.002, dt)), 0, this.maxCam);
    this.arenaL = this.camX;
    // inimigos
    const lim = this.camX + W + 120;
    while (this.spawnI < this.level.enemies.length && this.level.enemies[this.spawnI].x < lim) this.enemies.push(new RGEnemy(Object.assign({ skin: this.L.skin }, this.level.enemies[this.spawnI++])));
    for (const e of this.enemies) e.update(dt, this);
    this.enemies = this.enemies.filter((e) => !e.dead && e.x > this.camX - 200);
    this.stepPlayerShots(dt); this.stepEnemyShots(dt);
    for (const p of this.players) {
      if (!p.alive) continue;
      const box = p.box();
      for (const e of this.enemies) { const b = e.box(); if (box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y) p.hurt(this); }
      // moedas e corações
      for (const c of this.level.coins) if (!c.taken && circRect(c.x, c.y, 16, box.x, box.y, box.w, box.h)) this.takeCoin(c);
      for (const h of this.level.hearts) if (!h.taken && p.hp < (p.maxHp || 3) && circRect(h.x, h.y, 16, box.x, box.y, box.w, box.h)) { h.taken = true; p.hp++; Snd.play('revive'); Particles.stars(h.x, h.y, 8, PINK); Particles.add({ kind: 'text', text: '+1 PV', x: h.x, y: h.y - 20, vy: -50, life: 0.9, size: 22, color: PINK }); }
      // checkpoints
      this.level.cps.forEach((cx, i) => { if (i > this.cpReached && p.x > cx) { this.cpReached = i; this.cpX = cx; this.banner = { text: 'CHECKPOINT!', t: 1.2 }; Snd.play('parry'); Particles.stars(cx, GY - 60, 10, '#7fe08a'); } });
    }
    this.stepContacts();
    if (!this.players.some((p) => p.alive)) { this.respawnAll(); return; }
    // fim da corrida: ao entrar na última tela, o mini-boss aparece
    const alive = this.players.filter((p) => p.alive);
    if (this.camX >= this.maxCam - 2 && alive.length && alive.reduce((a, p) => a + p.x, 0) / alive.length > this.maxCam + 240) this.startBoss();
  }
  takeCoin(c) {
    c.taken = true;
    if (this.rec.got[c.i]) return;                        // já pega em outra vez: sem moeda de novo
    this.rec.got[c.i] = true; this.coinsRun++; addCoins(1); Snd.play('confirm');
    Particles.stars(c.x, c.y, 10, '#ffd84a'); Particles.add({ kind: 'text', text: '+1', x: c.x, y: c.y - 18, vy: -60, life: 1, size: 26, color: '#ffd84a' });
  }

  // ----- desenho -----
  drawBackdrop() {
    const sc = this.scrollX(), img = BG[this.L.bg], th = RG_GROUND[this.L.theme];
    ctx.save(); ctx.beginPath(); ctx.rect(-30, -30, W + 60, GY + 32); ctx.clip();
    const off = -((sc * 0.35) % (W * 2));
    for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(off + k * W, 0); if (k % 2) { ctx.translate(W, 0); ctx.scale(-1, 1); } ctx.drawImage(img, 0, 0, W, H); ctx.restore(); }
    ctx.restore();
    // chão que anda junto com a câmera
    ctx.fillStyle = th.fill; ctx.fillRect(-30, GY, W + 60, H - GY + 30);
    ctx.strokeStyle = th.line; ctx.lineWidth = 2;
    const sx = -(sc % 60);
    for (let x = sx - 60; x < W + 60; x += 60) { ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x - 24, H); ctx.stroke(); }
    ctx.fillStyle = th.top; ctx.fillRect(-30, GY + 2, W + 60, 7);
    ink(5); ctx.beginPath(); ctx.moveTo(-30, GY); ctx.lineTo(W + 30, GY); ctx.stroke();
  }
  drawPits() {
    for (const [qx, qw] of this.level.pits) {
      if (qx > this.camX + W + 40 || qx + qw < this.camX - 40) continue;
      const g = ctx.createLinearGradient(0, GY, 0, H); g.addColorStop(0, '#1a1410'); g.addColorStop(1, '#050302');
      ctx.fillStyle = g; ctx.fillRect(qx, GY - 1, qw, H - GY + 30);
      ink(5); ctx.beginPath(); ctx.moveTo(qx, GY); ctx.lineTo(qx, H); ctx.moveTo(qx + qw, GY); ctx.lineTo(qx + qw, H); ctx.stroke();
      ctx.fillStyle = 'rgba(255,230,160,.25)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(qx + qw * (0.25 + i * 0.25), H - 20 + Math.sin(this.t * 3 + i) * 5, 6, 0, TAU); ctx.fill(); } // olhinhos no escuro
    }
  }
  drawWorld() {
    const th = RG_GROUND[this.L.theme];
    this.drawPits();
    for (const [px, py, pw] of this.level.platforms) {
      if (px > this.camX + W + 40 || px + pw < this.camX - 40) continue;
      ink(4); rrect(px, py, pw, 16, 5, th.top); shade(pRRect(px, py, pw, 16, 5), 'rgba(0,0,0,.25)', 0, -5); ink(4); rrect(px, py, pw, 16, 5, null);
      ctx.strokeStyle = th.line; ctx.lineWidth = 2; for (let x = px + 24; x < px + pw - 8; x += 36) { ctx.beginPath(); ctx.moveTo(x, py + 2); ctx.lineTo(x, py + 14); ctx.stroke(); }
    }
    this.level.cps.forEach((cx, i) => {
      if (cx > this.camX + W + 40 || cx < this.camX - 40) return;
      const on = i <= this.cpReached;
      ink(4); ctx.beginPath(); ctx.moveTo(cx, GY); ctx.lineTo(cx, GY - 78); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, GY - 78); ctx.lineTo(cx + 38, GY - 66 + Math.sin(this.t * 6 + i) * 3); ctx.lineTo(cx, GY - 52); ctx.closePath(); ctx.fillStyle = on ? '#4fbf6a' : '#c8352b'; ctx.fill(); ink(3); ctx.stroke();
    });
    for (const c of this.level.coins) {
      if (c.taken || c.x > this.camX + W + 40 || c.x < this.camX - 40) continue;
      const got = this.rec.got[c.i], bob = Math.sin(this.t * 4 + c.i) * 4;
      if (got) { ctx.globalAlpha = 0.35; ink(2); ctx.setLineDash([4, 4]); circle(c.x, c.y + bob, 14, null); ctx.setLineDash([]); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = 'rgba(255,230,120,.25)'; ctx.beginPath(); ctx.arc(c.x, c.y + bob, 24 + Math.sin(this.t * 6) * 2, 0, TAU); ctx.fill(); drawCoin(c.x, c.y + bob, 15, this.t + c.i); }
    }
    for (const h of this.level.hearts) if (!h.taken && h.x > this.camX - 40 && h.x < this.camX + W + 40) drawHeart(h.x, h.y + Math.sin(this.t * 4 + h.x) * 4, 14, this.t);
    for (const e of this.enemies) e.draw(this.L.skin);
  }
  draw() {
    if (this.phaseKind === 'boss') { super.draw(); this.drawRunHud(); return; }
    ctx.save();
    const sk = opt().shake ? this.shake : 0; if (sk > 0) ctx.translate(rand(-1, 1) * sk, rand(-1, 1) * sk);
    this.drawBackdrop();
    ctx.save(); ctx.translate(-Math.round(this.camX), 0);
    this.drawWorld();
    for (const b of this.pb) drawPlayerBullet(b, this.t);
    for (const p of this.players) p.draw();
    for (const b of this.eb) drawBullet(b);
    Particles.draw();
    ctx.restore();
    ctx.restore();
    this.drawHUD(); this.drawRunHud();
    if (this.rt < 2.2) this.drawCard();
    if (this.paused) this.drawPause();
    if (this.sub) this.sub.draw();
  }
  drawCard() {
    const t = this.rt, k = Math.min(1, t * 4) * Math.min(1, (2.2 - t) * 4);
    ctx.fillStyle = `rgba(20,12,6,${0.55 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2 - 20); ctx.scale(0.8 + k * 0.2, 0.8 + k * 0.2); ctx.globalAlpha = k;
    outlinedText(this.L.name, 0, 0, 46, '#ffd84a', FONT_TITLE, 'center', 10);
    ctx.font = `22px ${FONT_TEXT}`; ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.fillText(`Corra, atire e junte as ${COINS_PER_LEVEL} moedas. Sem limite de tempo!`, 0, 52);
    ctx.font = `16px ${FONT_TEXT}`; ctx.fillText('Cuidado com os poços. No fim, um mini-boss espera por você.', 0, 82);
    ctx.restore();
  }
  drawRunHud() {
    // moedas da fase e barra de progresso
    const total = COINS_PER_LEVEL, got = this.rec.got.filter(Boolean).length;
    const x = W / 2 - 110, y = Touch.visible() ? 70 : 14;
    if (this.phaseKind === 'run') {
      ink(4); rrect(x, y, 220, 44, 12, 'rgba(244,231,197,.92)');
      for (let i = 0; i < total; i++) { const cx = x + 22 + i * 24; ctx.beginPath(); ctx.arc(cx, y + 15, 8, 0, TAU); ctx.fillStyle = this.rec.got[i] ? '#f2c14a' : 'rgba(26,20,16,.18)'; ctx.fill(); ink(2); ctx.stroke(); }
      const prog = clamp((this.players[0].x + this.baseOff) / (this.L.len - 140), 0, 1);
      ctx.fillStyle = 'rgba(26,20,16,.2)'; ctx.fillRect(x + 14, y + 33, 192, 5); ctx.fillStyle = '#c8352b'; ctx.fillRect(x + 14, y + 33, 192 * prog, 5);
      star(x + 208, y + 35, 7, '#ffd84a');
    }
  }
}

// ---------- resultado da fase ----------
class RGResults {
  constructor(lvl, coinsRun) {
    this.lvl = lvl; this.coinsRun = coinsRun; this.t = 0; const L = LEVELS[lvl], rec = Save.data.rg[L.id];
    this.first = !rec.done; rec.done = true; this.bonus = this.first ? 2 : 0;
    if (this.bonus) addCoins(this.bonus);
    this.news = this.first && shopRotateOldest();
    Save.write(); Music.play('map');
  }
  update(dt) { this.t += dt; if (this.t > 1 && (pressed.jump || pressed.start)) { Snd.play('confirm'); Game.go(MapScene.rg(this.lvl)); } }
  draw() {
    const L = LEVELS[this.lvl], rec = Save.data.rg[L.id], got = rec.got.filter(Boolean).length;
    sunburst(W / 2, H / 2, this.t * 0.15, '#c98a3a', '#d9a04e');
    ink(6); rrect(170, 70, 620, 400, 18, PAPER);
    outlinedText('FASE COMPLETA!', W / 2, 120, 46, '#ffd84a');
    ctx.font = `20px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${L.name} · ${L.miniName} derrotado`, W / 2, 168);
    for (let i = 0; i < COINS_PER_LEVEL; i++) { const cx = W / 2 - 125 + i * 50, on = rec.got[i] && this.t > 0.3 + i * 0.12; if (on) drawCoin(cx, 232, 18, this.t + i); else { ink(3); ctx.setLineDash([4, 4]); circle(cx, 232, 17, null); ctx.setLineDash([]); } }
    ctx.font = `24px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.fillText(`${got} / ${COINS_PER_LEVEL} moedas`, W / 2, 286);
    ctx.font = `18px ${FONT_TEXT}`; ctx.fillStyle = '#2f8a4a';
    ctx.fillText(this.coinsRun ? `+${this.coinsRun} desta vez` : 'Nenhuma moeda nova desta vez', W / 2, 322);
    if (this.bonus) ctx.fillText(`+${this.bonus} de bônus por completar a fase${this.news ? ' · a loja tem novidades' : ''}`, W / 2, 350);
    else if (got < COINS_PER_LEVEL) { ctx.fillStyle = 'rgba(26,20,16,.7)'; ctx.fillText('Ainda faltam moedas: dê outra corrida!', W / 2, 350); }
    ink(4); rrect(W / 2 - 100, 384, 200, 44, 12, '#fff6e0'); drawCoin(W / 2 - 66, 406, 13, this.t);
    ctx.font = `22px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(`${Save.data.coins} no bolso`, W / 2 - 44, 407);
    if (this.t > 1 && Math.floor(this.t * 2) % 2) { ctx.font = `16px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('Pressione Z para continuar', W / 2, 452); }
  }
}
