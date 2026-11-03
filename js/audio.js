'use strict';
// ===== Som: efeitos sintetizados e trilha de jazz/ragtime procedural =====

const Snd = {
  ac: null, master: null, sfxBus: null, musicBus: null,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain(); this.master.gain.value = Save.data.muted ? 0 : 0.55;
      // filtro passa-baixa para soar como disco antigo
      const lp = this.ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
      const hp = this.ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120;
      this.master.connect(lp); lp.connect(hp); hp.connect(this.ac.destination);
      this.sfxBus = this.ac.createGain(); this.sfxBus.connect(this.master);
      this.musicBus = this.ac.createGain(); this.applyVolume(); this.musicBus.connect(this.master);
      const len = this.ac.sampleRate * 0.5;
      this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      Music.start();
    } catch (e) { this.ac = null; }
  },
  applyVolume() {
    if (!this.ac) return;
    this.sfxBus.gain.value = 0.0875 * opt().sfx;
    this.musicBus.gain.value = 0.045 * opt().music;
  },
  toggleMute() {
    Save.data.muted = !Save.data.muted; Save.write();
    if (this.master) this.master.gain.value = Save.data.muted ? 0 : 0.55;
  },
  tone(freq, dur, type = 'square', vol = 0.15, slide = 0, when = 0, bus) {
    if (!this.ac) return;
    const t = this.ac.currentTime + when;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.2, freq = 2000, when = 0, bus) {
    if (!this.ac) return;
    const t = this.ac.currentTime + when;
    const s = this.ac.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = this.ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || this.sfxBus); s.start(t); s.stop(t + dur + 0.02);
  },
  play(name) {
    if (!this.ac) return;
    switch (name) {
      case 'shoot': this.tone(rand(700, 820), 0.05, 'square', 0.035, -300); break;
      case 'shoot2': this.tone(rand(420, 500), 0.06, 'triangle', 0.07, -160); break;
      case 'hit': this.noise(0.05, 0.06, 3000); break;
      case 'jump': this.tone(300, 0.15, 'square', 0.07, 400); break;
      case 'dash': this.noise(0.18, 0.15, 900); break;
      case 'parry': this.tone(880, 0.1, 'square', 0.12); this.tone(1320, 0.18, 'square', 0.1, 0, 0.07); break;
      case 'hurt': this.tone(220, 0.35, 'sawtooth', 0.18, -150); this.noise(0.25, 0.2, 600); break;
      case 'ex': this.noise(0.3, 0.25, 400); this.tone(160, 0.3, 'sawtooth', 0.15, 300); break;
      case 'super': for (let i = 0; i < 6; i++) this.tone(200 + i * 80, 0.25, 'sawtooth', 0.1, 200, i * 0.06); this.noise(1.2, 0.25, 500); break;
      case 'boom': this.noise(0.6, 0.35, 180); this.tone(90, 0.5, 'sine', 0.3, -50); break;
      case 'select': this.tone(660, 0.07, 'square', 0.08); break;
      case 'confirm': this.tone(523, 0.09, 'square', 0.1); this.tone(784, 0.14, 'square', 0.1, 0, 0.08); break;
      case 'bell': [1, 1.5, 2].forEach((m, i) => this.tone(520 * m, 1.2, 'sine', 0.12, 0, i * 0.01)); break;
      case 'warn': this.tone(1100, 0.06, 'square', 0.05); break;
      case 'zap': this.noise(0.35, 0.3, 2500); this.tone(1400, 0.3, 'sawtooth', 0.1, -1200); break;
      case 'honk': this.tone(180, 0.25, 'sawtooth', 0.12, 60); this.tone(240, 0.25, 'square', 0.06, 60); break;
      case 'cuckoo': this.tone(780, 0.15, 'sine', 0.15); this.tone(620, 0.2, 'sine', 0.15, 0, 0.18); break;
      case 'revive': [660, 880, 1100].forEach((f, i) => this.tone(f, 0.18, 'square', 0.09, 0, i * 0.07)); break;
      case 'whistle': this.tone(880, 0.6, 'square', 0.08, 40); this.tone(1100, 0.6, 'square', 0.06, 40); this.noise(0.6, 0.12, 3000); break;
      case 'poof': this.noise(0.3, 0.25, 1200); this.tone(500, 0.2, 'sine', 0.1, 400); break;
      case 'chord': [262, 330, 392].forEach((f) => this.tone(f * rand(0.98, 1.02), 0.4, 'triangle', 0.09)); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 'square', 0.1, 0, i * 0.12)); break;
      case 'lose': [392, 370, 349, 262].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.15, 0, i * 0.22)); break;
    }
  },
};

