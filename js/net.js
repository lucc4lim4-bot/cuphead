'use strict';
// ===== Jogo online: cada um no seu aparelho =====
// Quem CRIA a sala (anfitrião) roda a luta de verdade e envia o que aparece na tela;
// quem ENTRA (convidado) envia os botões que aperta e desenha o que recebe.
// Conexão direta entre os aparelhos via WebRTC (PeerJS). Com ?net=local na URL,
// usa BroadcastChannel (duas abas no mesmo computador) para testes.

const NET_PREFIX = 'fosforo-candela-vv-';
const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const NET_ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'shoot', 'dash', 'ex', 'lock', 'start', 'pause'];

const Net = {
  role: null, connected: false, code: '', status: '', peer: null, conn: null, chan: null,
  remoteLoadout: { weapon: null, charm: null }, myHero: 'fosforo', sfx: [], snap: null, lastHeld: 0, tick: 0,
  get online() { return !!this.role; },
  local() { return /[?&]net=local/.test(location.search); },

  setStatus(s) { this.status = s; NetUI.render(); },
  loadPeer() {
    if (window.Peer) return Promise.resolve();
    return new Promise((ok, fail) => {
      const s = document.createElement('script'); s.src = PEERJS_URL; s.onload = ok;
      s.onerror = () => fail(new Error('Não deu para carregar a conexão. Verifique a internet.'));
      document.head.appendChild(s);
    });
  },

  // ---------- criar / entrar ----------
  async host(hero) {
    this.reset(); this.role = 'host'; this.myHero = hero;
    this.code = String(1000 + Math.floor(Math.random() * 9000));
    this.setStatus('Abrindo a sala…');
    if (this.local()) { this.openChannel(); this.setStatus('Sala aberta! Passe o código para o outro iPad.'); return; }
    try { await this.loadPeer(); } catch (e) { this.fail(e.message); return; }
    this.peer = new Peer(NET_PREFIX + this.code, { debug: 0 });
    this.peer.on('open', () => this.setStatus('Sala aberta! Passe o código para o outro iPad.'));
    this.peer.on('connection', (c) => { if (this.conn) { c.close(); return; } this.useConn(c); });
    this.peer.on('error', (e) => {
      if (e.type === 'unavailable-id') { this.host(hero); return; }
      this.fail('Erro de conexão (' + (e.type || 'desconhecido') + '). Tente de novo.');
    });
  },
  async join(code) {
    this.reset(); this.role = 'guest'; this.code = code;
    this.setStatus('Procurando a sala ' + code + '…');
    if (this.local()) { this.openChannel(); this.send({ t: 'knock' }); return; }
    try { await this.loadPeer(); } catch (e) { this.fail(e.message); return; }
    this.peer = new Peer(undefined, { debug: 0 });
    this.peer.on('open', () => {
      const c = this.peer.connect(NET_PREFIX + code, { reliable: true, serialization: 'json' });
      this.useConn(c);
      setTimeout(() => { if (!this.connected && this.role === 'guest') this.fail('Não achei a sala ' + code + '. Confira o código e se o outro iPad está com a sala aberta.'); }, 12000);
    });
    this.peer.on('error', (e) => this.fail(e.type === 'peer-unavailable' ? 'Não achei a sala ' + code + '. Confira o código.' : 'Erro de conexão (' + (e.type || 'desconhecido') + ').'));
  },
  openChannel() {
    this.chan = new BroadcastChannel('fc-net-' + this.code);
    this.chan.onmessage = (e) => {
      const m = e.data; if (!m || m.from === this.role) return;
      if (m.t === 'knock' && this.role === 'host' && !this.connected) { this.onOpen(); return; }
      if (m.t === 'welcome' && this.role === 'guest' && !this.connected) { this.onOpen(); }
      this.onMsg(m);
    };
  },
  useConn(c) {
    this.conn = c;
    c.on('open', () => this.onOpen());
    c.on('data', (m) => this.onMsg(m));
    c.on('close', () => this.onClose());
    c.on('error', () => this.onClose());
  },
  send(m) {
    if (this.chan) { m.from = this.role; this.chan.postMessage(m); return; }
    if (this.conn && this.conn.open) { try { this.conn.send(m); } catch (e) { /* conexão caiu */ } }
  },

  // ---------- ciclo da conexão ----------
  onOpen() {
    if (this.connected) return;
    this.connected = true;
    if (this.role === 'host' && this.chan) this.send({ t: 'welcome' });
    this.setStatus('Conectado!');
    this.send({ t: 'hello', save: saveSnapshot(), loadout: loadoutOf(this.role === 'host' ? this.myHero : otherHero(this.myHero)), hero: this.myHero });
  },
  onClose() {
    if (!this.role) return;
    const wasGuest = this.role === 'guest', was = this.connected;
    this.reset();
    if (was) Game.toast('O parceiro saiu da partida.');
    if (wasGuest && was) Game.go(new Title());
    else if (!wasGuest && was && Game.scene instanceof Fight) for (const k in PIN[1].held) PIN[1].held[k] = false;
    NetUI.close();
  },
  fail(msg) { this.reset(); this.setStatus(msg); NetUI.render(); },
  leave() { if (this.connected) this.send({ t: 'bye' }); this.reset(); },
  reset() {
    try { if (this.conn) this.conn.close(); } catch (e) { /* ok */ }
    try { if (this.peer) this.peer.destroy(); } catch (e) { /* ok */ }
    try { if (this.chan) this.chan.close(); } catch (e) { /* ok */ }
    this.conn = null; this.peer = null; this.chan = null; this.connected = false; this.role = null; this.snap = null;
    for (const k in PIN[1].held) PIN[1].held[k] = false;
  },

  // ---------- mensagens ----------
  onMsg(m) {
    switch (m.t) {
      case 'hello':
        mergeSave(m.save);
        if (this.role === 'host') {
          this.remoteLoadout = m.loadout || this.remoteLoadout;
          Game.mode = { coop: true, online: true, chars: [this.myHero, otherHero(this.myHero)] };
          InputMode.coop = false;
          this.send({ t: 'start', chars: Game.mode.chars, diff: opt().diff, save: saveSnapshot() });
          NetUI.close(); Game.toast('Parceiro conectado! Escolha a fase no mapa.'); Game.go(new MapScene(0));
        }
        break;
      case 'start':
        mergeSave(m.save);
        this.myHero = m.chars[1];
        Game.mode = { coop: true, online: true, chars: m.chars }; InputMode.coop = false;
        opt().diff = m.diff;
        this.send({ t: 'loadout', loadout: loadoutOf(this.myHero) });
        NetUI.close(); Game.toast(`Conectado! Você é ${HEROES[this.myHero].name}.`); Game.go(new MapScene(0));
        break;
      case 'loadout': this.remoteLoadout = m.loadout || this.remoteLoadout; break;
      case 'save': mergeSave(m.save); break;
      case 'in': // botões do convidado (no anfitrião viram o jogador 2)
        if (this.role !== 'host') break;
        NET_ACTIONS.forEach((a, i) => { const on = !!(m.h & (1 << i)); PIN[1].held[a] = on; if (m.p & (1 << i)) PIN[1].pressed[a] = true; });
        if ((m.p & (1 << NET_ACTIONS.indexOf('pause'))) && Game.scene instanceof Fight && Game.scene.state === 'play') { Game.scene.paused = true; Game.scene.menuSel = 0; }
        break;
      case 'mapsel': if (this.role === 'guest' && Game.scene instanceof MapScene) Game.scene.sel = m.sel; break;
      case 'fight':
        if (this.role !== 'guest') break;
        opt().diff = m.diff; Game.mode = { coop: true, online: true, chars: m.chars };
        Game.go(new NetView(m.idx));
        break;
      case 'snap': if (this.role === 'guest' && (!this.snap || m.n > this.snap.n || m.n < 10)) this.snap = m; break;
      case 'results':
        if (this.role === 'guest') { opt().diff = m.diff; Game.go(new Results(m.idx, m.stats, m.hp, m.diff)); }
        break;
      case 'map': if (this.role === 'guest' && !(Game.scene instanceof Shop) && !(Game.scene instanceof Results)) Game.go(new MapScene(m.sel - 1)); break;
      case 'bye': this.onClose(); break;
    }
  },

  // chamado a cada quadro pelo laço principal
  update() {
    if (!this.connected) return;
    this.tick++;
    if (this.role === 'guest') {
      // envia meus botões
      let h = 0, p = 0;
      NET_ACTIONS.forEach((a, i) => { if (PIN[0].held[a] || (a === 'start' && keys.start) || (a === 'pause' && keys.pause)) h |= 1 << i; if (PIN[0].pressed[a] || ((a === 'start' || a === 'pause') && pressed[a])) p |= 1 << i; });
      if (Game.scene instanceof NetView && (h !== this.lastHeld || p || this.tick % 20 === 0)) { this.send({ t: 'in', h, p }); this.lastHeld = h; }
    } else if (Game.scene instanceof Fight && this.tick % 2 === 0) {
      this.send(fightSnapshot(Game.scene));
    }
  },
};
const otherHero = (h) => (h === 'fosforo' ? 'candela' : 'fosforo');

