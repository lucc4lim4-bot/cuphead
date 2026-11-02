'use strict';
// ===== Arte dos heróis jogáveis: Fósforo e Candela =====

const HEROES = {
  fosforo: {
    name: 'Fósforo', tag: 'O palito destemido',
    weapon: 'Faíscas', desc: 'Tiro rápido e reto, de longo alcance.',
    flame: ['#d8341c', '#ff8a1e', '#ffe56a'], shoe: '#3b2416',
  },
  candela: {
    name: 'Candela', tag: 'A velinha valente',
    weapon: 'Leque de Cera', desc: 'Três gotas em leque: alcance curto, dano alto de perto.',
    flame: ['#2a6fd0', '#6fd3ff', '#effcff'], shoe: '#3a1f4a',
  },
};

function drawFlame(x, y, s, t, pal, outline = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const w = Math.sin(t * 21) * 2.2, h = Math.sin(t * 16.5) * 3;
  const layers = [[1, pal[0]], [0.7, pal[1]], [0.4, pal[2]]];
  layers.forEach(([k, c], i) => {
    ctx.save(); ctx.translate(0, (1 - k) * 6); ctx.scale(k, k);
    ctx.beginPath(); ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-13, 4, -11, -9, w * (1 + i * 0.3), -26 - h);
    ctx.bezierCurveTo(4, -16, 6, -18, 8, -20 + h * 0.4);
    ctx.bezierCurveTo(14, -6, 12, 4, 0, 8);
    ctx.fillStyle = c; ctx.fill();
    if (i === 0 && outline) { ctx.lineWidth = 2.5 / k; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.restore();
  });
  ctx.restore();
}

// Calcula a pose comum (pernas, inclinação, respiração)
function heroPose(o) {
  const t = o.t || 0, ph = t * 14;
  let l1 = { x: -7, y: 0 }, l2 = { x: 7, y: 0 };
  if (o.run) { l1 = { x: -3 + Math.sin(ph) * 14, y: -Math.max(0, Math.cos(ph)) * 8 }; l2 = { x: 3 - Math.sin(ph) * 14, y: -Math.max(0, -Math.cos(ph)) * 8 }; }
  if (o.air) { l1 = { x: -11, y: -9 }; l2 = { x: 10, y: -14 }; }
  if (o.dance) { const d = Math.sin(ph * 0.5); l1 = { x: -11 + d * 6, y: -Math.max(0, d) * 11 }; l2 = { x: 11 + d * 6, y: -Math.max(0, -d) * 11 }; }
  if (o.duck) { l1 = { x: -13, y: 0 }; l2 = { x: 12, y: 0 }; }
  return { ph, l1, l2, bob: o.run ? -Math.abs(Math.sin(ph)) * 3 : o.dance ? -Math.abs(Math.sin(ph * 0.5)) * 4 : 0 };
}

function drawHero(type, x, y, o = {}) {
  const f = o.facing || 1, t = o.t || 0, sc = o.scale || 1, H = HEROES[type] || HEROES.fosforo;
  ctx.save(); ctx.translate(x, y); ctx.scale(f * sc, sc);
  if (o.ghost) ctx.globalAlpha = 0.55;
  let sx = 1, sy = 1;
  if (o.land) { sy -= o.land * 0.18; sx += o.land * 0.14; }
  if (o.air) { sy += 0.05; sx -= 0.03; }
  if (o.dash) { sx += 0.2; sy -= 0.1; }
  if (!o.run && !o.air && !o.dash && !o.duck && !o.dance) { const br = Math.sin(t * 4) * 0.025; sy += br; sx -= br * 0.6; }
  ctx.scale(sx, sy);
  const P = heroPose(o);
  const hipY = o.duck ? -15 : -24;

  // pernas e sapatos
  const legCol = INK;
  hose(-4, hipY + 2, P.l1.x, P.l1.y - 5, 5, 6, legCol); hose(4, hipY + 2, P.l2.x, P.l2.y - 5, -5, 6, legCol);
  if (type === 'candela') { for (const l of [P.l1, P.l2]) { ink(2); ellipse(l.x, l.y - 7, 4.5, 3, 0, '#fffaf0'); } }
  shoe(P.l1.x - 3, P.l1.y, 1, 8.5, H.shoe); shoe(P.l2.x - 3, P.l2.y, 1, 8.5, H.shoe);
  if (type === 'candela') { ink(2); for (const l of [P.l1, P.l2]) { ctx.beginPath(); ctx.moveTo(l.x - 4, l.y - 9); ctx.lineTo(l.x + 6, l.y - 9); ctx.stroke(); } }

  ctx.save();
  ctx.translate(0, hipY + P.bob); ctx.rotate(o.run ? 0.1 : o.dash ? 0.22 : 0); ctx.translate(0, -hipY);
  const sh = type === 'candela' ? drawCandelaBody(o, hipY, P, H) : drawFosforoBody(o, hipY, P, H);
  ctx.restore();
  ctx.restore();
  return sh;
}

