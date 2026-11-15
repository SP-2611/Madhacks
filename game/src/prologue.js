// Prologue: how Wisconsin's lead miners gave the state its nickname.
// Kept in its own file so game.js only needs a few hooks:
// Boot starts 'Prologue', Prologue ends on 'Title', and Title uses drawPixelCapitol.
// Uses W, H, FONT from game.js (loaded after this file, used only at runtime).

// ---------- pixel helpers ----------
function pxRows(g, rows, pal, ox, oy) {
  rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (pal[c] !== undefined) { g.fillStyle(pal[c], 1); g.fillRect(ox + x, oy + y, 1, 1); }
  }));
}

const MINER_PAL = {
  K: 0x1a1410, H: 0x6b5a44, h: 0x3a2e24, S: 0xe0b088, s: 0xb8865e, E: 0x1a1410, B: 0x6b4226,
  R: 0x9c3b2e, r: 0x7a2a20, U: 0x2e241c, P: 0x4a5a78, p: 0x36435a, O: 0x3a2a1a
};
const MINER_TOP = [
  '......KKKK......',
  '.....KHHHHK.....',
  '....KHHHHHHK....',
  '....KhhhhhhK....',
  '..KKHHHHHHHHKK..',
  '....KSSSSSSK....',
  '....KSESSESK....',
  '....KSSSSSSK....',
  '....KBBssBBK....',
  '.....KBBBBK.....',
  '...KRURRRRURK...',
  '..KRrURRRRUrRK..',
  '..KRrURRRRUrRK..',
  '..KSKURRRRUKSK..',
  '...KKPPPPPPKK...',
  '....KPPppPPK....'
];
const MINER_LEGS_A = ['....KPPKKPPK....', '....KPPKKPPK....', '...KOOOKKOOOK...', '...KKKK..KKKK...'];
const MINER_LEGS_B = ['....KPPKKPPK....', '...KOOOKKPPK....', '...KKKK.KOOOK...', '........KKKK....'];

// pickaxe pixels in texture space; the right hand sits at (16, 16)
const PICKS = {
  shoulder: {
    W: [[17, 15], [17, 14], [18, 13], [18, 12], [19, 11], [19, 10], [20, 9], [20, 8], [21, 7]],
    I: [[18, 5], [19, 5], [20, 6], [21, 6], [22, 6], [23, 7], [24, 8]]
  },
  up: {
    W: [[16, 15], [16, 14], [16, 13], [16, 12], [16, 11], [16, 10], [16, 9], [16, 8], [16, 7], [16, 6], [16, 5], [16, 4], [16, 3], [16, 2]],
    I: [[12, 2], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 2]]
  },
  down: {
    W: [[17, 16], [18, 17], [19, 17], [20, 18], [21, 18], [22, 19]],
    I: [[22, 15], [23, 16], [23, 17], [23, 18], [23, 19], [23, 20], [23, 21], [22, 22]]
  }
};

function makeMinerTex(scene, key, legs, pick) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  pxRows(g, MINER_TOP.concat(legs), MINER_PAL, 4, 3);
  const P = PICKS[pick];
  g.fillStyle(0x8a5a30, 1); P.W.forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  g.fillStyle(0xaab0b8, 1); P.I.forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  g.fillStyle(0xe0b088, 1); g.fillRect(16, 16, 1, 1); // hand drawn over the handle so it grips it
  g.generateTexture(key, 26, 25);
  g.destroy();
}

// Wisconsin State Capitol in chunky pixels; cx = center, gy = ground line, s = pixel size
function drawPixelCapitol(g, cx, gy, s) {
  const R = (x, y, w, h, c) => { g.fillStyle(c, 1); g.fillRect(Math.round(cx + x * s), Math.round(gy + y * s), w * s, h * s); };
  const L = 0xe8e2d0, M = 0xc9c1aa, D = 0xa39a84, X = 0x5e5848, Y = 0xffd27a, N = 0x3a3d52, G = 0xd4a64a;
  // wings
  R(-62, -24, 124, 24, M); R(-62, -24, 124, 2, L); R(-62, -2, 124, 2, D);
  R(-64, -28, 12, 28, L); R(52, -28, 12, 28, L); R(-64, -28, 12, 2, M); R(52, -28, 12, 2, M);
  R(-60, -20, 4, 6, N); R(56, -20, 4, 6, N); R(-60, -10, 4, 6, Y); R(56, -10, 4, 6, Y);
  for (let x = -48; x <= 46; x += 6) {
    if (Math.abs(x) < 28) continue;
    [-19, -11].forEach((y, k) => R(x, y, 2, 5, ((x + 60) / 6 + k) % 3 ? Y : N));
  }
  // center block, portico, pediment, steps
  R(-26, -38, 52, 38, L); R(-26, -38, 52, 2, M);
  R(-20, -32, 40, 26, X);
  for (let i = 0; i < 6; i++) { const x = -19 + i * 7; R(x, -32, 3, 26, L); R(x + 2, -32, 1, 26, D); }
  R(-21, -34, 42, 2, M);
  for (let i = 0; i < 7; i++) { const w = 21 - i * 3; R(-w, -35 - i, w * 2, 1, i === 0 ? M : L); }
  R(-22, -6, 44, 2, M); R(-24, -4, 48, 2, D); R(-26, -2, 52, 2, X);
  // drum
  R(-20, -46, 40, 4, M); R(-18, -50, 36, 4, M); R(-18, -50, 36, 1, L);
  R(-15, -64, 30, 14, X);
  for (let x = -15; x < 15; x += 3) R(x, -64, 2, 14, L);
  R(-16, -66, 32, 2, M); R(-17, -67, 34, 1, L);
  // dome: stacked rows, lit on the left, shaded on the right, with ribs
  const r = 14, h = 22;
  for (let j = 0; j < h; j++) {
    const w = Math.max(1, Math.round(r * Math.sqrt(1 - (j / h) ** 2)));
    const y = -68 - j;
    R(-w, y, w * 2, 1, L);
    const sh = Math.ceil(w * 0.45);
    R(w - sh, y, sh, 1, D);
    [-8, -3, 3, 8].forEach(rx => { if (Math.abs(rx) < w - 1) R(rx, y, 1, 1, rx > 0 ? X : M); });
  }
  // lantern and gold statue on top
  R(-4, -91, 8, 2, M); R(-3, -96, 6, 5, L); R(-1, -96, 1, 5, X); R(1, -96, 1, 5, X);
  R(-4, -97, 8, 1, M); R(-2, -99, 4, 2, M);
  R(-1, -104, 2, 5, G); R(-2, -102, 1, 1, G); R(1, -103, 1, 1, G);
}

