'use strict';
// ===== Cenários, luta e telas =====

// ---------- Cenários (pré-desenhados em canvas fora da tela) ----------
const BG = {};

function buildBackgrounds() {
  // Usa o ctx global temporariamente para reaproveitar as funções de desenho
  const realCtx = ctx;
  const build = (fn) => { const c = document.createElement('canvas'); c.width = W; c.height = H; swapCtx(c.getContext('2d')); fn(); swapCtx(realCtx); return c; };

  BG.hall = build(() => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a1810'); g.addColorStop(1, '#6b2a18'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // holofotes
    for (const x of [200, 760]) { ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x - 200, GY); ctx.lineTo(x + 200, GY); ctx.lineTo(x + 30, 0); ctx.fillStyle = 'rgba(255,230,160,.12)'; ctx.fill(); }
    // palco e cortinas
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1, x0 = i ? W : 0;
      ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 - side * -150, 0); ctx.quadraticCurveTo(x0 - side * -60, 250, x0 - side * -110, GY); ctx.lineTo(x0, GY); ctx.closePath();
      ctx.fillStyle = '#9b1d1d'; ctx.fill(); ink(5); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4;
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0 + side * -k * 35, 0); ctx.quadraticCurveTo(x0 + side * -k * 18, 250, x0 + side * -k * 26, GY); ctx.stroke(); }
    }
    ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= W; x += 80) ctx.quadraticCurveTo(x + 40, 70, x + 80, 0);
    ctx.lineTo(W, 0); ctx.fillStyle = '#b52525'; ctx.fill(); ink(5); ctx.stroke();
    // notas decorativas na parede
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffd9a0'; ctx.font = `60px serif`;
    for (const [x, y] of [[300, 160], [470, 110], [620, 190], [400, 280]]) ctx.fillText('♪', x, y);
    ctx.globalAlpha = 1;
    // piso
    ctx.fillStyle = '#a0612f'; ctx.fillRect(0, GY, W, H - GY); ink(5); ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2;
    for (let x = -40; x < W; x += 70) { ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x - 30, H); ctx.stroke(); }
    ctx.fillStyle = '#e6c27a'; ctx.fillRect(0, GY + 2, W, 6);
  });

  BG.roofs = build(() => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5d6b7a'); g.addColorStop(1, '#b8b3a0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // nuvens distantes
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (const [x, y, r] of [[120, 260, 40], [170, 250, 55], [230, 265, 40], [700, 300, 45], [760, 285, 60], [830, 300, 42]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    // prédios ao fundo
    ink(4);
    const bld = [[20, 300, 90], [120, 250, 70], [200, 320, 110], [330, 280, 80], [430, 230, 60], [500, 300, 120], [640, 260, 90], [740, 310, 70], [820, 240, 120]];
    for (const [x, y, w] of bld) {
      ctx.fillStyle = '#4b4a52'; ctx.fillRect(x, y, w, GY - y); ctx.strokeRect(x, y, w, GY - y);
      ctx.fillStyle = '#e8c86a';
      for (let wy = y + 20; wy < GY - 40; wy += 40) for (let wx = x + 12; wx < x + w - 20; wx += 28) if ((wx * 7 + wy * 3) % 5 < 2) ctx.fillRect(wx, wy, 12, 18);
    }
    // varal
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 360); ctx.quadraticCurveTo(480, 410, W, 360); ctx.stroke();
    for (const [x, c] of [[180, '#c8352b'], [300, '#f4e7c5'], [620, '#5a7ea8'], [760, '#e0b040']]) { ctx.fillStyle = c; ctx.fillRect(x, 377 + Math.sin(x) * 4, 34, 40); ink(3); ctx.strokeRect(x, 377 + Math.sin(x) * 4, 34, 40); }
    // telhado (chão)
    ctx.fillStyle = '#7b3b2a'; ctx.fillRect(0, GY, W, H - GY); ink(5); ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
    for (let y = GY + 16; y < H; y += 16) for (let x = (y / 16) % 2 ? 0 : 20; x < W; x += 40) { ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI); ctx.stroke(); }
    // chaminés
    for (const x of [60, 880]) { ink(4); ctx.fillStyle = '#8f4a33'; ctx.fillRect(x, GY - 60, 40, 60); ctx.strokeRect(x, GY - 60, 40, 60); ctx.fillStyle = '#3a2a22'; ctx.fillRect(x - 5, GY - 70, 50, 12); ctx.strokeRect(x - 5, GY - 70, 50, 12); }
  });

  if (typeof buildBackgrounds2 === 'function') buildBackgrounds2(build);
  BG.tower = build(() => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2c2218'); g.addColorStop(1, '#5a4228'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // engrenagens gigantes ao fundo
    const gear = (x, y, R, n, col) => {
      ctx.save(); ctx.translate(x, y); ctx.beginPath();
      for (let i = 0; i < n * 2; i++) { const a0 = (i / (n * 2)) * TAU, a1 = ((i + 1) / (n * 2)) * TAU, rr = i % 2 ? R * 0.85 : R; ctx.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr); ctx.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ink(4); ctx.stroke();
      circle(0, 0, R * 0.55, 'rgba(0,0,0,.25)'); circle(0, 0, R * 0.15, '#2c2218');
      ctx.restore();
    };
    gear(140, 150, 120, 16, '#6e5530'); gear(330, 330, 90, 12, '#5f4a2a'); gear(900, 420, 150, 18, '#6e5530'); gear(560, 90, 70, 10, '#5f4a2a');
    // janela redonda
    ink(6); circle(480, 160, 70, '#c9b98a'); ctx.beginPath(); ctx.moveTo(410, 160); ctx.lineTo(550, 160); ctx.moveTo(480, 90); ctx.lineTo(480, 230); ctx.stroke();
    // vigas
    ctx.fillStyle = '#3d2b1a'; for (const x of [40, 900]) { ctx.fillRect(x, 0, 26, GY); ink(4); ctx.strokeRect(x, 0, 26, GY); }
    // piso de madeira
    ctx.fillStyle = '#6b4423'; ctx.fillRect(0, GY, W, H - GY); ink(5); ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; for (let y = GY + 20; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  });
}

