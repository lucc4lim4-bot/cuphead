'use strict';
// ===== Loja do Seu Lampião: moedas, armas e amuletos =====

const ITEMS = [
  { id: 'w_homing', type: 'weapon', name: 'Rajada Teleguiada', price: 4, desc: 'Faíscas que perseguem o chefão. Dano menor, mas quase nunca erram.' },
  { id: 'w_twin', type: 'weapon', name: 'Tiro Duplo', price: 5, desc: 'Duas faíscas paralelas de uma vez. Ótimo contra alvos grandes.' },
  { id: 'w_bomb', type: 'weapon', name: 'Bombinha', price: 5, desc: 'Bombas em arco que explodem com muito dano. Mais lentas de atirar.' },
  { id: 'c_heart', type: 'charm', name: 'Coração Extra', price: 3, desc: '+1 PV no começo de cada luta. Em troca, o tiro fica 5% mais fraco.' },
  { id: 'c_coffee', type: 'charm', name: 'Cafezinho', price: 3, desc: 'O medidor de chamas enche sozinho, devagarinho, durante a luta.' },
  { id: 'c_smoke', type: 'charm', name: 'Bomba de Fumaça', price: 4, desc: 'O dash vira fumaça: você fica invencível enquanto ele dura!' },
  { id: 'c_magnet', type: 'charm', name: 'Ímã Rosa', price: 2, desc: 'Rebater fica mais fácil: mais alcance e mais tempo para acertar.' },
  { id: 'c_bubble', type: 'charm', name: 'Bolha Protetora', price: 5, desc: 'Uma bolha absorve 1 golpe. Ela volta depois de 25 segundos.' },
  { id: 'c_spring', type: 'charm', name: 'Sapato de Mola', price: 4, desc: 'Pulo duplo! O segundo pulo também serve para rebater rosa.' },
];
const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

// ---------- Moedas e equipamento salvos ----------
(function initShopSave() {
  const d = Save.data;
  if (typeof d.coins !== 'number') d.coins = 4 + 2 * Object.keys(d.grades || {}).length; // presente de boas-vindas
  d.owned = d.owned || [];
  d.loadout = d.loadout || {};
  for (const h of ['fosforo', 'candela']) d.loadout[h] = Object.assign({ weapon: null, charm: null }, d.loadout[h] || {});
  Save.write();
})();
const loadoutOf = (hero) => Save.data.loadout[hero] || { weapon: null, charm: null };
const owns = (id) => Save.data.owned.includes(id);

function coinsForWin(grade, diffId, firstClear) {
  let n = diffId === 'easy' ? 1 : 2;
  if (firstClear) n += 3;
  if (GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf('A-')) n += 1;
  if (grade === 'S') n += 1;
  if (diffId === 'hard') n += 1;
  if (diffId === 'nightmare') n += 2;
  return n;
}
function addCoins(n) { Save.data.coins += n; Save.write(); }

