// The Tale of the Badger · Chapter 1 core
// Shared by every Ch 1 scene: settings, night state (S), quests + lessons, texture helpers,
// Boot (makes textures, picks the start scene), UI overlay (HUD, dialogue, phone), Walk base class.
// Load order: phaser → sprite → prologue → music → core → scenes/* → main

// Tale of the Badger — Chapter 1: Dig In
// Phaser 3, no build step. Open index.html in a browser.

const W = 960, H = 640;
// Render scale: the canvas is drawn at (W*RS x H*RS) real pixels and every camera zooms by RS,
// so text and shapes are sharp instead of a blown-up 960x640 image.
const RS = Math.max(1, Math.min(3, Math.round(Math.min(window.innerWidth / W, window.innerHeight / H) * (window.devicePixelRatio || 1))));
const RES_UI = RS + 1;               // text texture resolution for HUD / dialog / phone
const RES_WORLD = Math.ceil(RS * 3); // world text (camera zoom up to ~2x on top of RS)
function fitCam(scene) { scene.cameras.main.setZoom(RS).centerOn(W / 2, H / 2); }
const FONT = 'Verdana, "Segoe UI", Tahoma, sans-serif';
const UW_RED = 0xc5050c;

// ---------- shared night state ----------
const CHAR_D = 2000; // characters always draw above furniture
const STEPS = [
  { id: 'knock', label: 'Knock on the party house door (E)' },
  { id: 'tail', label: 'Show off your tail to the kitchen crowd (SPACE)' },
  { id: 'kitchen', label: 'Dig in: the beer stack or the punch bowl' },
  { id: 'pong', label: 'Beer pong in the living room · 10:30 PM' },
  { id: 'bathroom', label: 'Check on whoever is in the bathroom' },
  { id: 'balcony', label: 'Get some air on the balcony' },
  { id: 'shots', label: 'Midnight shots · 12:00 AM' },
  { id: 'jake', label: 'Find Jake' },
  { id: 'end', label: '1:30 AM' }
];
const LESSONS = [
  { id: 'no', t: 'Saying no is normal. You don\'t owe anyone a reason.' },
  { id: 'pressure', t: 'Pressure can look like a compliment.' },
  { id: 'mixed', t: 'Mixed drinks hide how strong they are.' },
  { id: 'food', t: 'Food slows how fast alcohol hits you.' },
  { id: 'water', t: 'Water helps you pace. It doesn\'t sober you up.' },
  { id: 'check', t: 'Check on people. It matters.' },
  { id: 'time', t: 'Only time sobers you up.' },
  { id: 'shots', t: 'Shots hit way faster than beer.' },
  { id: 'signs', t: 'Alcohol poisoning: can\'t wake up, slow breathing, vomiting, cold/clammy skin.' },
  { id: 'call', t: 'Roll them on their side, call 911, stay with them.' },
  { id: 'energy', t: 'Energy drinks + alcohol: the caffeine hides how drunk you are, so you keep drinking.' }
];
const LEARNED = new Set(); // knowledge carries over when you dig back
const S = {};
function resetState(rewind) {
  Object.assign(S, {
    rewind, depth: 0, peak: 0, drinks: 0, water: 0, chips: 0, chipsBuffer: 0,
    minutes: 0, refused: 0, checkedBathroom: false, talkedMaya: false,
    holdingWater: false, jakeDrunk: 0, flags: {}, current: null, done: []
  });
}
resetState(false);