// ---------- Cena: Luta ----------
class Fight {
  constructor(idx) {
    this.idx = idx; this.def = BOSSES[idx];
    const mode = Game.mode;
    this.coop = mode.coop;
    this.boss = this.def.make();
    this.diffId = opt().diff; this.diff = curDiff();
    this.boss.hp = this.boss.max = Math.round(this.boss.max * this.diff.hp * (this.coop ? 1.7 : 1));
    this.players = mode.coop
      ? [new Player(0, mode.chars[0], 120), new Player(1, mode.chars[1], 210)]
      : [new Player(0, mode.chars[0], 160)];
    for (const p of this.players) p.hp = this.diff.lives;
    this.focus = this.players[0];
    this.pb = []; this.eb = []; this.wind = 0;
    this.state = 'intro'; this.stateT = 0; this.shake = 0; this.hitstop = 0; this.t = 0;
    this.stats = { time: 0, parries: 0, meterUsed: 0 };
    this.menuSel = 0; this.paused = false; this.sub = null; this.landed = false;
    this.arenaR = this.def.arenaR || W;
    Particles.clear(); Music.play(this.def.song);
  }
  // alvo atual dos ataques do chefão (sempre um jogador vivo)
  get player() { return this.focus && this.focus.alive ? this.focus : (this.players.find((p) => p.alive) || this.players[0]); }
  pickTarget() { const alive = this.players.filter((p) => p.alive); if (alive.length) this.focus = pick(alive); }
  targets() { return [this.boss, ...this.eb.filter((b) => b.shootable).map((b) => ({ hurtCircles: () => [b], damage: (n) => this.hitMinion(b, n) }))]; }
  hitMinion(b, n) { b.hp -= n; if (b.hp <= 0 && b.life > 0) { b.life = 0; Particles.puff(b.x, b.y, 5, 14, '#d8d2c4'); Snd.play('boom'); } }
  win() {
    this.state = 'win'; this.stateT = 0; this.hitstop = 0.3; this.shake = 20;
    this.eb = []; Snd.play('win'); Music.stop();
    for (const p of this.players) { if (p.ghost) p.revive(); p.victory = true; }
  }
  update(dt) {
    if (this.sub) { this.sub.update(dt); return; }
    if (this.paused) return this.updatePause();
    if (backPressed() && (this.state === 'play' || this.state === 'intro')) { this.paused = true; this.menuSel = 0; Snd.play('select'); return; }
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.t += dt; this.stateT += dt;
    this.shake = Math.max(0, this.shake - dt * 40);
    const boss = this.boss;
    Particles.update(dt);

    if (this.state === 'intro') {
      if (!this.landed && this.stateT > 0.75) { this.landed = true; this.shake = 14; Snd.play('boom'); const c = boss.hurtCircles()[0] || { x: W * 0.75, y: GY - 100 }; Particles.puff(c.x - 80, GY - 8, 5, 18); Particles.puff(c.x + 80, GY - 8, 5, 18); }
      boss.t += dt; for (const p of this.players) p.anim += dt; if (this.stateT > 2.3) { this.state = 'play'; this.stateT = 0; } return; }
    if (this.state === 'dead') { this.updateDeath(); return; }

    if (this.state === 'play') { this.stats.time += dt; for (const p of this.players) p.update(dt, this); }
    else if (this.state === 'win') for (const p of this.players) p.update(dt, this);
    boss.update(dt, this);

    // tiros dos jogadores
    for (const b of this.pb) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40) b.life = 0;
      if (b.life <= 0 || this.state !== 'play') continue;
      for (const tg of this.targets()) {
        const hit = tg.hurtCircles().some((c) => (c.x - b.x) ** 2 + (c.y - b.y) ** 2 < (c.r + b.r) ** 2);
        if (hit) {
          tg.damage(b.dmg, this); b.life = 0;
          const o = b.from; if (o && o.superT <= 0 && b.kind !== 'ember') o.meter = Math.min(5, o.meter + 0.012 * b.dmg);
          if (b.kind === 'ember') { Particles.stars(b.x, b.y, 10, HEROES[b.hero].flame[1]); Snd.play('boom'); this.shake = 6; } else { Particles.stars(b.x, b.y, 1, b.kind === 'wax' ? '#bfe3ff' : '#ffd84a'); Snd.play('hit'); }
          break;
        }
      }
      if (b.kind === 'ember' && Math.random() < 0.6) Particles.puff(b.x, b.y, 1, 8, HEROES[b.hero].flame[1]);
    }
    this.pb = this.pb.filter((b) => b.life > 0);

    // projéteis inimigos
    for (const b of this.eb) {
      updateBullet(b, dt * this.diff.speed, this);
      if (b.life <= 0 || this.state !== 'play') continue;
      for (const p of this.players) {
        if (!p.alive || b.life <= 0) continue;
        const box = p.box();
        if (b.pink && p.parryT > 0 && circRect(b.x, b.y, b.r + 16, box.x, box.y - 10, box.w, box.h + 10)) { this.parry(p, b); continue; }
        if (bulletHits(b, box)) p.hurt(this);
      }
    }
    this.eb = this.eb.filter((b) => b.life > 0);
    if (this.state === 'play') for (const p of this.players) {
      if (!p.alive) continue;
      const box = p.box();
      // contato com o chefão
      for (const c of boss.dangerCircles()) if (circRect(c.x, c.y, c.r, box.x, box.y, box.w, box.h)) p.hurt(this);
      // reviver o parceiro: rebater o coração rosa do fantasma
      for (const g of this.players) if (g.ghost && !g.gone && p.parryT > 0) {
        const h = g.heartPos();
        if (circRect(h.x, h.y, 30, box.x, box.y - 10, box.w, box.h + 10)) {
          g.revive(); p.vy = -560; p.parryT = 0; p.parryUsed = false; p.jumpHeld = false;
          this.hitstop = 0.12; Snd.play('revive'); Particles.stars(h.x, h.y, 12, PINK);
          Particles.add({ kind: 'text', text: 'REVIVEU!', x: h.x, y: h.y - 20, vy: -40, life: 1.2, size: 28, color: PINK });
        }
      }
    }

    if (this.state === 'play' && !this.players.some((p) => p.alive)) {
      this.state = 'dead'; this.stateT = 0; this.menuSel = 0; Snd.play('lose'); Music.stop();
    }
    if (this.state === 'win') {
      if (Math.random() < 0.25) { const c = boss.hurtCircles()[0] || { x: boss.x || W * 0.75, y: boss.y || 250 }; Particles.stars(c.x + rand(-80, 80), c.y + rand(-80, 80), 6, pick(['#ffd84a', '#ff9a2e', '#fff'])); if (Math.random() < 0.3) Snd.play('boom'); this.shake = 5; }
      if (this.stateT > 3.6) Game.go(new Results(this.idx, this.stats, Math.max(...this.players.map((p) => p.hp)), this.diffId));
    }
  }
  parry(p, b) {
    b.life = 0;
    p.vy = -560; p.parryT = 0; p.parryUsed = false; p.jumpHeld = false;
    p.meter = Math.min(5, p.meter + 1); this.stats.parries++;
    this.hitstop = 0.1; Snd.play('parry'); Particles.stars(b.x, b.y, 8, PINK);
  }
  updatePause() {
    const opts = 4;
    if (pressed.up) { this.menuSel = (this.menuSel + opts - 1) % opts; Snd.play('select'); }
    if (pressed.down) { this.menuSel = (this.menuSel + 1) % opts; Snd.play('select'); }
    if (backPressed()) { this.paused = false; return; }
    if (pressed.jump || pressed.start) {
      Snd.play('confirm');
      if (this.menuSel === 0) this.paused = false;
      else if (this.menuSel === 1) Game.go(new Fight(this.idx));
      else if (this.menuSel === 2) this.sub = new Options(() => { this.sub = null; });
      else Game.go(new MapScene(this.idx));
    }
  }
  updateDeath() {
    if (this.stateT < 1.2) return;
    if (pressed.up || pressed.down) { this.menuSel ^= 1; Snd.play('select'); }
    if (pressed.jump || pressed.start) { Snd.play('confirm'); Game.go(this.menuSel === 0 ? new Fight(this.idx) : new MapScene(this.idx)); }
  }
  draw() {
    ctx.save();
    const sk = opt().shake ? this.shake : 0;
    if (sk > 0) ctx.translate(rand(-1, 1) * sk, rand(-1, 1) * sk);
    ctx.drawImage(BG[this.def.bg], -20, -20, W + 40, H + 40);
    // entrada do chefão (cai do alto) e saída ao ser derrotado (afunda girando)
    ctx.save();
    if (this.state === 'intro' && this.stateT < 0.75) { const k = this.stateT / 0.75; ctx.translate(0, -(1 - k * k) * 520); }
    else if (this.state === 'intro' && this.stateT < 1.1) { const k = (this.stateT - 0.75) / 0.35; const sq = Math.sin(k * Math.PI) * 0.12; const c = this.boss.hurtCircles()[0] || { x: W * 0.75 }; ctx.translate(c.x, GY); ctx.scale(1 + sq, 1 - sq); ctx.translate(-c.x, -GY); }
    if (this.state === 'win' && this.stateT > 2.2) {
      const k = Math.min(1, (this.stateT - 2.2) / 1.2), c = this.boss.hurtCircles()[0] || { x: W * 0.75, y: 250 };
      ctx.globalAlpha = 1 - k; ctx.translate(c.x, c.y + k * 120); ctx.rotate(k * 0.5); ctx.scale(1 - k * 0.4, 1 - k * 0.4); ctx.translate(-c.x, -c.y);
    }
    this.boss.draw();
    ctx.restore();
    for (const b of this.pb) drawPlayerBullet(b, this.t);
    for (const p of this.players) p.draw();
    for (const b of this.eb) drawBullet(b);
    Particles.draw();
    if (this.wind) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const y = (i * 67 + this.t * 40) % GY, x = ((this.t * this.wind * 4 + i * 173) % (W + 200) + W + 200) % (W + 200) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.sign(this.wind) * 80, y); ctx.stroke(); } }
    ctx.restore();
    this.drawHUD();
    if (this.state === 'intro') this.drawIntro();
    if (this.state === 'win' && this.stateT < 3) {
      const k = Math.min(1, this.stateT * 3);
      ctx.save(); ctx.translate(W / 2, H / 2 - 30); ctx.scale(k * (1 + Math.sin(this.stateT * 10) * 0.03), k); ctx.rotate(-0.06);
      outlinedText('VITÓRIA!', 0, 0, 96, '#ffd84a', FONT_TITLE, 'center', 14);
      ctx.restore();
    }
    if (this.state === 'dead') this.drawDeath();
    if (this.paused) this.drawPause();
    if (this.sub) this.sub.draw();
  }
  drawHUD() {
    this.players.forEach((p, i) => {
      const right = i === 1, x0 = right ? W - 18 - 222 : 18, y0 = Touch.visible() ? 16 : H - 54;
      ctx.save(); ctx.translate(x0, y0);
      // retrato
      ink(3.5); circle(19, 18, 19, p.type === 'candela' ? '#cfe2f6' : '#f3d2c8');
      ctx.save(); ctx.beginPath(); ctx.arc(19, 18, 17, 0, TAU); ctx.clip();
      drawHero(p.type, 17, p.type === 'candela' ? 86 : 96, { scale: p.type === 'candela' ? 0.95 : 1, t: this.t, hurt: !p.alive });
      ctx.restore(); ink(3.5); circle(19, 18, 19, null);
      // cartão de vida
      const low = p.hp === 1 && Math.floor(this.t * 4) % 2;
      ink(4); rrect(44, 2, 74, 34, 6, !p.alive ? '#6b5a4a' : low ? '#c8352b' : CREAM);
      ctx.font = `19px ${FONT_TITLE}`; ctx.fillStyle = low || !p.alive ? CREAM : INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.alive ? `PV ${p.hp}` : (p.ghost && !p.gone ? 'AJUDA!' : 'FIM'), 81, 20);
      // medidor de chamas (5 cartas)
      const pal = HEROES[p.type].flame;
      for (let k = 0; k < 5; k++) {
        const fill = clamp(p.meter - k, 0, 1), full = fill >= 1;
        ctx.save(); ctx.translate(134 + k * 21, 19);
        if (full) ctx.rotate(Math.sin(this.t * 6 + k) * 0.08 + (p.meter >= 5 ? Math.sin(this.t * 20) * 0.1 : 0));
        ink(3); rrect(-9, -15, 18, 30, 3, '#3a2a1e');
        if (fill > 0) { ctx.fillStyle = full ? pal[1] : 'rgba(168,106,42,.9)'; ctx.fillRect(-7, 13 - 26 * fill, 14, 26 * fill); }
        if (full) { ctx.fillStyle = pal[2]; ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(6, 2, 0, 7); ctx.quadraticCurveTo(-6, 2, 0, -8); ctx.fill(); }
        ctx.restore();
      }
      if (this.coop) { ctx.font = `14px ${FONT_TITLE}`; ctx.fillStyle = CREAM; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeText(`J${i + 1}`, 0, -6); ctx.fillText(`J${i + 1}`, 0, -6); }
      ctx.restore();
    });
  }
  drawIntro() {
    const t = this.stateT;
    if (t < 1.3) {
      ctx.fillStyle = `rgba(20,12,6,${Math.max(0, 0.6 - t * 0.4)})`; ctx.fillRect(0, 0, W, H);
      outlinedText(this.def.name, W / 2, 120, 44, '#ffd84a');
      ctx.font = `22px ${FONT_TEXT}`; ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.fillText(this.def.quote, W / 2, 168);
      ctx.font = `20px ${FONT_TITLE}`; ctx.fillStyle = this.diff.color; ctx.lineWidth = 4; ctx.strokeStyle = CREAM; ctx.strokeText(`Dificuldade: ${this.diff.name}`, W / 2, 200); ctx.fillText(`Dificuldade: ${this.diff.name}`, W / 2, 200);
      const k = Math.min(1, t * 4);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k, k); outlinedText('PREPARE-SE...', 0, 0, 64, CREAM); ctx.restore();
    } else {
      const k = Math.min(1, (t - 1.3) * 5);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k * 1.2, k * 1.2); ctx.rotate(-0.08); outlinedText('JÁ!', 0, 0, 110, '#ff9a2e', FONT_TITLE, 'center', 16); ctx.restore();
    }
  }
  drawDeath() {
    const t = this.stateT;
    ctx.fillStyle = `rgba(15,8,4,${Math.min(0.7, t)})`; ctx.fillRect(0, 0, W, H);
    if (t < 0.3) return;
    const k = Math.min(1, (t - 0.3) * 4);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.rotate(-0.02);
    ink(6); rrect(-260, -170, 520, 340, 16, PAPER);
    ctx.strokeStyle = 'rgba(80,50,20,.4)'; ctx.lineWidth = 2; rrect(-245, -155, 490, 310, 10, null);
    outlinedText('APAGOU!', 0, -115, 56, '#c8352b');
    ctx.font = `20px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(this.def.name, 0, -62);
    // barra de progresso
    const prog = 1 - this.boss.hp / this.boss.max, bx = -200, bw = 400, by = -20;
    ink(4); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.stroke();
    for (const m of [0.34, 0.67]) { ctx.beginPath(); ctx.moveTo(bx + bw * m, by - 8); ctx.lineTo(bx + bw * m, by + 8); ctx.stroke(); }
    star(bx + bw, by, 16, '#ffd84a');
    ctx.save(); ctx.translate(bx + bw * prog * Math.min(1, (t - 0.5) * 1.5), by - 12); drawHero(this.players[0].type, 0, 22, { scale: 0.45, t: this.t }); ctx.restore();
    ctx.font = `18px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.fillText(`Progresso: ${Math.round(prog * 100)}%  ·  ${this.diff.name}`, 0, 30);
    const opts = ['Tentar de novo', 'Voltar ao mapa'];
    opts.forEach((o, i) => {
      const sel = i === this.menuSel;
      ctx.font = `${sel ? 30 : 24}px ${FONT_TITLE}`; ctx.fillStyle = sel ? '#c8352b' : 'rgba(26,20,16,.6)';
      ctx.fillText((sel ? '► ' : '') + o, 0, 78 + i * 40);
    });
    ctx.restore();
  }
  drawPause() {
    ctx.fillStyle = 'rgba(15,8,4,.6)'; ctx.fillRect(0, 0, W, H);
    ink(6); rrect(W / 2 - 180, H / 2 - 150, 360, 300, 16, PAPER);
    outlinedText('PAUSA', W / 2, H / 2 - 100, 48, CREAM);
    ['Continuar', 'Recomeçar', 'Opções', 'Sair para o mapa'].forEach((o, i) => {
      const sel = i === this.menuSel;
      ctx.font = `${sel ? 28 : 24}px ${FONT_TITLE}`; ctx.fillStyle = sel ? '#c8352b' : 'rgba(26,20,16,.6)'; ctx.textAlign = 'center';
      ctx.fillText((sel ? '► ' : '') + o, W / 2, H / 2 - 30 + i * 44);
    });
  }
}

