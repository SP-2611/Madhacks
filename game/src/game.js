// Tale of the Badger — Chapter 1: Dig In
// Phaser 3, no build step. Open index.html in a browser.

const W = 960, H = 640;
const FONT = 'Verdana, "Segoe UI", Tahoma, sans-serif';
const UW_RED = 0xc5050c;

// ---------- shared night state ----------
const CHAR_D = 2000; // characters always draw above furniture
const STEPS = [
  { id: 'knock', label: 'Knock on the door', from: 'Tyler', msg: 'party\'s at my place on Langdon 🎉 knock when u get here!' },
  { id: 'tail', label: 'Show off your tail', from: 'Jake', msg: 'yo show the kitchen your tail 🦡 (SPACE)' },
  { id: 'kitchen', label: 'Dig in: beer or punch', from: 'Tyler', msg: 'drinks table is right by the door. beer or punch, dig in!' },
  { id: 'pong', label: 'Beer pong · 10:30 PM', from: 'Brody', msg: 'PONG. living room. now 🏓' },
  { id: 'bathroom', label: 'Check on the bathroom', from: 'Kayla', msg: 'someone\'s been in the bathroom forever... can u check on them?' },
  { id: 'balcony', label: 'Get some air', from: 'Maya', msg: 'balcony is way chiller if u need air' },
  { id: 'shots', label: 'Shots · 12:00 AM', from: 'Tyler', msg: 'SHOTS AT MIDNIGHT 🥃🥃' },
  { id: 'jake', label: 'Find Jake', from: 'Maya', msg: 'hey have u seen Jake? he looked kinda out of it' },
  { id: 'end', label: '1:30 AM', from: 'Tyler', msg: 'its 1:30 lol who\'s still here' }
];
const REPLIES = ['done ✅', 'on it 👍', 'ok ok', 'got it', 'ya', 'kk'];
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
  { id: 'call', t: 'Roll them on their side, call 911, stay with them.' }
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
  KAYLA: '#ff8fd8', MAYA: '#7ee0a1', VOICE: '#aaaaaa', CROWD: '#ffb36b'
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

    pixelTex(this, 'px', 1, 1, 2, p => p(0, 0, 1, 1, 0xffffff));
    pixelTex(this, 'can', 4, 7, 2, p => {
      p(0, 0, 4, 1, 0xcccccc); p(0, 1, 4, 6, 0xc0392b); p(0, 3, 4, 1, 0xffffff);
    });
    pixelTex(this, 'can2', 4, 7, 2, p => {
      p(0, 0, 4, 1, 0xcccccc); p(0, 1, 4, 6, 0x2d6cdf); p(0, 3, 4, 1, 0xdddddd);
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
    this.scene.start('Prologue');
  }
}