// braço com luva; mão aponta a mira ao atirar
function heroArm(sh, o, P, front) {
  const aim = o.aim || { x: 1, y: 0 };
  let ax = Math.abs(aim.x), ay = aim.y; if (ax < 0.01 && Math.abs(ay) < 0.01) ax = 1;
  let hand, fist = false;
  if (!front) {
    const sw = o.run ? Math.sin(P.ph + Math.PI) * 10 : 0;
    hand = o.dance ? { x: sh.x - 16, y: sh.y - 12 - Math.sin(P.ph * 0.5) * 8 } : { x: sh.x - 14 - sw * 0.4, y: sh.y + 16 + Math.abs(sw) * 0.2 };
    if (o.air) hand = { x: sh.x - 16, y: sh.y - 8 };
    fist = true;
  } else if (o.shooting || o.superT > 0) { hand = { x: sh.x + ax * 23, y: sh.y + ay * 23 }; }
  else if (o.parry) { hand = { x: sh.x + 4, y: sh.y - 26 }; }
  else if (o.dance) { hand = { x: sh.x + 15, y: sh.y - 14 + Math.sin(P.ph * 0.5) * 8 }; }
  else if (o.air) { hand = { x: sh.x + 16, y: sh.y - 10 }; }
  else { const sw = o.run ? Math.sin(P.ph) * 10 : 0; hand = { x: sh.x + 15 + sw * 0.5, y: sh.y + 15 }; fist = true; }
  hose(sh.x, sh.y, hand.x, hand.y, front ? 4 : -5, 5);
  glove(hand.x, hand.y, 7, Math.atan2(hand.y - sh.y, hand.x - sh.x), fist && !o.shooting);
  if (front && (o.shooting || o.superT > 0) && Math.floor((o.t || 0) * 20) % 2) {
    // clarão na ponta do dedo
    ctx.save(); ctx.translate(hand.x + ax * 12, hand.y + ay * 12); star(0, 0, 8, '#fff1a8'); ctx.restore();
  }
}