function timeStr(m) {
  const total = 21 * 60 + m;
  const h24 = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${h24 % 12 || 12}:${mm.toString().padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

// drunk text: swap one pair of letters in some longer words, so it looks off but stays readable
function scramble(s) {
  return s.split(' ').map(w => {
    if (w.length < 5 || Math.random() < 0.5) return w;
    const a = w.split('');
    const i = 1 + Math.floor(Math.random() * (a.length - 3));
    [a[i], a[i + 1]] = [a[i + 1], a[i]];
    return a.join('');
  }).join(' ');
}

const SPEAKER_COLORS = {
  BUCKY: '#ff5a5f', JAKE: '#6fb3ff', TYLER: '#ffd166', BRODY: '#f4f4f4',
  KAYLA: '#ff8fd8', MAYA: '#7ee0a1', VOICE: '#aaaaaa', CROWD: '#ffb36b', CHAD: '#c6ff4d'
};

// ---------- texture helpers ----------
function pixelTex(scene, key, w, h, s, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const p = (x, y, ww, hh, c) => { g.fillStyle(c, 1); g.fillRect(x * s, y * s, ww * s, hh * s); };
  draw(p);
  g.generateTexture(key, w * s, h * s);
  g.destroy();
}

function makePerson(scene, key, o) {
  const skin = o.skin || 0xf1c27d, dark = 0x111111;
  pixelTex(scene, key, 14, 23, 2, p => {
    // outlines
    p(2, 0, 10, 9, dark); p(1, 7, 12, 10, dark); p(2, 16, 4, 7, dark); p(8, 16, 4, 7, dark);
    if (o.long) { p(1, 1, 12, 9, dark); }
    // hair + head
    if (o.long) { p(2, 2, 1, 7, o.hair); p(11, 2, 1, 7, o.hair); }
    p(3, 2, 8, 6, skin);
    p(3, 1, 8, 2, o.hair); p(4, 1, 6, 1, o.hair);
    if (o.cap) { p(3, 1, 8, 2, o.cap); p(9, 2, 3, 1, o.cap); }
    p(5, 4, 1, 1, dark); p(8, 4, 1, 1, dark); p(6, 6, 2, 1, 0x9b4a3a);
    // body
    p(2, 8, 10, 8, o.shirt);
    p(2, 13, 1, 3, skin); p(11, 13, 1, 3, skin);
    // legs
    p(3, 16, 2, 6, o.pants || 0x2d3a5a); p(9, 16, 2, 6, o.pants || 0x2d3a5a);
    p(3, 22, 2, 1, dark); p(9, 22, 2, 1, dark);
  });
}

function makeChair(scene, key, color) {
  const g = scene.make.graphics({ add: false });
  const cx = 30, cy = 44;
  for (let i = 0; i <= 8; i++) {
    const a = Phaser.Math.DegToRad(200 + i * 17.5);
    g.lineStyle(6, 0x222222, 1);
    g.lineBetween(cx, cy, cx + Math.cos(a) * 28, cy + Math.sin(a) * 28);
  }
  for (let i = 0; i <= 8; i++) {
    const a = Phaser.Math.DegToRad(200 + i * 17.5);
    g.lineStyle(4, color, 1);
    g.lineBetween(cx, cy, cx + Math.cos(a) * 27, cy + Math.sin(a) * 27);
  }
  g.fillStyle(0x222222, 1); g.fillRect(8, 41, 44, 9);
  g.fillStyle(color, 1); g.fillRect(9, 42, 42, 7);
  g.lineStyle(3, 0x333333, 1);
  g.lineBetween(12, 49, 9, 62); g.lineBetween(48, 49, 51, 62);
  g.generateTexture(key, 60, 64);
  g.destroy();
}

// Wisconsin State Capitol, drawn in code. (cx, gy) = center of the base on the ground.
function drawCapitol(g, cx, gy, sc, body, shade, lit) {
  const R = (x, y, w, h, c) => { g.fillStyle(c, 1); g.fillRect(cx + x * sc, gy + y * sc, w * sc, h * sc); };
  // dome first, so the drum + colonnade cover its lower half
  g.fillStyle(body, 1); g.fillEllipse(cx, gy - 160 * sc, 92 * sc, 130 * sc);
  g.fillStyle(shade, 0.45); g.fillEllipse(cx + 16 * sc, gy - 158 * sc, 46 * sc, 116 * sc);
  g.lineStyle(Math.max(1, 1.5 * sc), shade, 0.7);
  [-28, -14, 0, 14, 28].forEach(dx => g.lineBetween(cx + dx * 0.2 * sc, gy - 218 * sc, cx + dx * sc, gy - 164 * sc));
  R(-8, -240, 16, 20, body); R(-8, -240, 5, 20, shade);       // lantern
  R(-2, -256, 4, 16, 0xd4af37); g.fillStyle(0xd4af37, 1); g.fillCircle(cx, gy - 258 * sc, 3.5 * sc); // gold statue
  R(-50, -162, 100, 10, body);                                  // ring under dome
  R(-46, -152, 92, 36, shade);                                  // drum
  for (let i = 0; i < 10; i++) R(-44 + i * 9.6, -152, 5, 36, body); // columns
  R(-56, -118, 112, 8, body);
  R(-150, -50, 300, 50, body);                                  // wings
  R(-150, -50, 300, 6, shade);
  R(-66, -82, 132, 82, body);                                   // center block
  R(-72, -90, 144, 10, shade);
  g.fillStyle(body, 1); g.fillTriangle(cx - 60 * sc, gy - 90 * sc, cx, gy - 112 * sc, cx + 60 * sc, gy - 90 * sc); // pediment
  for (let i = 0; i < 6; i++) R(-58 + i * 22, -78, 8, 70, shade); // portico columns
  for (let i = 0; i < 12; i++) { if (Math.abs(-140 + i * 24) > 70) R(-140 + i * 24, -38, 9, 14, lit); }
  R(-150, -6, 300, 6, shade);                                   // steps
}

// ======================================================================
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.load.spritesheet('badger', BADGER_PNG, { frameWidth: 50, frameHeight: 48 });
  }
  create() {
    const P = (k, o) => makePerson(this, k, o);
    P('tyler', { shirt: UW_RED, hair: 0x3b2a1a });
    P('jake', { shirt: 0x2b6cb0, hair: 0xd8b04a });
    P('brody', { shirt: 0xe8e8e8, hair: 0x222222, cap: UW_RED, skin: 0xd9a066 });
    P('kayla', { shirt: 0xd65db1, hair: 0x6b3e26, long: true });
    P('maya', { shirt: 0x3a8a5c, hair: 0x151515, long: true, skin: 0xc68642 });
    P('d1', { shirt: 0xf2c94c, hair: 0x4a2a10, skin: 0x8d5524 });
    P('d2', { shirt: 0x9b51e0, hair: 0xe0b060, long: true });
    P('d3', { shirt: 0x56ccf2, hair: 0x222222, skin: 0xe0ac69 });
    P('p1', { shirt: 0xeb5757, hair: 0x5a3a1a });
    P('p2', { shirt: 0x27ae60, hair: 0x111111, skin: 0x8d5524 });
    P('couch', { shirt: 0x828282, hair: 0x9a6a3a });
    P('chad', { shirt: 0x111111, hair: 0xe8d27a, cap: 0x6bdc3a });

    pixelTex(this, 'px', 1, 1, 2, p => p(0, 0, 1, 1, 0xffffff));
    pixelTex(this, 'can', 4, 7, 2, p => {
      p(0, 0, 4, 1, 0xcccccc); p(0, 1, 4, 6, 0xc0392b); p(0, 3, 4, 1, 0xffffff);
    });
    pixelTex(this, 'can2', 4, 7, 2, p => {
      p(0, 0, 4, 1, 0xcccccc); p(0, 1, 4, 6, 0x2d6cdf); p(0, 3, 4, 1, 0xdddddd);
    });
    pixelTex(this, 'whiteMonster', 4, 8, 2, p => {
      p(0, 0, 4, 1, 0xbbbbbb); p(0, 1, 4, 7, 0xf4f4f4); p(1, 2, 1, 4, 0x6bdc3a); p(2, 3, 1, 3, 0x6bdc3a); p(0, 7, 4, 1, 0xcfcfcf);
    });
    pixelTex(this, 'canOpen', 4, 7, 2, p => {
      p(0, 0, 4, 1, 0xcccccc); p(1, 0, 1, 1, 0x222222); p(0, 1, 4, 6, 0xc0392b); p(0, 3, 4, 1, 0xffffff); p(0, 6, 4, 1, 0x8e2a20);
    });
    pixelTex(this, 'canOpen2', 4, 7, 2, p => {
      p(0, 0, 4, 1, 0xcccccc); p(2, 0, 1, 1, 0x222222); p(0, 1, 4, 6, 0x2d6cdf); p(0, 3, 4, 1, 0xdddddd); p(0, 6, 4, 1, 0x1f4ea3);
    });
    pixelTex(this, 'cup', 5, 6, 2, p => {
      p(0, 0, 5, 1, 0xffffff); p(0, 1, 5, 4, 0xd62828); p(1, 5, 3, 1, 0xd62828);
    });

    // tail
    const TAIL = [
      '....KKKK....',
      '..KKDMMLKK..',
      '.KDDMMLLWWK.',
      'KDDMMLLWWWWK',
      'KDDDMMLWWWK.',
      '.KKDDMMKKK..',
      '...KKKK.....'];
    const TC = { K: 0x1a1410, D: 0x4a3628, M: 0x7a5e48, L: 0xa88a6e, W: 0xeee6d6 };
    pixelTex(this, 'tail', 12, 7, 2, p => TAIL.forEach((r, y) => [...r].forEach((c, x) => { if (TC[c]) p(x, y, 1, 1, TC[c]); })));

    makeChair(this, 'chair_o', 0xf28c28);
    makeChair(this, 'chair_y', 0xf2c81e);
    makeChair(this, 'chair_g', 0x3fa34d);

    // vignette
    const vt = this.textures.createCanvas('vignette', W, H);
    const ctx = vt.getContext();
    const grd = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.62);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    vt.refresh();

    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('badger', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    // ?scene=Name jumps straight to one scene (used by scenes/test.html); default is the full game
    const q = new URLSearchParams(location.search);
    if (q.has('scene')) {
      resetState(q.get('rewind') === '1');
      if (q.has('drinks')) { S.drinks = +q.get('drinks'); S.peak = Math.min(10, S.drinks * 2); }
    }
    this.scene.start(q.get('scene') || 'Title');
  }
}

