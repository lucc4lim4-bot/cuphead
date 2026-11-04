'use strict';
// ===== Loja do Seu Lampião, inventário e economia de moedas =====

const ITEMS = [
  { id: 'w_homing', type: 'weapon', name: 'Rajada Teleguiada', price: 4, desc: 'Faíscas que perseguem o chefão. Dano menor, mas quase nunca erram.' },
  { id: 'w_twin', type: 'weapon', name: 'Tiro Duplo', price: 5, desc: 'Duas faíscas paralelas de uma vez. Ótimo contra alvos grandes.' },
  { id: 'w_fan', type: 'weapon', name: 'Leque de Cera', price: 4, desc: 'Três gotas em leque: curto alcance, dano alto de perto. A arma que era da Candela!' },
  { id: 'w_bomb', type: 'weapon', name: 'Bombinha', price: 5, desc: 'Bombas em arco que explodem com muito dano. Mais lentas de atirar.' },
  { id: 'c_heart', type: 'charm', name: 'Coração Extra', price: 3, desc: '+1 PV no começo de cada luta. Em troca, o tiro fica 5% mais fraco.' },
  { id: 'c_coffee', type: 'charm', name: 'Cafezinho', price: 3, desc: 'O medidor de chamas enche sozinho, devagarinho, durante a luta.' },
  { id: 'c_smoke', type: 'charm', name: 'Bomba de Fumaça', price: 4, desc: 'O dash vira fumaça: você fica invencível enquanto ele dura!' },
  { id: 'c_magnet', type: 'charm', name: 'Ímã Rosa', price: 2, desc: 'Rebater fica mais fácil: mais alcance e mais tempo para acertar.' },
  { id: 'c_bubble', type: 'charm', name: 'Bolha Protetora', price: 5, desc: 'Uma bolha absorve 1 golpe. Ela volta depois de 25 segundos.' },
  { id: 'c_spring', type: 'charm', name: 'Sapato de Mola', price: 4, desc: 'Um pulo extra (a Candela ganha o terceiro). No Fósforo, o pulo extra também rebate rosa.' },
];
const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const ITEM_TOTAL_COST = ITEMS.reduce((a, i) => a + i.price, 0);
const SHOP_SLOTS = 6;
// notas de 1 a 5 para comparar as armas no inventário
const WEAPON_STATS = {
  spark: { Dano: 3, Alcance: 5, Cadência: 4, Precisão: 3 },
  w_homing: { Dano: 2, Alcance: 4, Cadência: 4, Precisão: 5 },
  w_twin: { Dano: 3, Alcance: 5, Cadência: 4, Precisão: 4 },
  w_fan: { Dano: 5, Alcance: 1, Cadência: 4, Precisão: 4 },
  w_bomb: { Dano: 4, Alcance: 3, Cadência: 1, Precisão: 2 },
};

// ---------- Economia: moedas = ganhas − preço dos itens comprados ----------
const itemCost = (id) => (ITEM_BY_ID[id] ? ITEM_BY_ID[id].price : 0);
function recalcCoins() { const d = Save.data; d.coins = Math.max(0, (d.earned || 0) - (d.owned || []).reduce((a, id) => a + itemCost(id), 0)); }
function addCoins(n) { Save.data.earned = (Save.data.earned || 0) + n; recalcCoins(); Save.write(); }
const loadoutOf = (hero) => Save.data.loadout[hero] || { weapon: null, weapon2: null, charm: null };
const owns = (id) => Save.data.owned.includes(id);
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Moedas finitas e desenháveis: a 1ª vitória paga bem; repetir paga só 1 (sem fazenda de moedas)
function coinsForWin(grade, diffId, firstClear) {
  if (!firstClear) return 1;
  let n = 4;
  if (GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf('A-')) n += 1;
  if (grade === 'S') n += 1;
  if (diffId === 'hard') n += 1;
  if (diffId === 'nightmare') n += 2;
  return n;
}