function drawPlayerBullet(b, t) {
  const pal = HEROES[b.hero || 'fosforo'].flame;
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
  if (b.kind === 'ember') {
    const s = 1 + Math.sin(t * 40) * 0.08; ctx.scale(s, s);
    ink(4); ctx.beginPath(); ctx.moveTo(-50, 0); ctx.quadraticCurveTo(-10, -30, 20, -22); ctx.arc(0, 0, 24, -1.2, 1.2); ctx.quadraticCurveTo(-10, 30, -50, 0);
    ctx.fillStyle = pal[0]; ctx.fill(); ctx.stroke();
    circle(4, 0, 14, pal[1], false); circle(8, 0, 7, pal[2], false); shine(10, -6, 4, 2, 0, 0.8);
  } else if (b.kind === 'wax') {
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(-2, -8, 6, -7); ctx.arc(6, 0, 7, -Math.PI / 2, Math.PI / 2); ctx.quadraticCurveTo(-2, 8, -16, 0);
    ctx.fillStyle = '#8fc6f2'; ctx.fill(); ink(2.5); ctx.stroke();
    shine(5, -3, 3, 1.6, 0, 0.85);
  } else {
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(-4, -8, 8, -6); ctx.arc(8, 0, 6, -Math.PI / 2, Math.PI / 2); ctx.quadraticCurveTo(-4, 8, -22, 0);
    ctx.fillStyle = pal[1]; ctx.fill(); ink(2.5); ctx.stroke();
    circle(6, 0, 3.5, pal[2], false);
  }
  ctx.restore();
}