// ---------- Ícones ----------
function drawCoin(x, y, r = 10, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.abs(Math.cos(t * 2)) * 0.25 + 0.75, 1);
  ink(Math.max(2, r * 0.22)); circle(0, 0, r, '#f2c14a');
  ctx.strokeStyle = 'rgba(140,90,10,.7)'; ctx.lineWidth = Math.max(1, r * 0.14); circle(0, 0, r * 0.68, null);
  ctx.fillStyle = '#a8701a'; ctx.font = `${Math.round(r * 1.05)}px ${FONT_TITLE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1);
  shine(-r * 0.35, -r * 0.4, r * 0.25, r * 0.14, -0.6, 0.8);
  ctx.restore();
}

function drawItemIcon(id, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const fire = ['#d8341c', '#ff8a1e', '#ffe56a'];
  switch (id) {
    case 'w_homing': {
      ctx.setLineDash([5, 5]); ink(3); ctx.beginPath(); ctx.moveTo(-26, 16); ctx.bezierCurveTo(-20, -24, 14, -22, 18, 4); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(18, 4); ctx.rotate(1.4); drawFlame(0, 8, 0.8, t, fire); ctx.restore();
      ink(3); circle(-26, 16, 7, '#c8352b'); circle(-26, 16, 3, '#fffaf0');
      break;
    }
    case 'w_twin': {
      for (const dy of [-10, 10]) { ctx.save(); ctx.translate(0, dy); ctx.rotate(Math.PI / 2); drawFlame(0, 10, 0.75, t + dy, fire); ctx.restore(); }
      ctx.strokeStyle = 'rgba(26,20,16,.5)'; ctx.lineWidth = 2; for (const dy of [-10, 10]) { ctx.beginPath(); ctx.moveTo(-28, dy); ctx.lineTo(-16, dy); ctx.stroke(); }
      break;
    }
    case 'w_bomb': {
      ink(4); circle(0, 4, 20, '#2a2422'); shine(-7, -4, 6, 4, -0.6, 0.5);
      ink(3); rrect(-6, -20, 12, 8, 2, '#5a5450');
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(8, -32, 16, -28); ctx.stroke();
      star(16, -28, 7 + Math.sin(t * 20) * 2, '#ffd84a');
      break;
    }
    case 'c_heart': {
      ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-30, -2, -16, -26, 0, -10); ctx.bezierCurveTo(16, -26, 30, -2, 0, 20);
      ctx.fillStyle = '#d8342c'; ctx.fill(); ink(4); ctx.stroke(); shine(-10, -8, 5, 3, -0.6, 0.7);
      outlinedText('+1', 18, 16, 16, '#ffd84a', FONT_TITLE, 'center', 4);
      break;
    }
    case 'c_coffee': {
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 8, -12); ctx.bezierCurveTo(i * 8 - 6, -18 - Math.sin(t * 4 + i) * 3, i * 8 + 6, -24, i * 8, -32); ctx.strokeStyle = 'rgba(26,20,16,.45)'; ctx.lineWidth = 2.5; ctx.stroke(); }
      ink(4); ctx.beginPath(); ctx.moveTo(-18, -10); ctx.lineTo(16, -10); ctx.lineTo(12, 18); ctx.quadraticCurveTo(0, 24, -14, 18); ctx.closePath(); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(19, 2, 7, -1.4, 1.4); ctx.stroke();
      ctx.fillStyle = '#6b3b1c'; ctx.beginPath(); ctx.ellipse(-1, -9, 16, 3, 0, 0, TAU); ctx.fill();
      ink(2); ellipse(0, 22, 24, 4, 0, '#e9d6a8');
      break;
    }
    case 'c_smoke': {
      ink(3);
      for (const [px, py, r] of [[-12, 6, 13], [10, 6, 13], [0, -6, 15]]) circle(px + Math.sin(t * 3 + px) * 1.5, py, r, '#c9c4bb');
      ctx.fillStyle = '#c9c4bb'; ctx.beginPath(); ctx.arc(-12, 6, 11, 0, TAU); ctx.arc(10, 6, 11, 0, TAU); ctx.arc(0, -6, 13, 0, TAU); ctx.fill();
      star(16, -14, 8, '#ffd84a');
      break;
    }
    case 'c_magnet': {
      ctx.rotate(-0.3);
      ctx.beginPath(); ctx.arc(0, 0, 18, Math.PI, 0); ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = PINK; ctx.stroke();
      ink(3); for (const sx of [-18, 18]) { rrect(sx - 8, -1, 16, 16, 2, '#e8e2d6'); }
      ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-18, 2); ctx.moveTo(18, 0); ctx.lineTo(18, 2); ctx.stroke();
      ctx.rotate(0.3);
      ctx.strokeStyle = PINK; ctx.lineWidth = 2.5; for (const k of [0, 1]) { ctx.beginPath(); ctx.arc(0, 26, 6 + k * 6 + (t * 8) % 6, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
      break;
    }
    case 'c_bubble': {
      ctx.fillStyle = 'rgba(160,210,255,.35)'; ctx.beginPath(); ctx.arc(0, 0, 22 + Math.sin(t * 3) * 1.5, 0, TAU); ctx.fill();
      ink(3); circle(0, 0, 22 + Math.sin(t * 3) * 1.5, null);
      shine(-8, -9, 7, 4, -0.6, 0.8); shine(9, 9, 2.5, 2.5, 0, 0.6);
      break;
    }
    case 'c_spring': {
      ink(3); ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo(i % 2 ? 9 : -9, 20 - i * 4 - Math.sin(t * 6) * 2); ctx.lineWidth = 4; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = '#c9c9c9'; ctx.stroke();
      shoe(-4, -4, 1, 11, '#3b2416');
      break;
    }
    default: circle(0, 0, 14, '#ccc');
  }
  ctx.restore();
}

// ---------- O lojista: Seu Lampião ----------
function drawShopkeeper(x, y, t, talk = 0, happy = 0) {
  ctx.save(); ctx.translate(x, y);
  const sway = Math.sin(t * 1.6) * 0.04; ctx.rotate(sway);
  const br = 1 + Math.sin(t * 3) * 0.015 + happy * 0.04; ctx.scale(1 / br, br);
  // base de latão (corpo)
  shape(pEllipse(0, -40, 70, 46), '#c9933a', 6, 'rgba(90,50,0,.4)', -12, -6);
  ctx.strokeStyle = 'rgba(90,50,0,.45)'; ctx.lineWidth = 3; for (const yy of [-56, -24]) { ctx.beginPath(); ctx.ellipse(0, yy, 62, 10, 0, 0.15, Math.PI - 0.15); ctx.stroke(); }
  shine(-30, -62, 16, 6, -0.4, 0.55);
  // botão de ajuste do pavio
  ink(4); ctx.beginPath(); ctx.moveTo(62, -66); ctx.lineTo(84, -70); ctx.stroke(); circle(88, -70, 8, '#e0b04a');
  // braços e luvas
  const wv = Math.sin(t * 2.4) * 6 + happy * 10;
  hose(-62, -50, -98, -86 - wv, -12, 10); glove(-100, -88 - wv, 15, -2.2, false);
  hose(60, -40, 96, -16, 10, 10); glove(98, -14, 15, 0.4, true);
  // gola e chaminé de vidro (cabeça)
  ink(5); rrect(-40, -96, 80, 18, 6, '#a8701a');
  const glass = () => { ctx.moveTo(-34, -96); ctx.bezierCurveTo(-62, -140, -54, -196, -26, -214); ctx.lineTo(26, -214); ctx.bezierCurveTo(54, -196, 62, -140, 34, -96); ctx.closePath(); };
  ctx.save(); ctx.globalAlpha = 0.9; shape(glass, '#f6ecd0', 5, 'rgba(120,90,40,.2)', -10, 0); ctx.restore();
  shine(-30, -160, 6, 30, 0.1, 0.55);
  // chama interna
  drawFlame(0, -170, 1.4, t, ['#d8341c', '#ff8a1e', '#ffe56a'], true, Math.sin(t * 1.3) * 0.15);
  // rosto no vidro
  const blink = (t % 4.2) > 4.05 ? 1 : 0;
  pieEye(-17, -134, 10, 14, 0.3, 0, blink); pieEye(15, -134, 10, 14, 0.3, 0, blink);
  ink(4); ctx.beginPath(); ctx.moveTo(-30, -156); ctx.quadraticCurveTo(-18, -164, -6, -154); ctx.moveTo(4, -154); ctx.quadraticCurveTo(16, -164, 28, -156); ctx.stroke();
  // bigodão
  ctx.beginPath(); ctx.moveTo(0, -112);
  ctx.bezierCurveTo(-14, -122, -36, -100, -46, -116); ctx.bezierCurveTo(-48, -122, -40, -126, -38, -120);
  ctx.bezierCurveTo(-30, -100, -12, -104, 0, -106);
  ctx.bezierCurveTo(12, -104, 30, -100, 38, -120); ctx.bezierCurveTo(40, -126, 48, -122, 46, -116);
  ctx.bezierCurveTo(36, -100, 14, -122, 0, -112);
  ctx.fillStyle = '#2a1d14'; ctx.fill(); ink(2); ctx.stroke();
  const mo = 2 + talk * (4 + Math.abs(Math.sin(t * 22)) * 7) + happy * 6;
  ink(3); ellipse(0, -98, 9, mo, 0, '#5a1515');
  ctx.fillStyle = 'rgba(255,120,120,.45)'; ctx.beginPath(); ctx.ellipse(-34, -118, 7, 4, 0, 0, TAU); ctx.ellipse(32, -118, 7, 4, 0, 0, TAU); ctx.fill();
  // tampa da chaminé
  ink(5); rrect(-30, -226, 60, 14, 5, '#a8701a');
  ctx.restore();
}

function speechBubble(x, y, w, text, tail = 'left') {
  ctx.font = `15px ${FONT_TEXT}`;
  const words = text.split(' '); const lines = []; let line = '';
  for (const wd of words) { const tst = line ? line + ' ' + wd : wd; if (ctx.measureText(tst).width > w - 28 && line) { lines.push(line); line = wd; } else line = tst; }
  if (line) lines.push(line);
  const h = 20 + lines.length * 20;
  ink(4);
  ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.arcTo(x + w, y, x + w, y + h, 12); ctx.arcTo(x + w, y + h, x, y + h, 12);
  if (tail === 'left') { ctx.lineTo(x + 50, y + h); ctx.lineTo(x + 30, y + h + 22); ctx.lineTo(x + 34, y + h); }
  ctx.arcTo(x, y + h, x, y, 12); ctx.arcTo(x, y, x + w, y, 12); ctx.closePath();
  ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, x + 14, y + 11 + i * 20));
}

// ---------- Cena da loja ----------
class Shop {
  constructor() {
    this.t = 0; this.sel = 0; this.talk = 0; this.happy = 0; this.shake = 0;
    this.hero = Game.mode.chars[0] || 'fosforo';
    this.line = 'Bem-vindo ao Empório! Moedas brilhando? Então vamos negociar!';
    Music.play('shop');
  }
  say(txt) { this.line = txt; this.talk = 1.2; }
  update(dt) {
    this.t += dt; Particles.update(dt); this.talk = Math.max(0, this.talk - dt); this.happy = Math.max(0, this.happy - dt * 1.5); this.shake = Math.max(0, this.shake - dt * 3);
    const col = this.sel % 3, row = (this.sel / 3) | 0;
    let moved = false;
    if (pressed.left && col > 0) { this.sel--; moved = true; }
    if (pressed.right && col < 2) { this.sel++; moved = true; }
    if (pressed.up && row > 0) { this.sel -= 3; moved = true; }
    if (pressed.down && row < 2) { this.sel += 3; moved = true; }
    if (moved) { Snd.play('select'); const it = ITEMS[this.sel]; this.say(it.desc); }
    if (pressed.dash || pressed.ex) { this.hero = this.hero === 'fosforo' ? 'candela' : 'fosforo'; Snd.play('select'); this.say(`Equipando ${HEROES[this.hero].name} agora. Cada herói tem sua própria arma e amuleto!`); }
    if (backPressed()) { Snd.play('confirm'); Game.go(new MapScene(-1)); return; }
    if (pressed.jump || pressed.start || pressed.shoot) this.choose(ITEMS[this.sel]);
  }
  choose(it) {
    const lo = loadoutOf(this.hero), slot = it.type === 'weapon' ? 'weapon' : 'charm';
    if (!owns(it.id)) {
      if (Save.data.coins < it.price) { Snd.play('hurt'); this.shake = 1; this.say(`Ih, faltam ${it.price - Save.data.coins} moeda(s)! Vença mais chefões e volte aqui.`); return; }
      Save.data.coins -= it.price; Save.data.owned.push(it.id);
      lo[slot] = it.id; Save.write();
      Snd.play('win'); this.happy = 1; Particles.stars(this.cardPos(this.sel).x + 85, this.cardPos(this.sel).y + 45, 10, '#ffd84a');
      this.say(`Negócio fechado! ${it.name} já está equipado no ${HEROES[this.hero].name}.`);
      return;
    }
    if (lo[slot] === it.id) { lo[slot] = null; Snd.play('select'); this.say(slot === 'weapon' ? `${HEROES[this.hero].name} volta para a arma de sempre.` : 'Amuleto guardado no bolso.'); }
    else { lo[slot] = it.id; Snd.play('parry'); this.say(`${it.name} equipado no ${HEROES[this.hero].name}!`); }
    Save.write();
  }
  cardPos(i) { return { x: 398 + (i % 3) * 184, y: 104 + ((i / 3) | 0) * 126 }; }
  draw() {
    // parede e prateleiras
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a3420'); g.addColorStop(1, '#3a2014'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,220,170,.05)'; for (let x = 0; x < W; x += 48) ctx.fillRect(x, 0, 24, H);
    ctx.fillStyle = 'rgba(255,230,160,.12)'; ctx.beginPath(); ctx.arc(190, 150, 230, 0, TAU); ctx.fill();
    // placa
    ink(5); rrect(36, 14, 320, 58, 10, '#2f4a32');
    ctx.strokeStyle = '#e0b04a'; ctx.lineWidth = 2; rrect(44, 22, 304, 42, 7, null);
    outlinedText('Empório do Seu Lampião', 196, 44, 23, '#ffd84a', FONT_TITLE, 'center', 5);
    // lojista e balcão
    drawShopkeeper(190, 420, this.t, this.talk > 0 ? 1 : 0, this.happy);
    shape(pRRect(-10, 400, 380, 160, 10), '#7a4a26', 6, 'rgba(0,0,0,.35)', 0, -10);
    ctx.fillStyle = '#9c6234'; ctx.fillRect(-10, 400, 380, 16); ink(4); ctx.strokeRect(-10, 400, 380, 16);
    // balão de fala
    speechBubble(30, 86, 330, this.line);
    // moedas
    ink(4); rrect(36, 428, 150, 40, 10, '#fff6e0');
    drawCoin(62, 448, 13, this.t);
    outlinedText(`${Save.data.coins}`, 120, 449, 26, '#f2c14a', FONT_TITLE, 'center', 6);
    // herói equipando
    const lo = loadoutOf(this.hero);
    ink(4); rrect(196, 428, 166, 96, 10, '#fff6e0');
    ctx.save(); ctx.beginPath(); ctx.rect(198, 430, 60, 92); ctx.clip(); drawHero(this.hero, 228, 512, { scale: 0.95, t: this.t, dance: this.happy > 0 }); ctx.restore();
    ctx.font = `14px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(HEROES[this.hero].name, 262, 444);
    ctx.font = `11px ${FONT_TEXT}`;
    ctx.fillText('Arma:', 262, 466); ctx.fillText('Amuleto:', 262, 496);
    if (lo.weapon) drawItemIcon(lo.weapon, 344, 466, 0.42, this.t); else { ctx.fillText(this.hero === 'candela' ? 'Leque' : 'Faíscas', 300, 466); }
    if (lo.charm) drawItemIcon(lo.charm, 344, 496, 0.42, this.t); else ctx.fillText('nenhum', 318, 496);
    ctx.fillText('C: trocar', 262, 514);
    // prateleira de itens
    ITEMS.forEach((it, i) => {
      const p = this.cardPos(i), sel = i === this.sel, has = owns(it.id);
      const eq = lo.weapon === it.id || lo.charm === it.id;
      ctx.save(); ctx.translate(p.x + 85, p.y + 56);
      if (sel) { const k = 1.05 + Math.sin(this.t * 6) * 0.015; ctx.scale(k, k); ctx.rotate(Math.sin(this.t * 3) * 0.01); if (this.shake) ctx.translate(Math.sin(this.t * 60) * this.shake * 5, 0); }
      ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(-81, -50, 170, 112, 10, 'rgba(0,0,0,.35)', false);
      ink(sel ? 5 : 4); rrect(-85, -56, 170, 112, 10, eq ? '#ffe9b0' : has ? '#f2ead6' : PAPER);
      ctx.fillStyle = it.type === 'weapon' ? '#c8352b' : '#3a6fb0'; ctx.fillRect(-85 + 2, -54, 166, 6);
      ctx.font = `10px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(26,20,16,.6)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(it.type === 'weapon' ? 'ARMA' : 'AMULETO', -76, -40);
      drawItemIcon(it.id, 0, -10, 0.9, this.t + i);
      ctx.font = `14px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(it.name, 0, 26);
      if (eq) { ctx.font = `13px ${FONT_TITLE}`; ctx.fillStyle = '#2f8a4a'; ctx.fillText('★ EQUIPADO', 0, 44); }
      else if (has) { ctx.font = `13px ${FONT_TEXT}`; ctx.fillStyle = '#6a5a4a'; ctx.fillText('comprado · equipar', 0, 44); }
      else { drawCoin(-14, 44, 8, 0); ctx.font = `15px ${FONT_TITLE}`; ctx.fillStyle = Save.data.coins >= it.price ? INK : '#a33'; ctx.textAlign = 'left'; ctx.fillText(`${it.price}`, -2, 45); }
      if (sel) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -this.t * 30; rrect(-91, -62, 182, 124, 13, null); ctx.setLineDash([]); }
      ctx.restore();
    });
    Particles.draw();
    ctx.font = `13px ${FONT_TEXT}`; ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Setas: escolher · Z: comprar/equipar · C: trocar herói · Esc: voltar ao mapa', 664, 498);
  }
}