// ======================================================================
// UI overlay scene (own camera, so the drunk camera sway never rotates it)
class UI extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    fitCam(this);
    this.open = false;
    this.closedAt = 0;
    this.objText = null; // recreated per scene (old one is destroyed on restart)
    this.vignette = this.add.image(W / 2, H / 2, 'vignette').setAlpha(0);

    // HUD
    this.hud = this.add.container(0, 0).setVisible(false);
    const clockBg = this.add.rectangle(16, 16, 170, 40, 0x000000, 0.6).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.6);
    this.clock = this.add.text(28, 25, '9:00 PM', { fontFamily: FONT, fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setResolution(RES_UI);
    // depth meter
    const mx = W - 54, my = 90, mh = 300;
    const meterBg = this.add.rectangle(mx, my, 34, mh, 0x2a1a0e).setOrigin(0.5, 0).setStrokeStyle(3, 0xffffff, 0.8);
    const layers = this.add.graphics();
    const cols = [0x5c3d22, 0x4d321b, 0x3d2714, 0x2e1d0e, 0x1f1308];
    cols.forEach((c, i) => { layers.fillStyle(c, 1); layers.fillRect(mx - 15, my + i * (mh / 5), 30, mh / 5); });
    this.meterFill = this.add.rectangle(mx, my, 30, 0, 0x000000, 0.75).setOrigin(0.5, 0);
    this.meterIcon = this.add.sprite(mx, my, 'badger', 0).setScale(0.6);
    const lbl = this.add.text(mx, my - 26, 'DEPTH', { fontFamily: FONT, fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setResolution(RES_UI);
    const surf = this.add.text(mx - 26, my - 2, 'surface', { fontFamily: FONT, fontSize: '10px', color: '#cccccc' }).setOrigin(1, 0.5).setResolution(RES_UI);
    const bottom = this.add.text(mx - 26, my + mh, 'blackout', { fontFamily: FONT, fontSize: '10px', color: '#ff6b6b' }).setOrigin(1, 0.5).setResolution(RES_UI);
    this.meter = { x: mx, y: my, h: mh };
    this.status = this.add.text(16, 66, '', { fontFamily: FONT, fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 4, lineSpacing: 4 }).setResolution(RES_UI);
    this.hint = this.add.text(W / 2, H - 14, 'WASD: move   E: interact   SPACE: tail shake   ↑: phone', { fontFamily: FONT, fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5, 1).setResolution(RES_UI);
    this.hint.setVisible(false);
    this.hud.add([clockBg, this.clock, meterBg, layers, this.meterFill, this.meterIcon, lbl, surf, bottom, this.status]);

    this.toastText = this.add.text(W / 2, 130, '', { fontFamily: FONT, fontSize: '19px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 10, y: 6 }, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5).setAlpha(0).setResolution(RES_UI);
    this.bannerText = this.add.text(W / 2, H / 2 - 60, '', { fontFamily: FONT, fontSize: '44px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0).setResolution(RES_UI);

    // dialog: dim the world behind it (demo-3 style)
    this.dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setAlpha(0);
    this.box = this.add.container(0, 0).setVisible(false);
    const bg = this.add.rectangle(W / 2, H - 127, W - 40, 230, 0x0d0d16, 0.96).setStrokeStyle(3, 0xffffff, 0.9).setInteractive();
    bg.on('pointerdown', () => this.advance());
    this.who = this.add.text(44, H - 232, '', { fontFamily: FONT, fontSize: '21px', fontStyle: 'bold', color: '#ffffff' }).setResolution(RES_UI);
    this.body = this.add.text(44, H - 202, '', { fontFamily: FONT, fontSize: '21px', color: '#ffffff', wordWrap: { width: W - 100 }, lineSpacing: 5 }).setResolution(RES_UI);
    this.more = this.add.text(W - 44, H - 22, '▼ E', { fontFamily: FONT, fontSize: '15px', color: '#bbbbbb' }).setOrigin(1, 1).setResolution(RES_UI);
    this.timerBar = this.add.rectangle(30, H - 250, W - 60, 8, 0xffd166).setOrigin(0, 0.5);
    this.box.add([bg, this.who, this.body, this.more, this.timerBar]);
    this.selBox = this.add.rectangle(46, 0, W - 92, 30, 0xffd166, 0.16).setOrigin(0, 0.5).setStrokeStyle(2, 0xffd166, 0.9).setVisible(false);
    this.box.add(this.selBox);
    this.sel = 0;
    this.choiceTexts = [];
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(60, 0, '', { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#ffd166' }).setResolution(RES_UI).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { if (this.mode === 'choice' && !this.typing) { this.sel = i; this.updateSel(); } });
      t.on('pointerdown', () => this.pick(i));
      this.choiceTexts.push(t);
      this.box.add(t);
    }

    this.buildPhone();
    this.input.keyboard.on('keydown', e => this.onKey(e));
  }

  // ----- phone (plain version of the demo-3 phone) -----
  buildPhone() {
    const PW = 300, PH = 540;
    this.phoneOpen = false;
    this.phoneTab = 0;
    this.phoneDim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setAlpha(0);
    this.phone = this.add.container(W - PW - 60, H + 20);
    const g = this.add.graphics();
    g.fillStyle(0xf5f5f5, 1); g.fillRoundedRect(0, 0, PW, PH, 30);
    g.fillStyle(0x0a0a0d, 1); g.fillRoundedRect(6, 6, PW - 12, PH - 12, 25);
    g.fillStyle(0xf5f5f5, 1); g.fillRoundedRect(PW / 2 - 35, 18, 70, 8, 4);
    g.fillStyle(0xffffff, 1); g.fillRect(20, 40, PW - 40, PH - 90);
    this.phone.add(g);
    this.phoneClock = this.add.text(30, 48, '', { fontFamily: FONT, fontSize: '13px', color: '#000000' }).setResolution(RES_UI);
    this.phoneTabs = ['Quests', 'Learned'].map((t, i) => this.add.text(34 + i * 130, 70, t, { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff' }).setResolution(RES_UI));
    this.phoneLine = this.add.rectangle(34, 93, 96, 3, 0x34c759).setOrigin(0, 0.5);
    // iMessage-style chat
    this.chatHead = this.add.container(0, 0);
    const hg = this.add.graphics();
    hg.fillStyle(0xf6f6f6, 1); hg.fillRect(20, 100, PW - 40, 52);
    hg.fillStyle(0xd1d1d6, 1); hg.fillRect(20, 152, PW - 40, 1);
    hg.fillStyle(0xc7c7cc, 1); hg.fillCircle(PW / 2, 116, 11);
    this.chatHead.add([hg,
      this.add.text(PW / 2, 116, '🦡', { fontSize: '13px' }).setOrigin(0.5).setResolution(RES_UI),
      this.add.text(PW / 2, 138, 'Tonight\'s quests', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#000000' }).setOrigin(0.5).setResolution(RES_UI),
      this.add.text(34, 116, '‹', { fontFamily: FONT, fontSize: '24px', color: '#34c759' }).setOrigin(0, 0.5).setResolution(RES_UI)]);
    this.chat = this.add.container(0, 0);
    const mask = this.make.graphics({ add: false });
    this.chatMaskG = mask;
    this.phoneBody = this.add.text(30, 106, '', { fontFamily: FONT, fontSize: '15px', color: '#111111', lineSpacing: 7, wordWrap: { width: PW - 64 } }).setResolution(RES_UI);
    this.phoneHint = this.add.text(PW / 2, PH - 34, '← → tabs · Esc close', { fontFamily: FONT, fontSize: '13px', color: '#aaaaaa' }).setOrigin(0.5).setResolution(RES_UI);
    this.phone.add([this.phoneClock, ...this.phoneTabs, this.phoneLine, this.chatHead, this.chat, this.phoneBody, this.phoneHint]);
    // small phone button on the HUD
    this.phoneBtn = this.add.text(16, 66, '📱 ↑ phone', { fontFamily: FONT, fontSize: '16px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 8, y: 5 } }).setResolution(RES_UI);
    this.phoneBadge = this.add.circle(140, 68, 7, UW_RED).setVisible(false);
    this.phoneBtn.setVisible(false); this.phoneBadge.setAlpha(0);
    this.phonePH = PH;
  }
  drawPhone() {
    this.phoneClock.setText(timeStr(S.minutes) + '        ▮▮▮ 82%');
    this.phoneTabs.forEach((t, i) => t.setColor(i === this.phoneTab ? '#000000' : '#aaaaaa'));
    this.phoneLine.x = 34 + this.phoneTab * 130;
    const chatTab = this.phoneTab === 0;
    this.chatHead.setVisible(chatTab);
    this.chat.setVisible(chatTab);
    this.phoneBody.setVisible(!chatTab);
    let out = '';
    if (chatTab) { this.drawChat(); return; } else {
      out = `What you're learning (${LEARNED.size}/${LESSONS.length})\n\n`;
      LESSONS.forEach(l => { out += LEARNED.has(l.id) ? '★ ' + l.t + '\n' : '🔒 ???\n'; });
    }
    this.phoneBody.setText(out);
  }
  drawChat() {
    this.chat.removeAll(true);
    const PW = 300, left = 30, maxW = 205;
    const items = [];
    if (S.rewind) items.push({ sys: '⛏ digging back through the night' });
    STEPS.forEach(st => {
      if (S.done.includes(st.id)) items.push({ text: '✓ ' + st.label, done: true });
      else if (st.id === S.current) items.push({ text: st.label, cur: true });
    });
    if (!items.length) items.push({ sys: 'no quests yet' });
    // newest at the bottom, like a chat
    let y = 470;
    const made = [];
    for (let i = items.length - 1; i >= 0 && y > 165; i--) {
      const it = items[i];
      if (it.sys) {
        const t = this.add.text(PW / 2, y, it.sys, { fontFamily: FONT, fontSize: '12px', color: '#8e8e93' }).setOrigin(0.5, 1).setResolution(RES_UI);
        y -= 22; made.push(t); continue;
      }
      const t = this.add.text(0, 0, it.text, { fontFamily: FONT, fontSize: '14px', color: it.cur ? '#ffffff' : '#3a3a3c', wordWrap: { width: maxW } }).setResolution(RES_UI);
      const bw = t.width + 22, bh = t.height + 14, bx = left, by = y - bh;
      const g = this.add.graphics();
      g.fillStyle(it.cur ? 0x34c759 : 0xe9e9eb, 1);
      g.fillRoundedRect(bx, by, bw, bh, 14);
      g.fillTriangle(left + 8, by + bh - 10, left - 4, by + bh, left + 16, by + bh);
      t.setPosition(bx + 11, by + 7);
      made.push(g, t);
      if (it.cur) made.push(this.add.text(left + 4, y + 2, 'current quest', { fontFamily: FONT, fontSize: '11px', color: '#34c759', fontStyle: 'bold' }).setResolution(RES_UI));
      y = by - 12;
    }
    this.chat.add(made);
  }
  togglePhone(v) {
    if (v === undefined) v = !this.phoneOpen;
    if (v && (this.open || !(this.hud.visible || this.phoneAllowed))) return;
    this.phoneOpen = v;
    if (v) { this.phoneBadge.setVisible(false); this.drawPhone(); }
    this.tweens.killTweensOf([this.phone, this.phoneDim]);
    this.tweens.add({ targets: this.phone, y: v ? (H - this.phonePH) / 2 : H + 20, duration: 220, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: this.phoneDim, alpha: v ? 0.5 : 0, duration: 220 });
    if (!v) this.closedAt = this.time.now;
  }
  learn(id) {
    if (LEARNED.has(id)) return;
    LEARNED.add(id);
    const l = LESSONS.find(x => x.id === id);
    this.phoneBadge.setVisible(true);
    this.toast('📱 New on your phone: ' + l.t, 3200);
  }

  // ----- HUD -----
  showHUD(v) { this.hud.setVisible(v); if (!v) { this.objective(''); if (this.phoneOpen) this.togglePhone(false); } }
  objective(t) {
    if (!this.objText) this.objText = this.add.text(W / 2, 18, '', { fontFamily: FONT, fontSize: '18px', color: '#ffd166', fontStyle: 'bold', backgroundColor: '#000000cc', padding: { x: 14, y: 8 } }).setOrigin(0.5, 0).setResolution(RES_UI);
    this.objText.setText(t ? '▶ ' + t : '').setVisible(!!t);
  }
  setTop(v) { this.box.y = v ? -(H - 262) : 0; }
  refresh() {
    this.clock.setText('🕘 ' + timeStr(S.minutes));
    const f = Phaser.Math.Clamp(S.depth / 10, 0, 1);
    this.meterFill.height = 0;
    this.tweens.add({ targets: this.meterIcon, y: this.meter.y + f * this.meter.h, duration: 500, ease: 'Sine.easeOut' });
    this.vignette.setAlpha(Math.max(0, (S.depth - 2) * 0.06));
    const st = [];
    st.push(`Drinks: ${S.drinks}`);
    if (S.chipsBuffer > 0) st.push('🥔 food in stomach');
    if (S.holdingWater) st.push('🥤 holding water');
    this.status.setText(st.join('\n'));
  }
  toast(msg, ms = 2600) {
    this.toastText.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: ms, duration: 500 });
  }
  banner(msg, ms = 1600) {
    this.bannerText.setText(msg).setAlpha(0).setScale(0.8);
    this.tweens.killTweensOf(this.bannerText);
    this.tweens.add({ targets: this.bannerText, alpha: 1, scale: 1, duration: 300, yoyo: true, hold: ms });
  }

  // ----- dialog -----
  lines(arr, done) {
    this.queue = arr.slice();
    this.doneCb = done;
    this.mode = 'lines';
    this.showBox();
    this.nextLine();
  }
  updateSel() {
    const shown = this.choiceTexts.filter(t => t.visible);
    if (!shown.length) { this.selBox.setVisible(false); return; }
    this.sel = Phaser.Math.Clamp(this.sel, 0, shown.length - 1);
    shown.forEach((t, i) => t.setColor(i === this.sel ? '#ffffff' : '#c9a24a'));
    const t = shown[this.sel];
    this.selBox.setVisible(true).setY(t.y + t.height / 2);
  }
  showBox() {
    if (!this.open) {
      this.tweens.killTweensOf(this.dim); this.tweens.add({ targets: this.dim, alpha: 0.4, duration: 250 });
      // a new chat popping up: ignore input for 3s so key spam can't skip it
      // (a follow-up box right after the last one closed counts as the same chat)
      if (this.time.now - this.closedAt > 500) this.inputBlockUntil = this.time.now + 3000;
    }
    this.open = true;
    this.box.setVisible(true);
    this.choiceTexts.forEach(t => t.setVisible(false));
    if (this.selBox) this.selBox.setVisible(false);
    this.timerBar.setVisible(false);
  }
  setSpeaker(who) {
    this.who.setText(who || '');
    this.who.setColor(SPEAKER_COLORS[who] || '#ffffff');
  }
  typeText(txt, after) {
    if (this.typer) this.typer.remove();
    this.full = txt; this.shown = 0; this.typing = true;
    this.body.setText('');
    this.typer = this.time.addEvent({
      delay: 14, loop: true, callback: () => {
        this.shown += 2;
        this.body.setText(this.full.slice(0, this.shown));
        if (this.shown >= this.full.length) this.finishType(after);
      }
    });
    this.afterType = after;
  }
  finishType() {
    if (this.typer) { this.typer.remove(); this.typer = null; }
    this.body.setText(this.full);
    const was = this.typing;
    this.typing = false;
    if (was && this.afterType) { const a = this.afterType; this.afterType = null; a(); }
  }
  nextLine() {
    if (!this.queue.length) { this.close(); if (this.doneCb) this.doneCb(); return; }
    const l = this.queue.shift();
    this.setSpeaker(l.who);
    if (this.speakerCb) this.speakerCb(l.who);
    this.more.setText('▼ E').setVisible(true);
    this.typeText(l.text);
  }
  choose(o) {
    this.mode = 'choice';
    this.showBox();
    this.inputBlockUntil = this.time.now + 3000; // every choice popup: 3s before you can pick
    this.setSpeaker(o.who);
    if (this.speakerCb) this.speakerCb(o.who);
    this.more.setText('↑↓ select · Enter').setVisible(true);
    let choices = o.choices.slice();
    if (S.holdingWater && o.waterOk) {
      choices.splice(1, 0, { label: '🥤 "Already got a drink." (it\'s water)', fn: o.waterOk });
      choices = choices.slice(0, 4);
    }
    let lost = false;
    if (S.depth >= 8) {
      const kept = choices.filter(c => !c.sober);
      if (kept.length && kept.length < choices.length) { choices = kept; lost = true; }
    }
    this.choices = choices;
    this.onTimeout = o.onTimeout;
    this.typeText(o.text, () => {
      choices.forEach((c, i) => {
        let label = S.depth >= 8 ? scramble(c.label) : c.label;
        this.choiceTexts[i].setText(`${i + 1}. ${label}`).setVisible(true).setY(H - 146 + i * 31);
      });
      this.sel = 0;
      this.choiceReadyAt = this.time.now + 400;
      this.updateSel();
      if (lost) this.toast("You can't find the words to say no.");
      if (o.timer) {
        this.timerBar.setVisible(true).width = W - 60;
        this.timerLeft = o.timer * 1000; this.timerMax = this.timerLeft;
      }
    });
  }
  pick(i) {
    if (this.mode !== 'choice' || this.typing || !this.choices[i] || this.time.now < this.choiceReadyAt || this.inputBlocked()) return;
    const c = this.choices[i];
    this.close();
    c.fn();
  }
  advance() {
    if (!this.open || this.inputBlocked()) return;
    if (this.typing) { this.finishType(); return; }
    if (this.mode === 'lines') this.nextLine();
  }
  close() {
    this.open = false; this.timerLeft = 0;
    this.box.setVisible(false);
    this.closedAt = this.time.now;
    this.tweens.killTweensOf(this.dim);
    this.tweens.add({ targets: this.dim, alpha: 0, duration: 250 });
    if (this.closeCb) this.closeCb();
  }
  inputBlocked() { return this.time.now < (this.inputBlockUntil || 0); }
  onKey(e) {
    if (this.open && this.inputBlocked()) return;
    if (!this.open) {
      const k = e.key;
      if (!this.phoneOpen) { if (k === 'ArrowUp') this.togglePhone(true); return; }
      if (k === 'Escape' || k === 'Backspace') this.togglePhone(false);
      if (k === 'ArrowLeft' || k === 'ArrowRight') { this.phoneTab = 1 - this.phoneTab; this.drawPhone(); }
      return;
    }
    const k = e.key;
    if (this.mode === 'choice' && !this.typing) {
      const n = this.choices.length;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { this.sel = (this.sel - 1 + n) % n; this.updateSel(); return; }
      if (k === 'ArrowDown' || k === 's' || k === 'S') { this.sel = (this.sel + 1) % n; this.updateSel(); return; }
      if (this.time.now < this.choiceReadyAt) return; // ignore key spam right as choices appear
      if (['1', '2', '3', '4'].includes(k)) { this.pick(+k - 1); return; }
      if (['e', 'E', 'Enter'].includes(k)) { this.pick(this.sel); return; }
      return;
    }
    if (['e', 'E', 'Enter'].includes(k)) this.advance();
  }
  update(t, dt) {
    if (this.open) this.more.setAlpha(this.inputBlocked() ? 0.25 : 1);
    if (this.open && this.mode === 'choice' && this.timerLeft > 0 && !this.inputBlocked()) {
      this.timerLeft -= dt;
      this.timerBar.width = Math.max(0, (W - 60) * this.timerLeft / this.timerMax);
      if (this.timerLeft <= 0) { this.close(); if (this.onTimeout) this.onTimeout(); }
    }
  }
}

// helper: launch UI fresh and run cb once it exists
function withUI(scene, cb) {
  scene.scene.stop('UI');
  const ui = scene.scene.get('UI');
  ui.speakerCb = null; ui.closeCb = null; ui.phoneAllowed = false;
  ui.events.once(Phaser.Scenes.Events.CREATE, () => cb(ui));
  scene.scene.launch('UI');
}


// ======================================================================
// base for walkable scenes
class Walk extends Phaser.Scene {
  setupPlayer(x, y) {
    this.player = this.physics.add.sprite(x, y, 'badger', 0);
    this.player.body.setSize(28, 14).setOffset(11, 32);
    this.player.setCollideWorldBounds(true);
    this.tail = this.add.image(x, y, 'tail').setOrigin(0.1, 0.5);
    this.ghost = this.add.sprite(x, y, 'badger', 0).setAlpha(0);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE');
    this.shakeUntil = 0;
    this.vel = new Phaser.Math.Vector2();
  }
  // demo-3 style: dim the world and pan/zoom the camera to whoever is speaking
  setupTalkCam() {
    const cam = this.cameras.main;
    this.camTarget = this.add.zone(this.player.x, this.player.y, 1, 1);
    cam.startFollow(this.camTarget, true, 0.1, 0.1);
    this.baseZoom = cam.zoom;
    this.focus = null;
    this.ui.speakerCb = who => { this.focus = this.speakerTarget(who); };
    this.ui.closeCb = () => { this.focus = null; };
  }
  speakerTarget() { return this.player; }
  updateTalkCam() {
    if (!this.camTarget) return;
    const talking = this.ui && this.ui.open;
    const f = talking && this.focus ? this.focus : this.player;
    this.camTarget.setPosition(f.x, f.y + (talking ? 42 : 0));
    const cam = this.cameras.main;
    const z = talking ? this.baseZoom * 1.45 : this.baseZoom;
    cam.setZoom(cam.zoom + (z - cam.zoom) * 0.1);
  }
  uiBusy() { return !this.ui || this.ui.open || this.ui.phoneOpen || this.time.now - this.ui.closedAt < 450; }
  movePlayer(time) {
    const k = this.keys, p = this.player;
    let dx = 0, dy = 0;
    if (!this.uiBusy() && !this.frozen) {
      if (k.A.isDown) dx -= 1;
      if (k.D.isDown) dx += 1;
      if (k.W.isDown) dy -= 1;
      if (k.S.isDown) dy += 1;
    }
    if (S.depth >= 9) { dx = -dx; dy = -dy; }
    const speed = 165;
    const target = new Phaser.Math.Vector2(dx, dy).normalize().scale(speed);
    if (S.depth >= 4 && (dx || dy)) {
      target.x += Math.sin(time / 300) * 12 * (S.depth - 3);
      target.y += Math.cos(time / 370) * 8 * (S.depth - 3);
    }
    const lerp = S.depth >= 5 ? Math.max(0.05, 0.25 - S.depth * 0.02) : 1;
    this.vel.x += (target.x - this.vel.x) * lerp;
    this.vel.y += (target.y - this.vel.y) * lerp;
    p.setVelocity(this.vel.x, this.vel.y);
    const moving = Math.abs(this.vel.x) + Math.abs(this.vel.y) > 15;
    if (moving) { if (!p.anims.isPlaying) p.play('walk'); } else { p.stop(); p.setFrame(0); }
    if (dx !== 0) p.setFlipX(dx < 0);
    p.setDepth(CHAR_D + p.y);

    // tail
    if (this.tail.visible) {
      const side = p.flipX ? 1 : -1; // tail trails behind: opposite the way Bucky walks
      this.tail.setPosition(p.x + side * 13, p.y + 13).setFlipX(side < 0).setOrigin(side < 0 ? 0.9 : 0.1, 0.5);
      this.tail.setDepth(p.depth - 0.5);
      let ang = Math.sin(time / 260) * 10;
      if (time < this.shakeUntil) ang = Math.sin(time / 70) * 34;
      if (S.depth >= 6) { ang += 28 * side; this.tail.setAlpha(Math.random() > 0.12 ? 1 : 0.35); } else this.tail.setAlpha(1);
      this.tail.setAngle(ang * side);
    }
    // double vision
    if (S.depth >= 5) {
      this.ghost.setAlpha(0.32).setPosition(p.x + Math.sin(time / 280) * 4 * (S.depth - 3), p.y).setFrame(p.frame.name).setFlipX(p.flipX).setDepth(p.depth + 0.1);
    } else this.ghost.setAlpha(0);
    this.updateTalkCam();
    // camera sway
    const cam = this.cameras.main;
    cam.setRotation(S.depth >= 3 ? Math.sin(time / 900) * 0.012 * (S.depth - 2) : 0);
  }
  floatText(x, y, msg, color = '#ffffff') {
    const t = this.add.text(x, y, msg, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(5000).setResolution(RES_WORLD);
    this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 1900, delay: 300, onComplete: () => t.destroy() });
  }
  followNPC(npc, target, dist, speed, time) {
    const d = Phaser.Math.Distance.Between(npc.x, npc.y, target.x, target.y);
    if (d > dist) {
      const a = Phaser.Math.Angle.Between(npc.x, npc.y, target.x, target.y);
      npc.x += Math.cos(a) * speed * this.game.loop.delta / 1000;
      npc.y += Math.sin(a) * speed * this.game.loop.delta / 1000;
      npc.setFlipX(Math.cos(a) < 0);
    }
    npc.setDepth(CHAR_D + npc.y);
    npc.setAngle(Math.sin(time / 420) * S.jakeDrunk * 1.4);
  }
}
