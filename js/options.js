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
  constructor(onClose) { this.onClose = onClose; this.sel = 0; this.t = 0; this.sub = null; this.msg = ''; this.editing = false; }
  items() {
    const o = opt();
    const toggle = (k) => () => { o[k] = !o[k]; };
    return [
      { label: 'Dificuldade', val: () => curDiff().name, adj: (d) => cycleDiff(d) },
      { label: 'Volume da música', val: () => volBar(o.music), adj: (d) => { o.music = clamp(o.music + d, 0, 10); Snd.applyVolume(); } },
      { label: 'Volume dos efeitos', val: () => volBar(o.sfx), adj: (d) => { o.sfx = clamp(o.sfx + d, 0, 10); Snd.applyVolume(); Snd.play('select'); } },
      { label: 'Som geral', val: () => (Save.data.muted ? 'Mudo' : 'Ligado'), adj: () => Snd.toggleMute() },
      { label: 'Tremor de tela', val: () => (o.shake ? 'Ligado' : 'Desligado'), adj: toggle('shake') },
      { label: 'Efeito de filme antigo', val: () => (o.film ? 'Ligado' : 'Desligado'), adj: toggle('film') },
      { label: 'Botões de toque na tela', val: () => ({ auto: 'Automático', on: 'Sempre', off: 'Nunca' })[o.touch], adj: (d) => { const m = ['auto', 'on', 'off']; o.touch = m[(m.indexOf(o.touch) + (d < 0 ? 2 : 1)) % 3]; Touch.apply(); } },
      { label: 'Opacidade dos botões', val: () => `${Math.round(o.tOpacity * 100)}%`, adj: (d) => { o.tOpacity = clamp(Math.round((o.tOpacity + d * 0.05) * 100) / 100, 0.1, 1); Touch.apply(); } },
      { label: 'Tamanho dos botões', val: () => `${Math.round(o.tScale * 100)}%`, adj: (d) => { o.tScale = clamp(Math.round((o.tScale + d * 0.05) * 100) / 100, 0.6, 1.6); Touch.apply(); } },
      { label: 'Posição dos botões', val: () => 'Arrastar ►', act: () => { this.editing = true; Touch.startEdit(() => { this.editing = false; this.msg = 'Layout dos botões salvo.'; }); } },
      { label: 'Teclas · 1 Jogador', val: () => 'Configurar ►', act: () => { this.sub = new KeyBind('solo', () => { this.sub = null; }); } },
      { label: 'Teclas · Jogador 1 (2J)', val: () => 'Configurar ►', act: () => { this.sub = new KeyBind('p1', () => { this.sub = null; }); } },
      { label: 'Teclas · Jogador 2 (2J)', val: () => 'Configurar ►', act: () => { this.sub = new KeyBind('p2', () => { this.sub = null; }); } },
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
    if (pressed.up) { this.sel = (this.sel + n - 1) % n; Snd.play('select'); }
    if (pressed.down) { this.sel = (this.sel + 1) % n; Snd.play('select'); }
    const cur = it[this.sel];
    if ((pressed.left || pressed.right) && cur.adj) { cur.adj(pressed.left ? -1 : 1); Save.write(); this.msg = ''; }
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
      const yy = y + 86 + i * 26, sel = i === this.sel;
      if (sel) { ctx.fillStyle = 'rgba(200,53,43,.14)'; ctx.fillRect(x + 22, yy - 13, w - 44, 26); }
      ctx.font = `${sel ? 19 : 17}px ${FONT_TITLE}`; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillStyle = sel ? '#c8352b' : INK; ctx.fillText((sel ? '► ' : '') + row.label, x + 34, yy);
      ctx.font = `17px ${FONT_TEXT}`; ctx.textAlign = 'right'; ctx.fillStyle = INK;
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
