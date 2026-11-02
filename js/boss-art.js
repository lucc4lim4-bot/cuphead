'use strict';
// ===== Arte detalhada dos chefões =====

function brow(x1, y1, x2, y2, w = 7) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 4, x2, y2); ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); }
function teethRow(x, y, w, h, n) {
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.strokeRect(x, y, w, h);
  for (let i = 1; i < n; i++) { ctx.beginPath(); ctx.moveTo(x + (w / n) * i, y); ctx.lineTo(x + (w / n) * i, y + h); ctx.stroke(); }
}
function crack(x, y, len, a, seed = 1) {
  ctx.beginPath(); ctx.moveTo(x, y);
  let cx = x, cy = y;
  for (let i = 1; i <= 4; i++) { const aa = a + Math.sin(seed * 7 + i * 3) * 0.7; cx += Math.cos(aa) * len / 4; cy += Math.sin(aa) * len / 4; ctx.lineTo(cx, cy); }
  ink(2.5); ctx.stroke();
}

// ---------------- Gramofone Gustavo ----------------
Gramophone.prototype.draw = function () {
  groundShadow(this.x, Math.max(50, 125 + this.yoff * 0.25), 0.38);
  ctx.save();
  const w = this.windup || 0;
  const sq = 1 + Math.sin(this.t * 7) * 0.025 + this.mouth * 0.05 - w * 0.05;
  ctx.translate(this.x, this.y + this.yoff); ctx.scale(-this.face, 1); ctx.scale(1 / sq, sq);
  if (this.dead) ctx.translate(rand(-5, 5), rand(-3, 3));
  const fl = this.flash > 0, lx = (this.lookX || 0) * -this.face, ly = this.lookY || 0, p = this.phase;
  const inAir = this.yoff < -15;

  // pernas e sapatos
  const step = inAir ? 0 : Math.sin(this.t * 7) * 4, tuck = inAir ? -16 : 0;
  hose(-48, -26, -58, -8 + step + tuck, 9, 10); hose(48, -26, 54, -8 - step + tuck, -9, 10);
  shoe(-50, step * 0.4 + tuck, -1, 14, '#2a1a10'); shoe(62, -step * 0.4 + tuck, -1, 14, '#2a1a10');

  // braço de trás com batuta de maestro
  const bw = Math.sin(this.t * 9) * 0.6;
  const hb = { x: 120 + Math.cos(bw) * 10, y: -100 + Math.sin(bw) * 20 };
  hose(84, -95, hb.x, hb.y, -12, 10);
  ctx.save(); ctx.translate(hb.x, hb.y); ctx.rotate(-1.1 + bw);
  ink(3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -55); ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  glove(hb.x, hb.y, 13, -0.4, true);

  // gabinete de madeira
  const wood = fl ? '#c48552' : '#8f4f2a', panel = fl ? '#d9a070' : '#a8653a';
  shape(pRRect(-92, -142, 184, 122, 16), wood, 6, 'rgba(40,15,5,.42)', -12, -9);
  ctx.strokeStyle = 'rgba(50,20,5,.35)'; ctx.lineWidth = 2;
  for (const yy of [-134, -30]) { ctx.beginPath(); ctx.moveTo(-80, yy); ctx.bezierCurveTo(-40, yy - 3, -10, yy + 3, 30, yy); ctx.bezierCurveTo(50, yy - 2, 70, yy + 2, 80, yy); ctx.stroke(); }
  // painel frontal em baixo-relevo
  shape(pRRect(-76, -128, 152, 94, 11), panel, 4, 'rgba(40,15,5,.35)', 7, 7);
  ctx.strokeStyle = 'rgba(255,220,170,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-70, -40); ctx.lineTo(70, -40); ctx.lineTo(70, -120); ctx.stroke();
  // cantoneiras de latão
  for (const [cx, cy] of [[-82, -132], [82, -132], [-82, -30], [82, -30]]) { ink(3); circle(cx, cy, 6.5, '#e0b04a'); shine(cx - 2, cy - 2, 2, 1.3, -0.6, 0.8); }
  // olhos
  const blink = (this.t % 4) > 3.86 ? 1 : 0;
  const lid = p >= 2 ? 0.3 : 0.08;
  pieEye(-40, -98, 18, 23, lx, ly, blink, lid, panel, 0.3);
  pieEye(6, -98, 18, 23, lx, ly, blink, lid, panel, -0.3);
  const bh = p >= 2 ? 8 : 0;
  brow(-62, -128 + (p >= 2 ? -2 : 0), -22, -124 + bh, 8); brow(-14, -124 + bh, 26, -128 + (p >= 2 ? -2 : 0), 8);
  // nariz = botão de volume
  ink(3); circle(-17, -74, 8, '#e0b04a'); ctx.beginPath(); ctx.moveTo(-17, -74); ctx.lineTo(-17 + Math.cos(this.t * 3) * 6, -74 + Math.sin(this.t * 3) * 6); ctx.stroke(); shine(-20, -77, 2.5, 1.5);
  // boca
  const mo = 7 + this.mouth * 18 + w * 6 + (this.dead ? 16 : 0);
  ctx.save(); ctx.beginPath(); ctx.ellipse(-17, -50, 36, mo, 0, 0, TAU); ctx.fillStyle = '#3b120c'; ctx.fill(); ctx.clip();
  ctx.beginPath(); ctx.ellipse(-17, -50 + mo, 22, mo * 0.7, 0, 0, TAU); ctx.fillStyle = '#d6555a'; ctx.fill();
  teethRow(-45, -50 - mo, 56, Math.min(9, mo * 0.6), 6);
  ctx.restore(); ink(4.5); ellipse(-17, -50, 36, mo, 0, null);
  // danos na fase 3
  if (p === 3) {
    crack(60, -138, 40, 1.9, 2); crack(-88, -60, 30, -0.3, 5);
    ctx.save(); ctx.translate(58, -60); ctx.rotate(0.6); ink(2.5); rrect(-16, -5, 32, 10, 3, '#f4e7c5'); rrect(-5, -16, 10, 32, 3, '#f4e7c5'); ctx.restore();
  }

  // prato giratório e disco
  ink(5); ellipse(0, -147, 80, 17, 0, '#2a2018'); ellipse(0, -151, 74, 14, 0, '#16110d');
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, -151, 70, 12, 0, 0, TAU); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; for (const r of [60, 48, 36]) { ctx.beginPath(); ctx.ellipse(0, -151, r, r * 0.18, 0, 0, TAU); ctx.stroke(); }
  const ra = this.t * 6; ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(Math.cos(ra) * 64, -151 + Math.sin(ra) * 11); ctx.lineTo(Math.cos(ra) * 26, -151 + Math.sin(ra) * 4.5); ctx.stroke(); ctx.restore();
  ink(3); ellipse(0, -151, 17, 4.5, 0, '#c8352b');
  // braço da agulha
  ink(3); circle(58, -152, 9, '#c9c9c9'); shine(55, -155, 3, 2);
  ctx.beginPath(); ctx.moveTo(58, -152); ctx.quadraticCurveTo(40, -165, 18, -154); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#d8d8d8'; ctx.stroke();
  ink(2.5); rrect(10, -158, 12, 8, 2, '#b0b0b0');

  // pescoço e corneta
  ctx.beginPath(); ctx.moveTo(48, -158); ctx.bezierCurveTo(70, -210, 30, -214, 6, -206);
  ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = fl ? '#f5d58a' : '#d9a441'; ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(52, -170); ctx.bezierCurveTo(64, -205, 34, -210, 12, -206); ctx.stroke();
  const flare = 1 + this.mouth * 0.16 + w * 0.08;
  const mx = -102, my = -252, mh = 64 * flare;
  const horn = () => { ctx.moveTo(8, -216); ctx.quadraticCurveTo(-48, -222, mx, my - mh); ctx.lineTo(mx, my + mh); ctx.quadraticCurveTo(-48, -196, 8, -196); ctx.closePath(); };
  shape(horn, fl ? '#f5d58a' : '#d9a441', 5, 'rgba(110,60,0,.35)', 0, -12);
  // gomos da corneta
  for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) {
    ctx.beginPath(); ctx.moveTo(6, -206 + k * 8); ctx.quadraticCurveTo(-50, -210 + k * 26, mx + 2, my + k * mh);
    ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(110,60,0,.45)'; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, -212); ctx.quadraticCurveTo(-46, -222, mx + 4, my - mh * 0.7); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
  // boca da corneta
  ink(6); ellipse(mx, my, 24, mh, 0, '#e9bf5a');
  const g = ctx.createRadialGradient(mx + 4, my, 2, mx + 4, my, mh * 0.8);
  g.addColorStop(0, '#000'); g.addColorStop(1, '#5a3410');
  ink(3); ellipse(mx + 3, my, 15, mh * 0.8, 0, g);
  ctx.beginPath(); ctx.ellipse(mx - 2, my, 22, mh - 3, 0, 2.2, 3.6); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.stroke();

  // braço da frente segurando a corneta
  const hy = -160 + Math.sin(this.t * 7) * 6;
  hose(-84, -100, -116, hy, 12, 10); glove(-116, hy, 13, -2.2, true);
  ctx.restore();
};