function drawFosforoBody(o, hipY, P, H) {
  const t = o.t || 0;
  const bodyH = o.duck ? 14 : 28, topY = hipY - bodyH;
  const sh = { x: 5, y: topY + 9 };
  heroArm({ x: -4, y: sh.y }, o, P, false);
  // corpo-palito de madeira
  shape(pRRect(-7.5, topY, 15, bodyH + 8, 6), '#ebc183', 3.5, 'rgba(110,60,20,.3)', -5, 0);
  ctx.strokeStyle = 'rgba(130,80,35,.55)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-2.5, topY + 5); ctx.quadraticCurveTo(-1, topY + bodyH * 0.5, -2.5, topY + bodyH); ctx.moveTo(2, topY + 8); ctx.lineTo(2, topY + bodyH * 0.6); ctx.stroke();
  // calção com suspensórios
  shape(pRRect(-12.5, hipY - 10, 25, 15, 5), '#b8322a', 3, 'rgba(60,5,5,.35)', -5, -4);
  ink(3); ctx.strokeStyle = '#7a1c15'; ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.moveTo(-6, hipY - 9); ctx.lineTo(-4, topY + 4); ctx.moveTo(6, hipY - 9); ctx.lineTo(5, topY + 4); ctx.stroke();
  for (const bx of [-6, 6]) { ink(1.5); circle(bx, hipY - 5, 2.4, '#ffd98a'); }
  // cabeça (pólvora)
  const hx = 3, hy = topY - 17 + (o.dance ? Math.sin(P.ph) * 1.5 : 0);
  const headCol = o.hurt ? '#ffffff' : '#c7362b';
  shape(pEllipse(hx, hy, 21, 20), headCol, 4.5, 'rgba(80,5,0,.38)', -8, -7);
  shine(hx - 8, hy - 10, 6, 3.5, -0.6, 0.55); shine(hx - 13, hy - 4, 1.8, 1.8, 0, 0.5);
  ctx.fillStyle = 'rgba(90,10,5,.45)'; for (const [dx, dy] of [[10, -12], [-12, 6], [14, 8]]) { ctx.beginPath(); ctx.arc(hx + dx, hy + dy, 1.4, 0, TAU); ctx.fill(); }
  // chama
  const fs = 1 + (o.shooting ? 0.3 : 0) + (o.superT > 0 ? 0.9 : 0) + (o.parry ? 0.4 : 0);
  drawFlame(hx - 4, hy - 17, fs, t, H.flame);
  // rosto
  const blink = (t % 3.2) > 3.05 ? 1 : 0;
  const ly = o.aim && o.aim.y < -0.3 ? -1 : o.aim && o.aim.y > 0.3 ? 1 : 0;
  pieEye(hx + 4, hy - 3, 5.5, 8.5, 1, ly, blink); pieEye(hx + 15, hy - 3, 5.5, 8.5, 1, ly, blink);
  ink(2.5); ctx.beginPath();
  const brow = o.shooting ? 3 : 0;
  ctx.moveTo(hx, hy - 14 + brow * 0.3); ctx.quadraticCurveTo(hx + 4, hy - 16, hx + 8, hy - 13 + brow);
  ctx.moveTo(hx + 12, hy - 13 + brow); ctx.quadraticCurveTo(hx + 16, hy - 16, hx + 20, hy - 14 + brow * 0.3); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(hx + 4, hy + 8, 4, 2.5, 0, 0, TAU); ctx.fillStyle = 'rgba(255,150,150,.5)'; ctx.fill();
  ink(3);
  if (o.hurt) { ellipse(hx + 12, hy + 10, 4, 5, 0, '#3b0d08'); }
  else if (o.shooting || o.dance) {
    ctx.beginPath(); ctx.moveTo(hx + 4, hy + 5); ctx.quadraticCurveTo(hx + 12, hy + 6, hx + 19, hy + 3); ctx.quadraticCurveTo(hx + 15, hy + 16, hx + 6, hy + 11); ctx.closePath();
    ctx.fillStyle = '#3b0d08'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hx + 11, hy + 11, 3.5, 2, 0, 0, TAU); ctx.fillStyle = '#ff7a7a'; ctx.fill();
  } else { ctx.beginPath(); ctx.arc(hx + 11, hy + 3, 7, 0.35, Math.PI - 0.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx + 17, hy + 6); ctx.lineTo(hx + 19, hy + 4); ctx.stroke(); }
  ink(2); circle(hx + 20, hy + 2, 3.3, '#8e1f18'); shine(hx + 19, hy + 1, 1.2, 0.8, 0, 0.7);
  heroArm(sh, o, P, true);
  if (o.parry) { ctx.save(); ctx.globalAlpha *= 0.7; star(hx, hy - 6, 30, 'rgba(255,95,168,.45)'); ctx.restore(); }
  return sh;
}