// ---------- Sequenciador de música ----------
const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);
const CH = { maj: [0, 4, 7], min: [0, 3, 7], dom: [0, 4, 7, 10], dim: [0, 3, 6, 9], m7: [0, 3, 7, 10] };
const SONGS = {
  title: { bpm: 150, prog: [[60, 'maj'], [60, 'maj'], [57, 'dom'], [57, 'dom'], [62, 'dom'], [62, 'dom'], [55, 'dom'], [55, 'dom']], seed: 3, lead: 'square' },
  map: { bpm: 120, prog: [[65, 'maj'], [62, 'm7'], [67, 'm7'], [60, 'dom']], seed: 9, lead: 'triangle' },
  boss1: { bpm: 176, prog: [[57, 'min'], [57, 'min'], [62, 'min'], [64, 'dom'], [57, 'min'], [53, 'dom'], [64, 'dom'], [64, 'dom']], seed: 21, lead: 'square' },
  boss2: { bpm: 164, prog: [[62, 'min'], [58, 'dom'], [57, 'dom'], [62, 'min'], [55, 'min'], [57, 'dom'], [62, 'min'], [57, 'dom']], seed: 44, lead: 'sawtooth' },
  boss3: { bpm: 188, prog: [[59, 'min'], [55, 'dom'], [52, 'min'], [54, 'dom'], [59, 'min'], [52, 'min'], [54, 'dom'], [54, 'dim']], seed: 77, lead: 'square' },
  boss4: { bpm: 168, prog: [[60, 'maj'], [57, 'm7'], [62, 'm7'], [55, 'dom'], [60, 'maj'], [64, 'dom'], [57, 'min'], [55, 'dom']], seed: 101, lead: 'triangle' },
  boss5: { bpm: 158, prog: [[62, 'min'], [62, 'min'], [55, 'min'], [57, 'dom'], [58, 'maj'], [55, 'min'], [57, 'dom'], [57, 'dom']], seed: 131, lead: 'square' },
  boss6: { bpm: 196, prog: [[55, 'maj'], [55, 'maj'], [60, 'maj'], [62, 'dom'], [55, 'maj'], [52, 'min'], [57, 'dom'], [62, 'dom']], seed: 171, lead: 'sawtooth' },
  shop: { bpm: 104, prog: [[62, 'm7'], [55, 'dom'], [60, 'maj'], [57, 'dom']], seed: 211, lead: 'triangle' },
  ending: { bpm: 110, prog: [[60, 'maj'], [64, 'm7'], [65, 'maj'], [67, 'dom']], seed: 5, lead: 'triangle' },
};
const Music = {
  song: null, nextTime: 0, step: 0, timer: null, melody: null,
  start() { if (this.timer) return; this.timer = setInterval(() => this.schedule(), 25); },
  play(name) {
    if (this.song === SONGS[name]) return;
    this.song = SONGS[name] || null; this.step = 0;
    if (this.song) this.melody = this.compose(this.song);
    if (Snd.ac) this.nextTime = Snd.ac.currentTime + 0.1;
  },
  stop() { this.song = null; },
  compose(s) {
    // melodia determinística baseada nos acordes
    let seed = s.seed;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const notes = [];
    let prev = 0;
    for (let bar = 0; bar < s.prog.length; bar++) {
      const [root, q] = s.prog[bar]; const tones = CH[q];
      for (let i = 0; i < 8; i++) {
        if (rnd() < (i % 2 ? 0.35 : 0.15)) { notes.push(null); continue; }
        let deg = tones[(rnd() * tones.length) | 0] + (rnd() < 0.5 ? 12 : 24);
        if (i % 2 && rnd() < 0.4) deg = prev + (rnd() < 0.5 ? 1 : -1) * 2; // nota de passagem
        prev = deg; notes.push(root + deg - 12);
      }
    }
    return notes;
  },
  schedule() {
    if (!Snd.ac || !this.song) return;
    const s = this.song, eighth = 60 / s.bpm / 2;
    if (this.nextTime < Snd.ac.currentTime - 0.2) this.nextTime = Snd.ac.currentTime + 0.05;
    while (this.nextTime < Snd.ac.currentTime + 0.12) {
      const i = this.step, bar = ((i / 8) | 0) % s.prog.length, pos = i % 8;
      const [root, q] = s.prog[bar]; const tones = CH[q];
      const swing = pos % 2 ? eighth * 0.33 : 0;
      const when = this.nextTime + swing - Snd.ac.currentTime;
      const bus = Snd.musicBus;
      // baixo "oom-pah"
      if (pos === 0 || pos === 4) Snd.tone(NOTE(root - 24 + (pos === 4 ? 7 : 0)), eighth * 1.6, 'triangle', 0.5, 0, when, bus);
      if (pos === 2 || pos === 6) tones.slice(0, 3).forEach((t) => Snd.tone(NOTE(root + t), eighth * 0.7, 'square', 0.045, 0, when, bus));
      // bateria
      if (pos === 0 || pos === 4) Snd.noise(0.08, 0.35, 120, when, bus);
      if (pos % 2) Snd.noise(0.04, 0.12, 7000, when, bus);
      if (pos === 2 || pos === 6) Snd.noise(0.1, 0.18, 1800, when, bus);
      // melodia
      const m = this.melody[i % this.melody.length];
      if (m != null) Snd.tone(NOTE(m), eighth * 0.9, s.lead, 0.07, 0, when, bus);
      this.step++; this.nextTime += eighth;
    }
  },
};