// ---------------- Nuvem Nimbo ----------------
Nimbo.prototype.draw = function () {
  ctx.save(); ctx.translate(this.x, this.y);
  if (this.dead) { ctx.translate(rand(-5, 5), rand(-3, 3)); ctx.rotate(Math.sin(this.t * 20) * 0.05); }
  const w = this.windup || 0, p = this.phase, fl = this.flash > 0;
  const s = 1 + Math.sin(this.t * 3) * 0.03 + this.puff * 0.08 + w * 0.05; ctx.scale(s, 1 / s);
  const pal = fl ? ['#ffffff', '#e6e2da'] : p === 3 ? ['#a6a2ae', '#4b4858'] : p === 2 ? ['#e2ded6', '#8c867b'] : ['#fbf8f1', '#b9b3a6'];
  const lumps = [[-100, 18, 48], [-62, -30, 55], [0, -56, 64], [64, -30, 55], [104, 16, 46], [56, 44, 50], [-6, 50, 52], [-58, 44, 48]]
    .map(([x, y, r], i) => [x, y, r + Math.sin(this.t * 4 + i) * 2.5]);
  const union = () => { for (const [x, y, r] of lumps) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); } };

  // relâmpagos crepitando na fase 3
  if (p === 3 && !this.dead) {
    for (let i = 0; i < 2; i++) if (Math.random() < 0.5) {
      const a = rand(0, TAU), r0 = 100; let x = Math.cos(a) * r0, y = Math.sin(a) * r0 * 0.7;
      ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += Math.cos(a) * 12 + rand(-8, 8); y += Math.sin(a) * 12 + rand(-8, 8); ctx.lineTo(x, y); }
      ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffe45c'; ctx.stroke();
    }
  }
  // contorno grosso e preenchimento com degradê
  ctx.beginPath(); union(); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  const g = ctx.createLinearGradient(0, -120, 0, 100); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
  ctx.beginPath(); union(); ctx.fillStyle = g; ctx.fill();
  // definição interna entre os gomos e sombra inferior
  ctx.save(); ctx.beginPath(); union(); ctx.clip();
  ctx.fillStyle = 'rgba(40,35,60,.18)'; ctx.beginPath(); ctx.ellipse(0, 105, 150, 50, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(40,35,60,.28)'; ctx.lineWidth = 3;
  for (const [x, y, r] of lumps.slice(1, 5)) { ctx.beginPath(); ctx.arc(x, y, r - 2, 2.0, 2.9); ctx.stroke(); }
  for (const [x, y, r] of lumps.slice(1, 5)) shine(x - r * 0.35, y - r * 0.45, r * 0.28, r * 0.13, -0.5, p === 3 ? 0.25 : 0.7);
  ctx.restore();

  // braços (um levanta para chamar o raio)
  const wv = Math.sin(this.t * 6) * 10, raise = w > 0.3 && this.seq % 3 === 0;
  hose(-118, 20, -158, 58 + wv, 12, 9); glove(-160, 60 + wv, 14, 2.2, true);
  if (raise) { hose(118, 10, 160, -70, -10, 9); glove(162, -74, 14, -1.3); }
  else { hose(118, 20, 158, 58 - wv, -12, 9); glove(160, 60 - wv, 14, 0.9, true); }

  // rosto
  const lx = this.lookX || 0, ly = clamp((this.lookY || 0) + 0.5, -1, 1);
  const blink = (this.t % 3.6) > 3.45 ? 1 : 0;
  const lid = p === 1 ? 0.12 : p === 2 ? 0.3 : 0.38, lidCol = p === 3 ? '#8c8896' : p === 2 ? '#d4d0c7' : '#f0ece3';
  pieEye(-32, -8, 19, 25, lx, ly, blink, lid, lidCol, 0.32); pieEye(30, -8, 19, 25, lx, ly, blink, lid, lidCol, -0.32);
  if (p === 1) { brow(-56, -42, -14, -40, 7); brow(10, -40, 52, -42, 7); }
  else { brow(-58, -46, -12, -28, 9); brow(8, -28, 54, -46, 9); }
  ctx.fillStyle = 'rgba(230,120,130,.45)';
  ctx.beginPath(); ctx.ellipse(-62, 24, 13 + this.puff * 10, 8 + this.puff * 6, 0, 0, TAU); ctx.ellipse(60, 24, 13 + this.puff * 10, 8 + this.puff * 6, 0, 0, TAU); ctx.fill();
  ink(4.5);
  if (this.puff > 0.2) { ellipse(0, 40, 11, 13, 0, '#3b2a3a'); ellipse(0, 40, 4, 5, 0, '#000', false); }
  else if (p === 1) { ctx.beginPath(); ctx.moveTo(-26, 30); ctx.quadraticCurveTo(0, 52, 28, 28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(28, 28); ctx.lineTo(34, 24); ctx.stroke(); }
  else {
    const open = p === 3 ? 16 + w * 8 : 8 + w * 6;
    ctx.save(); ctx.beginPath(); ctx.moveTo(-30, 40); ctx.quadraticCurveTo(0, 22 - open * 0.3, 30, 40); ctx.quadraticCurveTo(0, 40 + open * 1.4, -30, 40); ctx.closePath();
    ctx.fillStyle = '#3b1a2a'; ctx.fill(); ctx.clip();
    teethRow(-30, 26, 60, 10, 7);
    ctx.beginPath(); ctx.ellipse(0, 40 + open * 1.1, 14, 8, 0, 0, TAU); ctx.fillStyle = '#d6555a'; ctx.fill();
    ctx.restore(); ink(4.5); ctx.beginPath(); ctx.moveTo(-30, 40); ctx.quadraticCurveTo(0, 22 - open * 0.3, 30, 40); ctx.quadraticCurveTo(0, 40 + open * 1.4, -30, 40); ctx.closePath(); ctx.stroke();
  }
  if (p === 3) { ink(2.5); ctx.beginPath(); ctx.moveTo(72, -40); ctx.bezierCurveTo(80, -28, 82, -18, 74, -14); ctx.bezierCurveTo(66, -18, 66, -28, 72, -40); ctx.fillStyle = '#9fd0f0'; ctx.fill(); ctx.stroke(); }
  if (this.dead) { ctx.font = `34px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('x', -32, 2); ctx.fillText('x', 30, 2); }
  ctx.restore();
};

// ---------------- Rei Relógio ----------------
ClockKing.prototype.draw = function () {
  const fl = this.flash > 0, p = this.phase, w = this.windup || 0;
  // pêndulo
  if (this.pend) {
    const b = this.bob();
    ctx.beginPath(); ctx.moveTo(470, -40); ctx.lineTo(b.x, b.y); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#c99a3a'; ctx.stroke();
    const g = ctx.createRadialGradient(b.x - 12, b.y - 12, 3, b.x, b.y, 40); g.addColorStop(0, '#fff2b0'); g.addColorStop(0.5, '#e0aa40'); g.addColorStop(1, '#8a5a12');
    ink(6); circle(b.x, b.y, 37, g);
    ctx.strokeStyle = 'rgba(90,50,0,.6)'; ctx.lineWidth = 2.5; circle(b.x, b.y, 26, null); star(b.x, b.y, 12, '#f6d36a');
  }
  groundShadow(this.x, 150, 0.38);
  ctx.save(); ctx.translate(this.x, this.y);
  if (this.dead) { ctx.translate(rand(-5, 5), rand(-4, 4)); ctx.rotate(Math.sin(this.t * 25) * 0.04); }
  const floor = GY - this.y;
  // sapatos
  shoe(-42, floor, -1, 15, '#2a1a10'); shoe(46, floor, -1, 15, '#2a1a10');
  // capa
  const cape = () => { ctx.moveTo(-82, 60); ctx.quadraticCurveTo(-150, 200, -134, floor - 10); ctx.quadraticCurveTo(0, floor + 4, 134, floor - 10); ctx.quadraticCurveTo(150, 200, 82, 60); ctx.closePath(); };
  const cg = ctx.createLinearGradient(-140, 0, 140, 0); cg.addColorStop(0, fl ? '#b04a54' : '#8e2633'); cg.addColorStop(1, fl ? '#a03a44' : '#5e1520');
  shape(cape, cg, 6, 'rgba(30,0,5,.35)', -14, 0);
  ctx.strokeStyle = 'rgba(30,0,5,.4)'; ctx.lineWidth = 3;
  for (const k of [-90, -50, 50, 90]) { ctx.beginPath(); ctx.moveTo(k * 0.6, 120); ctx.quadraticCurveTo(k * 1.05, 200, k * 1.1, floor - 12); ctx.stroke(); }
  // colete com botões dourados
  shape(pRRect(-22, 108, 44, floor - 118, 8), '#f4ecd8', 4, 'rgba(80,60,30,.25)', -6, 0);
  for (let yy = 128; yy < floor - 20; yy += 26) { ink(2.5); circle(0, yy, 5.5, '#e0b04a'); shine(-2, yy - 2, 1.8, 1.2); }
  // gola de arminho
  ctx.save(); ink(4);
  for (let i = -4; i <= 4; i++) { const x = i * 24, y = 92 + Math.abs(i) * -4; circle(x, y, 20, '#fffaf0'); }
  ctx.fillStyle = INK; for (let i = -4; i <= 4; i += 2) { ctx.beginPath(); ctx.ellipse(i * 24 + 4, 94 + Math.abs(i) * -4, 2.5, 5, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  // braços e cetro
  const wv = Math.sin(this.t * 4) * 8 - w * 14;
  hose(-104, 50, -168, -16 + wv, -15, 10);
  ink(5); ctx.beginPath(); ctx.moveTo(-170, -20 + wv); ctx.lineTo(-180, 130 + wv); ctx.lineWidth = 9; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#e0b04a'; ctx.stroke();
  const og = ctx.createRadialGradient(-172, -60 + wv, 2, -168, -54 + wv, 22); og.addColorStop(0, '#fff6c0'); og.addColorStop(1, '#d8a030');
  ink(4); circle(-168, -52 + wv, 18, og); star(-168, -78 + wv, 11, '#ffd84a');
  glove(-170, -18 + wv, 15, -1.6, true);
  hose(104, 50, 150, 110, 14, 10); glove(150, 112, 15, 1.4, true);

  // caixa do relógio (moldura dourada)
  const bz = ctx.createRadialGradient(-40, -50, 10, 0, 0, 125);
  bz.addColorStop(0, fl ? '#fff4c8' : '#f6d77e'); bz.addColorStop(0.7, fl ? '#f0c870' : '#c99a3a'); bz.addColorStop(1, fl ? '#d8a850' : '#8a5f18');
  ink(8); circle(0, 0, 117, bz);
  ctx.strokeStyle = 'rgba(90,50,0,.55)'; ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 108, Math.sin(a) * 108, 3, 0, TAU); ctx.stroke(); }
  // mostrador
  const dg = ctx.createRadialGradient(-20, -20, 10, 0, 0, 100); dg.addColorStop(0, '#fffaf0'); dg.addColorStop(1, '#eadcb8');
  ink(5); circle(0, 0, 98, dg);
  ctx.strokeStyle = INK;
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU, r1 = i % 5 ? 92 : 86; ctx.lineWidth = i % 5 ? 1.2 : 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * 96, Math.sin(a) * 96); ctx.stroke(); }
  ctx.fillStyle = INK; ctx.font = `17px ${FONT_TITLE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const nums = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 12; i++) { if (i >= 8 && i <= 10) continue; if (i >= 2 && i <= 4) continue; const a = -Math.PI / 2 + (i / 12) * TAU; ctx.fillText(nums[i], Math.cos(a) * 74, Math.sin(a) * 74); }

  // rosto
  const lx = this.lookX || 0, ly = this.lookY || 0, blink = (this.t % 3.3) > 3.16 ? 1 : 0;
  const lid = p === 1 ? 0.1 : 0.3;
  pieEye(-34, -26, 17, 22, lx, ly, blink, lid, '#f6efdc', 0.28); pieEye(32, -26, 17, 22, lx, ly, blink, lid, '#f6efdc', -0.28);
  // monóculo
  ink(4); ctx.beginPath(); ctx.arc(32, -26, 26, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#e0b04a'; ctx.stroke();
  ctx.beginPath(); ctx.arc(32, -26, 22, 3.6, 4.4); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke();
  ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(56, -16); ctx.quadraticCurveTo(80, 30, 66, 70); ctx.lineWidth = 2.5; ctx.strokeStyle = '#a07a20'; ctx.stroke(); ctx.setLineDash([]);
  if (p === 1) { brow(-58, -60, -16, -58, 8); brow(12, -60, 56, -62, 8); }
  else { brow(-60, -64, -14, -48, 9); brow(10, -48, 58, -66, 9); }
  // boca e bigode
  const open = w * 12 + (p === 3 ? 6 : 0) + (this.dead ? 14 : 0);
  if (open > 2) { ink(4); ellipse(0, 50, 18, open, 0, '#3b120c'); }
  else { ink(4.5); ctx.beginPath(); ctx.arc(0, p === 1 ? 44 : 60, 14, p === 1 ? 0.3 : Math.PI + 0.4, p === 1 ? Math.PI - 0.3 : TAU - 0.4); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, 22);
  ctx.bezierCurveTo(-22, 8, -52, 44, -76, 20); ctx.bezierCurveTo(-78, 12, -70, 8, -66, 14);
  ctx.bezierCurveTo(-54, 40, -24, 30, 0, 32);
  ctx.bezierCurveTo(24, 30, 54, 40, 66, 14); ctx.bezierCurveTo(70, 8, 78, 12, 76, 20);
  ctx.bezierCurveTo(52, 44, 22, 8, 0, 22);
  ctx.fillStyle = '#2a1d14'; ctx.fill(); ink(2.5); ctx.stroke();
  shine(-30, 22, 10, 2.5, 0.3, 0.35); shine(30, 22, 10, 2.5, -0.3, 0.35);
  // ponteiros (nariz)
  const hand = (ang, len, wdt) => {
    ctx.save(); ctx.rotate(ang); ctx.beginPath();
    ctx.moveTo(-wdt * 0.5, 8); ctx.lineTo(-wdt * 0.5, -len + 14); ctx.lineTo(-wdt * 1.6, -len + 12); ctx.lineTo(0, -len); ctx.lineTo(wdt * 1.6, -len + 12); ctx.lineTo(wdt * 0.5, -len + 14); ctx.lineTo(wdt * 0.5, 8); ctx.closePath();
    ctx.fillStyle = '#2a1d14'; ctx.fill(); ink(1.5); ctx.stroke(); ctx.restore();
  };
  hand(this.hand * 0.2, 48, 6); hand(this.hand * 2, 76, 4);
  ink(3); circle(0, 0, 9, '#c8352b'); shine(-3, -3, 2.5, 1.6);
  // vidro: reflexo e rachaduras
  ctx.beginPath(); ctx.arc(0, 0, 90, 3.5, 4.5); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 76, 3.7, 4.2); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
  if (p === 3) { crack(70, -50, 50, 2.6, 1); crack(70, -50, 36, 2.0, 3); crack(-60, 64, 40, -0.8, 6); }

  // coroa
  ctx.save(); ctx.translate(0, -102); ctx.rotate(Math.sin(this.t * 2) * 0.04);
  const crown = () => { ctx.moveTo(-62, 4); ctx.lineTo(-74, -64); ctx.lineTo(-38, -32); ctx.lineTo(0, -78); ctx.lineTo(38, -32); ctx.lineTo(74, -64); ctx.lineTo(62, 4); ctx.closePath(); };
  shape(crown, '#ffd84a', 5, 'rgba(120,70,0,.4)', -9, 0);
  ink(4); rrect(-66, -10, 132, 18, 6, '#fffaf0'); ctx.fillStyle = INK; for (let i = -54; i <= 54; i += 18) { ctx.beginPath(); ctx.ellipse(i, -1, 2, 4, 0, 0, TAU); ctx.fill(); }
  for (const [x, y, c] of [[-74, -64, '#c8352b'], [0, -78, '#3a7bd5'], [74, -64, '#c8352b']]) { ink(3); circle(x, y, 8, c); shine(x - 2, y - 3, 2.5, 1.5); }
  ink(2.5); ellipse(0, -30, 7, 10, 0, '#2fa36b'); shine(-2, -34, 2, 3, 0);
  ctx.restore();
  // porta do cuco
  if (this.door > 0) {
    const d = Math.min(1, this.door * 2); ctx.save(); ctx.translate(112, 112);
    ink(4); rrect(-24, -232, 48, 46, 5, '#3b2416'); ctx.beginPath(); ctx.moveTo(-32, -230); ctx.lineTo(0, -254); ctx.lineTo(32, -230); ctx.closePath(); ctx.fillStyle = '#7a1f2a'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(0, -208 + (1 - d) * 22);
    ink(3); circle(0, 0, 15, '#8fc0b0'); shine(-5, -6, 4, 2.5);
    pieEye(-4, -3, 4, 5, -1, 0); ctx.beginPath(); ctx.moveTo(-12, -1); ctx.lineTo(-26, 3); ctx.lineTo(-12, 7); ctx.closePath(); ctx.fillStyle = '#f2a33a'; ctx.fill(); ctx.stroke();
    ctx.restore(); ctx.restore();
  }
  ctx.restore();
};
