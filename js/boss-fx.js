'use strict';
// ===== Vida extra dos chefões: efeitos de ambiente, flutuação e risadas =====

Nimbo.prototype.floating = true;
Magician.prototype.floating = true;

const fxEvery = (o, key, dt, interval) => { o[key] = (o[key] || 0) - dt; if (o[key] <= 0) { o[key] = interval * rand(0.7, 1.3); return true; } return false; };

Gramophone.prototype.idleFx = function (dt) {
  // notas musicais saindo da corneta no ritmo
  if (fxEvery(this, '_fxN', dt, 0.7)) {
    const m = this.hornMouth();
    Particles.add({ kind: 'text', text: pick(['♪', '♫']), x: m.x + rand(-10, 10), y: m.y + rand(-30, 30), vx: this.face * rand(20, 60), vy: rand(-60, -30), life: 1.2, size: 24, color: '#2a1d14' });
  }
};
Nimbo.prototype.idleFx = function (dt) {
  // garoa caindo da barriga da nuvem
  if (fxEvery(this, '_fxD', dt, this.phase === 3 ? 0.05 : 0.12)) {
    Particles.add({ kind: 'puff', x: this.x + rand(-90, 90), y: this.y + 60, vx: 0, vy: 260, g: 400, life: 0.55, size: 2.5, color: '#9fc4e0' });
  }
};
ClockKing.prototype.idleFx = function (dt) {
  // "tique-taque" visual a cada segundo
  if (fxEvery(this, '_fxT', dt, 1)) Particles.add({ kind: 'text', text: pick(['tic', 'tac']), x: this.x + rand(-140, -110), y: this.y - rand(40, 90), vy: -30, life: 0.8, size: 16, color: '#f4e7c5' });
};
Piano.prototype.idleFx = function (dt) {
  if (fxEvery(this, '_fxN', dt, 0.8)) Particles.add({ kind: 'text', text: pick(['♪', '♫', '♬']), x: this.x + rand(-90, 90), y: this.y - 250, vx: rand(-20, 20), vy: rand(-50, -25), life: 1.3, size: 22, color: '#f4e7c5' });
};
Magician.prototype.idleFx = function (dt) {
  if (this.vis > 0.5 && fxEvery(this, '_fxS', dt, 0.18)) Particles.add({ kind: 'star', x: this.x - 120 + rand(-40, 20), y: this.y + rand(-50, 30), vx: rand(-20, 20), vy: rand(-40, 10), life: 0.5, size: rand(4, 7), vr: 6, color: pick(['#ffd84a', '#fff6e0', '#ff9ad0']) });
};
Train.prototype.idleFx = function (dt) {
  // vapor dos pistões a cada "tchu"
  if (fxEvery(this, '_fxP', dt, 0.4)) Particles.add({ kind: 'puff', x: this.x - 110, y: this.y - 30, vx: rand(-120, -60), vy: rand(-30, 0), life: 0.6, size: 9, color: '#f2efe8' });
  if (this.phase >= 2 && fxEvery(this, '_fxW', dt, 0.25)) Particles.add({ kind: 'star', x: this.x + rand(-60, 70), y: this.y - 4, vx: rand(-80, 80), vy: rand(-140, -60), g: 500, life: 0.4, size: 4, color: '#ffd84a' });
};

const LAUGHS = { gramofone: 'HA HA!', nimbo: 'HO HO!', relogio: 'HM HM!', piano: 'HÁ-HÁ!', cartola: 'TCHARAM!', locomotiva: 'PIUÍ!' };
