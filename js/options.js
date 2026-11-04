'use strict';
// ===== Opções: som, efeitos, botões de toque (posição/tamanho/opacidade) e teclas =====

const PROFILE_NAMES = { solo: '1 Jogador', p1: 'Jogador 1 (modo 2J)', p2: 'Jogador 2 (modo 2J)' };
const volBar = (v) => '■'.repeat(v) + '□'.repeat(10 - v);

function drawPanel(title, x, y, w, h) {
  ctx.fillStyle = 'rgba(15,8,4,.65)'; ctx.fillRect(0, 0, W, H);
  ink(6); rrect(x, y, w, h, 16, PAPER);
  ctx.strokeStyle = 'rgba(80,50,20,.35)'; ctx.lineWidth = 2; rrect(x + 10, y + 10, w - 20, h - 20, 10, null);
  outlinedText(title, x + w / 2, y + 40, 38, '#ffd84a');
}

class Options {
  constructor(onClose, fromTitle = false) { this.onClose = onClose; this.fromTitle = fromTitle; this.sel = 0; this.t = 0; this.sub = null; this.msg = ''; this.editing = false; this.pendingLower = false; }
  items() {
    const o = opt();
    const toggle = (k) => () => { o[k] = !o[k]; };
    return [
      { label: 'Dificuldade (travada)', val: () => curDiff().name + ' · só desce', adj: (d) => {
        if (d > 0) { this.msg = 'Travada neste save: só dá para baixar.'; this.pendingLower = false; return; }
        const i = DIFF_ORDER.indexOf(curDiffId());
        if (i <= 0) { this.msg = 'Já está na dificuldade mais baixa.'; return; }
        const next = DIFFS[DIFF_ORDER[i - 1]].name;
        if (!this.pendingLower) { this.pendingLower = true; this.msg = `Baixar para ${next}? Não dá para voltar. Aperte ◄ de novo.`; return; }
        this.pendingLower = false; lowerDiff(); this.msg = `Dificuldade baixada para ${next}.`;
      } },
      { label: 'Volume da música', val: () => volBar(o.music), adj: (d) => { o.music = clamp(o.music + d, 0, 10); Snd.applyVolume(); } },
      { label: 'Volume dos efeitos', val: () => volBar(o.sfx), adj: (d) => { o.sfx = clamp(o.sfx + d, 0, 10); Snd.applyVolume(); Snd.play('select'); } },
      { label: 'Som geral', val: () => (Save.data.muted ? 'Mudo' : 'Ligado'), adj: () => Snd.toggleMute() },
      { label: 'Barra de vida do chefão', val: () => (o.bossBar ? 'Ligada' : 'Desligada'), adj: toggle('bossBar') },
      { label: 'Tremor de tela', val: () => (o.shake ? 'Ligado' : 'Desligado'), adj: toggle('shake') },
      { label: 'Efeito de filme antigo', val: () => (o.film ? 'Ligado' : 'Desligado'), adj: toggle('film') },
      { label: 'Botões de toque na tela', val: () => ({ auto: 'Automático', on: 'Sempre', off: 'Nunca' })[o.touch], adj: (d) => { const m = ['auto', 'on', 'off']; o.touch = m[(m.indexOf(o.touch) + (d < 0 ? 2 : 1)) % 3]; Touch.apply(); } },
      { label: 'Direção na tela', val: () => DIR_NAMES[o.dir] || DIR_NAMES.stick, adj: (d) => { const m = ['stick', 'float', 'pad']; o.dir = m[(m.indexOf(o.dir) + (d < 0 ? 2 : 1)) % 3]; Touch.apply(); } },
      { label: 'Opacidade dos botões', val: () => `${Math.round(o.tOpacity * 100)}%`, adj: (d) => { o.tOpacity = clamp(Math.round((o.tOpacity + d * 0.05) * 100) / 100, 0.1, 1); Touch.apply(); } },
      { label: 'Tamanho dos botões', val: () => `${Math.round(o.tScale * 100)}%`, adj: (d) => { o.tScale = clamp(Math.round((o.tScale + d * 0.05) * 100) / 100, 0.6, 1.6); Touch.apply(); } },
      { label: 'Posição dos botões', val: () => 'Arrastar ►', act: () => { this.editing = true; Touch.startEdit(() => { this.editing = false; this.msg = 'Layout dos botões salvo.'; }); } },
      { label: 'Teclas · 1 Jogador', val: () => 'Configurar ►', act: () => { this.sub = new KeyBind('solo', () => { this.sub = null; }); } },
      { label: 'Teclas · Jogador 1 (2J)', val: () => 'Configurar ►', act: () => { this.sub = new KeyBind('p1', () => { this.sub = null; }); } },
      { label: 'Teclas · Jogador 2 (2J)', val: () => 'Configurar ►', act: () => { this.sub = new KeyBind('p2', () => { this.sub = null; }); } },
      ...(this.fromTitle ? [{ label: 'Trocar de save / novo jogo', val: () => `Save ${Save.slot} ►`, act: () => { this.onClose(); Game.go(new SlotSelect(false)); } }] : []),
      { label: 'Restaurar tudo ao padrão', val: () => '', act: () => { Object.assign(o, OPT_DEFAULTS, { tPos: {} }); Save.data.binds = {}; rebuildKeymaps(); Touch.apply(); Snd.applyVolume(); this.msg = 'Configurações padrão restauradas!'; } },
      { label: 'Voltar', val: () => '', act: () => this.close() },
    ];
  }
  close() { Save.write(); Touch.apply(); this.onClose(); }
  update(dt) {
    this.t += dt;
    if (this.editing) {
      if (backPressed()) Touch.endEdit(false);
      else if (pressed.start) Touch.endEdit(true);
      return;
    }
    if (this.sub) { this.sub.update(dt); return; }
    const it = this.items(), n = it.length;
    if (pressed.up) { this.sel = (this.sel + n - 1) % n; Snd.play('select'); this.pendingLower = false; }
    if (pressed.down) { this.sel = (this.sel + 1) % n; Snd.play('select'); this.pendingLower = false; }
    const cur = it[this.sel];
    if ((pressed.left || pressed.right) && cur.adj) { this.msg = ''; cur.adj(pressed.left ? -1 : 1); Save.write(); }
    if (pressed.jump || pressed.start) {
      Snd.play('confirm');
      if (cur.act) cur.act(); else if (cur.adj) { cur.adj(1); Save.write(); }
    }
    if (backPressed()) this.close();
  }
  draw() {
    if (this.editing) {
      ctx.fillStyle = 'rgba(15,8,4,.45)'; ctx.fillRect(0, 0, W, H);
      ctx.font = `16px ${FONT_TEXT}`; ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Teclado: Enter salva · Esc cancela', W / 2, H / 2);
      return;
    }
    const x = 170, y = 22, w = 620, h = 496;
    drawPanel('OPÇÕES', x, y, w, h);
    const it = this.items();
    it.forEach((row, i) => {
      const rh = Math.min(24, (h - 118) / it.length), yy = y + 78 + i * rh, sel = i === this.sel;
      if (sel) { ctx.fillStyle = 'rgba(200,53,43,.14)'; ctx.fillRect(x + 22, yy - rh / 2, w - 44, rh); }
      ctx.font = `${Math.round((sel ? 19 : 17) * rh / 24)}px ${FONT_TITLE}`; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillStyle = sel ? '#c8352b' : INK; ctx.fillText((sel ? '► ' : '') + row.label, x + 34, yy);
      ctx.font = `${Math.round(17 * rh / 24)}px ${FONT_TEXT}`; ctx.textAlign = 'right'; ctx.fillStyle = INK;
      const v = row.val ? row.val() : '';
      ctx.fillText(row.adj && sel && v ? `◄ ${v} ►` : v, x + w - 34, yy);
    });
    ctx.font = `15px ${FONT_TEXT}`; ctx.textAlign = 'center'; ctx.fillStyle = this.msg ? '#2f7a3a' : 'rgba(26,20,16,.7)';
    ctx.fillText(this.msg || '↑/↓ escolher · ←/→ ajustar · Z/Enter confirmar · Esc voltar', W / 2, y + h - 22);
    if (this.sub) this.sub.draw();
  }
}