// ---------- save em conjunto ----------
function saveSnapshot() {
  const d = Save.data;
  return { grades: d.grades, gradeDiff: d.gradeDiff || {}, coins: d.coins, owned: d.owned, seenIntro: d.seenIntro };
}
function mergeSave(r) {
  if (!r) return;
  const d = Save.data, gd = d.gradeDiff || (d.gradeDiff = {});
  for (const [id, g] of Object.entries(r.grades || {})) {
    if (!d.grades[id] || GRADE_ORDER.indexOf(g) > GRADE_ORDER.indexOf(d.grades[id])) { d.grades[id] = g; gd[id] = (r.gradeDiff || {})[id] || 'normal'; }
  }
  d.coins = Math.max(d.coins || 0, r.coins || 0);
  d.owned = [...new Set([...(d.owned || []), ...(r.owned || [])])];
  d.seenIntro = d.seenIntro || !!r.seenIntro;
  Save.write();
}

// ---------- fotografia da luta (anfitrião → convidado) ----------
function plainVal(v, depth) {
  if (v === null || typeof v === 'boolean' || typeof v === 'string') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  if (typeof v === 'function' || v === undefined) return undefined;
  if (depth <= 0) return undefined;
  if (Array.isArray(v)) return v.map((x) => plainVal(x, depth - 1)).filter((x) => x !== undefined);
  if (typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const o = {}; for (const k in v) { const p = plainVal(v[k], depth - 1); if (p !== undefined) o[k] = p; } return o;
  }
  return undefined;
}
function plainInst(inst, skip = []) {
  const o = {};
  for (const k of Object.keys(inst)) { if (skip.includes(k)) continue; const p = plainVal(inst[k], 3); if (p !== undefined) o[k] = p; }
  return o;
}
const FIGHT_KEYS = ['state', 'stateT', 't', 'shake', 'wind', 'banner', 'paused', 'menuSel', 'landed', 'consolation', 'stats', 'barLag'];
function fightSnapshot(f) {
  const s = { t: 'snap', n: Net.tick, f: {}, boss: plainInst(f.boss, ['q']), players: f.players.map((p) => plainInst(p, ['in'])), eb: f.eb.map((b) => plainVal(b, 3)), pb: f.pb.map((b) => plainVal(b, 3)), parts: Particles.list.slice(-50).map((p) => plainVal(p, 2)), sfx: Net.sfx.splice(0) };
  for (const k of FIGHT_KEYS) s.f[k] = plainVal(f[k], 3);
  return s;
}

