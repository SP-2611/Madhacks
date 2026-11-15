// Prologue music: an original 8-bit folk tune, synthesized live with Web Audio (no audio files).
// A minor, 96 BPM, 16 bars. Bars 1-8 are quiet and wistful (the miners, long ago);
// bars 9-16 add drums and climb higher (the Badger name, Madison today).
// Loaded after prologue.js and hooks onto the Prologue scene, so prologue.js needs no edits.

const ChipMusic = (() => {
  const BPM = 96, STEP = 60 / BPM / 4; // one 16th note
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);

  // melody as [midi, length in 8th notes] per bar; 0 = rest
  const MELODY = [
    [[69, 2], [72, 2], [76, 3], [74, 1]],
    [[72, 2], [69, 2], [65, 4]],
    [[67, 2], [72, 2], [76, 2], [79, 2]],
    [[77, 2], [76, 2], [74, 4]],
    [[76, 2], [81, 2], [79, 1], [77, 1], [76, 2]],
    [[77, 2], [76, 1], [74, 1], [72, 4]],
    [[74, 2], [71, 2], [67, 2], [71, 2]],
    [[76, 6], [0, 2]],
    [[81, 2], [79, 2], [77, 2], [81, 2]],
    [[79, 4], [76, 2], [72, 2]],
    [[74, 2], [76, 2], [77, 2], [74, 2]],
    [[76, 6], [0, 2]],
    [[77, 2], [81, 2], [84, 2], [81, 2]],
    [[83, 2], [79, 2], [74, 2], [71, 2]],
    [[80, 2], [76, 2], [71, 2], [74, 2]],
    [[81, 6], [0, 2]]
  ];
  const ROOTS = [45, 41, 48, 43, 45, 41, 43, 40, 41, 48, 43, 45, 41, 43, 40, 45];
  const CHORDS = { 45: [57, 60, 64], 41: [53, 57, 60], 48: [55, 60, 64], 43: [55, 59, 62], 40: [56, 59, 64] };

  // flatten the melody into a lookup by 16th-note step
  const LEAD = {};
  MELODY.forEach((bar, b) => { let pos = b * 16; bar.forEach(([m, len]) => { if (m) LEAD[pos] = [m, len * 2]; pos += len * 2; }); });

  let ctx, master, pulse25, pulse12, noise, timer, next = 0, step = 0, playing = false;

  function pulseWave(duty) {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  }
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    pulse25 = pulseWave(0.25); pulse12 = pulseWave(0.125);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone(wave, freq, t, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol * 0.7, t + Math.min(0.05, dur / 2));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function hit(t, dur, vol, hp) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.16);
  }
  function tick() {
    while (next < ctx.currentTime + 0.15) {
      const i = step % 256, bar = i >> 4, s = i % 16, root = ROOTS[bar], chord = CHORDS[root];
      const lead = LEAD[i];
      if (lead) tone(pulse25, mf(lead[0]), next, lead[1] * STEP * 0.92, 0.09);
      if (s % 4 === 0) tone('triangle', mf(root + [0, 7, 12, 7][s / 4]), next, STEP * 3.6, 0.28);
      tone(pulse12, mf(chord[s % 3] + 12), next, STEP * 0.8, bar < 8 ? 0.02 : 0.03);
      if (bar >= 8) {
        if (s === 0 || s === 8) kick(next);
        if (s === 4 || s === 12) hit(next, 0.12, 0.12, 1500);
        if (s % 2 === 0) hit(next, 0.03, 0.04, 7000);
      }
      next += STEP; step++;
    }
  }
  return {
    play() {
      init();
      if (playing) return;
      playing = true; step = 0; next = ctx.currentTime + 0.1;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
      clearInterval(timer); timer = setInterval(tick, 25);
      ctx.resume();
    },
    // browsers keep audio muted until the first key press or click
    unlock() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    stop(fade = 1.2) {
      if (!ctx || !playing) return;
      playing = false;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + fade);
      setTimeout(() => { if (!playing) clearInterval(timer); }, fade * 1000 + 100);
    }
  };
})();

// hook onto the Prologue scene without editing prologue.js
(() => {
  const create = Prologue.prototype.create, finish = Prologue.prototype.finish;
  Prologue.prototype.create = function () {
    create.call(this);
    ChipMusic.play();
    this.input.keyboard.on('keydown', ChipMusic.unlock);
    this.input.on('pointerdown', ChipMusic.unlock);
  };
  Prologue.prototype.finish = function () {
    if (!this.leaving) ChipMusic.stop(1.2);
    finish.call(this);
  };
})();