class KeyBind {
  constructor(profile, onClose) { this.profile = profile; this.onClose = onClose; this.sel = 0; this.waiting = false; this.msg = ''; this.t = 0; }
  update(dt) {
    this.t += dt;
    if (this.waiting) return;
    const n = ACTIONS.length + 2;
    if (pressed.up) { this.sel = (this.sel + n - 1) % n; Snd.play('select'); }
    if (pressed.down) { this.sel = (this.sel + 1) % n; Snd.play('select'); }
    if (backPressed()) { this.onClose(); return; }
    if (pressed.jump || pressed.start) {
      Snd.play('confirm');
      if (this.sel < ACTIONS.length) {
        const action = ACTIONS[this.sel];
        this.waiting = true; this.msg = '';
        // espera a próxima tecla (a tecla de confirmação já foi pressionada)
        setTimeout(() => {
          KeyCapture.fn = (code) => {
            this.waiting = false;
            if (code === 'Escape') { this.msg = 'Cancelado.'; return; }
            if (!setBind(this.profile, action, code)) { this.msg = `${keyName(code)} é reservada (menus/pausa).`; Snd.play('hurt'); return; }
            this.msg = `${ACTION_NAMES[action]}: ${keyName(code)}`; Snd.play('parry');
          };
        }, 60);
      } else if (this.sel === ACTIONS.length) { resetBinds(this.profile); this.msg = 'Teclas padrão restauradas.'; }
      else this.onClose();
    }
  }
  draw() {
    const x = 190, y = 30, w = 580, h = 480;
    drawPanel('TECLAS', x, y, w, h);
    ctx.font = `17px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(PROFILE_NAMES[this.profile], W / 2, y + 74);
    const binds = getBinds(this.profile);
    const rows = [...ACTIONS.map((a) => [ACTION_NAMES[a], binds[a].map(keyName).join('  /  ') || '—']), ['Restaurar padrão', ''], ['Voltar', '']];
    rows.forEach(([k, v], i) => {
      const yy = y + 108 + i * 30, sel = i === this.sel;
      if (sel) { ctx.fillStyle = 'rgba(200,53,43,.14)'; ctx.fillRect(x + 22, yy - 14, w - 44, 28); }
      ctx.font = `${sel ? 19 : 17}px ${FONT_TITLE}`; ctx.textAlign = 'left'; ctx.fillStyle = sel ? '#c8352b' : INK; ctx.fillText((sel ? '► ' : '') + k, x + 36, yy);
      ctx.font = `17px ${FONT_TEXT}`; ctx.textAlign = 'right'; ctx.fillStyle = INK;
      const waitingHere = this.waiting && sel;
      if (waitingHere) { ctx.fillStyle = Math.floor(this.t * 4) % 2 ? '#c8352b' : INK; ctx.fillText('aperte uma tecla…', x + w - 36, yy); }
      else ctx.fillText(v, x + w - 36, yy);
    });
    ctx.font = `15px ${FONT_TEXT}`; ctx.textAlign = 'center'; ctx.fillStyle = this.msg ? '#2f7a3a' : 'rgba(26,20,16,.7)';
    ctx.fillText(this.msg || (this.waiting ? 'Esc cancela' : 'Z/Enter: trocar a tecla · Esc voltar'), W / 2, y + h - 24);
  }
}

// ---------- Seleção de save (3 slots) e escolha da dificuldade de um jogo novo ----------
class SlotSelect {
  constructor(forced = false) {
    this.forced = forced; this.t = 0; this.sel = Math.max(0, (Save.slot || 1) - 1); this.mode = 'pick'; this.dsel = 1;
    this.confirmDel = -1; this.msg = ''; Music.play('title');
  }
  update(dt) {
    this.t += dt;
    if (this.mode === 'diff') {
      if (pressed.left || pressed.up) { this.dsel = (this.dsel + 3) % 4; Snd.play('select'); }
      if (pressed.right || pressed.down) { this.dsel = (this.dsel + 1) % 4; Snd.play('select'); }
      if (backPressed()) { this.mode = 'pick'; Snd.play('select'); }
      else if (pressed.jump || pressed.start) { Snd.play('confirm'); Save.createSlot(this.sel + 1, DIFF_ORDER[this.dsel]); Game.go(new Title()); }
      return;
    }
    if (pressed.left) { this.sel = (this.sel + SLOT_COUNT - 1) % SLOT_COUNT; this.confirmDel = -1; this.msg = ''; Snd.play('select'); }
    if (pressed.right) { this.sel = (this.sel + 1) % SLOT_COUNT; this.confirmDel = -1; this.msg = ''; Snd.play('select'); }
    const info = Save.slotInfo(this.sel + 1);
    if (pressed.jump || pressed.start) {
      Snd.play('confirm');
      if (info) { Save.loadSlot(this.sel + 1); Game.go(new Title()); } else { this.mode = 'diff'; this.dsel = 1; }
    }
    if (pressed.shoot && info) {
      if (this.confirmDel === this.sel) { Save.deleteSlot(this.sel + 1); this.confirmDel = -1; this.msg = `Save ${this.sel + 1} apagado.`; Snd.play('hurt'); }
      else { this.confirmDel = this.sel; this.msg = `Apagar o Save ${this.sel + 1}? Aperte atirar de novo para confirmar.`; Snd.play('select'); }
    }
    if (backPressed() && Save.slot) Game.go(new Title());
  }
  draw() {
    sunburst(W / 2, H / 2, this.t * 0.1, '#c98a3a', '#d9a04e', 26);
    outlinedText(this.mode === 'diff' ? 'ESCOLHA A DIFICULDADE' : 'ESCOLHA SEU SAVE', W / 2, 54, 42, '#ffd84a');
    if (this.mode === 'diff') { this.drawDiff(); return; }
    for (let i = 0; i < SLOT_COUNT; i++) {
      const info = Save.slotInfo(i + 1), sel = i === this.sel, x = 60 + i * 290, y = 100, w = 260, h = 340;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); const k = sel ? 1.04 + Math.sin(this.t * 5) * 0.01 : 0.96; ctx.scale(k, k); ctx.translate(-w / 2, -h / 2);
      ink(sel ? 6 : 4); rrect(0, 0, w, h, 16, sel ? '#fff6e0' : '#cdb98e');
      outlinedText(`Save ${i + 1}`, w / 2, 34, 30, sel ? '#c8352b' : CREAM);
      ctx.font = `15px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (info) {
        const D = DIFFS[info.diff] || DIFFS.normal, brasas = Object.keys(info.grades || {}).length;
        ink(3); rrect(w / 2 - 70, 58, 140, 28, 9, '#fff'); ctx.font = `17px ${FONT_TITLE}`; ctx.fillStyle = D.color; ctx.fillText(D.name, w / 2, 73);
        const rows = [['Brasas', `${brasas} / ${BOSSES.length}`], ['Moedas', `${info.coins || 0}`], ['Itens', `${(info.owned || []).length} / ${ITEMS.length}`]];
        rows.forEach(([a, b], r) => { ctx.font = `16px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(a, 26, 120 + r * 32); ctx.textAlign = 'right'; ctx.fillText(b, w - 26, 120 + r * 32); });
        for (let b = 0; b < BOSSES.length; b++) { const g = (info.grades || {})[BOSSES[b].id]; ctx.beginPath(); ctx.arc(34 + b * 38, 232, 13, 0, TAU); ctx.fillStyle = g ? '#ffd84a' : 'rgba(26,20,16,.15)'; ctx.fill(); ink(2.5); ctx.stroke(); if (g) { ctx.font = `11px ${FONT_TITLE}`; ctx.fillStyle = '#c8352b'; ctx.textAlign = 'center'; ctx.fillText(g, 34 + b * 38, 233); } }
        ctx.font = `13px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(26,20,16,.6)'; ctx.textAlign = 'center';
        ctx.fillText(info.updated ? 'Último jogo: ' + new Date(info.updated).toLocaleDateString('pt-PT') : '', w / 2, 270);
        ctx.font = `15px ${FONT_TITLE}`; ctx.fillStyle = '#c8352b'; ctx.fillText(sel ? '► Z: continuar' : '', w / 2, 304);
        ctx.font = `12px ${FONT_TEXT}`; ctx.fillStyle = 'rgba(26,20,16,.6)'; ctx.fillText(sel ? 'Atirar: apagar' : '', w / 2, 324);
      } else {
        drawHero(i % 2 ? 'candela' : 'fosforo', w / 2, 200, { scale: 1.3, t: this.t + i, dance: sel });
        ctx.font = `20px ${FONT_TITLE}`; ctx.fillStyle = 'rgba(26,20,16,.7)'; ctx.textAlign = 'center'; ctx.fillText('Vazio', w / 2, 80);
        ctx.font = `15px ${FONT_TITLE}`; ctx.fillStyle = '#c8352b'; ctx.fillText(sel ? '► Z: novo jogo' : '', w / 2, 304);
      }
      if (this.confirmDel === i) { ctx.fillStyle = 'rgba(200,53,43,.18)'; rrect(0, 0, w, h, 16, 'rgba(200,53,43,.18)', false); }
      ctx.restore();
    }
    ctx.font = `15px ${FONT_TEXT}`; ctx.fillStyle = this.msg ? '#fff6e0' : CREAM; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = INK; const line = this.msg || '←/→ escolher · Z entrar · a dificuldade fica travada em cada save';
    ctx.strokeText(line, W / 2, 478); ctx.fillText(line, W / 2, 478);
  }
  drawDiff() {
    DIFF_ORDER.forEach((id, i) => {
      const D = DIFFS[id], sel = i === this.dsel, y = 100 + i * 78;
      ctx.save(); ctx.translate(W / 2, y + 32); const k = sel ? 1.03 : 0.97; ctx.scale(k, k);
      ink(sel ? 6 : 4); rrect(-300, -32, 600, 64, 14, sel ? '#fff6e0' : '#cdb98e');
      ctx.font = `26px ${FONT_TITLE}`; ctx.fillStyle = D.color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText((sel ? '► ' : '') + D.name, -280, -8);
      ctx.font = `15px ${FONT_TEXT}`; ctx.fillStyle = INK; ctx.fillText(D.desc, -280, 18);
      ctx.restore();
    });
    ink(4); rrect(W / 2 - 300, 420, 600, 64, 12, '#fff6e0');
    ctx.font = `16px ${FONT_TEXT}`; ctx.fillStyle = '#8a3a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('A dificuldade fica TRAVADA neste save.', W / 2, 442);
    ctx.fillStyle = INK; ctx.fillText('Depois, só dá para baixar (em Opções), sem volta.', W / 2, 464);
    ctx.font = `14px ${FONT_TEXT}`; ctx.fillStyle = CREAM; ctx.lineWidth = 4; ctx.strokeStyle = INK;
    ctx.strokeText('↑/↓ escolher · Z confirmar · Esc voltar', W / 2, 508); ctx.fillText('↑/↓ escolher · Z confirmar · Esc voltar', W / 2, 508);
  }
}