// ---------- Cena: Seleção de personagem ----------
class CharSelect {
  constructor(coop) {
    this.coop = coop; this.t = 0;
    this.sel = Game.mode.chars[0] === 'candela' ? 1 : 0; // escolha do J1 (o J2 fica com o outro)
    InputMode.coop = coop;
  }
  update(dt) {
    this.t += dt;
    if (pressed.left || pressed.right) { this.sel ^= 1; Snd.play('select'); }
    if (pressed.up || pressed.down) { cycleDiff(pressed.up ? -1 : 1); Snd.play('select'); }
    if (backPressed()) { InputMode.coop = Game.mode.coop; Game.go(new Title()); return; }
    if (pressed.jump || pressed.start || pressed.shoot) {
      Snd.play('confirm');
      const ids = ['fosforo', 'candela'];
      Game.mode = { coop: this.coop, chars: this.coop ? [ids[this.sel], ids[this.sel ^ 1]] : [ids[this.sel]] };
      InputMode.coop = this.coop;
      Game.go(Save.data.seenIntro ? new MapScene(0) : new Story(STORY_INTRO, () => { Save.data.seenIntro = true; Save.write(); Game.go(new MapScene(0)); }));
    }
  }
  draw() {
    sunburst(W / 2, H / 2, this.t * 0.12, '#c98a3a', '#d9a04e', 26);
    outlinedText(this.coop ? 'ESCOLHAM SEUS HERÓIS' : 'ESCOLHA SEU HERÓI', W / 2, 52, 44, '#ffd84a');
    ['fosforo', 'candela'].forEach((id, i) => {
      const Hh = HEROES[id], cx = 260 + i * 440, chosen = i === this.sel;
      ctx.save(); ctx.translate(cx, 290);
      const sc = chosen ? 1.04 + Math.sin(this.t * 5) * 0.015 : 0.94; ctx.scale(sc, sc); ctx.rotate(i ? 0.02 : -0.02);
      ink(6); rrect(-185, -200, 370, 400, 18, chosen ? '#fff6e0' : '#cdb98e');
      ctx.strokeStyle = 'rgba(80,50,20,.4)'; ctx.lineWidth = 2; rrect(-172, -187, 344, 374, 12, null);
      // palco do retrato
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, -55, 130, 120, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = i ? '#b9d4ee' : '#f0c4a8'; ctx.fillRect(-140, -180, 280, 260);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 12; k++) { const a = this.t * 0.3 + k * TAU / 12; ctx.beginPath(); ctx.moveTo(0, 30); ctx.arc(0, 30, 300, a, a + 0.13); ctx.fill(); }
      ctx.restore(); ink(5); ellipse(0, -55, 130, 120, 0, null);
      drawHero(id, 0, 50, { scale: 2.1, dance: chosen, t: this.t + i, shooting: false });
      outlinedText(Hh.name, 0, 86, 40, i ? '#8fc6f2' : '#ff8a5a');
      ctx.font = `17px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(Hh.tag, 0, 116);
      ctx.font = `19px ${FONT_TITLE}`; ctx.fillStyle = '#c8352b'; ctx.fillText(`Arma: ${Hh.weapon}`, 0, 142);
      textBlock(Hh.desc, 0, 154, 320, 19, 15, INK, 'center');
      if (this.coop) { const tag = chosen ? 'J1' : 'J2'; ink(4); circle(-150, -165, 26, chosen ? '#c8352b' : '#3a7bd5'); outlinedText(tag, -150, -164, 22, CREAM); }
      else if (chosen) { star(-150, -165, 24, '#ffd84a'); }
      ctx.restore();
    });
    ctx.font = `18px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center';
    // dificuldade
    const D = curDiff();
    ink(4); rrect(W / 2 - 250, 494, 500, 34, 10, '#fff6e0');
    ctx.font = `20px ${FONT_TITLE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = D.color;
    ctx.fillText(`▲  Dificuldade: ${D.name}  ▼`, W / 2, 504);
    ctx.font = `12px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.fillText(D.desc, W / 2, 520);
    ctx.font = `13px ${FONT_TEXT}`; ctx.fillStyle = INK;
    ctx.fillText(this.coop ? '←/→ trocar heróis · ↑/↓ dificuldade · Z/F/Enter confirmar · Esc voltar' : '←/→ herói · ↑/↓ dificuldade · Z/Enter confirmar · Esc voltar', W / 2, 536);
  }
}

// ---------- Cena: Resultado ----------
function computeGrade(stats, hp, idx, diffId = 'normal') {
  const par = BOSSES[idx].par || 120, D = DIFFS[diffId] || DIFFS.normal;
  hp = Math.min(3, hp * (3 / Math.min(3, D.lives)));
  let s = 0;
  s += stats.time <= par * 0.65 ? 30 : stats.time <= par ? 22 : stats.time <= par * 1.5 ? 12 : 5;
  s += hp * 10;
  s += Math.min(stats.parries, 3) * 7;
  s += Math.min(stats.meterUsed, 6) * 3.2;
  const table = [[96, 'S'], [88, 'A+'], [80, 'A'], [74, 'A-'], [68, 'B+'], [60, 'B'], [54, 'B-'], [48, 'C+'], [40, 'C'], [0, 'D']];
  let grade = table.find(([m]) => s >= m)[1];
  if (D.maxGrade && GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(D.maxGrade)) grade = D.maxGrade;
  return { score: s, grade };
}
const GRADE_ORDER = ['D', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S'];

class Results {
  constructor(idx, stats, hp, diffId = 'normal') {
    this.idx = idx; this.stats = stats; this.hp = hp; this.t = 0; this.diffId = diffId; this.diff = DIFFS[diffId] || DIFFS.normal;
    this.res = computeGrade(stats, hp, idx, diffId);
    const id = BOSSES[idx].id, old = Save.data.grades[id];
    const gd = Save.data.gradeDiff || (Save.data.gradeDiff = {});
    const better = !old || GRADE_ORDER.indexOf(this.res.grade) > GRADE_ORDER.indexOf(old)
      || (this.res.grade === old && DIFF_ORDER.indexOf(diffId) > DIFF_ORDER.indexOf(gd[id] || 'normal'));
    this.newBest = better;
    if (better) { Save.data.grades[id] = this.res.grade; gd[id] = diffId; Save.write(); }
    Music.play('map');
  }
  update(dt) {
    this.t += dt;
    if (this.t > 1 && (pressed.jump || pressed.start)) {
      Snd.play('confirm');
      const allDone = BOSSES.every((b) => Save.data.grades[b.id]);
      Game.go(new MapScene(allDone ? BOSSES.length : Math.min(this.idx + 1, BOSSES.length - 1)));
    }
  }
  draw() {
    sunburst(W / 2, H / 2, this.t * 0.15, '#c98a3a', '#d9a04e');
    ink(6); rrect(150, 50, 660, 440, 18, PAPER);
    outlinedText('RESULTADO', W / 2, 100, 52, '#ffd84a');
    ctx.font = `20px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(`${BOSSES[this.idx].name} foi derrotado e a brasa foi recuperada!`, W / 2, 145);
    ctx.font = `17px ${FONT_TITLE}`; ctx.fillStyle = this.diff.color; ctx.fillText(`Dificuldade: ${this.diff.name}`, 690, 182);
    const mm = Math.floor(this.stats.time / 60), ss = Math.floor(this.stats.time % 60).toString().padStart(2, '0');
    const rows = [['Tempo', `${mm}:${ss}`], ['Vida restante', `${this.hp} / ${this.diff.lives}`], ['Rebotes', `${Math.min(this.stats.parries, 3)} / 3`], ['Chamas gastas', `${Math.min(this.stats.meterUsed, 6)} / 6`]];
    rows.forEach(([k, v], i) => {
      const show = this.t > 0.3 + i * 0.3;
      if (!show) return;
      ctx.font = `24px ${FONT_TEXT}`; ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.fillText(k, 210, 200 + i * 48);
      ctx.textAlign = 'right'; ctx.fillText(v, 560, 200 + i * 48);
      ctx.strokeStyle = 'rgba(26,20,16,.3)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(210, 216 + i * 48); ctx.lineTo(560, 216 + i * 48); ctx.stroke(); ctx.setLineDash([]);
    });
    if (this.t > 1.6) {
      const k = Math.min(1, (this.t - 1.6) * 5);
      ctx.save(); ctx.translate(690, 270); ctx.scale(k, k); ctx.rotate(-0.12);
      ink(6); circle(0, 0, 80, '#fff6e0'); ctx.strokeStyle = '#c8352b'; ctx.lineWidth = 4; circle(0, 0, 66, null);
      outlinedText(this.res.grade, 0, 4, 72, '#c8352b');
      ctx.restore();
      ctx.font = `18px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('NOTA', 690, 375);
      if (this.newBest) { ctx.fillStyle = '#c8352b'; ctx.fillText('★ novo recorde! ★', 690, 400); }
    }
    Game.mode.chars.forEach((c, i) => drawHero(c, 280 + i * 70, 450, { dance: true, t: this.t + i * 0.4, scale: 0.9, facing: i ? -1 : 1 }));
    if (this.t > 1 && Math.floor(this.t * 2) % 2) { ctx.font = `20px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('Pressione Z para continuar', W / 2, 465); }
  }
}

// ---------- Cena: Tela título ----------
class Title {
  constructor() { this.t = 0; this.sel = 0; this.help = false; this.helpPage = 0; Music.play('title'); InputMode.coop = false; }
  update(dt) {
    this.t += dt;
    if (this.sub) { this.sub.update(dt); return; }
    if (this.help) {
      if (pressed.left || pressed.right) { this.helpPage ^= 1; Snd.play('select'); }
      else if (pressed.jump || pressed.start || backPressed()) { this.help = false; Snd.play('select'); }
      return;
    }
    const n = 4;
    if (pressed.up) { this.sel = (this.sel + n - 1) % n; Snd.play('select'); }
    if (pressed.down) { this.sel = (this.sel + 1) % n; Snd.play('select'); }
    if (pressed.mute) Snd.toggleMute();
    if (pressed.jump || pressed.start) {
      Snd.play('confirm');
      if (this.sel === 0) Game.go(new CharSelect(false));
      else if (this.sel === 1) Game.go(new CharSelect(true));
      else if (this.sel === 2) { this.help = true; this.helpPage = 0; }
      else this.sub = new Options(() => { this.sub = null; });
    }
  }
  draw() {
    sunburst(W / 2, 250, this.t * 0.12, '#d79a45', '#e8b762', 28);
    // logotipo
    ctx.save(); ctx.translate(W / 2, 92); ctx.rotate(-0.03 + Math.sin(this.t * 2) * 0.01);
    ctx.font = `78px ${FONT_TITLE}`;
    const w1 = ctx.measureText('FÓSFORO ').width, w2 = ctx.measureText('& ').width, w3 = ctx.measureText('CANDELA').width, x0 = -(w1 + w2 + w3) / 2;
    outlinedText('FÓSFORO', x0, 0, 78, '#c8352b', FONT_TITLE, 'left', 14);
    outlinedText('&', x0 + w1, 0, 78, '#ffd84a', FONT_TITLE, 'left', 14);
    outlinedText('CANDELA', x0 + w1 + w2, 0, 78, '#8fc6f2', FONT_TITLE, 'left', 14);
    outlinedText('e a Chama Perdida', 0, 68, 36, '#ffd84a', FONT_TITLE, 'center', 9);
    ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.ellipse(215, 462, 70, 12, 0, 0, TAU); ctx.ellipse(400, 462, 60, 11, 0, 0, TAU); ctx.fillStyle = 'rgba(60,30,10,.3)'; ctx.fill(); ctx.restore();
    drawHero('fosforo', 210, 462, { dance: true, t: this.t, scale: 2.1 });
    drawHero('candela', 400, 462, { dance: true, t: this.t + 0.45, scale: 1.9, facing: -1 });
    // menu
    const opts = ['1 Jogador', '2 Jogadores', 'Como jogar', 'Opções'];
    ink(5); rrect(570, 230, 300, 240, 14, PAPER);
    opts.forEach((o, i) => {
      const sel = i === this.sel;
      ctx.font = `${sel ? 29 : 24}px ${FONT_TITLE}`; ctx.textAlign = 'center'; ctx.fillStyle = sel ? '#c8352b' : 'rgba(26,20,16,.65)';
      ctx.fillText((sel ? '► ' : '') + o, 720, 275 + i * 52);
    });
    ctx.font = `15px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('↑/↓ escolher · Z ou Enter confirmar', 720, 498);
    if (this.help) this.drawHelp();
    if (this.sub) this.sub.draw();
  }
  drawHelp() {
    ctx.fillStyle = 'rgba(15,8,4,.6)'; ctx.fillRect(0, 0, W, H);
    ink(6); rrect(70, 30, 820, 480, 16, PAPER);
    outlinedText(this.helpPage ? 'COMO JOGAR · 2 JOGADORES' : 'COMO JOGAR · 1 JOGADOR', W / 2, 72, 36, '#ffd84a');
    const bl = (pr, a, n = 2) => getBinds(pr)[a].slice(0, n).map(keyName).join(' / ') || '—';
    const solo = [
      [bl('solo', 'left', 1) + ' ' + bl('solo', 'right', 1) + ' ' + bl('solo', 'up', 1) + ' ' + bl('solo', 'down', 1), 'Andar, mirar (cima, diagonais) e agachar'],
      [bl('solo', 'jump'), 'Pular (segure para ir mais alto)'],
      [bl('solo', 'jump', 1) + ' no ar', 'REBOTE: toque em objetos ROSA para quicar e ganhar 1 chama'],
      [bl('solo', 'shoot'), 'Atirar (segure)'],
      [bl('solo', 'dash'), 'Dash rápido (também no ar)'],
      [bl('solo', 'ex'), 'Golpe EX (1 chama) · SUPER Labareda (5 chamas)'],
      [bl('solo', 'lock'), 'Travar posição para mirar em 8 direções'],
      ['Esc / P', 'Pausar · M som · troque as teclas em Opções'],
    ];
    const pl = (pr) => ['left', 'right', 'up', 'down'].map((a) => bl(pr, a, 1)).join('') + ' mover · ' + bl(pr, 'jump', 1) + ' pular · ' + bl(pr, 'shoot', 1) + ' atirar · ' + bl(pr, 'dash', 1) + ' dash · ' + bl(pr, 'ex', 1) + ' EX';
    const coop = [
      ['Jogador 1', pl('p1')],
      ['Jogador 2', pl('p2')],
      ['Teclas', 'Troque as teclas de cada jogador em Opções'],
      ['Controles', 'Controle 1 = J1, Controle 2 = J2 (A pular, X atirar, RB dash, B EX)'],
      ['Fantasma', 'Quem cair vira fantasma: o parceiro REBATE o coração rosa para reviver'],
      ['Chefões', 'Ficam mais resistentes no modo de 2 jogadores'],
    ];
    const lines = this.helpPage ? coop : solo;
    lines.forEach(([k, v], i) => {
      ctx.font = `19px ${FONT_TITLE}`; ctx.fillStyle = '#c8352b'; ctx.textAlign = 'right'; ctx.fillText(k, 285, 130 + i * 44);
      ctx.font = `17px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(v, 302, 130 + i * 44);
    });
    ctx.font = `16px ${FONT_TEXT}`; ctx.textAlign = 'center';
    ctx.fillText('Fósforo: tiro reto e longo · Candela: leque de cera, forte de perto', W / 2, 455);
    ctx.fillText('←/→ trocar página · Z para voltar', W / 2, 484);
  }
}

// ---------- Cena: História ----------
const STORY_INTRO = [
  { art: 'lit', text: 'Em Vila Vinil, toda noite o grande Farol acendia a Chama Eterna — e a cidade inteira dançava até o amanhecer.' },
  { art: 'dark', text: 'Mas, numa noite sem lua, a chama se apagou! Seis brasas mágicas foram surrupiadas por seis figurões encrenqueiros da cidade.' },
  { art: 'hero', text: 'O pequeno Fósforo, aprendiz do faroleiro, riscou a cabeça na parede. Sua melhor amiga, a velinha Candela, acendeu o pavio: "Vamos trazer essas brasas de volta!"' },
  { art: 'villains', text: 'Gramofone Gustavo, Nuvem Nimbo, Rei Relógio, Pianão Pafúncio, Mestre Cartola e Locomotiva Lola esperam pela dupla. Recupere as brasas e reacenda o Farol!' },
];
const STORY_END = [
  { art: 'hero', text: 'Com as seis brasas nas mãos, Fósforo e Candela subiram os trezentos degraus do Farol, um por um...' },
  { art: 'lit', text: '...e a Chama Eterna voltou a brilhar! Vila Vinil dançou por sete noites seguidas — até o Rei Relógio perdeu a hora.' },
  { art: 'end', text: 'FIM. Obrigado por jogar! Tente conseguir nota S contra todos os chefões.' },
];
class Story {
  constructor(pages, done, song = 'map') { this.pages = pages; this.done = done; this.i = 0; this.t = 0; Music.play(song); }
  update(dt) {
    this.t += dt;
    const page = this.pages[this.i], full = this.t * 45 >= page.text.length;
    if (backPressed()) { Snd.play('confirm'); this.done(); return; }
    if (pressed.jump || pressed.start || pressed.shoot) {
      if (!full) { this.t = 999; return; }
      Snd.play('select'); this.i++; this.t = 0;
      if (this.i >= this.pages.length) this.done();
    }
  }
  draw() {
    const page = this.pages[Math.min(this.i, this.pages.length - 1)];
    ctx.fillStyle = '#2a1d12'; ctx.fillRect(0, 0, W, H);
    // moldura de livro
    ink(6); rrect(70, 30, 820, 480, 12, PAPER);
    ctx.save(); ctx.beginPath(); ctx.rect(110, 60, 740, 280); ctx.clip();
    drawStoryArt(page.art, this.t + this.i * 3);
    ctx.restore(); ink(5); ctx.strokeRect(110, 60, 740, 280);
    const shown = page.text.slice(0, Math.floor(this.t * 45));
    textBlock(shown, 120, 362, 720, 32, 24, INK);
    ctx.font = `15px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(26,20,16,.6)'; ctx.textAlign = 'right';
    ctx.fillText(`${Math.min(this.i + 1, this.pages.length)} / ${this.pages.length}  ·  Z avança · Esc pula`, 860, 488);
  }
}
function drawLighthouse(x, y, lit, t) {
  ink(5);
  ctx.beginPath(); ctx.moveTo(x - 50, y); ctx.lineTo(x - 30, y - 200); ctx.lineTo(x + 30, y - 200); ctx.lineTo(x + 50, y); ctx.closePath(); ctx.fillStyle = '#f4ecd8'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8352b'; for (const k of [0.25, 0.65]) { const yy = y - 200 * k; ctx.beginPath(); ctx.moveTo(x - 50 + 20 * k, yy); ctx.lineTo(x + 50 - 20 * k, yy); ctx.lineTo(x + 50 - 20 * (k + 0.15), yy - 30); ctx.lineTo(x - 50 + 20 * (k + 0.15), yy - 30); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  rrect(x - 38, y - 250, 76, 50, 6, lit ? '#ffe56a' : '#4a4038');
  ctx.beginPath(); ctx.moveTo(x - 45, y - 250); ctx.lineTo(x, y - 290); ctx.lineTo(x + 45, y - 250); ctx.closePath(); ctx.fillStyle = '#3b2416'; ctx.fill(); ctx.stroke();
  if (lit) for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, y - 225); ctx.lineTo(x + d * 500, y - 290 + Math.sin(t) * 30); ctx.lineTo(x + d * 500, y - 160 + Math.sin(t) * 30); ctx.closePath(); ctx.fillStyle = 'rgba(255,240,150,.35)'; ctx.fill(); }
}
function drawStoryArt(art, t) {
  const dark = art === 'dark' || art === 'villains';
  ctx.fillStyle = dark ? '#2e2a3a' : '#e8b762'; ctx.fillRect(110, 60, 740, 280);
  if (!dark) sunburstClip(480, 340, t * 0.1);
  // casinhas
  ctx.fillStyle = dark ? '#1c1a24' : '#8f5a35';
  for (let i = 0; i < 9; i++) { const x = 110 + i * 85, h = 50 + ((i * 37) % 40); ink(3); ctx.fillRect(x, 340 - h, 70, h); ctx.strokeRect(x, 340 - h, 70, h); ctx.beginPath(); ctx.moveTo(x - 5, 340 - h); ctx.lineTo(x + 35, 310 - h); ctx.lineTo(x + 75, 340 - h); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = dark ? '#1c1a24' : '#8f5a35'; }
  if (art === 'lit' || art === 'dark') drawLighthouse(480, 330, art === 'lit', t);
  if (art === 'hero') { drawLighthouse(760, 330, false, t); drawHero('fosforo', 330, 335, { dance: true, t, scale: 2.3 }); drawHero('candela', 500, 335, { dance: true, t: t + 0.4, scale: 2.1, facing: -1 }); }
  if (art === 'villains') {
    const put = (B, x, y, sc, setup) => { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); const o = new B(); o.t = t; o.x = 0; o.y = 0; if (setup) setup(o); o.draw(); ctx.restore(); };
    put(Nimbo, 470, 115, 0.38, (o) => { o.phase = 2; });
    put(ClockKing, 770, 120, 0.3, (o) => { o.hand = t; });
    put(Magician, 470, 250, 0.4, (o) => { o.bx = 0; o.by = 0; });
    put(Gramophone, 200, 215, 0.4);
    put(Piano, 230, 338, 0.38);
    put(Train, 730, 338, 0.36);
  }
  if (art === 'end') { drawLighthouse(300, 330, true, t); drawHero('fosforo', 540, 335, { dance: true, t, scale: 2.1 }); drawHero('candela', 680, 335, { dance: true, t: t + 0.4, scale: 1.9, facing: -1 }); outlinedText('FIM', 600, 130, 72, '#ffd84a'); }
}
function sunburstClip(cx, cy, t) {
  ctx.fillStyle = '#f0c878';
  for (let i = 0; i < 20; i++) { const a = t + (i / 20) * TAU; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 900, a, a + TAU / 40); ctx.closePath(); ctx.fill(); }
}