// ---------- cena do convidado: desenha a luta recebida ----------
class NetView {
  constructor(idx) { this.fight = new Fight(idx); this.idx = idx; this.applied = null; }
  update(dt) {
    const f = this.fight, s = Net.snap;
    if (s && s !== this.applied) {
      this.applied = s;
      Object.assign(f, s.f); Object.assign(f.boss, s.boss);
      s.players.forEach((p, i) => { if (f.players[i]) Object.assign(f.players[i], p); });
      f.eb = s.eb; f.pb = s.pb;
      Particles.list = s.parts;
      for (const n of s.sfx || []) Snd.play(n);
    } else {
      // suaviza o movimento entre uma fotografia e outra
      for (const b of f.eb) { if (b.vx) b.x += b.vx * dt; if (b.vy && !b.upd) b.y += b.vy * dt; b.t = (b.t || 0) + dt; }
      for (const b of f.pb) { b.x += b.vx * dt; b.y += b.vy * dt; }
      for (const p of f.players) { p.anim += dt; }
      f.boss.t += dt; f.t += dt; f.stateT += dt;
      Particles.update(dt);
    }
  }
  draw() {
    this.fight.draw();
    if (Net.connected) {
      ctx.font = `13px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(244,231,197,.8)'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(`online · você é ${HEROES[Net.myHero].name}`, W - 14, H - 10);
    }
  }
}

// ---------- painel de conexão (HTML, para o teclado do iPad) ----------
const NetUI = {
  el: null, mode: 'menu', hero: 'fosforo',
  open() { this.mode = 'menu'; this.build(); this.el.hidden = false; this.render(); },
  close() { if (this.el) this.el.hidden = true; },
  build() {
    if (this.el) return;
    const el = document.createElement('div'); el.id = 'netpanel'; el.hidden = true;
    document.getElementById('stage').appendChild(el); this.el = el;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      Snd.init(); Snd.play('select');
      const act = b.dataset.act;
      if (act === 'host') { this.mode = 'pick'; this.render(); }
      else if (act === 'join') { this.mode = 'join'; Net.status = ''; this.render(); setTimeout(() => { const i = document.getElementById('net-code'); if (i) i.focus(); }, 50); }
      else if (act === 'hero') { this.hero = b.dataset.hero; this.mode = 'wait'; Net.host(this.hero); this.render(); }
      else if (act === 'go') { const v = (document.getElementById('net-code').value || '').replace(/\D/g, ''); if (v.length !== 4) { Net.status = 'O código tem 4 números.'; this.render(); return; } this.mode = 'joining'; Net.join(v); this.render(); }
      else if (act === 'back') { Net.leave(); this.mode = 'menu'; Net.status = ''; this.render(); }
      else if (act === 'close') { Net.leave(); this.close(); }
    });
    el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { const g = el.querySelector('[data-act="go"]'); if (g) g.click(); } });
  },
  render() {
    if (!this.el || this.el.hidden) return;
    const st = Net.status ? `<p class="np-status">${Net.status}</p>` : '';
    let body = '';
    if (this.mode === 'menu') body = `
      <p>Cada um joga no seu iPad ou celular, na mesma fase, ao mesmo tempo. O progresso fica salvo nos dois.</p>
      <div class="np-row"><button data-act="host" class="primary">Criar sala</button><button data-act="join">Entrar numa sala</button></div>`;
    else if (this.mode === 'pick') body = `
      <p>Com qual herói você vai jogar? O outro aparelho fica com o outro herói.</p>
      <div class="np-row"><button data-act="hero" data-hero="fosforo" class="primary">Fósforo</button><button data-act="hero" data-hero="candela" class="primary">Candela</button></div>
      <div class="np-row"><button data-act="back">Voltar</button></div>`;
    else if (this.mode === 'wait') body = `
      <p>Código da sala:</p><div class="np-code">${Net.code || '····'}</div>
      <p>No outro aparelho, toque em <b>Jogar online → Entrar numa sala</b> e digite este código.</p>${st}
      <div class="np-row"><button data-act="back">Cancelar</button></div>`;
    else body = `
      <p>Digite o código de 4 números que aparece no outro aparelho:</p>
      <input id="net-code" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="0000">
      ${st}
      <div class="np-row"><button data-act="go" class="primary">Entrar</button><button data-act="back">Voltar</button></div>`;
    const keep = document.getElementById('net-code'); const val = keep ? keep.value : '';
    this.el.innerHTML = `<div class="np-card"><h2>Jogar online</h2>${body}<button class="np-x" data-act="close" aria-label="Fechar">✕</button></div>`;
    const i = document.getElementById('net-code'); if (i && val) i.value = val;
  },
};
