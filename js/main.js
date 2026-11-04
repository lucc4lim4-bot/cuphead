'use strict';
// ===== Laço principal =====
const Game = {
  scene: null,
  toastMsg: '', toastT: 0,
  toast(m) { this.toastMsg = m; this.toastT = 3.5; },
  mode: { coop: false, chars: ['fosforo'] },
  fade: 0, next: null,
  go(scene) { this.next = scene; this.fade = 0.0001; },
  start() {
    Film.init(); buildBackgrounds();
    this.scene = new Title();
    let last = performance.now(), acc = 0;
    const STEP = 1 / 60;
    const frame = (now) => {
      acc += Math.min(0.1, (now - last) / 1000); last = now;
      while (acc >= STEP) { this.tick(STEP); acc -= STEP; }
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },
  tick(dt) {
    Pads.poll();
    if (this.fade > 0) {
      // transição em "íris" estilo desenho antigo
      this.fade += dt * 3;
      if (this.next && this.fade >= 1) { this.scene = this.next; this.next = null; }
      if (this.fade >= 2) this.fade = 0;
    } else this.scene.update(dt);
    if (pressed.mute && !(this.scene instanceof Title)) Snd.toggleMute();
    Net.update();
    this.toastT = Math.max(0, this.toastT - dt);
    clearPressed();
  },
  render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    this.scene.draw();
    Film.draw();
    if (this.toastT > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, this.toastT * 2);
      ctx.font = `18px ${FONT_TEXT}`; const w = ctx.measureText(this.toastMsg).width + 40;
      ink(4); rrect(W / 2 - w / 2, H - 92, w, 40, 12, '#fff6e0');
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.toastMsg, W / 2, H - 72);
      ctx.restore();
    }
    if (this.fade > 0) {
      const k = this.fade < 1 ? 1 - this.fade : this.fade - 1;
      const r = Math.max(0, k) * 620;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, r, 0, TAU, true);
      ctx.fillStyle = '#0c0805'; ctx.fill('evenodd'); ctx.restore();
    }
  },
};

const fontsReady = document.fonts && document.fonts.load
  ? Promise.all([document.fonts.load('40px "Rye"'), document.fonts.load('20px "Special Elite"')]).catch(() => {})
  : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => Game.start());
