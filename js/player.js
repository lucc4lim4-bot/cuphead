'use strict';
// ===== Fósforo, o herói palito-de-fósforo =====

const P = { speed: 275, jumpV: 650, grav: 1750, dashV: 650, dashT: 0.2, shootCd: 0.11, bulletV: 950 };

class Player {
  constructor() {
    this.x = 160; this.y = GY; this.vx = 0; this.vy = 0;
    this.facing = 1; this.onGround = true; this.hp = 3;
    this.inv = 0; this.dashT = 0; this.dashCd = 0; this.dashDir = 1; this.airDashUsed = false;
    this.shootCd = 0; this.meter = 0; this.parryT = 0; this.parryUsed = false; this.jumpHeld = false;
    this.duck = false; this.aim = { x: 1, y: 0 }; this.anim = 0; this.land = 0; this.superT = 0; this.exT = 0;
    this.shooting = false; this.hurtT = 0;
  }
  box() {
    const h = this.duck ? 34 : 62;
    return { x: this.x - 13, y: this.y - h, w: 26, h };
  }
  shoulder() { return { x: this.x + this.facing * 4, y: this.y - (this.duck ? 26 : 46) }; }

  update(dt, f) {
    this.anim += dt; this.land = Math.max(0, this.land - dt * 5);
    this.inv = Math.max(0, this.inv - dt); this.dashCd -= dt; this.shootCd -= dt; this.exT -= dt; this.hurtT -= dt;
    if (this.parryT > 0) this.parryT -= dt;

    // ---- Super: labareda gigante ----
    if (this.superT > 0) {
      this.superT -= dt; this.vx = 0; this.vy = 0; this.inv = Math.max(this.inv, 0.3);
      const s = this.shoulder();
      const beam = { x: this.facing > 0 ? s.x : 0, y: s.y - 55, w: this.facing > 0 ? W - s.x : s.x, h: 110 };
      for (const t of f.targets()) for (const c of t.hurtCircles()) {
        if (circRect(c.x, c.y, c.r, beam.x, beam.y, beam.w, beam.h)) { t.damage(48 * dt, f); if (Math.random() < 0.3) Particles.stars(c.x + rand(-30, 30), c.y + rand(-30, 30), 1); break; }
      }
      for (const b of f.eb) if (!b.solid && circRect(b.x, b.y, b.r, beam.x, beam.y, beam.w, beam.h)) { b.life = 0; Particles.puff(b.x, b.y, 2, 8); }
      f.shake = Math.max(f.shake, 4);
      return;
    }

    const L = keys.left, R = keys.right, U = keys.up, D = keys.down, lock = keys.lock;
    const ax = (R ? 1 : 0) - (L ? 1 : 0);
    if (ax && this.dashT <= 0) this.facing = ax;
    this.duck = this.onGround && D && this.dashT <= 0 && !U;

    // ---- Mira em 8 direções ----
    let mx = ax, my = U ? -1 : (D && !this.onGround) ? 1 : 0;
    if (!lock && !U) mx = this.facing;
    if (mx === 0 && my === 0) mx = this.facing;
    if (this.duck) { mx = this.facing; my = 0; }
    const ml = Math.hypot(mx, my); this.aim = { x: mx / ml, y: my / ml };

    // ---- Movimento ----
    if (this.dashT > 0) {
      this.dashT -= dt; this.vx = this.dashDir * P.dashV; this.vy = 0;
      if (Math.random() < 0.5) Particles.puff(this.x - this.dashDir * 20, this.y - 30, 1, 9);
    } else {
      const canMove = !lock && !this.duck;
      this.vx = canMove ? ax * P.speed : 0;
      this.vy += P.grav * dt;
    }

    // ---- Pulo / rebote ----
    if (pressed.jump && this.dashT <= 0) {
      if (this.onGround) { this.vy = -P.jumpV; this.onGround = false; this.jumpHeld = true; Snd.play('jump'); }
      else if (!this.parryUsed) { this.parryT = 0.22; this.parryUsed = true; }
    }
    if (!keys.jump && this.jumpHeld && this.vy < -260) { this.vy = -260; this.jumpHeld = false; }

    // ---- Dash ----
    if (pressed.dash && this.dashCd <= 0 && (this.onGround || !this.airDashUsed)) {
      this.dashT = P.dashT; this.dashCd = 0.5; this.dashDir = this.facing;
      if (!this.onGround) this.airDashUsed = true;
      this.parryT = 0; Snd.play('dash'); Particles.puff(this.x, this.y - 30, 4, 12);
    }

    this.x += this.vx * dt + (f.wind || 0) * dt; this.y += this.vy * dt;
    this.x = clamp(this.x, 22, W - 22);
    if (this.y >= GY) {
      if (!this.onGround) { this.land = 1; Particles.puff(this.x, GY - 4, 3, 9); }
      this.y = GY; this.vy = 0; this.onGround = true; this.parryUsed = false; this.airDashUsed = false; this.jumpHeld = false;
    } else this.onGround = false;

    // ---- Tiro ----
    this.shooting = keys.shoot && this.dashT <= 0;
    if (this.shooting && this.shootCd <= 0) {
      this.shootCd = P.shootCd;
      const s = this.shoulder();
      const spread = rand(-0.05, 0.05);
      const a = Math.atan2(this.aim.y, this.aim.x) + spread;
      f.pb.push({ x: s.x + this.aim.x * 30, y: s.y + this.aim.y * 30, vx: Math.cos(a) * P.bulletV, vy: Math.sin(a) * P.bulletV, r: 9, dmg: 1, life: 1.2, kind: 'spark' });
      Snd.play('shoot');
    }

    // ---- EX e Super ----
    if (pressed.ex && this.dashT <= 0) {
      if (this.meter >= 5) {
        this.meter = 0; this.superT = 1.5; f.stats.meterUsed += 5; f.hitstop = 0.15; f.shake = 14;
        Snd.play('super'); Particles.stars(this.x, this.y - 40, 14, '#ff9a2e');
      } else if (this.meter >= 1 && this.exT <= 0) {
        this.meter -= 1; this.exT = 0.45; f.stats.meterUsed += 1;
        const s = this.shoulder();
        f.pb.push({ x: s.x + this.aim.x * 34, y: s.y + this.aim.y * 34, vx: this.aim.x * 620, vy: this.aim.y * 620, r: 24, dmg: 13, life: 2, kind: 'ember' });
        if (this.onGround) this.vx = -this.facing * 120;
        Snd.play('ex'); f.shake = 6;
      }
    }
  }