function drawCandelaBody(o, hipY, P, H) {
  const t = o.t || 0;
  const ch = o.duck ? 40 : 58, top = hipY + 4 - ch;
  const sh = { x: 6, y: top + 30 };
  heroArm({ x: -4, y: sh.y }, o, P, false);
  // vela (corpo e rosto)
  const wax = o.hurt ? '#ffffff' : '#8fb8e6';
  shape(pRRect(-15, top, 30, ch, 9), wax, 4, 'rgba(20,40,90,.3)', -7, -2);
  // cera derretida escorrendo
  ctx.beginPath(); ctx.moveTo(-15, top + 9);
  ctx.quadraticCurveTo(-15, top, -6, top);
  ctx.lineTo(8, top); ctx.quadraticCurveTo(15, top, 15, top + 9);
  ctx.lineTo(15, top + 16); ctx.quadraticCurveTo(12, top + 21, 10, top + 15);
  ctx.lineTo(8, top + 10); ctx.quadraticCurveTo(5, top + 25, 1, top + 12);
  ctx.quadraticCurveTo(-3, top + 9, -6, top + 13); ctx.quadraticCurveTo(-10, top + 19, -12, top + 11); ctx.closePath();
  ctx.fillStyle = '#d6e9fb'; ctx.fill(); ink(2.5); ctx.stroke();
  shine(-8, top + 22, 2.5, 9, 0, 0.45);
  // saia
  const sk = hipY - 12;
  const skirt = () => { ctx.moveTo(-15, sk); ctx.lineTo(15, sk); ctx.lineTo(21, hipY + 4); ctx.quadraticCurveTo(0, hipY + 9, -21, hipY + 4); ctx.closePath(); };
  shape(skirt, '#d0445e', 3, 'rgba(70,0,20,.3)', -6, -3);
  ctx.strokeStyle = 'rgba(70,0,20,.5)'; ctx.lineWidth = 1.5; for (const px of [-9, -2, 5, 12]) { ctx.beginPath(); ctx.moveTo(px, sk + 2); ctx.lineTo(px * 1.3, hipY + 4); ctx.stroke(); }
  ink(1.5); for (let i = -12; i <= 12; i += 6) circle(i, sk + 1, 1.8, '#fffaf0');
  // pavio e chama
  ink(3); ctx.beginPath(); ctx.moveTo(1, top + 1); ctx.quadraticCurveTo(3, top - 5, 1, top - 9); ctx.stroke();
  const fs = 1 + (o.shooting ? 0.3 : 0) + (o.superT > 0 ? 0.9 : 0) + (o.parry ? 0.4 : 0);
  drawFlame(1, top - 11, fs, t + 0.5, H.flame);
  // laço
  ctx.save(); ctx.translate(-12, top + 6); ctx.rotate(-0.4);
  ink(2.5);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-11, -8); ctx.lineTo(-11, 8); ctx.closePath(); ctx.fillStyle = '#d0445e'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, -8); ctx.lineTo(11, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  circle(0, 0, 3.5, '#ff7a90');
  ctx.restore();
  // rosto
  const fy = top + 24, blink = (t % 3.5) > 3.36 ? 1 : 0;
  const ly = o.aim && o.aim.y < -0.3 ? -1 : o.aim && o.aim.y > 0.3 ? 1 : 0;
  pieEye(1, fy, 5, 8, 1, ly, blink); pieEye(11, fy, 5, 8, 1, ly, blink);
  if (!blink) { ink(1.6); for (const ex of [1, 11]) { ctx.beginPath(); ctx.moveTo(ex + 3, fy - 7); ctx.lineTo(ex + 6, fy - 10); ctx.moveTo(ex + 4.5, fy - 5); ctx.lineTo(ex + 8, fy - 7); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(255,120,150,.45)'; ctx.beginPath(); ctx.ellipse(-4, fy + 9, 4, 2.5, 0, 0, TAU); ctx.ellipse(14, fy + 9, 3.5, 2.5, 0, 0, TAU); ctx.fill();
  ink(2.5);
  if (o.hurt) ellipse(7, fy + 13, 3.5, 4.5, 0, '#3b0d20');
  else if (o.shooting || o.dance) { ctx.beginPath(); ctx.moveTo(1, fy + 10); ctx.quadraticCurveTo(7, fy + 20, 13, fy + 10); ctx.closePath(); ctx.fillStyle = '#3b0d20'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(7, fy + 14.5, 2.5, 1.5, 0, 0, TAU); ctx.fillStyle = '#ff7a90'; ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(7, fy + 8, 5, 0.4, Math.PI - 0.4); ctx.stroke(); }
  heroArm(sh, o, P, true);
  if (o.parry) { ctx.save(); ctx.globalAlpha *= 0.7; star(0, top + 10, 30, 'rgba(255,95,168,.45)'); ctx.restore(); }
  return sh;
}

// compatibilidade com as telas
function drawFosforo(x, y, o = {}) { return drawHero('fosforo', x, y, o); }

function drawHeart(x, y, r, t) {
  const s = 1 + Math.sin(t * 8) * 0.08;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.9);
  ctx.fillStyle = PINK; ctx.fill(); ink(3); ctx.stroke();
  shine(-r * 0.45, -r * 0.4, r * 0.25, r * 0.15, -0.6, 0.7);
  ctx.restore();
}
