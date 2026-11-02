'use strict';
// ===== Heróis jogáveis =====

const P = { speed: 275, jumpV: 650, grav: 1750, dashV: 650, dashT: 0.2, bulletV: 950 };

class Player {
  constructor(idx = 0, type = 'fosforo', startX = 160) {
    this.idx = idx; this.type = type; this.in = PIN[idx];
    this.x = startX; this.y = GY; this.vx = 0; this.vy = 0;
    this.facing = 1; this.onGround = true; this.hp = 3;
    this.inv = 0; this.dashT = 0; this.dashCd = 0; this.dashDir = 1; this.airDashUsed = false;
    this.shootCd = 0; this.meter = 0; this.parryT = 0; this.parryUsed = false; this.jumpHeld = false;
    this.duck = false; this.aim = { x: 1, y: 0 }; this.anim = Math.random() * 3; this.land = 0; this.superT = 0; this.exT = 0;
    this.shooting = false; this.hurtT = 0;
    this.ghost = false; this.ghostT = 0; this.gone = false;
  }
  get alive() { return this.hp > 0; }
  box() {
    const h = this.duck ? 34 : 62;
    return { x: this.x - 13, y: this.y - h, w: 26, h };
  }
  shoulder() {
    const up = this.type === 'candela' ? (this.duck ? 30 : 46) : (this.duck ? 26 : 46);
    return { x: this.x + this.facing * 5, y: this.y - up };
  }
  heartPos() { return { x: this.x, y: this.y - 70 }; }

  update(dt, f) {
    this.anim += dt;
    if (this.ghost) { // sobe como fantasma esperando o rebote do parceiro
      this.ghostT += dt; this.y -= 34 * dt; this.x += Math.sin(this.ghostT * 2) * 30 * dt;
      if (this.y < -60) this.gone = true;
      return;
    }
    if (!this.alive) return;
    const I = this.in.held, Pr = this.in.pressed;
    this.land = Math.max(0, this.land - dt * 5);
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

    const L = I.left, R = I.right, U = I.up, D = I.down, lock = I.lock;
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
    if (Pr.jump && this.dashT <= 0) {
      if (this.onGround) { this.vy = -P.jumpV; this.onGround = false; this.jumpHeld = true; Snd.play('jump'); }
      else if (!this.parryUsed) { this.parryT = 0.22; this.parryUsed = true; }
    }
    if (!I.jump && this.jumpHeld && this.vy < -260) { this.vy = -260; this.jumpHeld = false; }

    // ---- Dash ----
    if (Pr.dash && this.dashCd <= 0 && (this.onGround || !this.airDashUsed)) {
      this.dashT = P.dashT; this.dashCd = 0.5; this.dashDir = this.facing;
      if (!this.onGround) this.airDashUsed = true;
      this.parryT = 0; Snd.play('dash'); Particles.puff(this.x, this.y - 30, 4, 12);
    }

    this.x += this.vx * dt + (f.wind || 0) * dt; this.y += this.vy * dt;
    this.x = clamp(this.x, 22, (f.arenaR || W) - 22);
    if (this.y >= GY) {
      if (!this.onGround) { this.land = 1; Particles.puff(this.x, GY - 4, 3, 9); }
      this.y = GY; this.vy = 0; this.onGround = true; this.parryUsed = false; this.airDashUsed = false; this.jumpHeld = false;
    } else this.onGround = false;
    if (this.onGround && Math.abs(this.vx) > 10 && this.dashT <= 0) {
      this.dustT = (this.dustT || 0) - dt;
      if (this.dustT <= 0) { this.dustT = 0.16; Particles.add({ kind: 'puff', x: this.x - this.facing * 10, y: GY - 4, vx: -this.facing * 40, vy: -20, life: 0.35, size: 5, color: '#f4e7c5' }); }
    }

    // ---- Tiro ----
    this.shooting = I.shoot && this.dashT <= 0;
    if (this.shooting && this.shootCd <= 0) this.fire(f);

    // ---- EX e Super ----
    if (Pr.ex && this.dashT <= 0) {
      if (this.meter >= 5) {
        this.meter = 0; this.superT = 1.5; f.stats.meterUsed += 5; f.hitstop = 0.15; f.shake = 14;
        Snd.play('super'); Particles.stars(this.x, this.y - 40, 14, HEROES[this.type].flame[1]);
      } else if (this.meter >= 1 && this.exT <= 0) {
        this.meter -= 1; this.exT = 0.45; f.stats.meterUsed += 1;
        const s = this.shoulder();
        f.pb.push({ x: s.x + this.aim.x * 34, y: s.y + this.aim.y * 34, vx: this.aim.x * 620, vy: this.aim.y * 620, r: 24, dmg: 13, life: 2, kind: 'ember', hero: this.type, from: this });
        if (this.onGround) this.vx = -this.facing * 120;
        Snd.play('ex'); f.shake = 6;
      }
    }
  }