  hurt(f) {
    if (this.inv > 0 || this.superT > 0) return;
    this.hp--; this.inv = 1.8; this.hurtT = 0.35; this.dashT = 0;
    this.vy = -360; this.onGround = false;
    f.shake = 12; f.hitstop = 0.12; Snd.play('hurt');
    Particles.stars(this.x, this.y - 40, 8, '#ff6a3a');
  }

  draw() {
    if (this.inv > 0 && this.superT <= 0 && Math.floor(this.inv * 18) % 2 === 0) return;
    drawFosforo(this.x, this.y, {
      facing: this.facing, aim: this.aim, run: this.onGround && Math.abs(this.vx) > 10, air: !this.onGround,
      duck: this.duck, t: this.anim, land: this.land, dash: this.dashT > 0, shooting: this.shooting || this.exT > 0,
      parry: this.parryT > 0, hurt: this.hurtT > 0, superT: this.superT,
    });
    if (this.superT > 0) this.drawSuper();
  }

  drawSuper() {
    const s = this.shoulder(), f = this.facing, len = f > 0 ? W - s.x : s.x;
    const k = Math.min(1, (1.5 - this.superT) * 6) * Math.min(1, this.superT * 4);
    ctx.save(); ctx.translate(s.x + f * 20, s.y); ctx.scale(f, 1);
    for (let layer = 0; layer < 3; layer++) {
      const hh = (55 - layer * 16) * k, col = ['#e2471f', '#ff9a2e', '#fff1a8'][layer];
      ctx.beginPath(); ctx.moveTo(0, -hh * 0.4);
      for (let x = 0; x <= len; x += 30) ctx.lineTo(x, -hh + Math.sin(x * 0.05 + this.anim * 30 + layer) * 8);
      for (let x = len; x >= 0; x -= 30) ctx.lineTo(x, hh + Math.sin(x * 0.06 + this.anim * 27 + layer) * 8);
      ctx.lineTo(0, hh * 0.4); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      if (layer === 0) { ink(4); ctx.stroke(); }
    }
    ctx.restore();
  }
}

function circRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw), ny = clamp(cy, ry, ry + rh);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