// ---------- Cena: Mapa de Vila Vinil ----------
const NODES = [{ x: 120, y: 430 }, { x: 250, y: 265 }, { x: 395, y: 430 }, { x: 535, y: 265 }, { x: 675, y: 430 }, { x: 800, y: 275 }, { x: 895, y: 470 }];
class MapScene {
  constructor(sel = 0) { this.sel = Math.min(sel, BOSSES.length); this.t = 0; this.px = NODES[this.sel].x; this.py = NODES[this.sel].y; Music.play('map'); }
  allDone() { return BOSSES.every((b) => Save.data.grades[b.id]); }
  update(dt) {
    this.t += dt;
    const max = this.allDone() ? BOSSES.length : BOSSES.length - 1;
    if (pressed.right || pressed.down) { if (this.sel < max) { this.sel++; Snd.play('select'); } }
    if (pressed.left || pressed.up) { if (this.sel > 0) { this.sel--; Snd.play('select'); } }
    const n = NODES[this.sel]; this.px = lerp(this.px, n.x, dt * 8); this.py = lerp(this.py, n.y, dt * 8);
    if (backPressed()) { Game.go(new Title()); return; }
    InputMode.coop = Game.mode.coop;
    if (pressed.jump || pressed.start) {
      Snd.play('confirm');
      if (this.sel < BOSSES.length) Game.go(new Fight(this.sel));
      else Game.go(new Story(STORY_END, () => Game.go(new Title()), 'ending'));
    }
  }
  draw() {
    // mar e ilha
    ctx.fillStyle = '#6f98a8'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) { const x = (i * 137 + this.t * 15) % (W + 60) - 30, y = 90 + ((i * 89) % 440); ctx.beginPath(); ctx.arc(x, y, 10, Math.PI, TAU); ctx.arc(x + 20, y, 10, Math.PI, TAU); ctx.stroke(); }
    const island = () => {
      ctx.moveTo(40, 330); ctx.bezierCurveTo(30, 160, 260, 120, 420, 145); ctx.bezierCurveTo(600, 100, 930, 110, 935, 250);
      ctx.bezierCurveTo(950, 400, 960, 520, 760, 520); ctx.bezierCurveTo(560, 535, 300, 530, 120, 515); ctx.bezierCurveTo(20, 500, 45, 420, 40, 330); ctx.closePath();
    };
    ctx.save(); ctx.translate(0, 8); ctx.beginPath(); island(); ctx.fillStyle = 'rgba(20,40,50,.3)'; ctx.fill(); ctx.restore();
    shape(island, '#d9c08a', 6, 'rgba(120,80,30,.25)', 10, 10);
    for (const [x, y, r] of [[180, 200, 40], [460, 190, 50], [740, 200, 45], [320, 360, 35], [600, 360, 38], [860, 380, 30]]) {
      circle(x, y, r, '#9fb06a', false); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); ctx.fill();
    }
    // caminho
    ctx.setLineDash([10, 10]); ink(4); ctx.beginPath(); ctx.moveTo(NODES[0].x, NODES[0].y);
    for (let i = 1; i < NODES.length; i++) ctx.lineTo(NODES[i].x, NODES[i].y);
    ctx.stroke(); ctx.setLineDash([]);
    // nós
    const done = this.allDone();
    NODES.forEach((n, i) => {
      const sel = i === this.sel;
      ctx.save(); ctx.translate(n.x, n.y - 40);
      if (sel) ctx.scale(1.1 + Math.sin(this.t * 5) * 0.04, 1.1 + Math.sin(this.t * 5) * 0.04);
      if (i < BOSSES.length) {
        ink(4); rrect(-46, -44, 92, 70, 8, sel ? '#fff6e0' : PAPER);
        ctx.font = `15px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(BOSSES[i].short, 0, -28);
        const g = Save.data.grades[BOSSES[i].id];
        if (g) { ctx.font = `24px ${FONT_TITLE}`; ctx.fillStyle = '#c8352b'; ctx.fillText(g, 0, -2); const gd = DIFFS[(Save.data.gradeDiff || {})[BOSSES[i].id] || 'normal']; ctx.font = `11px ${FONT_TEXT}`; ctx.fillStyle = gd.color; ctx.fillText(gd.name, 0, 16); } else { ctx.font = `14px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(26,20,16,.6)'; ctx.fillText('???', 0, 2); }
      } else {
        ctx.translate(0, 40); ctx.scale(0.33, 0.33); drawLighthouse(0, 40, done, this.t);
      }
      ctx.restore();
    });
    Game.mode.chars.forEach((c, i) => drawHero(c, this.px + (Game.mode.chars.length > 1 ? (i ? 16 : -16) : 0), this.py + 52, { dance: true, t: this.t + i * 0.4, scale: 0.75, facing: i ? -1 : 1 }));
    // painel de informações
    ink(5); rrect(20, 18, 920, 62, 12, PAPER);
    const N = BOSSES.length;
    const info = this.sel < N ? `${BOSSES[this.sel].place} — ${BOSSES[this.sel].name}` : (done ? 'O Farol — leve as brasas para casa!' : `O Farol (derrote os ${N} chefões)`);
    outlinedText('Vila Vinil', 110, 49, 30, '#ffd84a');
    ctx.font = `19px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(info, 220, 49);
    ctx.font = `14px ${FONT_TEXT}`; ctx.textAlign = 'right'; ctx.fillText('←/→ andar · Z entrar · Esc título', 925, 49);
    const brasas = BOSSES.filter((b) => Save.data.grades[b.id]).length;
    ink(4); rrect(20, 92, 150, 34, 8, PAPER);
    ctx.font = `18px ${FONT_TITLE}`; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText(`Brasas: ${brasas} / ${N}`, 95, 110);
    const D = curDiff(); ink(4); rrect(180, 92, 200, 34, 8, PAPER);
    ctx.font = `16px ${FONT_TITLE}`; ctx.fillStyle = D.color; ctx.fillText(`Dificuldade: ${D.name}`, 280, 110);
  }
}
