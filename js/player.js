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
    // equipamento comprado na loja
    const lo = (idx === 1 && typeof Net !== 'undefined' && Net.role === 'host') ? Net.remoteLoadout : (typeof loadoutOf === 'function') ? loadoutOf(type) : { weapon: null, charm: null };
    this.weapons = [lo.weapon || null, lo.weapon2 || null]; this.wi = 0; this.charm = lo.charm;
    // Candela rebate rosa com o DASH e tem pulo duplo de base; o Fósforo rebate com o pulo no ar
    this.dashParry = type === 'candela';
    this.airJumps = (type === 'candela' ? 1 : 0) + (this.charm === 'c_spring' ? 1 : 0); this.jumpsUsed = 0; this.floorY = GY;
    this.dmgMul = this.charm === 'c_heart' ? 0.95 : 1;
    this.parryWin = this.charm === 'c_magnet' ? 0.36 : 0.22; this.parryR = this.charm === 'c_magnet' ? 34 : 16;
    this.bubble = this.charm === 'c_bubble'; this.bubbleT = 0; this.doubleUsed = false;
    this.trail = []; this.recoil = 0; this.spin = 0; this.turnT = 0; this.takeoff = 0;
  }
  get alive() { return this.hp > 0; }
  get weapon() { return this.weapons[this.wi]; }
  box() {
    const h = this.duck ? 32 : 58;
    return { x: this.x - 11, y: this.y - h, w: 22, h };
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
    this.recoil = Math.max(0, this.recoil - dt * 12); this.turnT = Math.max(0, this.turnT - dt * 9); this.takeoff = Math.max(0, this.takeoff - dt * 5);
    if (this.charm === 'c_coffee' && this.superT <= 0) this.meter = Math.min(5, this.meter + 0.07 * dt);
    if (this.charm === 'c_bubble' && !this.bubble) { this.bubbleT -= dt; if (this.bubbleT <= 0) { this.bubble = true; Snd.play('parry'); Particles.stars(this.x, this.y - 40, 6, '#9fd0f0'); } }
    // rastro do dash
    if (this.dashT > 0 && Math.floor(this.anim * 40) % 2 === 0) this.trail.push({ x: this.x, y: this.y, f: this.facing, life: 0.22 });
    for (const g of this.trail) g.life -= dt;
    this.trail = this.trail.filter((g) => g.life > 0);

    // ---- Super: labareda gigante ----
    if (this.superT > 0) {
      this.superT -= dt; this.vx = 0; this.vy = 0; this.inv = Math.max(this.inv, 0.3);
      const s = this.shoulder();
      const cx = f.camX || 0; this.camX = cx;
      const beam = { x: this.facing > 0 ? s.x : cx, y: s.y - 55, w: this.facing > 0 ? cx + W - s.x : s.x - cx, h: 110 };
      for (const t of f.targets()) for (const c of t.hurtCircles()) {
        if (circRect(c.x, c.y, c.r, beam.x, beam.y, beam.w, beam.h)) { t.damage(66 * dt, f); if (Math.random() < 0.3) Particles.stars(c.x + rand(-30, 30), c.y + rand(-30, 30), 1); break; }
      }
      for (const b of f.eb) if (!b.solid && circRect(b.x, b.y, b.r, beam.x, beam.y, beam.w, beam.h)) { b.life = 0; Particles.puff(b.x, b.y, 2, 8); }
      f.shake = Math.max(f.shake, 4);
      return;
    }

    const L = I.left, R = I.right, U = I.up, D = I.down, lock = I.lock;
    const ax = (R ? 1 : 0) - (L ? 1 : 0);
    if (ax && this.dashT <= 0) { if (ax !== this.facing && this.onGround) this.turnT = 1; this.facing = ax; }
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

    // ---- Troca de arma ----
    if (Pr.swap && this.dashT <= 0 && this.weapons[0] !== this.weapons[1]) {
      this.wi ^= 1; this.shootCd = Math.max(this.shootCd, 0.12); Snd.play('select');
      Particles.add({ kind: 'text', text: this.weapon && ITEM_BY_ID[this.weapon] ? ITEM_BY_ID[this.weapon].name : 'Faíscas', x: this.x, y: this.y - 86, vy: -40, life: 0.9, size: 17, color: '#ffd84a' });
    }

    // ---- Pulo / rebote ----
    if (Pr.jump && this.dashT <= 0) {
      if (this.onGround) { this.vy = -P.jumpV; this.onGround = false; this.jumpHeld = true; this.takeoff = 1; Snd.play('jump'); Particles.puff(this.x, this.y - 4, 2, 7); }
      else if (this.jumpsUsed < this.airJumps) {
        this.jumpsUsed++; this.vy = -560; this.jumpHeld = true; this.takeoff = 0.6;
        if (!this.dashParry) { this.parryT = this.parryWin; this.parryUsed = true; }
        Snd.play('jump'); Particles.puff(this.x, this.y, 3, 8);
      }
      else if (!this.dashParry && !this.parryUsed) { this.parryT = this.parryWin; this.parryUsed = true; }
    }
    if (!I.jump && this.jumpHeld && this.vy < -260) { this.vy = -260; this.jumpHeld = false; }

    // ---- Dash ----
    if (Pr.dash && this.dashCd <= 0 && (this.onGround || !this.airDashUsed)) {
      this.dashT = P.dashT; this.dashCd = 0.5; this.dashDir = this.facing;
      if (!this.onGround) this.airDashUsed = true;
      this.parryT = this.dashParry ? P.dashT + (this.charm === 'c_magnet' ? 0.12 : 0.05) : 0;
      Snd.play('dash'); Particles.puff(this.x, this.y - 30, 4, 12, this.charm === 'c_smoke' ? '#b8b2a8' : '#fffaf0');
    }

    const prevY = this.y;
    this.x += this.vx * dt + (f.wind || 0) * dt; this.y += this.vy * dt;
    this.x = clamp(this.x, (f.arenaL || 0) + 22, (f.arenaR || W) - 22);
    // chão: fixo nas lutas; nas fases Run 'n' Gun a cena informa plataformas e poços
    const fl = f.floorAt ? f.floorAt(this.x, this.y, prevY) : GY;
    if (fl !== null && this.y >= fl && this.vy >= 0) {
      if (!this.onGround) { this.land = 1; Particles.puff(this.x, fl - 4, 3, 9); }
      this.y = fl; this.floorY = fl; this.vy = 0; this.onGround = true; this.parryUsed = false; this.airDashUsed = false; this.jumpHeld = false; this.jumpsUsed = 0;
    } else this.onGround = false;
    if (this.onGround && Math.abs(this.vx) > 10 && this.dashT <= 0) {
      this.dustT = (this.dustT || 0) - dt;
      if (this.dustT <= 0) { this.dustT = 0.16; Particles.add({ kind: 'puff', x: this.x - this.facing * 10, y: this.y - 4, vx: -this.facing * 40, vy: -20, life: 0.35, size: 5, color: '#f4e7c5' }); }
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
        f.pb.push({ x: s.x + this.aim.x * 34, y: s.y + this.aim.y * 34, vx: this.aim.x * 620, vy: this.aim.y * 620, r: 24, dmg: 18, life: 2, kind: 'ember', hero: this.type, from: this });
        if (this.onGround) this.vx = -this.facing * 120;
        Snd.play('ex'); f.shake = 6;
      }
    }
  }

  fire(f) {
    const s = this.shoulder(), a0 = Math.atan2(this.aim.y, this.aim.x), m = this.dmgMul;
    this.recoil = 1;
    const base = { hero: this.type, from: this };
    if (this.weapon === 'w_homing') {
      this.shootCd = 0.13;
      const a = a0 + rand(-0.15, 0.15);
      f.pb.push(Object.assign({ x: s.x + this.aim.x * 30, y: s.y + this.aim.y * 30, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, r: 9, dmg: 0.75 * m, life: 1.8, kind: 'homing', homing: true }, base));
      Snd.play('shoot'); return;
    }
    if (this.weapon === 'w_twin') {
      this.shootCd = 0.12;
      const px = -this.aim.y, py = this.aim.x;
      for (const k of [-9, 9]) f.pb.push(Object.assign({ x: s.x + this.aim.x * 30 + px * k, y: s.y + this.aim.y * 30 + py * k, vx: this.aim.x * P.bulletV, vy: this.aim.y * P.bulletV, r: 8, dmg: 0.58 * m, life: 1.2, kind: 'spark' }, base));
      Snd.play('shoot'); return;
    }
    if (this.weapon === 'w_bomb') {
      this.shootCd = 0.36;
      f.pb.push(Object.assign({ x: s.x + this.aim.x * 28, y: s.y + this.aim.y * 28 - 6, vx: this.aim.x * 720, vy: this.aim.y * 600 - 400, grav: 1150, r: 12, dmg: 2.7 * m, life: 2.2, kind: 'bomb' }, base));
      Snd.play('shoot2'); return;
    }
    if (this.weapon === 'w_fan') {
      // Leque de Cera: 3 gotas em leque, curto alcance, mais dano somado
      this.shootCd = 0.16;
      for (const da of [-0.2, 0, 0.2]) {
        const a = a0 + da + rand(-0.03, 0.03);
        f.pb.push(Object.assign({ x: s.x + this.aim.x * 26, y: s.y + this.aim.y * 26, vx: Math.cos(a) * 800, vy: Math.sin(a) * 800, r: 10, dmg: 0.6 * m, life: 0.42, kind: 'wax' }, base));
      }
      Snd.play('shoot2'); return;
    }
    // tiro padrão (igual para os dois heróis)
    this.shootCd = 0.11;
    const a = a0 + rand(-0.05, 0.05);
    f.pb.push(Object.assign({ x: s.x + this.aim.x * 30, y: s.y + this.aim.y * 30, vx: Math.cos(a) * P.bulletV, vy: Math.sin(a) * P.bulletV, r: 9, dmg: 1 * m, life: 1.2, kind: 'spark' }, base));
    Snd.play('shoot');
  }

  hurt(f) {
    if (this.inv > 0 || this.superT > 0 || !this.alive || this.ghost) return;
    if (this.charm === 'c_smoke' && this.dashT > 0) return;
    if (this.bubble) {
      this.bubble = false; this.bubbleT = 25; this.inv = 1.2;
      Snd.play('poof'); f.shake = 6; Particles.stars(this.x, this.y - 40, 10, '#9fd0f0'); Particles.puff(this.x, this.y - 40, 4, 14, '#d8eefa');
      return;
    }
    this.hp--; this.inv = 2.2; this.hurtT = 0.35; this.dashT = 0;
    this.vy = -360; this.onGround = false;
    f.shake = 12; f.hitstop = 0.12; Snd.play('hurt');
    Particles.stars(this.x, this.y - 40, 8, '#ff6a3a');
    if (this.hp <= 0) { this.meter = 0; this.superT = 0; Particles.puff(this.x, this.y - 30, 8, 18); if (f.coop) { this.ghost = true; this.ghostT = 0; } }
  }

  // volta ao jogo num ponto seguro (queda em poço ou checkpoint das fases Run 'n' Gun)
  respawn(x, y, hp) {
    this.ghost = false; this.gone = false; if (hp) this.hp = hp;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.inv = 2; this.dashT = 0; this.onGround = false; this.parryT = 0; this.superT = 0;
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
    groundShadow(this.x, clamp(22 - (this.floorY - this.y) * 0.06, 8, 22), 0.3, this.floorY);
    // fantasmas do dash
    for (const g of this.trail) {
      ctx.save(); ctx.globalAlpha = (g.life / 0.22) * 0.35;
      drawHero(this.type, g.x, g.y, { facing: g.f, t: this.anim, dash: true, ghost: false });
      ctx.restore();
    }
    const blinkOut = this.inv > 0 && this.superT <= 0 && Math.floor(this.inv * 18) % 2 === 0;
    if (!blinkOut) this.drawBody();
    if (this.bubble) {
      const r = 46 + Math.sin(this.anim * 4) * 2;
      ctx.save(); ctx.fillStyle = 'rgba(160,210,255,.2)'; ctx.beginPath(); ctx.arc(this.x, this.y - 34, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(200,235,255,.8)'; ctx.lineWidth = 2.5; ctx.stroke(); shine(this.x - 16, this.y - 58, 9, 4, -0.6, 0.6); ctx.restore();
    }
    if (this.superT > 0) this.drawSuper();
  }

  drawBody() {
    // giro do rebote, recuo do tiro e tombo ao levar dano
    ctx.save();
    const cy = this.y - 34;
    if (this.parryT > 0 && !this.dashParry) { const k = 1 - this.parryT / this.parryWin; ctx.translate(this.x, cy); ctx.rotate(k * TAU * this.facing); ctx.translate(-this.x, -cy); }
    if (this.hurtT > 0) { ctx.translate(this.x, cy); ctx.rotate(-this.facing * 0.6 * (this.hurtT / 0.35)); ctx.translate(-this.x, -cy); }
    if (this.recoil > 0) ctx.translate(-this.facing * this.recoil * 2.5, 0);
    drawHero(this.type, this.x, this.y, {
      facing: this.facing, aim: this.aim, run: this.onGround && Math.abs(this.vx) > 10, air: !this.onGround,
      duck: this.duck, t: this.anim, land: this.land, dash: this.dashT > 0, shooting: this.shooting || this.exT > 0,
      parry: this.parryT > 0 && !this.dashParry, hurt: this.hurtT > 0, superT: this.superT, vx: this.vx, dance: (this.victory || this.ready) && this.onGround,
      vy: this.vy, takeoff: this.takeoff, turn: this.turnT, low: this.hp === 1 && (this.maxHp || 3) > 1,
      idle: this.onGround && Math.abs(this.vx) < 10 && this.dashT <= 0 && !this.duck && !this.shooting, pulse: Music.pulse(),
    });
    ctx.restore();
  }

  drawSuper() {
    const s = this.shoulder(), f = this.facing, cx = this.camX || 0, len = f > 0 ? cx + W - s.x : s.x - cx;
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