// Desenha o Fósforo (também usado nos menus)
function drawFosforo(x, y, o = {}) {
  const f = o.facing || 1, t = o.t || 0, sc = o.scale || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(f * sc, sc);
  const squash = 1 - (o.land || 0) * 0.15;
  ctx.scale(1 / squash * (o.dash ? 1.15 : 1), squash * (o.dash ? 0.9 : 1));
  if (o.dash) ctx.rotate(0.15);
  const ph = t * 14;
  const bodyH = o.duck ? 16 : 30, hipY = -22;
  const topY = hipY - bodyH;

  // pernas
  let l1 = { x: -6, y: 0 }, l2 = { x: 6, y: 0 };
  if (o.run) { l1 = { x: -4 + Math.sin(ph) * 13, y: -Math.max(0, Math.cos(ph)) * 7 }; l2 = { x: 4 - Math.sin(ph) * 13, y: -Math.max(0, -Math.cos(ph)) * 7 }; }
  if (o.air) { l1 = { x: -10, y: -8 }; l2 = { x: 9, y: -12 }; }
  if (o.dance) { l1 = { x: -10 + Math.sin(ph * 0.5) * 6, y: -Math.max(0, Math.sin(ph * 0.5)) * 10 }; l2 = { x: 10 + Math.sin(ph * 0.5) * 6, y: -Math.max(0, -Math.sin(ph * 0.5)) * 10 }; }
  hose(-4, hipY, l1.x, l1.y - 4, 5); hose(4, hipY, l2.x, l2.y - 4, -5);
  shoe(l1.x, l1.y, 1, 8); shoe(l2.x, l2.y, 1, 8);

  // calção
  ink(3); rrect(-11, hipY - 9, 22, 13, 4, '#b8322a');
  ctx.fillStyle = '#ffe9b0'; circle(-5, hipY - 3, 2, '#ffe9b0', false); circle(5, hipY - 3, 2, '#ffe9b0', false);

  // braço de trás
  const sh = { x: 2, y: topY + 8 };
  const swing = o.run ? Math.sin(ph + Math.PI) * 10 : 0;
  hose(sh.x - 4, sh.y, -14 - swing * 0.3, sh.y + 16 + swing * 0.2, -6);
  glove(-14 - swing * 0.3, sh.y + 18 + swing * 0.2, 6);

  // corpo-palito
  ink(3.5); rrect(-7, topY, 14, bodyH + 6, 5, '#e5b877');
  ctx.strokeStyle = 'rgba(120,70,30,.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-2, topY + 6); ctx.lineTo(-2, topY + bodyH); ctx.stroke();

  // cabeça (a pólvora vermelha)
  const hy = topY - 16, bob = o.dance ? Math.sin(ph) * 2 : 0;
  ink(4); ellipse(2, hy + bob, 19, 18, 0, o.hurt ? '#ffffff' : '#c7362b');
  ctx.beginPath(); ctx.ellipse(-6, hy - 8 + bob, 5, 3, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,220,200,.6)'; ctx.fill();
  // chama no topo
  const fl = 1 + Math.sin(t * 25) * 0.12 + (o.shooting ? 0.35 : 0) + (o.superT > 0 ? 0.9 : 0);
  ctx.save(); ctx.translate(-2, hy - 16 + bob); ctx.scale(fl, fl);
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-12, 0, -6, -12, -2, -24 - Math.sin(t * 18) * 3); ctx.bezierCurveTo(4, -12, 12, -4, 0, 6);
  ctx.fillStyle = '#ff8a1e'; ctx.fill(); ink(2.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 3); ctx.bezierCurveTo(-5, -2, -3, -8, -1, -14); ctx.bezierCurveTo(3, -7, 5, -2, 0, 3); ctx.fillStyle = '#ffe56a'; ctx.fill();
  ctx.restore();
  // rosto
  const blink = (t % 3.2) > 3.05 ? 1 : 0;
  pieEye(5, hy - 3 + bob, 5, 7, 1, o.aim && o.aim.y < 0 ? -1 : 0, blink);
  pieEye(15, hy - 3 + bob, 5, 7, 1, o.aim && o.aim.y < 0 ? -1 : 0, blink);
  ink(3); ctx.beginPath();
  if (o.hurt) { ellipse(13, hy + 9 + bob, 4, 5, 0, INK); }
  else { ctx.arc(11, hy + 6 + bob, 6, 0.2, Math.PI - 0.4); ctx.stroke(); }
  // nariz
  circle(19, hy + 3 + bob, 2.5, '#8e1f18');

  // braço da frente (aponta a mira)
  const aim = o.aim || { x: 1, y: 0 };
  let axl = Math.abs(aim.x), ayl = aim.y;
  if (axl < 0.01 && Math.abs(ayl) < 0.01) axl = 1;
  let hand;
  if (o.shooting || o.superT > 0) hand = { x: sh.x + axl * 22, y: sh.y + ayl * 22 };
  else if (o.dance) hand = { x: sh.x + 14, y: sh.y - 14 + Math.sin(ph) * 8 };
  else hand = { x: sh.x + 10 + swing * 0.4, y: sh.y + 16 };
  if (o.parry) hand = { x: sh.x + 6, y: sh.y - 24 };
  hose(sh.x + 2, sh.y, hand.x, hand.y, 4);
  glove(hand.x, hand.y, 7, Math.atan2(hand.y - sh.y, hand.x - sh.x));
  if (o.parry) { ctx.save(); ctx.globalAlpha = 0.8; star(0, topY - 10, 26, 'rgba(255,95,168,.5)'); ctx.restore(); }
  ctx.restore();
}