// ======================================================================
class Prologue extends Phaser.Scene {
  constructor() { super('Prologue'); }
  create() {
    this.busy = false; this.leaving = false; this.objs = [];
    makeMinerTex(this, 'minerA', MINER_LEGS_A, 'shoulder');
    makeMinerTex(this, 'minerB', MINER_LEGS_B, 'shoulder');
    makeMinerTex(this, 'minerUp', MINER_LEGS_A, 'up');
    makeMinerTex(this, 'minerDown', MINER_LEGS_A, 'down');
    if (!this.anims.exists('miner_walk')) this.anims.create({ key: 'miner_walk', frames: [{ key: 'minerA' }, { key: 'minerB' }], frameRate: 5, repeat: -1 });
    if (!this.anims.exists('miner_dig')) this.anims.create({ key: 'miner_dig', frames: [{ key: 'minerUp', duration: 450 }, { key: 'minerDown', duration: 300 }], repeat: -1 });

    this.g = this.add.graphics();
    this.add.rectangle(W / 2, H - 78, W - 80, 116, 0x000000, 0.78).setStrokeStyle(2, 0xffffff).setDepth(10);
    this.cap = this.add.text(70, H - 122, '', { fontFamily: FONT, fontSize: '22px', color: '#ffffff', wordWrap: { width: W - 140 }, lineSpacing: 6 }).setDepth(11).setResolution(2);
    this.tag = this.add.text(50, 36, '', { fontFamily: FONT, fontSize: '20px', color: '#ffd166', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setDepth(11).setResolution(2);
    this.add.text(W - 54, H - 28, 'ENTER next · ESC skip', { fontFamily: FONT, fontSize: '13px', color: '#aaaaaa' }).setOrigin(1, 1).setDepth(11).setResolution(2);

    this.panels = [
      { tag: 'Long, long ago', draw: () => this.panelLongAgo(),
        text: 'Every badger has a tale. This one starts long ago. Before there was a campus or a Capitol.' },
      { tag: 'Southwest Wisconsin · 1820s', draw: () => this.panelRush(),
        text: 'Lead was found in the hills of southwest Wisconsin, and thousands of miners rushed in to dig for it.' },
      { tag: 'Winter is coming', draw: () => this.panelHillside(false),
        text: 'With no time to build cabins before winter, many miners dug their shelters straight into the hillsides.' },
      { tag: 'Living like badgers', draw: () => this.panelHillside(true),
        text: 'People joked that they lived like badgers in burrows. The miners got called "Badgers," and the name stuck.' },
      { tag: 'Madison · today', draw: () => this.panelToday(),
        text: 'Badgers have always been diggers. This is the tale of one.' }
    ];
    this.i = -1;
    this.next();
    const adv = () => this.next();
    this.input.keyboard.on('keydown-ENTER', adv);
    this.input.keyboard.on('keydown-E', adv);
    this.input.on('pointerdown', adv);
    this.input.keyboard.once('keydown-ESC', () => this.finish());
  }
  keep(o) { this.objs.push(o); return o; }
  next() {
    if (this.busy || this.leaving) return;
    this.i++;
    if (this.i >= this.panels.length) return this.finish();
    this.busy = true;
    const cam = this.cameras.main;
    const show = () => {
      if (this.leaving) return;
      this.g.clear(); this.objs.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); }); this.objs = [];
      const p = this.panels[this.i];
      this.tag.setText(p.tag); this.cap.setText(p.text); p.draw();
      cam.fadeIn(350);
      this.time.delayedCall(450, () => { this.busy = false; });
    };
    if (this.i === 0) show(); else { cam.fadeOut(250); cam.once('camerafadeoutcomplete', show); }
  }
  // the title is revealed only once the prologue is over
  finish() {
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(700, 0, 0, 0, (c, t) => { if (t === 1) this.scene.start('Title'); }, this);
  }
  sky(top, bottom) { this.g.fillGradientStyle(top, top, bottom, bottom, 1); this.g.fillRect(0, 0, W, H); }
  hills(baseY, amp, color, freq, phase) {
    this.g.fillStyle(color, 1);
    for (let x = 0; x < W; x += 8) { const y = baseY + Math.round(Math.sin(x * freq + phase) * amp / 4) * 4; this.g.fillRect(x, y, 8, H - y); }
  }
  stars(n) { for (let i = 0; i < n; i++) this.g.fillStyle(0xffffff, (i % 3 + 1) / 3).fillRect((i * 97) % W, (i * 53) % 260, 2, 2); }
  moon(x, y) {
    this.g.fillStyle(0xf4ecd0, 1);
    [[2, 0, 6], [1, 1, 8], [0, 2, 10], [0, 3, 10], [0, 4, 10], [0, 5, 10], [0, 6, 10], [0, 7, 10], [1, 8, 8], [2, 9, 6]]
      .forEach(([dx, dy, w]) => this.g.fillRect(x + dx * 4, y + dy * 4, w * 4, 4));
  }
  hole(x, y, lit) {
    const g = this.g;
    g.fillStyle(0x2a1a0c, 1); g.fillRect(x - 26, y - 44, 52, 46);
    g.fillStyle(0x6b4a2a, 1); g.fillRect(x - 22, y - 40, 4, 42); g.fillRect(x + 18, y - 40, 4, 42); g.fillRect(x - 26, y - 44, 52, 6);
    g.fillStyle(0x0d0805, 1); g.fillRect(x - 18, y - 34, 36, 36);
    if (lit) {
      const glow = this.keep(this.add.rectangle(x, y - 12, 14, 14, 0xffb347, 0.9));
      this.tweens.add({ targets: glow, alpha: 0.45, duration: Phaser.Math.Between(300, 600), yoyo: true, repeat: -1 });
    }
  }
  burrow(x, y) {
    this.g.fillStyle(0x2a1a0c, 1); this.g.fillRect(x - 48, y - 16, 96, 24); this.g.fillRect(x - 40, y - 24, 80, 8);
    this.g.fillStyle(0x0d0805, 1); this.g.fillRect(x - 36, y - 12, 72, 16); this.g.fillRect(x - 28, y - 18, 56, 6);
  }
  panelLongAgo() {
    this.sky(0x070a1a, 0x16204a); this.stars(70); this.moon(700, 90);
    this.hills(300, 50, 0x1e2a1c, 0.007, 0.4);
    this.hills(400, 30, 0x141e14, 0.013, 2.2);
    this.burrow(480, 450);
  }
  panelRush() {
    this.sky(0x2a3b6e, 0xe08a5a);
    this.g.fillStyle(0xffd27a, 1); this.g.fillRect(684, 300, 72, 64); this.g.fillRect(692, 292, 56, 80);
    this.hills(330, 40, 0x4a6b3a, 0.008, 0);
    this.hills(410, 24, 0x34502a, 0.015, 2);
    [0, 1, 2].forEach(k => {
      const m = this.keep(this.add.sprite(-80 - k * 160, 418 + (k % 2) * 14, 'minerA').setScale(5));
      m.play({ key: 'miner_walk', startFrame: k % 2 });
      this.tweens.add({ targets: m, x: W + 80, duration: 10000, delay: k * 300 });
    });
  }
  panelHillside(badger) {
    this.sky(0x0b1026, 0x1d2a52); this.stars(40); this.moon(120, 70);
    this.hills(250, 70, 0x5a4128, 0.006, 1);
    this.hills(470, 10, 0x3d2a18, 0.02, 0);
    this.hole(250, 400, true); this.hole(520, 372, true);
    if (!badger) {
      this.hole(790, 410, false);
      this.keep(this.add.sprite(700, 364, 'minerUp').setScale(5)).play('miner_dig');
    } else {
      this.keep(this.add.image(360, 420, 'minerA').setScale(5));
      this.burrow(800, 478);
      const b = this.keep(this.add.sprite(600, 410, 'badger', 0).setScale(2.5).setDepth(1));
      b.play('walk');
      this.tweens.add({ targets: b, x: 700, duration: 1600, onComplete: () => { b.stop(); b.setFrame(0); } });
    }
  }
  panelToday() {
    this.sky(0x0b1026, 0x3a0d1a); this.stars(50);
    drawPixelCapitol(this.g, W / 2 + 80, 470, 3);
    this.g.fillStyle(0x3d2714, 1); this.g.fillRect(0, 470, W, H - 470);
    const b = this.keep(this.add.sprite(-40, 440, 'badger', 0).setScale(2.5).setDepth(1));
    b.play('walk');
    this.tweens.add({ targets: b, x: 200, duration: 2000, onComplete: () => { b.stop(); b.setFrame(0); } });
  }
}