// ---------- Loja rotativa (determinística: a ordem vem de uma semente do save) ----------
function initShop() {
  const d = Save.data;
  if (!d.shop || !Array.isArray(d.shop.queue)) {
    const seed = (Math.random() * 2147483647) | 0, rnd = mulberry32(seed);
    const ids = ITEMS.map((i) => i.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [ids[i], ids[j]] = [ids[j], ids[i]]; }
    // garante pelo menos 1 arma e 1 amuleto entre os primeiros a aparecer
    for (const type of ['weapon', 'charm']) {
      const first = ids.slice(0, SHOP_SLOTS);
      if (!first.some((id) => ITEM_BY_ID[id].type === type)) {
        const k = ids.findIndex((id, idx) => idx >= SHOP_SLOTS && ITEM_BY_ID[id].type === type);
        if (k > 0) [ids[SHOP_SLOTS - 1], ids[k]] = [ids[k], ids[SHOP_SLOTS - 1]];
      }
    }
    d.shop = { seed, queue: ids, slots: [], serial: 0 };
  }
}
function shopNext() {
  // próximo item que espera na fila (e ainda não foi obtido nem está à venda)
  const sh = Save.data.shop, shown = new Set(sh.slots.map((s) => s.id));
  const k = sh.queue.findIndex((id) => !owns(id) && !shown.has(id));
  return k < 0 ? null : sh.queue.splice(k, 1)[0];
}
function shopSanitize() {
  initShop();
  const sh = Save.data.shop;
  for (const it of ITEMS) if (!sh.queue.includes(it.id) && !sh.slots.some((s) => s && s.id === it.id) && !owns(it.id)) sh.queue.push(it.id); // itens novos
  sh.slots = sh.slots.filter((s) => s && !owns(s.id));          // o que foi comprado sai da vitrine
  sh.queue = sh.queue.filter((id) => !owns(id));
  while (sh.slots.length < SHOP_SLOTS) { const id = shopNext(); if (!id) break; sh.slots.push({ id, n: ++sh.serial }); }
}
// compra: o item sai e um novo, ainda não obtido, entra no lugar na hora
function shopBuy(id) {
  const sh = Save.data.shop, k = sh.slots.findIndex((s) => s.id === id);
  Save.data.owned.push(id); recalcCoins();
  sh.slots.splice(k, 1); const nid = shopNext();
  if (nid) sh.slots.splice(k, 0, { id: nid, n: ++sh.serial });
  Save.write(); return nid;
}
// novidade por progresso: a 1ª vitória em cada fase troca o item que está há mais tempo na vitrine
function shopRotateOldest() {
  const sh = Save.data.shop; if (!sh.slots.length || !sh.queue.length) return false;
  let k = 0; sh.slots.forEach((s, i) => { if (s.n < sh.slots[k].n) k = i; });
  const old = sh.slots[k].id, nid = shopNext(); if (!nid) return false;
  sh.slots[k] = { id: nid, n: ++sh.serial }; sh.queue.push(old); Save.write(); return true;
}
// chamado quando um save é carregado ou criado
function afterSlotLoad() {
  const d = Save.data;
  d.owned = d.owned || []; d.grades = d.grades || {}; d.gradeDiff = d.gradeDiff || {}; d.best = d.best || {}; d.rg = d.rg || {};
  if (typeof d.earned !== 'number') d.earned = (d.coins || 0) + d.owned.reduce((a, id) => a + itemCost(id), 0); // save antigo
  d.loadout = d.loadout || {};
  for (const h of ['fosforo', 'candela']) d.loadout[h] = Object.assign({ weapon: null, weapon2: null, charm: null }, d.loadout[h] || {});
  recalcCoins(); shopSanitize(); Save.write();
}

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
    case 'spark': { ctx.save(); ctx.rotate(Math.PI / 2); drawFlame(0, 10, 0.9, t, fire); ctx.restore(); break; }
    case 'w_fan': {
      for (const a of [-0.5, 0, 0.5]) { ctx.save(); ctx.rotate(a); ctx.translate(14, 0); ctx.beginPath(); ctx.ellipse(0, 0, 11, 6, 0, 0, TAU); ctx.fillStyle = '#8fc6f2'; ctx.fill(); ink(2.5); ctx.stroke(); shine(3, -2, 3, 1.6, 0, 0.8); ctx.restore(); }
      ink(3); circle(-18, 0, 6, '#d6e9fb'); break;
    }
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
    this.hero = Net.role === 'guest' ? Net.myHero : (Game.mode.chars[0] || 'fosforo');
    this.line = 'Bem-vindo ao Empório! A vitrine muda a cada compra e a cada chefe vencido. Escolha bem!';
    shopSanitize(); Music.play('shop');
  }
  say(txt) { this.line = txt; this.talk = 1.2; }
  slots() { return Save.data.shop.slots; }
  update(dt) {
    this.t += dt; Particles.update(dt); this.talk = Math.max(0, this.talk - dt); this.happy = Math.max(0, this.happy - dt * 1.5); this.shake = Math.max(0, this.shake - dt * 3);
    const sl = this.slots(), n = sl.length;
    if (this.sel >= n) this.sel = Math.max(0, n - 1);
    const col = this.sel % 3, row = (this.sel / 3) | 0;
    let moved = false;
    if (pressed.left && col > 0) { this.sel--; moved = true; }
    if (pressed.right && col < 2 && this.sel + 1 < n) { this.sel++; moved = true; }
    if (pressed.up && row > 0) { this.sel -= 3; moved = true; }
    if (pressed.down && row < 1 && this.sel + 3 < n) { this.sel += 3; moved = true; }
    if (moved && sl[this.sel]) { Snd.play('select'); this.say(ITEM_BY_ID[sl[this.sel].id].desc); }
    const heroes = Net.connected ? [Net.myHero] : ['fosforo', 'candela'];
    if ((pressed.dash || pressed.ex) && heroes.length > 1) { this.hero = this.hero === 'fosforo' ? 'candela' : 'fosforo'; Snd.play('select'); this.say(`Agora equipando ${HEROES[this.hero].name}. Cada herói tem o seu equipamento!`); }
    if (pressed.shoot) { Snd.play('confirm'); Game.go(new Inventory(() => Game.go(new Shop()), null)); return; }
    if (backPressed()) { Snd.play('confirm'); Game.go(MapScene.shop()); return; }
    if ((pressed.jump || pressed.start) && sl[this.sel]) this.buy(ITEM_BY_ID[sl[this.sel].id]);
  }
  buy(it) {
    if (Save.data.coins < it.price) { Snd.play('hurt'); this.shake = 1; this.say(`Ih, faltam ${it.price - Save.data.coins} moeda(s)! Vença chefões e corra nas fases de moedas.`); return; }
    const pos = this.cardPos(this.sel);
    Save.data.coins -= it.price;
    const next = shopBuy(it.id);
    // equipa sozinho no primeiro espaço livre do herói
    const lo = loadoutOf(this.hero); let where = '';
    if (it.type === 'weapon') { if (!lo.weapon) { lo.weapon = it.id; where = 'na arma 1'; } else if (!lo.weapon2) { lo.weapon2 = it.id; where = 'na arma 2'; } }
    else if (!lo.charm) { lo.charm = it.id; where = 'no amuleto'; }
    Save.write();
    Snd.play('win'); this.happy = 1; Particles.stars(pos.x + 85, pos.y + 45, 10, '#ffd84a');
    this.say(`Negócio fechado! ${it.name}${where ? ` equipado ${where} do ${HEROES[this.hero].name}` : ' foi para o seu inventário (X)'}. ${next ? 'Chegou item novo na vitrine!' : 'A vitrine está esvaziando!'}`);
  }
  cardPos(i) { return { x: 398 + (i % 3) * 184, y: 104 + ((i / 3) | 0) * 126 }; }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a3420'); g.addColorStop(1, '#3a2014'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,220,170,.05)'; for (let x = 0; x < W; x += 48) ctx.fillRect(x, 0, 24, H);
    ctx.fillStyle = 'rgba(255,230,160,.12)'; ctx.beginPath(); ctx.arc(190, 150, 230, 0, TAU); ctx.fill();
    ink(5); rrect(36, 14, 320, 58, 10, '#2f4a32');
    ctx.strokeStyle = '#e0b04a'; ctx.lineWidth = 2; rrect(44, 22, 304, 42, 7, null);
    outlinedText('Empório do Seu Lampião', 196, 44, 23, '#ffd84a', FONT_TITLE, 'center', 5);
    drawShopkeeper(190, 420, this.t, this.talk > 0 ? 1 : 0, this.happy);
    shape(pRRect(-10, 400, 380, 160, 10), '#7a4a26', 6, 'rgba(0,0,0,.35)', 0, -10);
    ctx.fillStyle = '#9c6234'; ctx.fillRect(-10, 400, 380, 16); ink(4); ctx.strokeRect(-10, 400, 380, 16);
    speechBubble(30, 86, 330, this.line);
    ink(4); rrect(36, 428, 150, 40, 10, '#fff6e0');
    drawCoin(62, 448, 13, this.t);
    outlinedText(`${Save.data.coins}`, 120, 449, 26, '#f2c14a', FONT_TITLE, 'center', 6);
    const lo = loadoutOf(this.hero);
    ink(4); rrect(196, 428, 166, 96, 10, '#fff6e0');
    ctx.save(); ctx.beginPath(); ctx.rect(198, 430, 60, 92); ctx.clip(); drawHero(this.hero, 228, 512, { scale: 0.95, t: this.t, dance: this.happy > 0 }); ctx.restore();
    ctx.font = `14px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(HEROES[this.hero].name, 262, 444);
    ctx.font = `11px ${FONT_TEXT}`;
    [['Arma 1', lo.weapon, 464], ['Arma 2', lo.weapon2, 484], ['Amuleto', lo.charm, 504]].forEach(([lab, id, yy]) => {
      ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(lab, 262, yy);
      if (id) drawItemIcon(id, 344, yy, 0.34, this.t); else ctx.fillText('—', 338, yy);
    });
    // vitrine
    const sl = this.slots();
    for (let i = 0; i < SHOP_SLOTS; i++) {
      const p = this.cardPos(i), s = sl[i];
      ctx.save(); ctx.translate(p.x + 85, p.y + 56);
      if (!s) {
        ink(3); ctx.setLineDash([8, 6]); rrect(-85, -56, 170, 112, 10, 'rgba(0,0,0,.2)'); ctx.setLineDash([]);
        ctx.font = `14px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(244,231,197,.55)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i === sl.length ? 'Em breve…' : '', 0, 0);
        ctx.restore(); continue;
      }
      const it = ITEM_BY_ID[s.id], sel = i === this.sel, isNew = s.n > Save.data.shop.serial - 1 && this.t < 8;
      if (sel) { const k = 1.05 + Math.sin(this.t * 6) * 0.015; ctx.scale(k, k); ctx.rotate(Math.sin(this.t * 3) * 0.01); if (this.shake) ctx.translate(Math.sin(this.t * 60) * this.shake * 5, 0); }
      rrect(-81, -50, 170, 112, 10, 'rgba(0,0,0,.35)', false);
      ink(sel ? 5 : 4); rrect(-85, -56, 170, 112, 10, PAPER);
      ctx.fillStyle = it.type === 'weapon' ? '#c8352b' : '#3a6fb0'; ctx.fillRect(-83, -54, 166, 6);
      ctx.font = `10px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(26,20,16,.6)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(it.type === 'weapon' ? 'ARMA' : 'AMULETO', -76, -40);
      drawItemIcon(it.id, 0, -10, 0.9, this.t + i);
      ctx.font = `14px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(it.name, 0, 26);
      drawCoin(-14, 44, 8, 0); ctx.font = `15px ${FONT_TITLE}`; ctx.fillStyle = Save.data.coins >= it.price ? INK : '#a33'; ctx.textAlign = 'left'; ctx.fillText(`${it.price}`, -2, 45);
      if (sel) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -this.t * 30; rrect(-91, -62, 182, 124, 13, null); ctx.setLineDash([]); }
      ctx.restore();
    }
    // próxima chegada (silhueta): ajuda a planejar sem revelar tudo
    const sh = Save.data.shop, nxt = sh.queue.find((id) => !owns(id) && !sh.slots.some((x) => x.id === id));
    ctx.font = `12px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(244,231,197,.75)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(nxt ? `Próxima chegada: ${ITEM_BY_ID[nxt].type === 'weapon' ? 'uma arma' : 'um amuleto'} (${sh.queue.filter((id) => !owns(id)).length} na fila)` : 'Sem mais novidades: você já viu tudo!', 398, 360);
    Particles.draw();
    ctx.font = `13px ${FONT_TEXT}`; ctx.fillStyle = CREAM; ctx.textAlign = 'center';
    ctx.fillText('Setas: escolher · Z: comprar · X: inventário · C: trocar herói · Esc: voltar', 664, 498);
  }
}

// ---------- Inventário: equipar 2 armas e 1 amuleto por herói ----------
class Inventory {
  // onDone: o que fazer ao sair; fight: se não for nulo, mostra o botão "Lutar!" (equipar antes da luta)
  constructor(onDone, fight) {
    this.onDone = onDone; this.fight = fight; this.t = 0; this.row = fight ? 3 : 0; this.picker = null; this.msg = '';
    this.heroes = Net.connected ? [Net.myHero] : ['fosforo', 'candela'];
    this.hi = Math.max(0, this.heroes.indexOf(Game.mode.chars[0])); Music.play('shop');
  }
  hero() { return this.heroes[this.hi]; }
  rows() { return ['weapon', 'weapon2', 'charm'].concat(this.fight ? ['go'] : []); }
  options(slot) {
    // armas: padrão (faíscas) + armas obtidas; amuleto: vazio + amuletos obtidos
    if (slot === 'charm') return [null, ...ITEMS.filter((i) => i.type === 'charm' && owns(i.id)).map((i) => i.id)];
    return [null, ...ITEMS.filter((i) => i.type === 'weapon' && owns(i.id)).map((i) => i.id)];
  }
  close(go) {
    Save.write();
    if (Net.connected && Net.role === 'guest') Net.send({ t: 'loadout', loadout: loadoutOf(Net.myHero) });
    this.onDone(go);
  }
  update(dt) {
    this.t += dt;
    const lo = loadoutOf(this.hero()), rows = this.rows();
    if (this.picker) {
      const P = this.picker, opts = this.options(P.slot);
      if (pressed.up) { P.i = (P.i + opts.length - 1) % opts.length; Snd.play('select'); }
      if (pressed.down) { P.i = (P.i + 1) % opts.length; Snd.play('select'); }
      if (backPressed()) { this.picker = null; return; }
      if (pressed.jump || pressed.start) {
        const id = opts[P.i];
        if (P.slot !== 'charm' && id) { const other = P.slot === 'weapon' ? 'weapon2' : 'weapon'; if (lo[other] === id) lo[other] = lo[P.slot]; }  // trocar de lugar
        lo[P.slot] = id; Snd.play('parry'); this.picker = null; Save.write();
        this.msg = id ? `${ITEM_BY_ID[id].name} equipado!` : 'Espaço liberado.';
      }
      return;
    }
    if (pressed.up) { this.row = (this.row + rows.length - 1) % rows.length; Snd.play('select'); }
    if (pressed.down) { this.row = (this.row + 1) % rows.length; Snd.play('select'); }
    if ((pressed.left || pressed.right) && this.heroes.length > 1) { this.hi ^= 1; Snd.play('select'); }
    if (backPressed()) { Snd.play('confirm'); this.close(false); return; }
    if (pressed.jump || pressed.start) {
      const r = rows[this.row];
      if (r === 'go') { Snd.play('confirm'); this.close(true); return; }
      const opts = this.options(r);
      if (opts.length === 1 && r !== 'charm') this.msg = 'Você ainda não tem outras armas. Visite a loja!';
      else if (opts.length === 1) this.msg = 'Você ainda não tem amuletos. Visite a loja!';
      else { this.picker = { slot: r, i: Math.max(0, opts.indexOf(lo[r])) }; Snd.play('confirm'); }
    }
  }
  statBars(id, x, y) {
    const st = WEAPON_STATS[id || 'spark']; if (!st) return;
    Object.entries(st).forEach(([k, v], i) => {
      ctx.font = `13px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(k, x, y + i * 22);
      for (let b = 0; b < 5; b++) { ink(2); rrect(x + 90 + b * 22, y + i * 22 - 7, 18, 14, 3, b < v ? '#c8352b' : 'rgba(26,20,16,.12)'); }
    });
  }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a3420'); g.addColorStop(1, '#3a2014'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,220,170,.05)'; for (let x = 0; x < W; x += 48) ctx.fillRect(x, 0, 24, H);
    outlinedText('INVENTÁRIO', W / 2, 44, 38, '#ffd84a');
    const hero = this.hero(), lo = loadoutOf(hero), rows = this.rows();
    // retrato do herói
    ink(5); rrect(40, 80, 250, 360, 16, PAPER);
    ctx.save(); ctx.beginPath(); ctx.rect(46, 86, 238, 348); ctx.clip();
    ctx.fillStyle = hero === 'candela' ? '#b9d4ee' : '#f0c4a8'; ctx.fillRect(40, 80, 250, 360);
    drawHero(hero, 165, 400, { scale: 2.4, t: this.t, dance: this.picker !== null }); ctx.restore();
    outlinedText(HEROES[hero].name, 165, 110, 28, hero === 'candela' ? '#3a6fb0' : '#c8352b');
    if (this.heroes.length > 1) { ctx.font = `14px ${FONT_TEXT}`; ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.fillText('◄ ► trocar herói', 165, 462); }
    // espaços
    const labels = { weapon: 'Arma 1', weapon2: 'Arma 2', charm: 'Amuleto' };
    rows.forEach((r, i) => {
      const y = 90 + i * 98, sel = i === this.row && !this.picker;
      if (r === 'go') {
        ink(sel ? 6 : 4); rrect(310, y, 300, 70, 14, sel ? '#c8352b' : '#8a3a30');
        outlinedText('▶ Lutar!', 460, y + 36, 32, CREAM); return;
      }
      ink(sel ? 6 : 4); rrect(310, y, 300, 86, 14, sel ? '#fff6e0' : '#cdb98e');
      ctx.font = `13px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(26,20,16,.65)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(labels[r].toUpperCase() + (r === 'weapon' ? '  (inicial)' : ''), 326, y + 20);
      const id = lo[r];
      ink(3); circle(352, y + 52, 24, '#fff'); drawItemIcon(id || (r === 'charm' ? null : 'spark'), 352, y + 53, 0.62, this.t);
      ctx.font = `17px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.fillText(id ? ITEM_BY_ID[id].name : (r === 'charm' ? 'Vazio' : 'Faíscas (padrão)'), 388, y + 52);
      if (sel) { ctx.font = `12px ${FONT_TEXT}`; ctx.fillStyle = '#c8352b'; ctx.fillText('Z: trocar', 388, y + 72); }
    });
    // detalhe do item em foco
    ink(5); rrect(630, 80, 290, 360, 16, PAPER);
    let focus = null, slot = rows[this.row];
    if (this.picker) focus = this.options(this.picker.slot)[this.picker.i]; else if (slot !== 'go') focus = lo[slot];
    const isW = this.picker ? this.picker.slot !== 'charm' : slot === 'weapon' || slot === 'weapon2';
    ctx.font = `20px ${FONT_TITLE}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (slot === 'go' && !this.picker) { ctx.font = `15px ${FONT_TEXT}`; ctx.fillText('Tudo pronto?', 775, 140); }
    else {
      drawItemIcon(focus || (isW ? 'spark' : null), 775, 135, 1.3, this.t);
      ctx.fillText(focus ? ITEM_BY_ID[focus].name : (isW ? 'Faíscas (padrão)' : 'Nenhum amuleto'), 775, 200);
      textBlock(focus ? ITEM_BY_ID[focus].desc : (isW ? 'O tiro de sempre: rápido e reto. Dá para trocar entre duas armas durante a luta (tecla Q ou botão TROCA).' : 'Sem amuleto equipado.'), 650, 226, 250, 20, 14, INK, 'left');
      if (isW) this.statBars(focus, 652, 340);
    }
    // seletor de itens
    if (this.picker) {
      const opts = this.options(this.picker.slot);
      ctx.fillStyle = 'rgba(15,8,4,.5)'; ctx.fillRect(300, 70, 320, 380);
      ink(5); rrect(310, 80, 300, 360, 14, PAPER);
      outlinedText(this.picker.slot === 'charm' ? 'Amuletos' : 'Armas', 460, 108, 24, '#c8352b');
      opts.forEach((id, i) => {
        const sel = i === this.picker.i, y = 138 + i * 40;
        if (y > 410) return;
        if (sel) { ctx.fillStyle = 'rgba(200,53,43,.16)'; ctx.fillRect(318, y - 18, 284, 36); }
        if (id) drawItemIcon(id, 344, y + 1, 0.32, this.t); else if (this.picker.slot !== 'charm') drawItemIcon('spark', 344, y + 1, 0.32, this.t);
        ctx.font = `16px ${FONT_TITLE}`; ctx.fillStyle = sel ? '#c8352b' : INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText((sel ? '► ' : '') + (id ? ITEM_BY_ID[id].name : (this.picker.slot === 'charm' ? 'Nenhum' : 'Faíscas (padrão)')), 366, y);
      });
    }
    ctx.font = `14px ${FONT_TEXT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = this.msg ? '#fff6e0' : CREAM; ctx.fillText(this.msg || '↑/↓ escolher espaço · Z trocar item · Esc voltar', W / 2, 500);
  }
}