// ======================================================================
// UI overlay scene (own camera, so the drunk camera sway never rotates it)
class UI extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.open = false;
    this.closedAt = 0;
    this.objText = null; // recreated per scene (old one is destroyed on restart)
    this.vignette = this.add.image(W / 2, H / 2, 'vignette').setAlpha(0);

    // HUD
    this.hud = this.add.container(0, 0).setVisible(false);
    const clockBg = this.add.rectangle(16, 16, 170, 40, 0x000000, 0.6).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.6);
    this.clock = this.add.text(28, 25, '9:00 PM', { fontFamily: FONT, fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setResolution(2);
    // depth meter
    const mx = W - 54, my = 90, mh = 300;
    const meterBg = this.add.rectangle(mx, my, 34, mh, 0x2a1a0e).setOrigin(0.5, 0).setStrokeStyle(3, 0xffffff, 0.8);
    const layers = this.add.graphics();
    const cols = [0x5c3d22, 0x4d321b, 0x3d2714, 0x2e1d0e, 0x1f1308];
    cols.forEach((c, i) => { layers.fillStyle(c, 1); layers.fillRect(mx - 15, my + i * (mh / 5), 30, mh / 5); });
    this.meterFill = this.add.rectangle(mx, my, 30, 0, 0x000000, 0.75).setOrigin(0.5, 0);
    this.meterIcon = this.add.sprite(mx, my, 'badger', 0).setScale(0.6);
    const lbl = this.add.text(mx, my - 26, 'DEPTH', { fontFamily: FONT, fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setResolution(2);
    const surf = this.add.text(mx - 26, my - 2, 'surface', { fontFamily: FONT, fontSize: '10px', color: '#cccccc' }).setOrigin(1, 0.5).setResolution(2);
    const bottom = this.add.text(mx - 26, my + mh, 'blackout', { fontFamily: FONT, fontSize: '10px', color: '#ff6b6b' }).setOrigin(1, 0.5).setResolution(2);
    this.meter = { x: mx, y: my, h: mh };
    this.status = this.add.text(16, 140, '', { fontFamily: FONT, fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 4, lineSpacing: 4 }).setResolution(2);
    this.hint = this.add.text(W / 2, H - 14, 'WASD: move   E: interact   SPACE: tail shake   ↑: phone', { fontFamily: FONT, fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5, 1).setResolution(2);
    this.hud.add([clockBg, this.clock, meterBg, layers, this.meterFill, this.meterIcon, lbl, surf, bottom, this.status, this.hint]);

    this.toastText = this.add.text(W / 2, 130, '', { fontFamily: FONT, fontSize: '19px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 10, y: 6 }, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5).setAlpha(0).setResolution(2);
    this.bannerText = this.add.text(W / 2, H / 2 - 60, '', { fontFamily: FONT, fontSize: '44px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0).setResolution(2);

    // dialog: dim the world behind it (demo-3 style)
    this.dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setAlpha(0);
    this.box = this.add.container(0, 0).setVisible(false);
    const bg = this.add.rectangle(W / 2, H - 127, W - 40, 230, 0x0d0d16, 0.96).setStrokeStyle(3, 0xffffff, 0.9).setInteractive();
    bg.on('pointerdown', () => this.advance());
    this.who = this.add.text(44, H - 232, '', { fontFamily: FONT, fontSize: '21px', fontStyle: 'bold', color: '#ffffff' }).setResolution(2);
    this.body = this.add.text(44, H - 202, '', { fontFamily: FONT, fontSize: '21px', color: '#ffffff', wordWrap: { width: W - 100 }, lineSpacing: 5 }).setResolution(2);
    this.more = this.add.text(W - 44, H - 22, '▼ E', { fontFamily: FONT, fontSize: '15px', color: '#bbbbbb' }).setOrigin(1, 1).setResolution(2);
    this.timerBar = this.add.rectangle(30, H - 250, W - 60, 8, 0xffd166).setOrigin(0, 0.5);
    this.box.add([bg, this.who, this.body, this.more, this.timerBar]);
    this.selBox = this.add.rectangle(46, 0, W - 92, 30, 0xffd166, 0.16).setOrigin(0, 0.5).setStrokeStyle(2, 0xffd166, 0.9).setVisible(false);
    this.box.add(this.selBox);
    this.sel = 0;
    this.choiceTexts = [];
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(60, 0, '', { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#ffd166' }).setResolution(2).setInteractive({ useHandCursor: true });
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
    this.phoneClock = this.add.text(30, 48, '', { fontFamily: FONT, fontSize: '13px', color: '#000000' }).setResolution(2);
    this.phoneTabs = ['Messages', 'Learned'].map((t, i) => this.add.text(34 + i * 130, 70, t, { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff' }).setResolution(2));
    this.phoneLine = this.add.rectangle(34, 93, 96, 3, 0x34c759).setOrigin(0, 0.5);
    // iMessage-style chat
    this.chatHead = this.add.container(0, 0);
    const hg = this.add.graphics();
    hg.fillStyle(0xf6f6f6, 1); hg.fillRect(20, 100, PW - 40, 52);
    hg.fillStyle(0xd1d1d6, 1); hg.fillRect(20, 152, PW - 40, 1);
    hg.fillStyle(0xc7c7cc, 1); hg.fillCircle(PW / 2, 116, 11);
    this.chatHead.add([hg,
      this.add.text(PW / 2, 116, '🦡', { fontSize: '13px' }).setOrigin(0.5).setResolution(2),
      this.add.text(PW / 2, 138, 'Langdon St Party', { fontFamily: FONT, fontSize: '12px', color: '#000000' }).setOrigin(0.5).setResolution(2),
      this.add.text(34, 116, '‹', { fontFamily: FONT, fontSize: '24px', color: '#34c759' }).setOrigin(0, 0.5).setResolution(2)]);
    this.chat = this.add.container(0, 0);
    const mask = this.make.graphics({ add: false });
    this.chatMaskG = mask;
    this.phoneBody = this.add.text(30, 106, '', { fontFamily: FONT, fontSize: '15px', color: '#111111', lineSpacing: 7, wordWrap: { width: PW - 64 } }).setResolution(2);
    this.phoneHint = this.add.text(PW / 2, PH - 34, '← → tabs · Esc close', { fontFamily: FONT, fontSize: '11px', color: '#888888' }).setOrigin(0.5).setResolution(2);
    this.phone.add([this.phoneClock, ...this.phoneTabs, this.phoneLine, this.chatHead, this.chat, this.phoneBody, this.phoneHint]);
    // small phone button on the HUD
    this.phoneBtn = this.add.text(16, 66, '📱 ↑ phone', { fontFamily: FONT, fontSize: '16px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 8, y: 5 } }).setResolution(2);
    this.phoneBadge = this.add.circle(140, 68, 7, UW_RED).setVisible(false);
    this.hud.add([this.phoneBtn, this.phoneBadge]);
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
    const PW = 300, left = 30, right = PW - 30, maxW = 170;
    const items = [];
    if (S.rewind) items.push({ sys: '⛏ digging back through the night' });
    STEPS.forEach((st, i) => {
      const sent = S.done.includes(st.id) || st.id === S.current;
      if (!sent) return;
      items.push({ from: st.from, text: st.msg, cur: st.id === S.current });
      if (S.done.includes(st.id)) items.push({ me: true, text: REPLIES[i % REPLIES.length] });
    });
    // lay out bottom-up so the newest message sits above the hint
    let y = 486;
    const made = [];
    for (let i = items.length - 1; i >= 0 && y > 165; i--) {
      const it = items[i];
      if (it.sys) {
        const t = this.add.text(PW / 2, 0, it.sys, { fontFamily: FONT, fontSize: '10px', color: '#8e8e93' }).setOrigin(0.5, 1).setResolution(2);
        t.y = y; y -= 22; made.push(t); continue;
      }
      const t = this.add.text(0, 0, it.text, { fontFamily: FONT, fontSize: '12px', color: it.me ? '#ffffff' : '#000000', wordWrap: { width: maxW } }).setResolution(2);
      const bw = t.width + 22, bh = t.height + 14;
      const bx = it.me ? right - bw : left;
      const by = y - bh;
      const g = this.add.graphics();
      g.fillStyle(it.me ? 0x34c759 : 0xe9e9eb, 1);
      g.fillRoundedRect(bx, by, bw, bh, 14);
      // little tail on the bubble
      if (it.me) g.fillTriangle(right - 8, by + bh - 10, right + 4, by + bh, right - 16, by + bh);
      else g.fillTriangle(left + 8, by + bh - 10, left - 4, by + bh, left + 16, by + bh);
      t.setPosition(bx + 11, by + 7);
      made.push(g, t);
      if (it.cur) {
        const d = this.add.text(left + 4, y + 2, 'new mission', { fontFamily: FONT, fontSize: '9px', color: '#34c759', fontStyle: 'bold' }).setResolution(2);
        made.push(d);
      }
      y = by - 6;
      if (!it.me) {
        const n = this.add.text(left + 8, y, it.from, { fontFamily: FONT, fontSize: '9px', color: '#8e8e93' }).setOrigin(0, 1).setResolution(2);
        made.push(n); y -= 14;
      }
      y -= 6;
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
    if (!this.objText) this.objText = this.add.text(W / 2, 18, '', { fontFamily: FONT, fontSize: '18px', color: '#ffd166', fontStyle: 'bold', backgroundColor: '#000000cc', padding: { x: 14, y: 8 } }).setOrigin(0.5, 0).setResolution(2);
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
    if (!this.open) { this.tweens.killTweensOf(this.dim); this.tweens.add({ targets: this.dim, alpha: 0.4, duration: 250 }); }
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
      this.updateSel();
      if (lost) this.toast("You can't find the words to say no.");
      if (o.timer) {
        this.timerBar.setVisible(true).width = W - 60;
        this.timerLeft = o.timer * 1000; this.timerMax = this.timerLeft;
      }
    });
  }
  pick(i) {
    if (this.mode !== 'choice' || this.typing || !this.choices[i]) return;
    const c = this.choices[i];
    this.close();
    c.fn();
  }
  advance() {
    if (!this.open) return;
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
  onKey(e) {
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
      if (['1', '2', '3', '4'].includes(k)) { this.pick(+k - 1); return; }
      if (['e', 'E', ' ', 'Enter'].includes(k)) { this.pick(this.sel); return; }
      return;
    }
    if (['e', 'E', ' ', 'Enter'].includes(k)) this.advance();
  }
  update(t, dt) {
    if (this.open && this.mode === 'choice' && this.timerLeft > 0) {
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
class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    this.scene.stop('UI');
    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1026, 0x0b1026, 0x3a0d1a, 0x3a0d1a, 1);
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) {
      const s = this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.6), 2, 2, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
      this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(800, 2000), yoyo: true, repeat: -1 });
    }
    // Madison skyline: the Capitol on the isthmus, lakes on both sides
    const glow = this.add.circle(W / 2, 360, 220, 0xfff1c4, 0.10);
    this.tweens.add({ targets: glow, alpha: 0.03, duration: 2000, yoyo: true, repeat: -1 });
    g.fillStyle(0x0d1530, 1); g.fillRect(0, 470, W, 30);
    g.fillStyle(0x1b2a4f, 1); for (let x = 0; x < W; x += 6) g.fillRect(x, 476 + Math.sin(x / 13) * 2, 3, 1);
    g.fillStyle(0x10162b, 1);
    [[40, 60], [110, 90], [190, 50], [700, 80], [780, 110], [860, 60], [250, 40], [640, 45]].forEach(([x, h]) => g.fillRect(x, 470 - h, 50, h));
    // ground in front
    g.fillStyle(0x3d2714, 1); g.fillEllipse(W / 2, H + 40, W * 1.4, 260);
    g.fillStyle(0x5c3d22, 1); g.fillEllipse(W / 2, H + 60, W * 1.2, 220);
    drawPixelCapitol(this.add.graphics(), W / 2, 484, 2);

    this.add.text(W / 2, 62, 'THE TALE OF THE', { fontFamily: FONT, fontSize: '34px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setResolution(2);
    const t = this.add.text(W / 2, 122, 'BADGER', { fontFamily: FONT, fontSize: '84px', color: '#ffffff', fontStyle: 'bold', stroke: '#c5050c', strokeThickness: 12 }).setOrigin(0.5).setResolution(2);
    t.setShadow(6, 6, '#000000', 0, true, true);

    const tail = this.add.image(196, 506, 'tail').setScale(3).setOrigin(0.9, 0.5).setFlipX(true);
    const b = this.add.sprite(230, 478, 'badger', 0).setScale(3);
    this.tweens.add({ targets: tail, angle: { from: -20, to: 25 }, duration: 160, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: b, y: 470, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const start = this.add.text(W / 2, 560, 'Press ENTER or click to start', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5).setResolution(2);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    this.add.text(W / 2, 600, 'WASD move · E interact · SPACE tail shake · ↑ phone · ↑↓ + Enter choose', { fontFamily: FONT, fontSize: '14px', color: '#cccccc' }).setOrigin(0.5).setResolution(2);

    const go = () => {
      if (this.going) return; this.going = true;
      resetState(false);
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Street'));
    };
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.once('pointerdown', go);
  }
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
  uiBusy() { return !this.ui || this.ui.open || this.ui.phoneOpen || this.time.now - this.ui.closedAt < 250; }
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
      if (time < this.shakeUntil) ang = Math.sin(time / 38) * 38;
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
    const t = this.add.text(x, y, msg, { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(5000).setResolution(3);
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

// ======================================================================
class Street extends Walk {
  constructor() { super('Street'); }
  create() {
    const WW = 1400, WH = 460;
    this.cameras.main.setBounds(0, 0, WW, WH).setZoom(1.4).fadeIn(600);
    this.physics.world.setBounds(0, 296, WW, 64);
    const g = this.add.graphics().setDepth(-100);
    g.fillGradientStyle(0x050818, 0x050818, 0x1a1f45, 0x1a1f45, 1); g.fillRect(0, 0, WW, 300);
    for (let i = 0; i < 60; i++) g.fillStyle(0xffffff, Math.random() * 0.8 + 0.2).fillRect(Math.random() * WW, Math.random() * 200, 2, 2);
    drawCapitol(g, 760, 300, 0.7, 0x8f8ca6, 0x6d6a85, 0xd9b46a);
    g.fillStyle(0xf5f0d0, 1); g.fillCircle(160, 60, 22);
    g.fillStyle(0x050818, 1); g.fillCircle(170, 54, 20);
    // neighbor houses
    const sil = (x, w, h, c) => {
      g.fillStyle(c, 1); g.fillRect(x, 300 - h, w, h);
      g.fillTriangle(x - 12, 300 - h, x + w / 2, 300 - h - 70, x + w + 12, 300 - h);
      g.fillStyle(0xffcf73, 0.85); g.fillRect(x + 30, 300 - h + 40, 30, 34);
    };
    sil(60, 260, 150, 0x14182e); sil(400, 300, 170, 0x111428);
    // party house
    g.fillStyle(0x6b4f3a, 1); g.fillRect(860, 120, 420, 180);
    g.fillStyle(0x3b2a20, 1); g.fillTriangle(840, 125, 1070, 20, 1300, 125);
    g.fillStyle(0x5a4030, 1); g.fillRect(860, 236, 420, 8);
    g.fillStyle(0x8a6a50, 1); g.fillRect(1020, 290, 100, 10);
    g.fillStyle(0x7a5c45, 1); g.fillRect(1030, 282, 80, 8);
    // windows that pulse party colors
    this.windows = [[890, 150, 80, 60], [1170, 150, 80, 60], [890, 250, 80, 40], [1170, 250, 80, 40], [1040, 60, 60, 40]]
      .map(([x, y, w, h]) => this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xff3da5).setStrokeStyle(4, 0x2a1a10).setDepth(-90));
    const colors = [0xff3da5, 0x3dd6ff, 0xffe23d, 0x8a3dff, 0x3dff8a];
    let ci = 0;
    this.time.addEvent({ delay: 450, loop: true, callback: () => { ci++; this.windows.forEach((w, i) => w.setFillStyle(colors[(ci + i) % colors.length])); } });
    // door
    this.door = this.add.rectangle(1070, 250, 46, 64, 0x3a2416).setStrokeStyle(3, 0x1a0f08).setDepth(-80);
    this.add.circle(1084, 252, 3, 0xd4af37).setDepth(-79);
    // sidewalk + street
    g.fillStyle(0x6d6d6d, 1); g.fillRect(0, 300, WW, 62);
    g.lineStyle(2, 0x555555, 1); for (let x = 0; x < WW; x += 70) g.lineBetween(x, 300, x, 362);
    g.fillStyle(0x9a9a9a, 1); g.fillRect(0, 360, WW, 6);
    g.fillStyle(0x23232b, 1); g.fillRect(0, 366, WW, 94);
    g.fillStyle(0xe6c200, 1); for (let x = 20; x < WW; x += 90) g.fillRect(x, 410, 46, 5);
    // lamps
    [250, 760, 1340].forEach(x => {
      g.fillStyle(0x222222, 1); g.fillRect(x - 3, 150, 6, 152); g.fillRect(x - 3, 150, 22, 5);
      const glow = this.add.circle(x + 18, 160, 60, 0xffe9a8, 0.12).setDepth(-50);
      this.add.circle(x + 18, 158, 6, 0xfff3c4).setDepth(-49);
      this.tweens.add({ targets: glow, alpha: 0.06, duration: 1500, yoyo: true, repeat: -1 });
    });
    // street sign
    g.fillStyle(0x333333, 1); g.fillRect(598, 170, 5, 132);
    g.fillStyle(0x1e7a3c, 1); g.fillRect(560, 168, 82, 22);
    this.add.text(601, 179, 'LANGDON ST', { fontFamily: FONT, fontSize: '11px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(-40).setResolution(3);
    // thump text
    this.time.addEvent({ delay: 1400, loop: true, callback: () => this.floatText(1070 + Phaser.Math.Between(-150, 150), 110, '♪ thump ♪', '#ff9de2') });

    this.setupPlayer(120, 330);
    this.jake = this.add.sprite(80, 330, 'jake');
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.prompt = this.add.text(0, 0, '[E] Knock', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffd166', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(6000).setResolution(3).setVisible(false);

    withUI(this, ui => {
      this.ui = ui;
      this.setupTalkCam();
      ui.banner('Langdon St · 9:00 PM');
      this.time.delayedCall(1800, () => ui.lines([
        { who: 'JAKE', text: "That's the place! You can literally hear it from here." },
        { who: 'JAKE', text: 'Come on, let\'s go. (WASD to walk)' }
      ], () => { this.tut = 'move'; this.tutX = this.player.x; ui.objective('Walk toward the party (WASD)'); }));
    });
  }
  updateTutorial(time) {
    const ui = this.ui;
    if (this.tut === 'move' && Math.abs(this.player.x - this.tutX) > 90) {
      this.tut = 'ring';
      S.current = 'knock';
      ui.phoneAllowed = true;
      ui.objective('Your phone is buzzing! Press ↑ to pull it out');
      this.nextBuzz = 0;
    }
    if (this.tut === 'ring') {
      if (time > this.nextBuzz) {
        this.nextBuzz = time + 1600;
        this.floatText(this.player.x + 18, this.player.y - 40, '📳 bzzz', '#ffffff');
        this.cameras.main.shake(120, 0.002);
      }
      if (ui.phoneOpen) { this.tut = 'read'; ui.objective('Tyler texted you. Press Esc to put the phone away'); }
    }
    if (this.tut === 'read' && !ui.phoneOpen) {
      this.tut = 'done';
      ui.objective('Walk up to the party house and knock (E)');
      ui.toast('Press ↑ anytime to check your phone.', 3000);
    }
  }
  update(time) {
    if (!this.player) return;
    this.movePlayer(time);
    if (this.ui) this.updateTutorial(time);
    this.followNPC(this.jake, { x: this.player.x - 40, y: this.player.y }, 45, 150, time);
    const near = Math.abs(this.player.x - 1070) < 90 && !this.knocked && this.tut === 'done';
    this.prompt.setVisible(near && !this.uiBusy()).setPosition(1070, 200);
    if (near && Phaser.Input.Keyboard.JustDown(this.keys.E) && !this.uiBusy()) this.knock();
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && !this.uiBusy()) {
      this.shakeUntil = time + 900;
      this.floatText(this.player.x, this.player.y - 36, 'wiggle wiggle', '#ffd166');
    }
  }
  speakerTarget(who) { return { JAKE: this.jake, TYLER: this.tyler || { x: 1070, y: 290 } }[who] || this.player; }
  knock() {
    this.knocked = true;
    this.ui.objective('');
    this.ui.lines([{ who: '', text: '*knock knock*' }], () => {
      this.door.setFillStyle(0xffe9a8);
      const tyler = this.tyler = this.add.sprite(1070, 262, 'tyler').setDepth(-70);
      this.tweens.add({ targets: tyler, y: 300, duration: 500, onComplete: () => tyler.setDepth(CHAR_D + 300) });
      this.time.delayedCall(600, () => this.ui.lines([
        { who: 'TYLER', text: 'Hey, you made it! Come in, come in.' },
        { who: 'TYLER', text: 'Just dig in — the chips and drinks are in the kitchen. Make yourself at home!' },
        { who: 'JAKE', text: 'Told you this would be fun.' }
      ], () => {
        this.cameras.main.fadeOut(600);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Party'));
      }));
    });
  }
}

// ======================================================================
class Party extends Walk {
  constructor() { super('Party'); }

  create() {
    const WW = 1400, WH = 900;
    this.WW = WW; this.WH = WH;
    this.ended = false;
    this.pending = [];
    this.physics.world.setBounds(0, 0, WW, WH);
    const cam = this.cameras.main;
    cam.setBounds(20, 340, 880, 540).setZoom(1.4).fadeIn(600);
    this.solids = [];

    this.drawFloors();
    this.buildWalls();
    this.buildFurniture();
    this.mess = this.add.group();

    this.setupPlayer(220, 805);
    this.physics.add.collider(this.player, this.solids);
    cam.startFollow(this.player, true, 0.12, 0.12);

    this.buildNPCs();
    this.buildInteractables();
    this.buildFog();

    this.prompt = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffd166', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(6000).setResolution(3);

    withUI(this, ui => {
      this.ui = ui;
      this.setupTalkCam();
      ui.showHUD(true);
      ui.refresh();
      if (S.rewind) {
        ui.banner('⛏ DIGGING BACK... 9:00 PM', 1800);
        this.time.delayedCall(2300, () => ui.lines([
          { who: '', text: 'You dig back through the night. The memories come back one by one.' },
          { who: 'TYLER', text: 'Hey, you made it! Just dig in — chips and drinks are right here!' },
          { who: '', text: 'This time, choose differently. Find out where your tail went.' }
        ], () => { this.setStep('tail'); this.time.delayedCall(500, () => this.ui.togglePhone(true)); }));
      } else {
        ui.banner('9:00 PM');
        this.time.delayedCall(1800, () => {
          this.setStep('tail');
          this.time.delayedCall(400, () => { this.ui.togglePhone(true); this.ui.toast('Your phone buzzes. Esc to put it away, ↑ to check it again.', 4000); });
        });
      }
    });

    this.marker = this.add.text(0, 0, '▼', { fontFamily: FONT, fontSize: '20px', color: '#ffd166', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(7000).setResolution(3).setVisible(false);
    this.time.addEvent({ delay: 2600, loop: true, callback: () => this.ambient() });
  }

  // ---------- map ----------
  // Layout: kitchen (start, bottom-left) · balcony (top-left, always open)
  //         bathroom (top-middle, revealed) · living room w/ pong (right, revealed)
  drawFloors() {
    const g = this.add.graphics().setDepth(-1000);
    g.fillStyle(0x0b0b10, 1); g.fillRect(0, 0, this.WW, this.WH);
    // night yard outside the house
    g.fillStyle(0x10180f, 1); g.fillRect(0, 0, this.WW, this.WH);
    for (let i = 0; i < 160; i++) g.fillStyle(0x1c2a1a, 1).fillRect(Math.random() * this.WW, Math.random() * this.WH, 3, 2);
    for (let y = 540; y < 840; y += 30) for (let x = 60; x < 360; x += 30) {
      g.fillStyle(((x + y) / 30) % 2 ? 0xd9d4c7 : 0xb8b2a3, 1); g.fillRect(x, y, 30, 30);
    }
    g.fillStyle(0x4a4038, 1); g.fillRect(60, 380, 140, 140);
    g.lineStyle(2, 0x2e2722, 1); for (let x = 60; x < 200; x += 16) g.lineBetween(x, 380, x, 520);
    for (let y = 380; y < 520; y += 20) for (let x = 220; x < 360; x += 20) {
      g.fillStyle(((x + y) / 20) % 2 ? 0x9ec9d6 : 0x86b3c2, 1); g.fillRect(x, y, 20, 20);
    }
    g.fillStyle(0x7a5233, 1); g.fillRect(380, 440, 480, 400);
    g.lineStyle(1, 0x5f3f27, 1);
    for (let y = 440; y < 840; y += 20) g.lineBetween(380, y, 860, y);
    for (let y = 440, r = 0; y < 840; y += 20, r++) for (let x = 380 + (r % 2) * 60; x < 860; x += 120) g.lineBetween(x, y, x, y + 20);
    g.fillStyle(0x7d1e2c, 1); g.fillRect(440, 520, 360, 240);
    g.lineStyle(4, 0xd9b45a, 1); g.strokeRect(452, 532, 336, 216);
    g.fillStyle(0x3a3a3a, 1); g.fillRect(190, 806, 60, 30);
    this.lights = [];
    const cols = [0xff3da5, 0x3dd6ff, 0xffe23d, 0x8a3dff, 0x3dff8a];
    // big party lights sweeping the living room (clipped to the room)
    const lightMask = this.make.graphics({ add: false }).fillStyle(0xffffff).fillRect(380, 440, 480, 400).createGeometryMask();
    for (let i = 0; i < 8; i++) {
      const c = this.add.circle(Phaser.Math.Between(440, 800), Phaser.Math.Between(490, 790), Phaser.Math.Between(80, 120), cols[i % 5], 0.3).setDepth(-900).setMask(lightMask);
      this.lights.push(c);
      this.tweens.add({ targets: c, alpha: 0.05, x: c.x + Phaser.Math.Between(-90, 90), y: c.y + Phaser.Math.Between(-60, 60), duration: Phaser.Math.Between(800, 1500), yoyo: true, repeat: -1 });
    }
  }

  solid(x, y, w, h) {
    const r = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0, 0);
    this.physics.add.existing(r, true);
    this.solids.push(r);
    return r;
  }
  wall(x, y, w, h) {
    this.solid(x, y, w, h);
    const g = this.add.graphics().setDepth(y + h);
    g.fillStyle(0xe8dcc4, 1); g.fillRect(x, y, w, h);
    g.fillStyle(0xbfae90, 1); g.fillRect(x, y + h - 4, w, 4);
  }
  buildWalls() {
    // outer shell
    this.wall(360, 420, 520, 20);                 // top (living room)
    this.wall(40, 360, 320, 20);                  // top of balcony + bathroom
    this.wall(40, 360, 20, 500);                  // left
    this.wall(860, 420, 20, 440);                 // right
    this.wall(40, 840, 140, 20); this.wall(260, 840, 620, 20); // bottom, front door 180-260
    this.solid(180, 860, 80, 20);                 // front door: no leaving
    // kitchen top wall: balcony opening (90-150) + bathroom door (230-290)
    this.wall(40, 520, 50, 20); this.wall(150, 520, 80, 20); this.wall(290, 520, 70, 20);
    this.solid(230, 520, 60, 20);
    const plain = this.add.graphics().setDepth(540);
    plain.fillStyle(0xe8dcc4, 1); plain.fillRect(230, 520, 60, 20);
    plain.fillStyle(0xbfae90, 1); plain.fillRect(230, 536, 60, 4);
    this.bathDoor = this.add.graphics().setDepth(541).setAlpha(0);
    this.bathDoor.fillStyle(0x6b4423, 1); this.bathDoor.fillRect(230, 520, 60, 20);
    this.bathDoor.fillStyle(0xd4af37, 1); this.bathDoor.fillCircle(282, 530, 3);
    this.bathLabel = this.add.text(255, 530, 'WC', { fontFamily: FONT, fontSize: '10px', color: '#f0e0c0' }).setOrigin(0.5).setDepth(542).setResolution(3).setAlpha(0);
    this.wall(200, 380, 20, 140); // balcony | bathroom
    // kitchen | living room, doorway 640-740 blocked until revealed
    this.wall(360, 360, 20, 280); this.wall(360, 740, 20, 120);
    this.gate = this.solid(360, 640, 20, 100);
    // balcony railing + string lights
    const rail = this.add.graphics().setDepth(400);
    rail.fillStyle(0x222222, 1);
    for (let x = 64; x < 198; x += 14) rail.fillRect(x, 382, 10, 4);
    for (let y = 384; y < 518; y += 14) rail.fillRect(62, y, 4, 10);
    for (let x = 74; x < 196; x += 18) {
      const bl = this.add.circle(x, 396 + Math.sin(x / 20) * 3, 3, 0xffe9a8).setDepth(401);
      this.tweens.add({ targets: bl, alpha: 0.4, duration: Phaser.Math.Between(500, 1200), yoyo: true, repeat: -1 });
    }
  }
  buildFog() {
    this.fog = [
      this.add.rectangle(380, 420, 500, 440, 0x000000, 1).setOrigin(0).setDepth(5900),
      this.add.rectangle(220, 380, 140, 140, 0x000000, 1).setOrigin(0).setDepth(5900)
    ];
    this.fogLabel = this.add.text(620, 640, '♪ the living room is packed ♪', { fontFamily: FONT, fontSize: '14px', color: '#555566' }).setOrigin(0.5).setDepth(5901).setResolution(3);
  }
  reveal() {
    if (this.revealed) return;
    this.revealed = true;
    this.physics.world.disable(this.gate);
    this.tweens.add({ targets: [...this.fog, this.fogLabel], alpha: 0, duration: 1400 });
    this.tweens.add({ targets: [this.bathDoor, this.bathLabel, ...this.laterItems], alpha: 1, duration: 1400 });
    this.dancers = [...this.kitchenCrowd, ...this.livingCrowd];
    this.ui.toast('The rest of the party opens up: living room, beer pong, bathroom, snacks + water.', 3200);
  }
  furn(x, y, w, h, draw, collide = true) {
    if (collide) this.solid(x, y, w, h);
    const g = this.add.graphics().setDepth(y + h);
    draw(g);
    return g;
  }
  buildFurniture() {
    // counter + sink along the left wall (snacks/water appear later)
    this.furn(60, 560, 40, 130, g => {
      g.fillStyle(0x5b4636, 1); g.fillRect(60, 560, 40, 130);
      g.fillStyle(0x9a9286, 1); g.fillRect(60, 560, 34, 130);
      g.fillStyle(0x6f7f8a, 1); g.fillRect(63, 612, 26, 40);
      g.fillStyle(0x4c5a63, 1); g.fillRect(66, 616, 20, 32);
    });
    const later = this.add.graphics().setDepth(691).setAlpha(0);
    later.fillStyle(0x3d9be9, 1); later.fillRect(66, 568, 20, 28);
    later.fillStyle(0xbfe3ff, 1); later.fillRect(69, 572, 14, 10);
    later.fillStyle(0xf2f2f2, 1); later.fillCircle(77, 672, 12);
    later.fillStyle(0xf2c14e, 1); for (let i = 0; i < 9; i++) later.fillCircle(72 + (i % 3) * 5, 667 + Math.floor(i / 3) * 5, 2.5);
    this.laterItems = [later];
    // fridge (top-right corner)
    this.furn(300, 542, 56, 66, g => {
      g.fillStyle(0xf2f2f2, 1); g.fillRect(300, 542, 56, 66);
      g.fillStyle(0xcfcfcf, 1); g.fillRect(300, 568, 56, 3); g.fillRect(346, 550, 4, 14);
    });
    // drinks table in the middle: beer stack (left) + punch bowl (right)
    this.furn(140, 650, 150, 60, g => {
      g.fillStyle(0x4a3020, 1); g.fillRect(140, 650, 150, 60);
      g.fillStyle(0x8a5a3a, 1); g.fillRect(140, 650, 150, 48);
      g.fillStyle(0xdddddd, 0.8); g.fillCircle(258, 674, 19);
      g.fillStyle(0xd7263d, 0.85); g.fillCircle(258, 674, 15);
    });
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - r; i++)
      this.add.image(154 + i * 11 + r * 5.5, 690 - r * 12, r % 2 ? 'can2' : 'can').setDepth(711);
    [[214, 664], [220, 684], [284, 658]].forEach(([x, y]) => this.add.image(x, y, 'cup').setDepth(711));
    this.sinkCans = [];
    // living room: pong table dead center
    this.furn(520, 614, 200, 52, g => {
      g.fillStyle(0x3a2516, 1); g.fillRect(520, 614, 200, 52);
      g.fillStyle(0xc9b38a, 1); g.fillRect(520, 614, 200, 42);
      g.lineStyle(2, UW_RED, 1); g.lineBetween(620, 614, 620, 656);
    });
    const tri = (bx, dir) => { for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) this.add.image(bx + dir * (3 - r) * 8, 635 - r * 4.5 + i * 9, 'cup').setDepth(667); }; // tip faces the middle
    tri(532, 1); tri(708, -1);
    this.add.circle(620, 632, 3, 0xffffff).setDepth(668);
    // speaker (top-right corner)
    this.furn(806, 448, 44, 56, g => {
      g.fillStyle(0x111111, 1); g.fillRect(806, 448, 44, 56);
      g.fillStyle(0x333333, 1); g.fillCircle(828, 464, 10); g.fillCircle(828, 489, 7);
    });
    this.speakerPulse = this.add.circle(828, 464, 14, 0xffffff, 0).setStrokeStyle(3, 0xff3da5, 0.8).setDepth(505);
    this.tweens.add({ targets: this.speakerPulse, scale: 3, alpha: 0, duration: 500, repeat: -1 });
    // couch along the right wall
    this.furn(800, 540, 56, 220, g => {
      g.fillStyle(0x1f2a4a, 1); g.fillRect(800, 540, 56, 220);
      g.fillStyle(0x2f3f6a, 1); g.fillRect(806, 552, 44, 62); g.fillRect(806, 620, 44, 62); g.fillRect(806, 688, 44, 62);
    });
    // balcony chairs
    this.furn(72, 480, 30, 26, g => { g.fillStyle(0x2e5e4e, 1); g.fillRect(72, 480, 30, 26); });
    this.furn(160, 396, 30, 26, g => { g.fillStyle(0x2e5e4e, 1); g.fillRect(160, 396, 30, 26); });
  }

  buildNPCs() {
    const npc = (key, x, y, flip = false) => this.add.sprite(x, y, key).setDepth(CHAR_D + y).setFlipX(flip);
    this.tyler = npc('tyler', 300, 800);
    this.jake = this.add.sprite(180, 800, 'jake');
    this.brody = npc('brody', 325, 730, true);
    this.brodyHome = { x: 325, y: 730 };
    this.kayla = npc('kayla', 120, 590);
    this.maya = npc('maya', 120, 440);
    this.nameTags = [[this.tyler, 'Tyler'], [this.brody, 'Brody'], [this.kayla, 'Kayla'], [this.maya, 'Maya'], [this.jake, 'Jake']].map(([n, t]) =>
      ({ n, t: this.add.text(n.x, n.y - 30, t, { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setResolution(3).setDepth(5800) }));

    // background crowd: dark, faceless, can't be talked to
    const keys = ['d1', 'd2', 'd3', 'p1', 'p2', 'couch'];
    const blocked = [[50, 550, 70, 160], [290, 535, 75, 125], [130, 635, 170, 100], [165, 740, 110, 110], [225, 545, 70, 60],
      [95, 565, 50, 55], [295, 700, 60, 60], [270, 775, 60, 70],
      [495, 590, 250, 105], [785, 530, 80, 240], [790, 440, 70, 80], [370, 620, 70, 150]];
    const free = (x, y) => !blocked.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && y > by && y < by + bh);
    const crowd = (n, x0, y0, x1, y1, dance) => {
      const out = [];
      let tries = 0;
      while (out.length < n && tries++ < 500) {
        const x = Phaser.Math.Between(x0, x1), y = Phaser.Math.Between(y0, y1);
        if (!free(x, y) || out.some(o => Phaser.Math.Distance.Between(o.x, o.y, x, y) < (dance ? 40 : 26))) continue;
        const sp = this.add.sprite(x, y, Phaser.Utils.Array.GetRandom(keys)).setTint(0x23232f).setAlpha(0.95).setDepth(CHAR_D + y).setFlipX(Math.random() < 0.5);
        this.tweens.add({ targets: sp, y: y - (dance ? 6 : 2), duration: Phaser.Math.Between(240, 600), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 400) });
        out.push(sp);
      }
      return out;
    };
    this.kitchenCrowd = crowd(14, 75, 560, 350, 825, false);
    this.livingCrowd = crowd(14, 400, 470, 790, 825, true);
    this.dancers = [...this.kitchenCrowd];
    this.ponger = [[502, 640, false], [738, 640, true]].map(([x, y, f]) => this.add.sprite(x, y, Phaser.Utils.Array.GetRandom(keys)).setTint(0x23232f).setDepth(CHAR_D + y).setFlipX(f));
    this.couchGuy = this.add.sprite(828, 580, 'couch').setTint(0x23232f).setDepth(CHAR_D + 580);
  }

  buildInteractables() {
    this.inter = [
      { x: 175, y: 735, r: 42, label: 'Beer stack', fn: () => this.grabBeer() },
      { x: 258, y: 735, r: 42, label: 'Punch bowl', fn: () => this.punch() },
      { x: 120, y: 672, r: 40, label: 'Eat chips', zone: 'living', fn: () => this.eatChips() },
      { x: 120, y: 585, r: 40, label: 'Get water', zone: 'living', fn: () => this.getWater() },
      { x: 260, y: 568, r: 40, label: 'Knock', zone: 'living', fn: () => this.knock() },
      { x: 620, y: 700, r: 60, label: 'Beer pong', zone: 'living', fn: () => this.pongTalk() },
      { npc: this.maya, r: 55, label: 'Talk', fn: () => this.mayaTalk() },
      { npc: this.kayla, r: 50, label: 'Talk', fn: () => this.kaylaTalk() },
      { npc: this.jake, r: 50, low: true, label: 'Talk to Jake', fn: () => this.jakeTalk() },
      { npc: this.tyler, r: 50, label: 'Talk', fn: () => this.tylerTalk() },
      { npc: this.brody, r: 50, label: 'Talk', fn: () => this.brodyTalk() }
    ];
  }

  speakerTarget(who) {
    const m = {
      TYLER: this.tyler, JAKE: this.jake, BRODY: this.brody, KAYLA: this.kayla, MAYA: this.maya,
      VOICE: { x: 260, y: 520 }, CROWD: this.revealed ? this.livingCrowd[0] : this.kitchenCrowd[0]
    };
    return m[who] || this.player;
  }

  // ---------- loop ----------
  update(time) {
    if (!this.player || this.ended) return;
    this.movePlayer(time);
    if (!this.brodyWalking) this.brody.setDepth(CHAR_D + this.brody.y);
    if (!this.jakeDown && !this.jakeLeft) this.followNPC(this.jake, { x: this.player.x - 38, y: this.player.y + 6 }, 50, 150, time);

    // pending story events
    if (this.pending.length && !this.uiBusy() && this.time.now - this.ui.closedAt > 500) this.pending.shift()();

    // nearest interactable
    let best = null, bd = 1e9;
    for (const it of this.inter) {
      if (it.zone === 'living' && !this.revealed) continue;
      const x = it.npc ? it.npc.x : it.x, y = it.npc ? it.npc.y : it.y;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
      const score = it.low ? d + 1000 : d;
      if (d < it.r && score < bd) { best = it; bd = score; }
    }
    if (best && !this.uiBusy() && !this.frozen) {
      const x = best.npc ? best.npc.x : best.x, y = best.npc ? best.npc.y - 30 : best.y - 40;
      this.prompt.setText(`[E] ${best.label}`).setPosition(x, y).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) best.fn();
    } else this.prompt.setVisible(false);

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && !this.uiBusy() && !this.frozen) this.tailShake(time);
    this.nameTags.forEach(({ n, t }) => t.setPosition(n.x, n.y - 32).setVisible(n.visible && !(n === this.jake && this.jakeDown)));
    // objective marker
    const mt = this.markerTarget;
    if (mt && !this.uiBusy()) {
      const mx = mt.npc ? mt.npc.x : mt.x, my = (mt.npc ? mt.npc.y - 40 : mt.y - 50) + Math.sin(time / 180) * 5;
      this.marker.setPosition(mx, my).setVisible(true);
    } else this.marker.setVisible(false);
  }

  say(who, text, done) { this.ui.lines([{ who, text }], done); }

  // ---------- core systems ----------
  drink(amount, msg) {
    let a = amount;
    if (S.chipsBuffer > 0) { a *= 0.5; S.chipsBuffer--; }
    S.depth = Math.min(10, S.depth + a);
    S.peak = Math.max(S.peak, S.depth);
    S.drinks++;
    S.holdingWater = false;
    this.floatText(this.player.x, this.player.y - 40, '⛏ digging deeper', '#ff8a8a');
    this.cameras.main.shake(250, 0.004);
    this.ui.refresh();
    if (msg) this.ui.toast(msg, 3200);
    if (S.depth >= 10) this.time.delayedCall(900, () => this.blackout());
  }
  addSinkCans(n) {
    for (let i = 0; i < n; i++) {
      const k = this.sinkCans.length;
      // fill the sink first, then pile up on the counter around it
      const inSink = k < 10;
      const x = inSink ? 67 + (k % 3) * 7 + Math.random() * 3 : 64 + Math.random() * 26;
      const y = inSink ? 618 + Math.floor(k / 3) * 9 + Math.random() * 3 : 600 + Math.random() * 70;
      const c = this.add.image(x, y, Math.random() < 0.55 ? 'canOpen' : 'canOpen2').setDepth(692 + k * 0.01).setAngle(Phaser.Math.Between(-60, 60)).setScale(0);
      this.tweens.add({ targets: c, scale: 1, duration: 250, delay: i * 120, ease: 'Back.easeOut' });
      this.sinkCans.push(c);
    }
  }
  advance(m) {
    if (this.ended) return;
    const hoursBefore = Math.floor(S.minutes / 60);
    S.minutes += m;
    const hours = Math.floor(S.minutes / 60) - hoursBefore;
    if (hours > 0) this.addSinkCans(hours * 4);
    // the body slowly processes alcohol over time
    S.depth = Math.max(0, S.depth - 0.25 * (m / 15));
    this.ui.refresh();
  }
  setClock(m) { if (m > S.minutes) this.advance(m - S.minutes); }

  // ---------- linear story steps ----------
  setStep(name) {
    const steps = {
      tail: { text: 'Say hi to the kitchen crowd: show off your tail (SPACE)', x: 120, y: 760 },
      kitchen: { text: 'Dig in: the beer stack or the punch bowl', x: 215, y: 668 },
      bathroom: { text: 'Someone\'s been in the bathroom forever. Check on them.', x: 260, y: 572 },
      balcony: { text: 'Get some air on the balcony', npc: this.maya },
      jake: { text: 'Where did Jake go? Find him.', npc: this.jake }
    };
    this.step = name;
    this.markCurrent(name);
    this.markerTarget = steps[name] || null;
    this.ui.objective(steps[name] ? steps[name].text : '');
    const st = STEPS.find(x => x.id === name);
    if (st && name !== 'tail' && !this.ui.phoneOpen) { this.ui.phoneBadge.setVisible(true); this.ui.toast(`💬 ${st.from}: ${st.msg}`, 3000); }
  }
  markCurrent(id) {
    if (S.current && S.current !== id && !S.done.includes(S.current)) S.done.push(S.current);
    S.current = id;
    if (this.ui.phoneOpen) this.ui.drawPhone();
  }
  stepDone(name) {
    if (this.step !== name) return;
    this.step = null;
    this.markerTarget = null;
    this.ui.objective('');
    const next = {
      tail: () => this.brodyApproach(refused => refused ? this.kaylaApproach(() => this.setStep('kitchen')) : this.setStep('kitchen')),
      kitchen: () => { this.reveal(); this.time.delayedCall(2000, () => this.pending.push(() => this.stage1())); },
      bathroom: () => this.setStep('balcony'),
      balcony: () => this.stage2(),
      jake: () => { this.setClock(270); this.endNight(); }
    }[name];
    this.time.delayedCall(700, () => this.pending.push(next));
  }
  spawnMess(n) {
    const areas = [[75, 560, 280, 270], [400, 460, 440, 360], [400, 700, 380, 120]];
    for (let i = 0; i < n; i++) {
      const [x, y, w, h] = Phaser.Utils.Array.GetRandom(areas);
      const k = Phaser.Utils.Array.GetRandom(['can', 'can2', 'cup', 'can']);
      const s = this.add.image(x + Math.random() * w, y + Math.random() * h, k).setAngle(Phaser.Math.Between(0, 3) * 90 + 90).setDepth(-500);
      this.mess.add(s);
      if (Math.random() < 0.25) this.add.ellipse(s.x + 6, s.y + 4, 22, 10, 0xc9a227, 0.35).setDepth(-501);
    }
  }
  ambient() {
    if (this.ended) return;
    const d = Phaser.Utils.Array.GetRandom(this.dancers);
    const lines = S.flags.s2 ? ['WOOOO', 'one more!!', 'where\'s my phone', 'SHOTS!!'] : S.flags.s1 ? ['let\'s gooo', 'pong is so back', 'turn it up!'] : ['hiii', 'love this song', 'chips are elite'];
    this.floatText(d.x, d.y - 32, Phaser.Utils.Array.GetRandom(lines), '#ffffff');
    if (S.jakeDrunk >= 4 && Math.random() < 0.4) this.floatText(this.jake.x, this.jake.y - 32, Phaser.Utils.Array.GetRandom(['hehe', 'bro I love you', '*hic*']), '#6fb3ff');
  }

  tailShake(time) {
    this.shakeUntil = time + 900;
    this.tweens.add({ targets: this.player, scaleY: 0.88, duration: 110, yoyo: true, repeat: 3 });
    const near = [...this.dancers, this.brody, this.kayla, this.tyler, ...this.ponger]
      .filter(n => Phaser.Math.Distance.Between(n.x, n.y, this.player.x, this.player.y) < 230);
    if (S.depth >= 6) {
      this.tweens.add({ targets: this.player, angle: { from: -25, to: 25 }, duration: 120, yoyo: true, repeat: 2, onComplete: () => this.player.setAngle(0) });
      near.slice(0, 2).forEach((n, i) => this.time.delayedCall(i * 300, () => this.floatText(n.x, n.y - 32, Phaser.Utils.Array.GetRandom(['lmaooo he\'s gone', 'bro is NOT okay', 'yikes']), '#ff8a8a')));
      this.ui.toast('You stumble mid-shake. People are laughing at you now, not with you.');
    } else {
      const lines = ['THAT TAIL!!', 'Bucky\'s got MOVES', 'yooo the tail', 'iconic', 'legend!!'];
      near.slice(0, 3).forEach((n, i) => this.time.delayedCall(i * 250, () => this.floatText(n.x, n.y - 32, Phaser.Utils.Array.GetRandom(lines), '#ffd166')));
      if (!near.length) this.floatText(this.player.x, this.player.y - 40, 'wiggle wiggle', '#ffd166');
    }
    if (this.step === 'tail' && [...this.kitchenCrowd, this.brody, this.kayla].some(d => Phaser.Math.Distance.Between(d.x, d.y, this.player.x, this.player.y) < 230)) this.stepDone('tail');
  }

  walkTo(npc, x, y, done) {
    const d = Phaser.Math.Distance.Between(npc.x, npc.y, x, y);
    npc.setFlipX(x < npc.x);
    this.tweens.add({ targets: npc, x, y, duration: Math.max(200, d * 6), onUpdate: () => npc.setDepth(CHAR_D + npc.y), onComplete: done });
  }

  // ---------- scenes ----------
  brodyApproach(next) {
    const fin = refused => this.pending.push(() => next(refused));
    this.brodyWalking = true;
    this.frozen = true;
    this.walkTo(this.brody, this.player.x + 48, this.player.y, () => {
      this.brodyWalking = false;
      this.ui.lines([{ who: 'BRODY', text: 'BRO. That tail is legendary. You gotta celebrate — here!' }], () => {
        this.frozen = false;
        const refusedFollow = () => { S.refused++; this.ui.learn('no'); this.brodyHomeWalk(); fin(true); };
        this.ui.choose({
          who: 'BRODY', text: '*holds out a red cup*', timer: 5,
          choices: [
            { label: '🍺 "Let\'s go!"', fn: () => { this.drink(2); this.say('BRODY', 'THAT\'S what I\'m talking about!', () => { this.ui.learn('pressure'); this.brodyHomeWalk(); fin(false); }); } },
            { label: '🥔 "Lemme grab chips first."', fn: () => { this.say('BRODY', 'Fair, fair. I\'ll catch you later, legend.', () => { this.brodyHomeWalk(); fin(false); }); } },
            { label: '💧 "I\'m on water rn."', sober: true, fn: () => this.say('BRODY', 'Respect, respect.', refusedFollow) },
            { label: '🦶 Dig in your heels: "Nah, I\'m good."', sober: true, fn: () => this.say('BRODY', 'Suit yourself, legend.', refusedFollow) }
          ],
          waterOk: () => this.say('BRODY', 'Oh you\'re set? Bet.', refusedFollow),
          onTimeout: () => { this.say('', 'You pass on the cup. Brody shrugs and you head in with the group.', () => { this.ui.learn('no'); this.brodyHomeWalk(); fin(true); }); }
        });
      });
    });
  }
  brodyHomeWalk() { this.brodyWalking = true; this.walkTo(this.brody, this.brodyHome.x, this.brodyHome.y, () => { this.brodyWalking = false; }); }

  kaylaApproach(next) {
    const fin = () => this.pending.push(next);
    this.frozen = true;
    this.walkTo(this.kayla, this.player.x - 46, this.player.y + 4, () => {
      this.frozen = false;
      this.ui.choose({
        who: 'KAYLA', text: 'Wait... you don\'t drink? *laughs* Why\'d you even come to a party then?',
        choices: [
          { label: '😎 "I\'m here for the vibes. And the chips."', sober: true, fn: () => { this.ui.learn('no'); this.say('KAYLA', 'Okay, fair. The chips ARE elite.', () => this.ui.toast('A confident, casual answer shuts it down fast. You don\'t owe anyone a reason.', 3800)); fin(); } },
          { label: '🦶 "Just not feeling it tonight."', sober: true, fn: () => { this.ui.learn('no'); this.say('KAYLA', 'Huh. Okay.', () => this.ui.toast('You don\'t owe anyone an explanation.', 3000)); fin(); } },
          { label: '😬 "...I mean, I could have one."', fn: () => { this.say('KAYLA', 'Yesss! Kitchen, let\'s go.'); this.drink(2, 'Judgment is pressure too.'); fin(); } }
        ]
      });
    });
  }

  stage1() {
    this.setClock(90);
    S.flags.s1 = true;
    this.markCurrent('pong');
    this.ui.banner('10:30 PM');
    this.spawnMess(18);
    S.jakeDrunk = Math.max(S.jakeDrunk, 3);
    this.tweens.timeScale = 1.3;
    this.time.delayedCall(1800, () => this.pending.push(() => this.pongInvite(() => this.setStep('bathroom'))));
  }
  pongInvite(next) {
    const fin = () => this.pending.push(next);
    this.ui.lines([{ who: 'BRODY', text: 'YO LEGEND! Pong. You and me. Loser drinks!' }, { who: 'CROWD', text: 'PONG! PONG! PONG!' }], () => {
      const play = () => { S.refused++; this.say('BRODY', '...Respect. Still gonna destroy you.', () => this.ui.toast('You can still join in without drinking.')); fin(); };
      this.ui.choose({
        who: 'BRODY', text: 'You in or what?', timer: 6,
        choices: [
          { label: '🍺 "Let\'s go!"', fn: () => this.ui.lines([{ who: '', text: 'You sink one cup... then miss six in a row. You lose. Badly.' }, { who: 'BRODY', text: 'Drink up, champ!' }], () => { this.drink(2); fin(); }) },
          { label: '💧 "I\'ll play — water in my cups."', sober: true, fn: play },
          { label: '🦶 "I\'ll ref this one."', sober: true, fn: () => { S.refused++; this.say('BRODY', 'Ref?? Fine. No cheating calls though.'); fin(); } }
        ],
        waterOk: play,
        onTimeout: play
      });
    });
  }
  stage2() {
    this.setClock(180);
    S.flags.s2 = true;
    this.markCurrent('shots');
    this.ui.banner('12:00 AM');
    this.spawnMess(30);
    S.jakeDrunk = Math.max(S.jakeDrunk, 6);
    this.tweens.timeScale = 1.7;
    this.time.delayedCall(1500, () => this.pending.push(() => this.shots(() => this.jakeWandersOff())));
  }
  jakeWandersOff() {
    this.jakeLeft = true;
    this.jake.setPosition(700, 770).setFlipX(true).setDepth(CHAR_D + 770);
    this.ui.toast('Wait... where did Jake go?');
    this.setStep('jake');
  }
  shots(next) {
    const fin = () => this.pending.push(next);
    this.ui.lines([{ who: 'TYLER', text: 'EVERYBODY! SHOTS! On three!' }, { who: 'CROWD', text: 'ONE! TWO!...' }], () => {
      this.ui.choose({
        who: 'TYLER', text: '*hands you a shot glass*', timer: 5,
        choices: [
          { label: '🥃 Take the shot', fn: () => { this.drink(3, 'Shots hit way faster than beer.'); this.ui.learn('shots'); fin(); } },
          { label: '💧 Raise your water and cheers', sober: true, fn: () => { S.refused++; this.say('TYLER', 'WATER GANG! Okay okay!'); fin(); } },
          { label: '🦶 Dig in your heels: "I\'m good."', sober: true, fn: () => { S.refused++; this.say('TYLER', 'All good, more for us!'); fin(); } },
          { label: '🌙 Slip out to the balcony', fn: () => { S.refused++; this.player.setPosition(130, 470); this.ui.toast('You step away from the crowd. Fresh air.'); fin(); } }
        ],
        onTimeout: () => this.say('', 'You set the shot down. The night moves on without you drinking.', fin)
      });
    });
  }

  grabBeer() {
    this.ui.choose({
      who: '', text: 'A whole pyramid of cans. Someone built it with love.', choices: [
        { label: '🍺 Crack one open', fn: () => { this.drink(2); this.stepDone('kitchen'); } },
        { label: '🦶 Leave it', sober: true, fn: () => this.stepDone('kitchen') }
      ]
    });
  }
  eatChips() {
    S.chips++;
    S.chipsBuffer = 2;
    this.ui.learn('food');
    this.ui.refresh();
    this.floatText(this.player.x, this.player.y - 40, '*crunch*', '#f2c14e');
    this.stepDone('kitchen');
    if (!S.flags.chipsTip) { S.flags.chipsTip = true; this.ui.lines([{ who: '', text: 'You dig into the chips. *crunch*' }, { who: '', text: 'Food in your stomach slows how fast alcohol hits you. Your next two drinks dig you in less.' }]); }
  }
  getWater() {
    S.water++;
    S.holdingWater = true;
    this.ui.learn('water');
    this.ui.refresh();
    this.floatText(this.player.x, this.player.y - 40, '🥤 water', '#9fd6ff');
    this.stepDone('kitchen');
    if (!S.flags.waterTip) { S.flags.waterTip = true; this.ui.lines([{ who: '', text: 'You fill a red cup with water.' }, { who: '', text: 'Water doesn\'t sober you up. But a cup in your hand means fewer people offer you drinks — and it keeps you pacing.' }]); }
  }
  punch() {
    const drinkIt = () => { this.drink(3, 'That was NOT juice. Mixed drinks hide how strong they are.'); this.ui.learn('mixed'); this.stepDone('kitchen'); };
    const ask = () => this.ui.lines([{ who: 'KAYLA', text: 'The punch? Lol it\'s like... half vodka? Tyler lost count.' }], () => this.ui.choose({
      who: 'BUCKY', text: '...half vodka.', choices: [
        { label: '🍹 Drink it anyway', fn: drinkIt },
        { label: '🦶 Skip it', sober: true, fn: () => { this.ui.learn('mixed'); this.stepDone('kitchen'); } }
      ]
    }));
    this.ui.choose({
      who: '', text: 'A big bowl of red punch. Smells like fruit juice.', choices: [
        { label: '🍹 Drink a cup', fn: drinkIt },
        { label: '❓ Ask what\'s in it', fn: ask },
        { label: '🦶 Skip it', sober: true, fn: () => this.stepDone('kitchen') }
      ]
    });
  }
  knock() {
    if (S.checkedBathroom) { this.say('VOICE', '...still in here. I\'m okay.'); return; }
    S.checkedBathroom = true;
    this.ui.lines([
      { who: '', text: '*knock knock*' },
      { who: 'BUCKY', text: 'Hey... you okay in there? You\'ve been in there a while.' },
      { who: 'VOICE', text: '...yeah. I\'m good. Thanks for checking.' }
    ], () => { this.ui.learn('check'); this.stepDone('bathroom'); });
  }
  pongTalk() {
    if (!S.flags.s1) this.say('', 'The pong table is set up. Nobody\'s playing yet.');
    else this.say('', Phaser.Utils.Array.GetRandom(['*a ball bounces off the rim*', 'The crowd is chanting someone\'s name.', 'Cups everywhere. The table is sticky.']));
  }
  mayaTalk() {
    const breather = () => {
      this.ui.lines([{ who: '', text: 'You hang out on the balcony for a while. The music\'s muffled out here.' }, { who: '', text: 'Fresh air doesn\'t sober you up — only time does. But stepping away gives your body that time.' }], () => { this.advance(15); this.ui.learn('time'); });
    };
    const first = !S.talkedMaya;
    S.talkedMaya = true;
    this.ui.lines(first ? [
      { who: 'MAYA', text: 'Oh hey. Needed some air too?' },
      { who: 'MAYA', text: 'I don\'t drink either. Honestly, out here\'s the best part of the party.' }
    ] : [{ who: 'MAYA', text: Phaser.Utils.Array.GetRandom(['Back again? Pull up a chair.', 'Inside is getting chaotic, huh.', 'You can see the Capitol from here if you squint.']) }], () => {
      this.ui.choose({
        who: 'MAYA', text: 'Wanna chill out here for a bit?', choices: [
          { label: '🌙 Hang out for a bit (+15 min)', fn: () => { breather(); this.stepDone('balcony'); } },
          { label: '👋 Head back in', fn: () => this.stepDone('balcony') }
        ]
      });
    });
  }
  kaylaTalk() { this.say('KAYLA', S.flags.s1 ? 'Have you tried the punch? It\'s DANGEROUS lol.' : 'Hiii! Love the tail, honestly.'); }
  tylerTalk() { this.say('TYLER', S.flags.s2 ? 'Bro... my house... it\'s so sticky.' : 'Dig in, man! Chips and drinks in the kitchen!'); }
  brodyTalk() { this.say('BRODY', S.flags.s1 ? 'Rematch later. Pong. You and me.' : 'Where\'s that TAIL at?!'); }
  jakeTalk() {
    if (this.step === 'jake') {
      this.ui.lines([
        { who: 'JAKE', text: 'Brooo... there you are. I don\'t feel so good.' },
        { who: 'JAKE', text: 'I\'m just gonna... lie down on the couch for a sec.' }
      ], () => this.ui.choose({
        who: 'JAKE', text: '*stumbles toward the couch*', choices: [
          { label: '💧 "Drink some water first."', fn: () => this.say('JAKE', '...later. Couch first.', () => this.stepDone('jake')) },
          { label: '👍 "Yeah, sleep it off, man."', fn: () => this.stepDone('jake') }
        ]
      }));
      return;
    }
    if (S.jakeDrunk < 3) { this.say('JAKE', 'This is gonna be a good night.'); return; }
    this.ui.lines([{ who: 'JAKE', text: S.jakeDrunk >= 6 ? 'Brooo... I can\'t feel my face. One more? One more.' : 'Bro I\'m like... feeling it. Gonna grab another.' }], () => this.ui.choose({
      who: 'JAKE', text: '*sways*', choices: [
        { label: '🍺 "One more!"', fn: () => { S.jakeDrunk = Math.min(9, S.jakeDrunk + 1); this.say('JAKE', 'LET\'S GOOO'); } },
        { label: '💧 "Slow down. Drink this water first."', fn: () => { S.jakeDrunk = Math.max(0, S.jakeDrunk - 1); S.flags.helpedJake = true; this.say('JAKE', 'Ugh... fine. You\'re right.', () => this.ui.toast('Jake skips his next drink. Looking out for friends counts.')); } }
      ]
    }));
  }

  // ---------- ending of the night ----------
  endNight() {
    this.markCurrent('end');
    if (S.drinks === 0) {
      this.setClock(360); // 9:00 PM plus six hours = 3:00 AM
      this.ended = true;
      this.player.setVelocity(0, 0);
      this.ui.close();
      this.ui.showHUD(false);
      this.cameras.main.fadeOut(1200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('UI');
        this.scene.start('StateStreet');
      });
      return;
    }
    if (!S.rewind || S.depth >= 6) { this.blackout(); return; }
    this.jakeClimax();
  }
  blackout() {
    if (this.ended) return;
    this.ended = true;
    this.player.setVelocity(0, 0);
    this.ui.close();
    this.ui.showHUD(false);
    this.cameras.main.fadeOut(1800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop('UI'); this.scene.start('Blackout'); });
  }
  jakeClimax() {
    this.frozen = true;
    this.jakeDown = true;
    this.player.setVelocity(0, 0);
    this.jakeLeft = false;
    this.jake.setPosition(828, 650).setAngle(90).setDepth(CHAR_D + 800).setTint(0xc8d6e0);
    this.player.setPosition(760, 650).setFlipX(false);
    this.couchGuy.setVisible(false);
    this.brody.setPosition(735, 590);
    this.tweens.timeScale = 0.6;
    this.ui.banner('1:30 AM');
    const decide = () => this.ui.choose({
      who: 'BUCKY', text: 'What do you do?', choices: [
        { label: '😴 Let him sleep it off', fn: () => this.ui.lines([
          { who: '', text: 'You leave Jake on the couch and go back to the party.' },
          { who: '', text: 'Later, his breathing turns slow and uneven. Alcohol can keep rising in the blood after someone passes out. "Sleeping it off" can kill.' },
          { who: '', text: '⛏ You dig back to that moment.' }
        ], decide) },
        { label: '🔍 Check on him', fn: check }
      ]
    });
    const check = () => this.ui.lines([
      { who: '', text: 'You shake Jake and shout his name. He doesn\'t wake up.' },
      { who: '', text: 'His breathing is slow — long gaps between breaths.' },
      { who: '', text: 'His skin is cold and clammy. There\'s vomit on the floor.' },
      { who: '', text: 'These are signs of alcohol poisoning.' }
    ], () => { this.ui.learn('signs'); act(); });
    const act = () => this.ui.choose({
      who: 'BUCKY', text: 'What now?', choices: [
        { label: '☕ Coffee + a cold shower to wake him up', fn: () => this.ui.lines([{ who: '', text: 'Coffee and cold showers don\'t sober anyone up. A cold shower can also send someone into shock. That\'s a myth.' }], act) },
        { label: '📞 Roll him on his side + call 911', fn: save }
      ]
    });
    const save = () => this.ui.lines([
      { who: '', text: 'You roll Jake onto his side so he won\'t choke if he throws up.' },
      { who: '', text: 'You call 911 and stay with him until help arrives.' },
      { who: 'BRODY', text: '...wait. Is he gonna be okay?' },
      { who: 'BUCKY', text: 'He will be. We called.' },
      { who: '', text: '📱 New on your phone: Roll them on their side, call 911, stay with them.' },
      { who: '', text: 'Something tickles behind you. You turn around...' }
    ], () => {
      LEARNED.add('call');
      this.ended = true;
      this.ui.showHUD(false);
      this.cameras.main.fadeOut(1500, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop('UI'); this.scene.start('Ending'); });
    });
    this.time.delayedCall(1800, () => this.ui.lines([
      { who: '', text: 'The music\'s still going. Jake is on the couch... not moving.' },
      { who: 'BRODY', text: 'He\'s good, bro. Just let him sleep it off.' }
    ], decide));
  }
}

// ======================================================================
class StateStreet extends Phaser.Scene {
  constructor() { super('StateStreet'); }

  create() {
    this.cameras.main.fadeIn(900);
    this.drawStreet();
    this.shadow = this.add.ellipse(330, 452, 72, 16, 0x05070d, 0.65).setDepth(50);
    this.bucky = this.add.sprite(330, 414, 'badger', 0).setScale(2.15).setDepth(100);
    this.bucky.anims.play('walk');
    this.tail = this.add.image(300, 436, 'tail').setScale(2.5).setOrigin(0.1, 0.5).setDepth(99).setFlipX(true);
    this.mascot = this.makeWolverine(-100, 418);
    withUI(this, ui => {
      this.ui = ui;
      ui.setTop(true);
      ui.showHUD(false);
      ui.banner('STATE STREET · 3:00 AM', 1500);
      this.time.delayedCall(1800, () => ui.lines([
        { who: '', text: '3:00 AM. Bucky is walking alone on State Street, without a buddy beside him.' }
      ], () => this.walkAndSteal()));
    });
  }

  drawStreet() {
    const g = this.add.graphics().setDepth(-100);
    g.fillStyle(0x09101f, 1); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 34; i++) {
      g.fillStyle(0xcbd8eb, 0.65);
      g.fillRect((i * 137) % W, 30 + ((i * 47) % 230), 2, 2);
    }
    const buildings = [
      { x: 0, w: 185, color: 0x5a2934, sign: 'LATE NIGHT' },
      { x: 190, w: 175, color: 0x3c334d, sign: 'STATE ST' },
      { x: 370, w: 205, color: 0x503b32, sign: 'OPEN' },
      { x: 580, w: 175, color: 0x303d55, sign: 'MADISON' },
      { x: 760, w: 200, color: 0x5a2934, sign: '★' }
    ];
    buildings.forEach((building, index) => {
      g.fillStyle(building.color, 1); g.fillRect(building.x, 125 + (index % 2) * 18, building.w, 270);
      g.fillStyle(0x171c2d, 1); g.fillRect(building.x + 12, 145, building.w - 24, 82);
      g.fillStyle(0xffd878, 0.88);
      for (let wx = building.x + 22; wx < building.x + building.w - 16; wx += 35) {
        g.fillRect(wx, 155, 19, 24); g.fillRect(wx, 190, 19, 24);
      }
      g.fillStyle(0x211822, 1); g.fillRect(building.x + 18, 300, building.w - 36, 95);
      g.fillStyle(0xb94755, 1); g.fillRect(building.x + 12, 247, building.w - 24, 34);
      this.add.text(building.x + building.w / 2, 264, building.sign, {
        fontFamily: FONT, fontSize: '13px', color: '#fff1cc', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(-90).setResolution(2);
    });
    g.fillStyle(0x8c8174, 1); g.fillRect(0, 395, W, 80);
    g.fillStyle(0xb8ac98, 1); g.fillRect(0, 395, W, 7);
    for (let x = 0; x < W; x += 52) {
      g.lineStyle(2, 0x645d59, 0.8); g.lineBetween(x, 405, x, 475);
    }
    g.fillStyle(0x252a35, 1); g.fillRect(0, 475, W, 165);
    g.fillStyle(0xd5b958, 0.85);
    for (let x = 25; x < W; x += 125) g.fillRect(x, 550, 54, 5);
    [110, 825].forEach(x => {
      g.fillStyle(0x272b3b, 1); g.fillRect(x, 270, 8, 125);
      g.fillRect(x - 15, 268, 38, 6);
      g.fillStyle(0xffdf91, 0.24); g.fillRect(x - 40, 282, 88, 5);
      g.fillStyle(0xffe2a0, 1); g.fillRect(x - 5, 264, 18, 9);
    });
    this.add.text(W / 2, 38, 'STATE STREET · MADISON, WI', {
      fontFamily: FONT, fontSize: '16px', color: '#fff1cc', fontStyle: 'bold',
      backgroundColor: '#111827cc', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(200).setResolution(2);
  }

  makeWolverine(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0x754b2b, 1);
    g.fillRect(-24, -62, 42, 34);
    g.fillTriangle(-22, -55, -18, -76, -7, -59);
    g.fillTriangle(3, -59, 17, -76, 18, -48);
    g.fillRect(7, -49, 25, 18);
    g.fillStyle(0x16141a, 1); g.fillRect(25, -43, 7, 6);
    g.fillRect(-15, -52, 5, 5); g.fillRect(2, -52, 5, 5);
    g.fillStyle(0x00274c, 1); g.fillRect(-19, -28, 42, 42);
    g.fillStyle(0xffcb05, 1); g.fillRect(-22, -24, 10, 28); g.fillRect(19, -24, 10, 28);
    g.fillRect(-18, 14, 40, 17);
    g.fillStyle(0x00274c, 1); g.fillRect(-16, 30, 12, 24); g.fillRect(9, 30, 12, 24);
    g.fillStyle(0xffcb05, 1); g.fillRect(-22, 51, 20, 7); g.fillRect(7, 51, 20, 7);
    const initial = this.add.text(2, -8, 'M', {
      fontFamily: FONT, fontSize: '20px', color: '#ffcb05', fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2);
    const mascot = this.add.container(x, y, [g, initial]).setDepth(110);
    mascot.setScale(1.35);
    return mascot;
  }

  walkAndSteal() {
    this.bucky.anims.play('walk');
    this.tweens.add({
      targets: [this.bucky, this.shadow], x: 440, duration: 1250, ease: 'Linear',
      onComplete: () => { this.bucky.anims.stop(); this.runPastBucky(); }
    });
    this.tweens.add({ targets: this.tail, x: 410, duration: 1250, ease: 'Linear' });
  }

  runPastBucky() {
    this.mascot.setPosition(40, 418);
    this.tweens.add({
      targets: this.mascot, x: 435, duration: 850, ease: 'Linear',
      onComplete: () => this.tweens.add({
        targets: this.tail, x: 458, y: 395, angle: -25, duration: 300, ease: 'Back.easeOut',
        onComplete: () => {
          this.bucky.setFlipX(true);
          this.add.text(465, 350, 'HEY!', {
            fontFamily: FONT, fontSize: '24px', color: '#ffdf73', fontStyle: 'bold',
            stroke: '#14101c', strokeThickness: 5
          }).setDepth(250).setResolution(2);
          this.tweens.add({
            targets: this.mascot, x: 1080, duration: 950, ease: 'Linear',
            onComplete: () => this.showTheftMessage()
          });
        }
      })
    });
  }

  showTheftMessage() {
    this.ui.lines([
      { who: '', text: 'A maize-and-blue Michigan Wolverine mascot races past and steals Bucky’s tail!' },
      { who: 'BUCKY', text: 'My tail! I should have made a safer plan for getting home.' }
    ], () => this.showBuddyPopup());
  }

  showBuddyPopup() {
    this.ui.close();
    this.ui.showHUD(false);
    this.overlay = this.add.container(0, 0).setDepth(5000);
    this.overlay.add(this.add.rectangle(W / 2, H / 2, W, H, 0x050812, 0.72));
    this.overlay.add(this.add.rectangle(W / 2, H / 2, 820, 430, 0x171c2c, 0.98).setStrokeStyle(4, 0xffcb05));
    this.overlay.add(this.add.rectangle(W / 2, 135, 820, 56, 0x00274c, 1));
    this.overlay.add(this.add.text(W / 2, 135, 'PLAN AHEAD: WALKING AT NIGHT', {
      fontFamily: FONT, fontSize: '24px', color: '#ffcb05', fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2));
    const cards = [
      { x: 205, title: 'BADGER BUDDY', caption: 'MOVE-IN + WELCOME', color: 0xffcb05 },
      { x: 480, title: 'BADGERSAFE', caption: 'SHARE TRIP WITH A TRUSTED PERSON', color: 0x76c9ff },
      { x: 755, title: 'SAFEWALK', caption: 'TRAINED ESCORTS · UNTIL 1 AM', color: 0xffa34d }
    ];
    cards.forEach(card => this.overlay.add(
      this.add.rectangle(card.x, 320, 244, 244, 0x232940, 1).setStrokeStyle(3, card.color)
    ));

    // Simple pixel icons carry the key idea on each card.
    const art = this.add.graphics();
    // Badger Buddy: two welcome volunteers greeting a new student.
    art.fillStyle(0xffd18a, 1); art.fillRect(153, 232, 24, 24); art.fillRect(233, 232, 24, 24);
    art.fillStyle(0xc5050c, 1); art.fillRect(147, 260, 36, 46); art.fillRect(227, 260, 36, 46);
    art.fillStyle(0xffd18a, 1); art.fillRect(187, 268, 22, 12); art.fillRect(201, 258, 22, 12);
    art.fillStyle(0xfff0ca, 1); art.fillRect(187, 280, 36, 9);

    // BadgerSAFE Friend Walk: a phone sharing a route and location pin.
    art.fillStyle(0x101624, 1); art.fillRect(447, 216, 66, 105);
    art.fillStyle(0xf3efdf, 1); art.fillRect(454, 226, 52, 82);
    art.fillStyle(0x73bfe9, 1); art.fillRect(460, 274, 39, 5); art.fillRect(460, 262, 22, 5); art.fillRect(477, 250, 22, 5);
    art.fillStyle(0xc5050c, 1); art.fillRect(480, 238, 12, 12); art.fillTriangle(480, 246, 492, 246, 486, 258);
    art.fillStyle(0xffcb05, 1); art.fillRect(474, 312, 12, 4);

    // SAFEwalk: two trained escorts in bright vests.
    art.fillStyle(0xffd18a, 1); art.fillRect(710, 232, 24, 24); art.fillRect(770, 232, 24, 24);
    art.fillStyle(0x343b52, 1); art.fillRect(704, 260, 36, 48); art.fillRect(764, 260, 36, 48);
    art.fillStyle(0xff9c32, 1); art.fillRect(711, 265, 22, 32); art.fillRect(771, 265, 22, 32);
    art.fillStyle(0xfff0ca, 1); art.fillRect(716, 274, 12, 7); art.fillRect(776, 274, 12, 7);
    this.overlay.add(art);

    cards.forEach(card => {
      this.overlay.add(this.add.text(card.x, 365, card.title, {
        fontFamily: FONT, fontSize: '16px', color: Phaser.Display.Color.IntegerToColor(card.color).rgba,
        fontStyle: 'bold', align: 'center'
      }).setOrigin(0.5).setResolution(2));
      this.overlay.add(this.add.text(card.x, 402, card.caption, {
        fontFamily: FONT, fontSize: card.x === 480 ? '11px' : '12px', color: '#ffffff',
        align: 'center', wordWrap: { width: 210 }
      }).setOrigin(0.5).setResolution(2));
    });
    this.overlay.add(this.add.text(W / 2, 455, '3:00 AM · BUCKY WALKED ALONE', {
      fontFamily: FONT, fontSize: '15px', color: '#ffcb05', fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2));
    const button = this.add.text(W / 2, 500, 'CONTINUE ▶', {
      fontFamily: FONT, fontSize: '18px', color: '#111827', fontStyle: 'bold',
      backgroundColor: '#ffcb05', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setResolution(2);
    button.on('pointerdown', () => this.showChapterHandoff());
    this.overlay.add(button);
    this.input.keyboard.once('keydown-ENTER', () => this.showChapterHandoff());
  }

  showChapterHandoff() {
    if (this.handoffShown) return;
    this.handoffShown = true;
    this.overlay.removeAll(true);
    this.overlay.add(this.add.rectangle(W / 2, H / 2, W, H, 0x050812, 0.76));
    this.overlay.add(this.add.rectangle(W / 2, H / 2, 740, 330, 0x171c2c, 0.98).setStrokeStyle(4, 0xffcb05));
    this.overlay.add(this.add.text(W / 2, 250, 'TAIL STOLEN!', {
      fontFamily: FONT, fontSize: '36px', color: '#ffcb05', fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2));
    this.overlay.add(this.add.text(W / 2, 315, 'The trail continues in Chapter 2…', {
      fontFamily: FONT, fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5).setResolution(2));
    const button = this.add.text(W / 2, 405, 'RETURN TO TITLE', {
      fontFamily: FONT, fontSize: '17px', color: '#ffffff', backgroundColor: '#c5050c',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setResolution(2);
    button.on('pointerdown', () => this.returnToTitle());
    this.overlay.add(button);
    this.input.keyboard.once('keydown-ENTER', () => this.returnToTitle());
  }

  returnToTitle() {
    this.scene.stop('UI');
    this.scene.start('Title');
  }
}

// ======================================================================
class Blackout extends Phaser.Scene {
  constructor() { super('Blackout'); }
  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const frags = ['"one more, legend!"', '*bass thumping*', '...where\'s Jake...', '"bro is GONE lol"', '...the room is spinning...', '...my tail...'];
    frags.forEach((f, i) => {
      const t = this.add.text(Phaser.Math.Between(160, W - 160), Phaser.Math.Between(120, H - 160), f, { fontFamily: FONT, fontSize: '22px', color: '#888888', fontStyle: 'italic' }).setOrigin(0.5).setAlpha(0).setResolution(2);
      this.tweens.add({ targets: t, alpha: 0.9, duration: 500, delay: 600 + i * 900, yoyo: true, hold: 500 });
    });
    this.time.delayedCall(600 + frags.length * 900 + 1500, () => this.scene.start('Terrace'));
  }
}

// ======================================================================
function drawTerrace(scene) {
  const g = scene.add.graphics().setDepth(-100);
  g.fillGradientStyle(0x3b5b8f, 0x3b5b8f, 0xffa86b, 0xffa86b, 1); g.fillRect(0, 0, W, 300);
  g.fillStyle(0xffd27a, 1); g.fillCircle(720, 300, 64);
  g.fillStyle(0xffe7a8, 0.3); g.fillCircle(720, 300, 100);
  g.fillStyle(0x2c3e2f, 1); g.fillRect(0, 286, W, 16);
  for (let x = 0; x < W; x += 40) g.fillTriangle(x, 290, x + 20, 270 - (x % 3) * 6, x + 40, 290);
  g.fillStyle(0x4f6f9a, 1); g.fillRect(0, 300, W, 130);
  g.fillStyle(0xffd9a0, 0.55); for (let y = 310; y < 425; y += 12) g.fillRect(660 + Math.sin(y) * 20, y, 120 - (y - 310) * 0.3, 3);
  g.fillStyle(0xffffff, 0.15); for (let i = 0; i < 25; i++) g.fillRect(Math.random() * W, 305 + Math.random() * 120, 30, 2);
  g.fillStyle(0xb9a58a, 1); g.fillRect(0, 430, W, 210);
  g.lineStyle(2, 0x9e8a70, 1);
  for (let y = 430; y < H; y += 36) g.lineBetween(0, y, W, y);
  for (let y = 430, r = 0; y < H; y += 36, r++) for (let x = (r % 2) * 40; x < W; x += 80) g.lineBetween(x, y, x, y + 36);
  g.fillStyle(0x6d5c48, 1); g.fillRect(0, 426, W, 6);
  const chairs = [[110, 470, 'chair_o'], [230, 520, 'chair_y'], [140, 590, 'chair_g'], [790, 480, 'chair_g'], [880, 560, 'chair_o'], [700, 590, 'chair_y'], [330, 460, 'chair_g'], [610, 470, 'chair_o']];
  chairs.forEach(([x, y, k]) => scene.add.image(x, y, k).setScale(1.3).setDepth(y));
  scene.add.image(560, 610, 'cup').setScale(2).setAngle(90).setDepth(611);
  scene.add.image(380, 625, 'can').setScale(2).setAngle(70).setDepth(626);
}

class Terrace extends Phaser.Scene {
  constructor() { super('Terrace'); }
  create() {
    this.cameras.main.fadeIn(1500);
    drawTerrace(this);
    this.add.image(470, 530, 'chair_y').setScale(1.8).setDepth(500);
    this.bucky = this.add.sprite(470, 528, 'badger', 0).setScale(1.6).setDepth(560);
    this.jakeSeat = null;
    this.tweens.add({ targets: this.bucky, angle: 85, duration: 1 });
    this.waitingShake = false;
    this.input.keyboard.on('keydown-SPACE', () => this.tryShake());

    withUI(this, ui => {
      this.ui = ui;
      ui.setTop(true);
      ui.banner('Memorial Union Terrace · 6:12 AM', 2000);
      this.time.delayedCall(2600, () => {
        this.tweens.add({ targets: this.bucky, angle: 0, duration: 700, ease: 'Back.easeOut' });
        ui.lines([
          { who: '', text: 'The sun is coming up over Lake Mendota.' },
          { who: 'BUCKY', text: '...ugh. My head. How did I get to the Terrace?' },
          { who: '', text: 'Shake your tail to wake yourself up. (Press SPACE)' }
        ], () => { this.waitingShake = true; });
      });
    });
  }
  tryShake() {
    if (!this.waitingShake || this.ui.open) return;
    this.waitingShake = false;
    this.tweens.add({ targets: this.bucky, scaleY: 1.45, duration: 110, yoyo: true, repeat: 3 });
    const t = this.add.text(this.bucky.x + 40, this.bucky.y - 10, '...', { fontFamily: FONT, fontSize: '28px', color: '#ffffff', stroke: '#000', strokeThickness: 5 }).setDepth(900).setResolution(2);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 1500, delay: 400 });
    this.time.delayedCall(1600, () => this.ui.lines([
      { who: 'BUCKY', text: '...' },
      { who: 'BUCKY', text: '...Where\'s my tail?' },
      { who: 'BUCKY', text: '......Where\'s JAKE?' }
    ], () => this.recap()));
  }
  recap() {
    const lines = [
      `Drinks taken: ${S.drinks}`,
      `Deepest you dug: ${Math.round(S.peak * 10)}%`,
      `Water grabbed: ${S.water}   Chips eaten: ${S.chips}`,
      `Times you said no: ${S.refused}`,
      `Checked on the bathroom: ${S.checkedBathroom ? 'yes' : 'no'}`
    ];
    const panel = this.add.rectangle(W / 2, 330, 560, 230, 0x0d0d16, 0.9).setStrokeStyle(3, 0xffffff).setDepth(2000);
    this.add.text(W / 2, 240, 'LAST NIGHT (what you remember)', { fontFamily: FONT, fontSize: '18px', color: '#ffd166', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2001).setResolution(2);
    this.add.text(W / 2 - 240, 270, lines.join('\n'), { fontFamily: FONT, fontSize: '17px', color: '#ffffff', lineSpacing: 8 }).setDepth(2001).setResolution(2);
    this.time.delayedCall(800, () => this.ui.choose({
      who: 'BUCKY', text: 'Your tail is somewhere in last night. So is Jake.',
      choices: [
        { label: '⛏ Dig back through the night', fn: () => this.dig() },
        { label: '🏠 Back to title', fn: () => { this.scene.stop('UI'); this.scene.start('Title'); } }
      ]
    }));
  }
  dig() {
    this.cameras.main.shake(800, 0.01);
    this.cameras.main.fadeOut(900);
    this.cameras.main.once('camerafadeoutcomplete', () => { resetState(true); this.scene.stop('UI'); this.scene.start('Party'); });
  }
}

// ======================================================================
class Ending extends Phaser.Scene {
  constructor() { super('Ending'); }
  create() {
    this.cameras.main.fadeIn(1500, 255, 255, 255);
    drawTerrace(this);
    this.add.image(430, 530, 'chair_y').setScale(1.8).setDepth(500);
    this.add.image(560, 530, 'chair_g').setScale(1.8).setDepth(500);
    const tail = this.add.image(452, 548, 'tail').setScale(1.8).setOrigin(0.1, 0.5).setDepth(555);
    const b = this.add.sprite(430, 528, 'badger', 0).setScale(1.6).setDepth(560);
    this.add.sprite(560, 524, 'jake').setScale(1.6).setDepth(560);
    this.tweens.add({ targets: tail, angle: { from: -25, to: 30 }, duration: 140, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: b, y: 520, duration: 300, yoyo: true, repeat: -1 });

    withUI(this, ui => {
      ui.setTop(true);
      ui.banner('TAIL RESTORED', 1800);
      this.time.delayedCall(2400, () => ui.lines([
        { who: 'JAKE', text: '...hey. Thanks for not letting me "sleep it off."' },
        { who: 'BUCKY', text: 'That\'s what friends are for. Also — my TAIL is back!' },
        ...(S.checkedBathroom ? [{ who: '', text: 'The person from the bathroom waves at you from across the Terrace. They remember you checked on them...' }] : [])
      ], () => this.lessons()));
    });
  }
  lessons() {
    this.add.rectangle(W / 2, 220, 820, 360, 0x0d0d16, 0.92).setStrokeStyle(3, 0xffffff).setDepth(2000);
    this.add.text(W / 2, 64, 'What you dug up', { fontFamily: FONT, fontSize: '24px', color: '#ffd166', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2001).setResolution(2);
    const L = [
      '🦶 Saying no is normal. You don\'t owe anyone a reason.',
      '🥔 Eat food, hold water, pace yourself. Shots and punch hit harder.',
      '😴 "Sleeping it off" is a myth. Can\'t wake up, slow breathing,',
      '   vomiting, cold/clammy skin = alcohol poisoning.',
      '📞 Roll them on their side, call 911, stay with them.',
      '🛡  Ask UHS about UW–Madison\'s Responsible Action policy for',
      '   students who call for help.'
    ];
    this.add.text(W / 2 - 380, 100, L.join('\n'), { fontFamily: FONT, fontSize: '17px', color: '#ffffff', lineSpacing: 10 }).setDepth(2001).setResolution(2);
    this.add.text(W / 2, 330, 'Bucky lost his tail. Don\'t lose yourself.', { fontFamily: FONT, fontSize: '20px', color: '#ff5a5f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2001).setResolution(2);
    const burrowButton = this.add.text(W / 2, 372, 'RETURN TO BURROW  ·  ENTER / CLICK', { fontFamily: FONT, fontSize: '17px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#c5050c', padding: { x: 12, y: 8 } }).setOrigin(0.5).setDepth(2001).setResolution(2).setInteractive({ useHandCursor: true });
    const returnToBurrow = () => { window.location.href = 'Burrow/index.html'; };
    burrowButton.once('pointerdown', returnToBurrow);
    this.input.keyboard.once('keydown-ENTER', returnToBurrow);
  }
}

// ======================================================================
window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W, height: H,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Title, Prologue, Street, Party, StateStreet, Blackout, Terrace, Ending, UI]
});
