// Tale of the Badger — Chapter 1: Dig In
// Phaser 3, no build step. Open index.html in a browser.

const W = 960, H = 640;
const FONT = '"Courier New", Courier, monospace';
const UW_RED = 0xc5050c;

// ---------- shared night state ----------
const S = {};
function resetState(rewind) {
  Object.assign(S, {
    rewind, depth: 0, peak: 0, drinks: 0, water: 0, chips: 0, chipsBuffer: 0,
    minutes: 0, refused: 0, checkedBathroom: false, talkedMaya: false,
    holdingWater: false, jakeDrunk: 0, flags: {}
  });
}
resetState(false);

function timeStr(m) {
  const total = 21 * 60 + m;
  const h24 = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${h24 % 12 || 12}:${mm.toString().padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

function scramble(s) {
  return s.split(' ').map(w => {
    if (w.length < 4) return w;
    const mid = w.slice(1, -1).split('');
    Phaser.Utils.Array.Shuffle(mid);
    return w[0] + mid.join('') + w[w.length - 1];
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
    pixelTex(this, 'cup', 5, 6, 2, p => {
      p(0, 0, 5, 1, 0xffffff); p(0, 1, 5, 4, 0xd62828); p(1, 5, 3, 1, 0xd62828);
    });

    // tail
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x111111, 1); g.fillEllipse(14, 9, 28, 16);
    g.fillStyle(0x4a3628, 1); g.fillEllipse(14, 9, 25, 13);
    g.fillStyle(0x8a6a50, 1); g.fillEllipse(16, 8, 17, 8);
    g.fillStyle(0xeee6d6, 1); g.fillEllipse(23, 8, 8, 8);
    g.generateTexture('tail', 30, 18);
    g.destroy();

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
    this.scene.start('Title');
  }
}

// ======================================================================
// UI overlay scene (own camera, so the drunk camera sway never rotates it)
class UI extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.open = false;
    this.closedAt = 0;
    this.vignette = this.add.image(W / 2, H / 2, 'vignette').setAlpha(0);

    // HUD
    this.hud = this.add.container(0, 0).setVisible(false);
    const clockBg = this.add.rectangle(16, 16, 170, 40, 0x000000, 0.6).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.6);
    this.clock = this.add.text(30, 26, '9:00 PM', { fontFamily: FONT, fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setResolution(2);
    // depth meter
    const mx = W - 54, my = 90, mh = 300;
    const meterBg = this.add.rectangle(mx, my, 34, mh, 0x2a1a0e).setOrigin(0.5, 0).setStrokeStyle(3, 0xffffff, 0.8);
    const layers = this.add.graphics();
    const cols = [0x5c3d22, 0x4d321b, 0x3d2714, 0x2e1d0e, 0x1f1308];
    cols.forEach((c, i) => { layers.fillStyle(c, 1); layers.fillRect(mx - 15, my + i * (mh / 5), 30, mh / 5); });
    this.meterFill = this.add.rectangle(mx, my, 30, 0, 0x000000, 0.75).setOrigin(0.5, 0);
    this.meterIcon = this.add.sprite(mx, my, 'badger', 0).setScale(0.6);
    const lbl = this.add.text(mx, my - 26, 'DEPTH', { fontFamily: FONT, fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setResolution(2);
    const surf = this.add.text(mx - 26, my - 2, 'surface', { fontFamily: FONT, fontSize: '10px', color: '#cccccc' }).setOrigin(1, 0.5).setResolution(2);
    const bottom = this.add.text(mx - 26, my + mh, 'blackout', { fontFamily: FONT, fontSize: '10px', color: '#ff6b6b' }).setOrigin(1, 0.5).setResolution(2);
    this.meter = { x: mx, y: my, h: mh };
    this.status = this.add.text(16, 64, '', { fontFamily: FONT, fontSize: '13px', color: '#dddddd', lineSpacing: 4 }).setResolution(2);
    this.hint = this.add.text(W / 2, H - 14, 'WASD/Arrows: move   E: interact   SPACE: tail shake', { fontFamily: FONT, fontSize: '12px', color: '#bbbbbb' }).setOrigin(0.5, 1).setResolution(2);
    this.hud.add([clockBg, this.clock, meterBg, layers, this.meterFill, this.meterIcon, lbl, surf, bottom, this.status, this.hint]);

    this.toastText = this.add.text(W / 2, 120, '', { fontFamily: FONT, fontSize: '16px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 10, y: 6 }, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5).setAlpha(0).setResolution(2);
    this.bannerText = this.add.text(W / 2, H / 2 - 60, '', { fontFamily: FONT, fontSize: '44px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0).setResolution(2);

    // dialog: dim the world behind it (demo-3 style)
    this.dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setAlpha(0);
    this.box = this.add.container(0, 0).setVisible(false);
    const bg = this.add.rectangle(W / 2, H - 104, W - 40, 192, 0x0d0d16, 0.94).setStrokeStyle(3, 0xffffff, 0.9).setInteractive();
    bg.on('pointerdown', () => this.advance());
    this.who = this.add.text(44, H - 190, '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff' }).setResolution(2);
    this.body = this.add.text(44, H - 164, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', wordWrap: { width: W - 110 }, lineSpacing: 4 }).setResolution(2);
    this.more = this.add.text(W - 44, H - 22, '▼ E', { fontFamily: FONT, fontSize: '13px', color: '#aaaaaa' }).setOrigin(1, 1).setResolution(2);
    this.timerBar = this.add.rectangle(30, H - 202, W - 60, 6, 0xffd166).setOrigin(0, 0.5);
    this.box.add([bg, this.who, this.body, this.more, this.timerBar]);
    this.choiceTexts = [];
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(64, 0, '', { fontFamily: FONT, fontSize: '17px', color: '#ffd166' }).setResolution(2).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#ffffff'));
      t.on('pointerout', () => t.setColor('#ffd166'));
      t.on('pointerdown', () => this.pick(i));
      this.choiceTexts.push(t);
      this.box.add(t);
    }

    this.input.keyboard.on('keydown', e => this.onKey(e));
  }

  // ----- HUD -----
  showHUD(v) { this.hud.setVisible(v); if (!v) this.objective(''); }
  objective(t) {
    if (!this.objText) this.objText = this.add.text(W / 2, 18, '', { fontFamily: FONT, fontSize: '15px', color: '#ffd166', fontStyle: 'bold', backgroundColor: '#000000bb', padding: { x: 12, y: 7 } }).setOrigin(0.5, 0).setResolution(2);
    this.objText.setText(t ? '▶ ' + t : '').setVisible(!!t);
  }
  setTop(v) { this.box.y = v ? -(H - 216) : 0; }
  refresh() {
    this.clock.setText('🕘 ' + timeStr(S.minutes));
    const f = Phaser.Math.Clamp(S.depth / 10, 0, 1);
    this.meterFill.height = 0;
    this.tweens.add({ targets: this.meterIcon, y: this.meter.y + f * this.meter.h, duration: 500, ease: 'Sine.easeOut' });
    this.vignette.setAlpha(Math.max(0, (S.depth - 2) * 0.09));
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
  showBox() {
    if (!this.open) { this.tweens.killTweensOf(this.dim); this.tweens.add({ targets: this.dim, alpha: 0.4, duration: 250 }); }
    this.open = true;
    this.box.setVisible(true);
    this.choiceTexts.forEach(t => t.setVisible(false));
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
    this.more.setVisible(true);
    this.typeText(l.text);
  }
  choose(o) {
    this.mode = 'choice';
    this.showBox();
    this.setSpeaker(o.who);
    if (this.speakerCb) this.speakerCb(o.who);
    this.more.setVisible(false);
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
        let label = S.depth >= 7 ? scramble(c.label) : c.label;
        this.choiceTexts[i].setText(`${i + 1}. ${label}`).setVisible(true).setY(H - 128 + i * 26);
      });
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
    if (!this.open) return;
    const k = e.key;
    if (this.mode === 'choice' && !this.typing && ['1', '2', '3', '4'].includes(k)) { this.pick(+k - 1); return; }
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
  ui.speakerCb = null; ui.closeCb = null;
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
    // ground mound
    g.fillStyle(0x3d2714, 1); g.fillEllipse(W / 2, H + 40, W * 1.4, 260);
    g.fillStyle(0x5c3d22, 1); g.fillEllipse(W / 2, H + 60, W * 1.2, 220);

    this.add.text(W / 2, 120, 'TALE OF THE', { fontFamily: FONT, fontSize: '34px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setResolution(2);
    const t = this.add.text(W / 2, 180, 'BADGER', { fontFamily: FONT, fontSize: '84px', color: '#ffffff', fontStyle: 'bold', stroke: '#c5050c', strokeThickness: 12 }).setOrigin(0.5).setResolution(2);
    t.setShadow(6, 6, '#000000', 0, true, true);
    this.add.text(W / 2, 250, 'Chapter 1 · Dig In', { fontFamily: FONT, fontSize: '22px', color: '#ffd166' }).setOrigin(0.5).setResolution(2);

    const tail = this.add.image(W / 2 + 34, 420, 'tail').setScale(3.5).setOrigin(0.1, 0.5);
    const b = this.add.sprite(W / 2, 390, 'badger', 0).setScale(3.5);
    this.tweens.add({ targets: tail, angle: { from: -20, to: 25 }, duration: 160, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: b, y: 382, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const start = this.add.text(W / 2, 535, 'Press ENTER or click to start', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5).setResolution(2);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    this.add.text(W / 2, 590, 'WASD/Arrows move · E interact · SPACE tail shake · 1-4 choose', { fontFamily: FONT, fontSize: '14px', color: '#cccccc' }).setOrigin(0.5).setResolution(2);

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
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,T');
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
  uiBusy() { return !this.ui || this.ui.open || this.time.now - this.ui.closedAt < 250; }
  movePlayer(time) {
    const k = this.keys, p = this.player;
    let dx = 0, dy = 0;
    if (!this.uiBusy() && !this.frozen) {
      if (k.A.isDown || k.LEFT.isDown) dx -= 1;
      if (k.D.isDown || k.RIGHT.isDown) dx += 1;
      if (k.W.isDown || k.UP.isDown) dy -= 1;
      if (k.S.isDown || k.DOWN.isDown) dy += 1;
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
    p.setDepth(p.y);

    // tail
    if (this.tail.visible) {
      const side = p.flipX ? -1 : 1;
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
    const t = this.add.text(x, y, msg, { fontFamily: FONT, fontSize: '12px', color, stroke: '#000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(5000).setResolution(3);
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
    npc.setDepth(npc.y);
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
    this.prompt = this.add.text(0, 0, '[E] Knock', { fontFamily: FONT, fontSize: '11px', color: '#ffd166', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(6000).setResolution(3).setVisible(false);

    withUI(this, ui => {
      this.ui = ui;
      this.setupTalkCam();
      ui.banner('Langdon St · 9:00 PM');
      this.time.delayedCall(1800, () => ui.lines([
        { who: 'JAKE', text: "That's the place! You can literally hear it from here." },
        { who: 'JAKE', text: 'Come on, walk up and knock. (WASD / Arrow keys)' }
      ]));
    });
  }
  update(time) {
    if (!this.player) return;
    this.movePlayer(time);
    this.followNPC(this.jake, { x: this.player.x - 40, y: this.player.y }, 45, 150, time);
    const near = Math.abs(this.player.x - 1070) < 90 && !this.knocked;
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
    this.ui.lines([{ who: '', text: '*knock knock*' }], () => {
      this.door.setFillStyle(0xffe9a8);
      const tyler = this.tyler = this.add.sprite(1070, 262, 'tyler').setDepth(-70);
      this.tweens.add({ targets: tyler, y: 300, duration: 500, onComplete: () => tyler.setDepth(300) });
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
    cam.setBounds(0, 0, WW, WH).setZoom(1.4).fadeIn(600);
    this.solids = [];

    this.drawFloors();
    this.buildWalls();
    this.buildFurniture();
    this.mess = this.add.group();

    this.setupPlayer(340, 790);
    this.physics.add.collider(this.player, this.solids);
    cam.startFollow(this.player, true, 0.12, 0.12);

    this.buildNPCs();
    this.buildInteractables();
    this.buildFog();

    this.prompt = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '11px', color: '#ffd166', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(6000).setResolution(3);

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
        ], () => this.setStep('tail')));
      } else {
        ui.banner('9:00 PM');
        this.time.delayedCall(1800, () => this.setStep('tail'));
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
    for (let y = 300; y < 840; y += 30) for (let x = 60; x < 640; x += 30) {
      g.fillStyle(((x + y) / 30) % 2 ? 0xd9d4c7 : 0xb8b2a3, 1); g.fillRect(x, y, 30, 30);
    }
    g.fillStyle(0x4a4038, 1); g.fillRect(60, 60, 200, 220);
    g.lineStyle(2, 0x2e2722, 1); for (let x = 60; x < 260; x += 16) g.lineBetween(x, 60, x, 280);
    for (let y = 60; y < 280; y += 20) for (let x = 280; x < 640; x += 20) {
      g.fillStyle(((x + y) / 20) % 2 ? 0x9ec9d6 : 0x86b3c2, 1); g.fillRect(x, y, 20, 20);
    }
    g.fillStyle(0x7a5233, 1); g.fillRect(660, 60, 680, 780);
    g.lineStyle(1, 0x5f3f27, 1);
    for (let y = 60; y < 840; y += 20) g.lineBetween(660, y, 1340, y);
    for (let y = 60, r = 0; y < 840; y += 20, r++) for (let x = 660 + (r % 2) * 60; x < 1340; x += 120) g.lineBetween(x, y, x, y + 20);
    g.fillStyle(0x7d1e2c, 1); g.fillRect(760, 420, 460, 320);
    g.lineStyle(4, 0xd9b45a, 1); g.strokeRect(774, 434, 432, 292);
    g.fillStyle(0x3a3a3a, 1); g.fillRect(310, 806, 60, 30);
    this.lights = [];
    const cols = [0xff3da5, 0x3dd6ff, 0xffe23d, 0x8a3dff, 0x3dff8a];
    for (let i = 0; i < 9; i++) {
      const c = this.add.circle(Phaser.Math.Between(820, 1160), Phaser.Math.Between(470, 700), Phaser.Math.Between(30, 50), cols[i % 5], 0.22).setDepth(-900);
      this.lights.push(c);
      this.tweens.add({ targets: c, alpha: 0.03, x: c.x + Phaser.Math.Between(-50, 50), duration: Phaser.Math.Between(700, 1300), yoyo: true, repeat: -1 });
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
    this.wall(40, 40, 1320, 20);
    this.wall(40, 840, 260, 20); this.wall(380, 840, 980, 20);
    this.wall(40, 40, 20, 820); this.wall(1340, 40, 20, 820);
    this.solid(300, 860, 80, 20); // front door: no leaving
    // kitchen top wall: balcony opening (120-200) + bathroom door (440-520)
    this.wall(40, 280, 80, 20); this.wall(200, 280, 240, 20); this.wall(520, 280, 140, 20);
    this.solid(440, 280, 80, 20);
    const plain = this.add.graphics().setDepth(300);
    plain.fillStyle(0xe8dcc4, 1); plain.fillRect(440, 280, 80, 20);
    plain.fillStyle(0xbfae90, 1); plain.fillRect(440, 296, 80, 4);
    this.bathDoor = this.add.graphics().setDepth(301).setAlpha(0);
    this.bathDoor.fillStyle(0x6b4423, 1); this.bathDoor.fillRect(440, 280, 80, 20);
    this.bathDoor.fillStyle(0xd4af37, 1); this.bathDoor.fillCircle(506, 290, 3);
    this.bathLabel = this.add.text(470, 290, 'WC', { fontFamily: FONT, fontSize: '10px', color: '#f0e0c0' }).setOrigin(0.5).setDepth(302).setResolution(3).setAlpha(0);
    this.wall(260, 40, 20, 240); // balcony | bathroom
    // kitchen | living room, doorway 500-620 blocked until revealed
    this.wall(640, 40, 20, 460); this.wall(640, 620, 20, 240);
    this.gate = this.solid(640, 500, 20, 120);
    // balcony railing + string lights
    const rail = this.add.graphics().setDepth(70);
    rail.fillStyle(0x222222, 1);
    for (let x = 64; x < 258; x += 14) rail.fillRect(x, 62, 10, 4);
    for (let y = 64; y < 278; y += 14) rail.fillRect(62, y, 4, 10);
    for (let x = 74; x < 256; x += 18) {
      const bl = this.add.circle(x, 78 + Math.sin(x / 20) * 4, 3, 0xffe9a8).setDepth(80);
      this.tweens.add({ targets: bl, alpha: 0.4, duration: Phaser.Math.Between(500, 1200), yoyo: true, repeat: -1 });
    }
  }
  buildFog() {
    this.fog = [
      this.add.rectangle(660, 40, 700, 840, 0x000000, 1).setOrigin(0).setDepth(5900),
      this.add.rectangle(280, 40, 360, 240, 0x000000, 1).setOrigin(0).setDepth(5900)
    ];
    this.fogLabel = this.add.text(1000, 450, '♪ the living room is packed ♪', { fontFamily: FONT, fontSize: '14px', color: '#555566' }).setOrigin(0.5).setDepth(5901).setResolution(3);
  }
  reveal() {
    if (this.revealed) return;
    this.revealed = true;
    this.physics.world.disable(this.gate);
    this.tweens.add({ targets: [...this.fog, this.fogLabel], alpha: 0, duration: 1400 });
    this.tweens.add({ targets: [this.bathDoor, this.bathLabel], alpha: 1, duration: 1400 });
    this.dancers = [...this.kitchenCrowd, ...this.livingCrowd];
    this.ui.toast('The rest of the party opens up: living room, beer pong, bathroom.', 3200);
  }
  furn(x, y, w, h, draw, collide = true) {
    if (collide) this.solid(x, y, w, h);
    const g = this.add.graphics().setDepth(y + h);
    draw(g);
    return g;
  }
  buildFurniture() {
    // counter: beer stack, sink, water jug
    this.furn(220, 300, 200, 48, g => {
      g.fillStyle(0x5b4636, 1); g.fillRect(220, 300, 200, 48);
      g.fillStyle(0x9a9286, 1); g.fillRect(220, 300, 200, 36);
      g.fillStyle(0x6f7f8a, 1); g.fillRect(300, 305, 70, 26);
      g.fillStyle(0x4c5a63, 1); g.fillRect(305, 309, 60, 18);
      g.fillStyle(0x3d9be9, 1); g.fillRect(388, 302, 22, 30);
      g.fillStyle(0xbfe3ff, 1); g.fillRect(391, 306, 16, 12);
    });
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - r; i++)
      this.add.image(234 + i * 12 + r * 6, 336 - r * 13, r % 2 ? 'can2' : 'can').setDepth(349);
    // fridge + beer cases
    this.furn(560, 300, 60, 74, g => {
      g.fillStyle(0xf2f2f2, 1); g.fillRect(560, 300, 60, 74);
      g.fillStyle(0xcfcfcf, 1); g.fillRect(560, 330, 60, 3); g.fillRect(608, 308, 4, 16);
    });
    this.furn(495, 312, 52, 42, g => {
      g.fillStyle(0x8a5a3a, 1); g.fillRect(495, 312, 52, 42);
      g.fillStyle(0xb5835a, 1); g.fillRect(497, 314, 48, 18); g.fillRect(497, 334, 48, 18);
      g.fillStyle(UW_RED, 1); g.fillRect(510, 318, 22, 8); g.fillRect(510, 338, 22, 8);
    });
    // island: chips + punch + cups
    this.furn(240, 520, 190, 74, g => {
      g.fillStyle(0x4a3020, 1); g.fillRect(240, 520, 190, 74);
      g.fillStyle(0x8a5a3a, 1); g.fillRect(240, 520, 190, 60);
      g.fillStyle(0xf2f2f2, 1); g.fillCircle(285, 550, 17);
      g.fillStyle(0xf2c14e, 1); for (let i = 0; i < 12; i++) g.fillCircle(277 + (i % 4) * 5, 543 + Math.floor(i / 4) * 5, 3);
      g.fillStyle(0xdddddd, 0.8); g.fillCircle(380, 550, 21);
      g.fillStyle(0xd7263d, 0.85); g.fillCircle(380, 550, 17);
    });
    [[322, 538], [334, 556], [316, 566], [412, 532]].forEach(([x, y]) => this.add.image(x, y, 'cup').setDepth(595));
    this.sinkCans = [];
    // living room: pong table
    this.furn(860, 150, 240, 64, g => {
      g.fillStyle(0x3a2516, 1); g.fillRect(860, 150, 240, 64);
      g.fillStyle(0xc9b38a, 1); g.fillRect(860, 150, 240, 52);
      g.lineStyle(2, UW_RED, 1); g.lineBetween(980, 150, 980, 202);
    });
    const tri = (bx, dir) => { for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) this.add.image(bx + dir * r * 9, 176 - r * 5 + i * 10, 'cup').setDepth(215); };
    tri(874, 1); tri(1086, -1);
    this.add.circle(980, 171, 3, 0xffffff).setDepth(216);
    // speaker
    this.furn(1270, 330, 44, 62, g => {
      g.fillStyle(0x111111, 1); g.fillRect(1270, 330, 44, 62);
      g.fillStyle(0x333333, 1); g.fillCircle(1292, 348, 11); g.fillCircle(1292, 376, 8);
    });
    this.speakerPulse = this.add.circle(1292, 348, 14, 0xffffff, 0).setStrokeStyle(2, 0xff3da5, 0.8).setDepth(393);
    this.tweens.add({ targets: this.speakerPulse, scale: 2.2, alpha: 0, duration: 500, repeat: -1 });
    // couch along right wall
    this.furn(1270, 520, 60, 240, g => {
      g.fillStyle(0x1f2a4a, 1); g.fillRect(1270, 520, 60, 240);
      g.fillStyle(0x2f3f6a, 1); g.fillRect(1276, 534, 46, 66); g.fillRect(1276, 606, 46, 66); g.fillRect(1276, 678, 46, 66);
    });
    // balcony chairs
    this.furn(88, 210, 36, 30, g => { g.fillStyle(0x2e5e4e, 1); g.fillRect(88, 210, 36, 30); });
    this.furn(196, 96, 36, 30, g => { g.fillStyle(0x2e5e4e, 1); g.fillRect(196, 96, 36, 30); });
  }

  buildNPCs() {
    const npc = (key, x, y, flip = false) => this.add.sprite(x, y, key).setDepth(y).setFlipX(flip);
    this.tyler = npc('tyler', 420, 780);
    this.jake = this.add.sprite(300, 800, 'jake');
    this.brody = npc('brody', 520, 650, true);
    this.brodyHome = { x: 520, y: 650 };
    this.kayla = npc('kayla', 560, 450, true);
    this.maya = npc('maya', 160, 170);
    this.kitchenCrowd = [npc('d1', 470, 720, true), npc('d3', 170, 640)];
    this.livingCrowd = [npc('d2', 900, 560), npc('d1', 1060, 640, true), npc('d3', 980, 480)];
    this.livingCrowd.forEach((d, i) => this.tweens.add({ targets: d, y: d.y - 6, duration: 260 + i * 40, yoyo: true, repeat: -1 }));
    this.dancers = [...this.kitchenCrowd];
    this.ponger = [npc('p1', 840, 182), npc('p2', 1122, 182, true)];
    this.couchGuy = npc('couch', 1300, 580);
  }

  buildInteractables() {
    const crowdTalk = () => this.say('', Phaser.Utils.Array.GetRandom(['"Bucky! Do the tail thing!"', '"This song slaps."', '"Have you seen the punch? It\'s DANGEROUS lol."']));
    this.inter = [
      { x: 285, y: 618, r: 55, label: 'Eat chips', fn: () => this.eatChips() },
      { x: 380, y: 618, r: 55, label: 'Punch bowl', fn: () => this.punch() },
      { x: 262, y: 376, r: 55, label: 'Grab a beer', fn: () => this.grabBeer() },
      { x: 399, y: 376, r: 50, label: 'Get water', fn: () => this.getWater() },
      { x: 480, y: 326, r: 50, label: 'Knock', zone: 'living', fn: () => this.knock() },
      { x: 980, y: 240, r: 80, label: 'Beer pong', zone: 'living', fn: () => this.pongTalk() },
      { npc: this.maya, r: 55, label: 'Talk', fn: () => this.mayaTalk() },
      { npc: this.kayla, r: 50, label: 'Talk', fn: () => this.kaylaTalk() },
      { npc: this.jake, r: 50, low: true, label: 'Talk to Jake', fn: () => this.jakeTalk() },
      { npc: this.tyler, r: 50, label: 'Talk', fn: () => this.tylerTalk() },
      { npc: this.brody, r: 50, label: 'Talk', fn: () => this.brodyTalk() },
      { npc: this.couchGuy, r: 60, zone: 'living', label: 'Talk', fn: () => this.say('', '*couch guy gives you a thumbs up and goes back to his phone*') },
      ...this.kitchenCrowd.map(d => ({ npc: d, r: 45, label: 'Talk', fn: crowdTalk })),
      ...this.livingCrowd.map(d => ({ npc: d, r: 45, zone: 'living', label: 'Talk', fn: crowdTalk }))
    ];
  }

  speakerTarget(who) {
    const m = {
      TYLER: this.tyler, JAKE: this.jake, BRODY: this.brody, KAYLA: this.kayla, MAYA: this.maya,
      VOICE: { x: 480, y: 300 }, CROWD: this.revealed ? this.livingCrowd[0] : this.kitchenCrowd[0]
    };
    return m[who] || this.player;
  }

  // ---------- loop ----------
  update(time) {
    if (!this.player || this.ended) return;
    this.movePlayer(time);
    if (!this.brodyWalking) this.brody.setDepth(this.brody.y);
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
  advance(m) {
    if (this.ended) return;
    S.minutes += m;
    // the body slowly processes alcohol over time
    S.depth = Math.max(0, S.depth - 0.25 * (m / 15));
    this.ui.refresh();
  }
  setClock(m) { if (m > S.minutes) this.advance(m - S.minutes); }

  // ---------- linear story steps ----------
  setStep(name) {
    const steps = {
      tail: { text: 'Say hi to the kitchen crowd: show off your tail (SPACE)', x: 330, y: 700 },
      kitchen: { text: 'Dig in: chips, punch, or a beer from the stack', x: 335, y: 560 },
      bathroom: { text: 'Someone\'s been in the bathroom forever. Check on them.', x: 480, y: 330 },
      balcony: { text: 'Get some air on the balcony', npc: this.maya },
      jake: { text: 'Where did Jake go? Find him.', npc: this.jake }
    };
    this.step = name;
    this.markerTarget = steps[name] || null;
    this.ui.objective(steps[name] ? steps[name].text : '');
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
    const areas = [[80, 380, 540, 440], [680, 80, 560, 740], [680, 260, 560, 160]];
    for (let i = 0; i < n; i++) {
      const [x, y, w, h] = Phaser.Utils.Array.GetRandom(areas);
      const k = Phaser.Utils.Array.GetRandom(['can', 'can2', 'cup', 'can']);
      const s = this.add.image(x + Math.random() * w, y + Math.random() * h, k).setAngle(Phaser.Math.Between(0, 3) * 90 + 90).setDepth(-500);
      this.mess.add(s);
      if (Math.random() < 0.25) this.add.ellipse(s.x + 6, s.y + 4, 22, 10, 0xc9a227, 0.35).setDepth(-501);
    }
    for (let i = 0; i < n / 3; i++) this.add.image(310 + Math.random() * 50, 312 + Math.random() * 14, Math.random() < 0.5 ? 'can' : 'can2').setDepth(350).setAngle(Phaser.Math.Between(-40, 40));
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
    this.tweens.add({ targets: npc, x, y, duration: Math.max(200, d * 6), onUpdate: () => npc.setDepth(npc.y), onComplete: done });
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
        const refusedFollow = () => { S.refused++; this.brodyHomeWalk(); fin(true); };
        this.ui.choose({
          who: 'BRODY', text: '*holds out a red cup*', timer: 5,
          choices: [
            { label: '🍺 "Let\'s go!"', fn: () => { this.drink(2); this.say('BRODY', 'THAT\'S what I\'m talking about!', () => { this.brodyHomeWalk(); fin(false); }); } },
            { label: '🥔 "Lemme grab chips first."', fn: () => { this.say('BRODY', 'Fair, fair. I\'ll catch you later, legend.', () => { this.brodyHomeWalk(); fin(false); }); } },
            { label: '💧 "I\'m on water rn."', sober: true, fn: () => this.say('BRODY', 'Respect, respect.', refusedFollow) },
            { label: '🦶 Dig in your heels: "Nah, I\'m good."', sober: true, fn: () => this.say('BRODY', 'Suit yourself, legend.', refusedFollow) }
          ],
          waterOk: () => this.say('BRODY', 'Oh you\'re set? Bet.', refusedFollow),
          onTimeout: () => { this.say('', 'Before you can answer, he puts the cup in your hand. You drink without thinking.', () => { this.drink(2, 'Pressure doesn\'t always look mean. Sometimes it\'s a compliment.'); this.brodyHomeWalk(); fin(false); }); }
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
          { label: '😎 "I\'m here for the vibes. And the chips."', sober: true, fn: () => { this.say('KAYLA', 'Okay, fair. The chips ARE elite.', () => this.ui.toast('A confident, casual answer shuts it down fast. You don\'t owe anyone a reason.', 3800)); fin(); } },
          { label: '🦶 "Just not feeling it tonight."', sober: true, fn: () => { this.say('KAYLA', 'Huh. Okay.', () => this.ui.toast('You don\'t owe anyone an explanation.', 3000)); fin(); } },
          { label: '😬 "...I mean, I could have one."', fn: () => { this.say('KAYLA', 'Yesss! Kitchen, let\'s go.'); this.drink(2, 'Judgment is pressure too.'); fin(); } }
        ]
      });
    });
  }

  stage1() {
    this.setClock(90);
    S.flags.s1 = true;
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
        onTimeout: () => this.ui.lines([{ who: '', text: 'The crowd drags you to the table. You lose. Everyone chants.' }], () => { this.drink(2, 'Group pressure: hard to say no when everyone\'s watching.'); fin(); })
      });
    });
  }
  stage2() {
    this.setClock(180);
    S.flags.s2 = true;
    this.ui.banner('12:00 AM');
    this.spawnMess(30);
    S.jakeDrunk = Math.max(S.jakeDrunk, 6);
    this.tweens.timeScale = 1.7;
    this.time.delayedCall(1500, () => this.pending.push(() => this.shots(() => this.jakeWandersOff())));
  }
  jakeWandersOff() {
    this.jakeLeft = true;
    this.jake.setPosition(1010, 600).setFlipX(true).setDepth(600);
    this.ui.toast('Wait... where did Jake go?');
    this.setStep('jake');
  }
  shots(next) {
    const fin = () => this.pending.push(next);
    this.ui.lines([{ who: 'TYLER', text: 'EVERYBODY! SHOTS! On three!' }, { who: 'CROWD', text: 'ONE! TWO!...' }], () => {
      this.ui.choose({
        who: 'TYLER', text: '*hands you a shot glass*', timer: 5,
        choices: [
          { label: '🥃 Take the shot', fn: () => { this.drink(3, 'Shots hit way faster than beer.'); fin(); } },
          { label: '💧 Raise your water and cheers', sober: true, fn: () => { S.refused++; this.say('TYLER', 'WATER GANG! Okay okay!'); fin(); } },
          { label: '🦶 Dig in your heels: "I\'m good."', sober: true, fn: () => { S.refused++; this.say('TYLER', 'All good, more for us!'); fin(); } },
          { label: '🌙 Slip out to the balcony', fn: () => { S.refused++; this.player.setPosition(160, 230); this.ui.toast('You step away from the crowd. Fresh air.'); fin(); } }
        ],
        onTimeout: () => this.ui.lines([{ who: '', text: 'Everyone\'s watching. Someone clinks your glass. You take it.' }], () => { this.drink(3, 'Shots hit way faster than beer.'); fin(); })
      });
    });
  }

  grabBeer() {
    this.ui.choose({
      who: '', text: 'A whole pyramid of cans. Someone built it with love.', choices: [
        { label: '🍺 Crack one open', fn: () => { this.drink(2); this.stepDone('kitchen'); } },
        { label: '🦶 Leave it', sober: true, fn: () => { } }
      ]
    });
  }
  eatChips() {
    S.chips++;
    S.chipsBuffer = 2;
    this.ui.refresh();
    this.floatText(this.player.x, this.player.y - 40, '*crunch*', '#f2c14e');
    this.stepDone('kitchen');
    if (!S.flags.chipsTip) { S.flags.chipsTip = true; this.ui.lines([{ who: '', text: 'You dig into the chips. *crunch*' }, { who: '', text: 'Food in your stomach slows how fast alcohol hits you. Your next two drinks dig you in less.' }]); }
  }
  getWater() {
    S.water++;
    S.holdingWater = true;
    this.ui.refresh();
    this.floatText(this.player.x, this.player.y - 40, '🥤 water', '#9fd6ff');
    this.stepDone('kitchen');
    if (!S.flags.waterTip) { S.flags.waterTip = true; this.ui.lines([{ who: '', text: 'You fill a red cup with water.' }, { who: '', text: 'Water doesn\'t sober you up. But a cup in your hand means fewer people offer you drinks — and it keeps you pacing.' }]); }
  }
  punch() {
    const drinkIt = () => { this.drink(3, 'That was NOT juice. Mixed drinks hide how strong they are.'); this.stepDone('kitchen'); };
    const ask = () => this.ui.lines([{ who: 'KAYLA', text: 'The punch? Lol it\'s like... half vodka? Tyler lost count.' }], () => this.ui.choose({
      who: 'BUCKY', text: '...half vodka.', choices: [
        { label: '🍹 Drink it anyway', fn: drinkIt },
        { label: '🦶 Skip it', sober: true, fn: () => { this.ui.toast('Good call. You can\'t tell how strong a mixed drink is by taste.'); this.stepDone('kitchen'); } }
      ]
    }));
    this.ui.choose({
      who: '', text: 'A big bowl of red punch. Smells like fruit juice.', choices: [
        { label: '🍹 Drink a cup', fn: drinkIt },
        { label: '❓ Ask what\'s in it', fn: ask },
        { label: '🦶 Skip it', sober: true, fn: () => { } }
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
    ], () => { this.ui.toast('Checking on people matters. (They might remember this.)'); this.stepDone('bathroom'); });
  }
  pongTalk() {
    if (!S.flags.s1) this.say('', 'The pong table is set up. Nobody\'s playing yet.');
    else this.say('', Phaser.Utils.Array.GetRandom(['*a ball bounces off the rim*', 'The crowd is chanting someone\'s name.', 'Cups everywhere. The table is sticky.']));
  }
  mayaTalk() {
    const breather = () => {
      this.ui.lines([{ who: '', text: 'You hang out on the balcony for a while. The music\'s muffled out here.' }, { who: '', text: 'Fresh air doesn\'t sober you up — only time does. But stepping away gives your body that time.' }], () => this.advance(15));
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
    this.jake.setPosition(1300, 650).setAngle(90).setDepth(800).setTint(0xc8d6e0);
    this.player.setPosition(1215, 650).setFlipX(false);
    this.couchGuy.setVisible(false);
    this.brody.setPosition(1180, 590);
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
    ], act);
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
      { who: '', text: 'Something tickles behind you. You turn around...' }
    ], () => {
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
    this.add.text(W / 2, 372, 'Chapter 2: Bascom Hill — coming soon   ·   ENTER: title', { fontFamily: FONT, fontSize: '14px', color: '#cccccc' }).setOrigin(0.5).setDepth(2001).setResolution(2);
    this.input.keyboard.once('keydown-ENTER', () => { this.scene.stop('UI'); this.scene.start('Title'); });
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
  scene: [Boot, Title, Street, Party, Blackout, Terrace, Ending, UI]
});