  fire(f) {
    const s = this.shoulder(), a0 = Math.atan2(this.aim.y, this.aim.x);
    if (this.type === 'candela') {
      // leque de 3 gotas de cera: curto alcance, mais dano somado
      this.shootCd = 0.16;
      for (const da of [-0.2, 0, 0.2]) {
        const a = a0 + da + rand(-0.03, 0.03);
        f.pb.push({ x: s.x + this.aim.x * 26, y: s.y + this.aim.y * 26, vx: Math.cos(a) * 800, vy: Math.sin(a) * 800, r: 10, dmg: 0.6, life: 0.42, kind: 'wax', hero: this.type, from: this });
      }
      Snd.play('shoot2');
    } else {
      this.shootCd = 0.11;
      const a = a0 + rand(-0.05, 0.05);
      f.pb.push({ x: s.x + this.aim.x * 30, y: s.y + this.aim.y * 30, vx: Math.cos(a) * P.bulletV, vy: Math.sin(a) * P.bulletV, r: 9, dmg: 1, life: 1.2, kind: 'spark', hero: this.type, from: this });
      Snd.play('shoot');
    }
  }

  hurt(f) {
    if (this.inv > 0 || this.superT > 0 || !this.alive || this.ghost) return;
    this.hp--; this.inv = 1.8; this.hurtT = 0.35; this.dashT = 0;
    this.vy = -360; this.onGround = false;
    f.shake = 12; f.hitstop = 0.12; Snd.play('hurt');
    Particles.stars(this.x, this.y - 40, 8, '#ff6a3a');
    if (this.hp <= 0) { this.meter = 0; this.superT = 0; Particles.puff(this.x, this.y - 30, 8, 18); if (f.coop) { this.ghost = true; this.ghostT = 0; } }
  }

  revive() {
    this.ghost = false; this.gone = false; this.hp = 1; this.inv = 2.5;
    this.y = Math.min(this.y, GY - 40); this.vy = -300; this.onGround = false; this.x = clamp(this.x, 40, W - 40);
  }

  draw() {
    if (this.gone) return;
    if (this.ghost) {
      ctx.save(); ctx.globalAlpha = 0.85;
      ctx.strokeStyle = 'rgba(255,240,200,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(this.x, this.y - 105, 16, 5, 0, 0, TAU); ctx.stroke();
      drawHero(this.type, this.x, this.y, { facing: this.facing, t: this.anim, ghost: true, air: true });
      ctx.restore();
      const h = this.heartPos(); drawHeart(h.x, h.y, 13, this.anim);
      return;
    }
    if (!this.alive) return;
    groundShadow(this.x, clamp(22 - (GY - this.y) * 0.06, 8, 22), 0.3);
    if (this.inv > 0 && this.superT <= 0 && Math.floor(this.inv * 18) % 2 === 0) return;
    drawHero(this.type, this.x, this.y, {
      facing: this.facing, aim: this.aim, run: this.onGround && Math.abs(this.vx) > 10, air: !this.onGround,
      duck: this.duck, t: this.anim, land: this.land, dash: this.dashT > 0, shooting: this.shooting || this.exT > 0,
      parry: this.parryT > 0, hurt: this.hurtT > 0, superT: this.superT, vx: this.vx, dance: this.victory && this.onGround,
    });
    if (this.superT > 0) this.drawSuper();
  }

  drawSuper() {
    const s = this.shoulder(), f = this.facing, len = f > 0 ? W - s.x : s.x;
    const k = Math.min(1, (1.5 - this.superT) * 6) * Math.min(1, this.superT * 4);
    const pal = HEROES[this.type].flame;
    ctx.save(); ctx.translate(s.x + f * 20, s.y); ctx.scale(f, 1);
    for (let layer = 0; layer < 3; layer++) {
      const hh = (55 - layer * 16) * k, col = pal[layer];
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
