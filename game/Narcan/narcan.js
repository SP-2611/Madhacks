// Bucky vs the Pill: a standalone Narcan chapter.
// Walk down State Street, get ambushed by a fentanyl-laced pill, lose the fight
// (always), then Bucky's soul has a time limit to find Narcan on campus.
// Reuses the shared badger sprite (../src/sprite.js) and pixel helpers (../src/prologue.js).

const W = 960, H = 640;
const FONT = 'Verdana, "Segoe UI", Tahoma, sans-serif';
const START_TIME = 75;   // seconds Bucky's soul has to bring back Narcan
const TRAVEL_COST = 5;   // extra seconds lost per trip on the map

const G = {};
function resetG() { Object.assign(G, { time: START_TIME, running: false, hasNarcan: false, at: 'street', over: false }); }
resetG();

// ---------- the pill (original villain) ----------
const PILL_ROWS = [
  '....KKKKKKKK....',
  '...KPPPPPPPPK...',
  '..KPPpPPPPPPPK..',
  '..KPpPPPPPPPPK..',
  '..KPKKPPPPKKPK..',
  '..KPPWKPPKWPPK..',
  '..KPPWWPPWWPPK..',
  '..KPPPPPPPPPPK..',
  '..KPPKKKKKKPPK..',
  '..KPPPPPPPPPPK..',
  'KKKKKKKKKKKKKKKK',
  'KWKWWWWWWWWWWKWK',
  'KWKWWWWWWWWWWKWK',
  '..KWWWWWWWWWWK..',
  '..KWWWWWsWWWWK..',
  '..KWWWWWWWWWWK..',
  '...KWWWWWWWWK...',
  '....KKKKKKKK....',
  '.....KK..KK.....',
  '....KKK..KKK....'
];
const PILL_PAL = { K: 0x1a1020, P: 0x7b3fa0, p: 0xa56ccc, W: 0xeeeef2, s: 0xc8c8d4 };

function makeTex(scene, key, rows, pal) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  pxRows(g, rows, pal, 0, 0);
  g.generateTexture(key, rows[0].length, rows.length);
  g.destroy();
}

// ---------- shared drawing ----------
function drawStreet(g, dim) {
  g.fillGradientStyle(0x0b1026, 0x0b1026, 0x2a1840, 0x2a1840, 1); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) g.fillStyle(0xffffff, (i % 3 + 1) / 4).fillRect((i * 97) % W, (i * 41) % 180, 2, 2);
  drawPixelCapitol(g, 880, 330, 1);
  const shops = [[0, 150, 0x8a3b3b], [150, 130, 0x3b5f8a], [280, 160, 0x6a5a3a], [440, 120, 0x3b7a5a], [560, 170, 0x7a3b6a], [730, 100, 0x5a4a7a]];
  shops.forEach(([x, w, c], i) => {
    const top = 180 + (i % 3) * 30;
    g.fillStyle(c, 1); g.fillRect(x, top, w, 330 - top);
    g.fillStyle(0x000000, 0.25); g.fillRect(x + w - 8, top, 8, 330 - top);
    for (let wx = x + 16; wx < x + w - 24; wx += 34) for (let wy = top + 20; wy < 270; wy += 40) g.fillStyle((wx + wy) % 3 ? 0xffd27a : 0x2a2a3a, 1).fillRect(wx, wy, 18, 22);
    g.fillStyle([0xc5050c, 0xf2c94c, 0x3fa34d][i % 3], 1); g.fillRect(x + 6, 286, w - 12, 10);
    for (let sx = x + 6; sx < x + w - 12; sx += 16) g.fillStyle(0xffffff, 0.6).fillRect(sx, 286, 8, 10);
    g.fillStyle(0x1a1a24, 1); g.fillRect(x + w / 2 - 14, 296, 28, 34);
  });
  g.fillStyle(0x9a9aa8, 1); g.fillRect(0, 330, W, 170);
  g.fillStyle(0x84849a, 1); for (let x = 0; x < W; x += 64) g.fillRect(x, 330, 2, 170);
  g.fillStyle(0xc8c8d4, 1); g.fillRect(0, 498, W, 6);
  g.fillStyle(0x2a2a32, 1); g.fillRect(0, 504, W, H - 504);
  g.fillStyle(0xf2c94c, 1); for (let x = 20; x < W; x += 90) g.fillRect(x, 568, 50, 6);
  g.fillStyle(0x3fa34d, 1); g.fillRect(780, 200, 110, 26);
  if (dim) { g.fillStyle(0x000000, 0.35); g.fillRect(0, 0, W, H); }
}

// ---------- base scene: timer, caption box, map key ----------
class Base extends Phaser.Scene {
  ui(title) {
    this.box = this.add.rectangle(W / 2, H - 62, W - 60, 92, 0x000000, 0.8).setStrokeStyle(2, 0xffffff).setDepth(100);
    this.cap = this.add.text(50, H - 98, '', { fontFamily: FONT, fontSize: '20px', color: '#ffffff', wordWrap: { width: W - 100 }, lineSpacing: 4 }).setDepth(101).setResolution(2);
    this.timerText = this.add.text(W - 24, 18, '', { fontFamily: FONT, fontSize: '22px', color: '#ff6b6b', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(1, 0).setDepth(101).setResolution(2);
    if (title) this.add.text(24, 18, title, { fontFamily: FONT, fontSize: '22px', color: '#ffd166', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setDepth(101).setResolution(2);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,J,K,M,ENTER');
    // one-shot keys use events so quick taps never get missed
    this.pressed = new Set();
    ['E', 'J', 'M'].forEach(c => this.input.keyboard.on('keydown-' + c, () => this.pressed.add(c)));
  }
  hit(c) { return this.pressed.delete(c); }
  say(t) { this.cap.setText(t); }
  openMap() { if (G.running) this.scene.start('CampusMap'); }
  update(time, dt) {
    if (G.running && !G.over) {
      G.time -= dt / 1000;
      if (G.time <= 0) { G.time = 0; G.over = true; G.running = false; this.scene.start('End', { win: false }); return; }
    }
    if (this.timerText) this.timerText.setText(G.running ? `Bucky has ${Math.ceil(G.time)}s` : '');
    if (this.tick) this.tick(time, dt);
  }
}

// ======================================================================
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() { this.load.spritesheet('badger', BADGER_PNG, { frameWidth: 50, frameHeight: 48 }); }
  create() {
    makeTex(this, 'pill', PILL_ROWS, PILL_PAL);
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('badger', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.scene.start('Street');
  }
}

// ======================================================================
class Street extends Base {
  constructor() { super('Street'); }
  create() {
    resetG();
    drawStreet(this.add.graphics());
    this.add.text(835, 213, 'STATE ST', { fontFamily: FONT, fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setResolution(2);
    this.ui('State Street · 11:40 PM');
    this.p = this.add.sprite(80, 450, 'badger', 0).setScale(2.5);
    this.pill = this.add.image(760, -120, 'pill').setScale(6);
    this.ambushed = false;
    this.say('Heading home down State Street. Walk right with D or the arrow keys.');
  }
  tick() {
    if (this.ambushed) return;
    const k = this.keys;
    const dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    this.p.x = Phaser.Math.Clamp(this.p.x + dx * 3.2, 40, W - 40);
    if (dx) { this.p.setFlipX(dx < 0); if (!this.p.anims.isPlaying) this.p.play('walk'); } else { this.p.stop(); this.p.setFrame(0); }
    if (this.p.x > 480) this.ambush();
  }
  ambush() {
    this.ambushed = true; this.p.stop(); this.p.setFrame(0);
    this.tweens.add({ targets: this.pill, y: 420, duration: 450, ease: 'Bounce.easeOut', onComplete: () => this.cameras.main.shake(250, 0.012) });
    this.say('AMBUSH! A "study pill" a stranger offered earlier is back, and it is laced with fentanyl.');
    this.time.delayedCall(2600, () => this.scene.start('Fight'));
  }
}

// ======================================================================
// The fight is rigged: whatever the player does, Bucky goes down.
class Fight extends Base {
  constructor() { super('Fight'); }
  create() {
    drawStreet(this.add.graphics(), true);
    this.ui('BUCKY  vs  THE PILL');
    this.p = this.add.sprite(280, 450, 'badger', 0).setScale(2.5);
    this.pill = this.add.image(700, 420, 'pill').setScale(6);
    this.tweens.add({ targets: this.pill, y: 410, duration: 300, yoyo: true, repeat: -1 });
    this.hp = 100; this.pillHp = 100;
    this.bars = this.add.graphics().setDepth(99);
    this.add.text(40, 62, 'BUCKY', { fontFamily: FONT, fontSize: '15px', color: '#ffffff', fontStyle: 'bold' }).setDepth(101).setResolution(2);
    this.add.text(W - 40, 62, 'THE PILL', { fontFamily: FONT, fontSize: '15px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(101).setResolution(2);
    this.say('FIGHT! A / D move · J punch · K block');
    this.nextAtk = this.time.now + 1400;
    this.started = this.time.now;
    this.cool = 0;
    this.done = false;
  }
  drawBars() {
    const b = this.bars; b.clear();
    b.fillStyle(0x000000, 1); b.fillRect(38, 84, 304, 20); b.fillRect(W - 342, 84, 304, 20);
    b.fillStyle(0x3fa34d, 1); b.fillRect(40, 86, 3 * Math.max(0, this.hp), 16);
    b.fillStyle(0x9d63c4, 1); b.fillRect(W - 40 - 3 * this.pillHp, 86, 3 * this.pillHp, 16);
  }
  tick(time) {
    this.drawBars();
    if (this.done) return;
    const k = this.keys;
    const dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    this.blocking = k.K.isDown;
    this.p.x = Phaser.Math.Clamp(this.p.x + dx * 3, 60, this.pill.x - 110);
    this.p.setTint(this.blocking ? 0x8fb7ff : 0xffffff);
    if (dx && !this.blocking) { if (!this.p.anims.isPlaying) this.p.play('walk'); } else { this.p.stop(); this.p.setFrame(0); }

    if (this.hit('J') && time > this.cool && !this.blocking) {
      this.cool = time + 350;
      this.tweens.add({ targets: this.p, x: this.p.x + 30, duration: 80, yoyo: true });
      if (this.pill.x - this.p.x < 220) {
        this.pillHp = Math.max(70, this.pillHp - 6); // it never really goes down
        this.pill.setTint(0xff9999); this.time.delayedCall(90, () => this.pill.clearTint());
        if (this.pillHp === 70) this.say('Your punches barely do anything. You cannot fight this alone.');
      }
    }
    this.pillHp = Math.min(100, this.pillHp + 0.03);

    if (time > this.nextAtk) {
      this.nextAtk = time + 1100;
      const final = time - this.started > 13000;
      const startX = this.pill.x;
      this.tweens.add({
        targets: this.pill, x: this.p.x + 110, duration: 160, yoyo: true, hold: 60,
        onYoyo: () => {
          const dmg = final ? 100 : (this.blocking ? 9 : 18);
          this.hp -= dmg;
          this.cameras.main.shake(120, 0.01);
          this.p.setTint(0xff6b6b); this.time.delayedCall(100, () => this.p.setTint(this.blocking ? 0x8fb7ff : 0xffffff));
          this.tweens.add({ targets: this.p, x: Math.max(60, this.p.x - 40), duration: 120 });
          if (this.hp <= 0) this.knockout();
        },
        onComplete: () => { this.pill.x = startX; }
      });
    }
  }
  knockout() {
    if (this.done) return; this.done = true; this.hp = 0;
    this.p.stop(); this.p.clearTint();
    this.tweens.add({ targets: this.p, angle: -90, y: 480, duration: 500 });
    this.say('K.O. Bucky goes down hard.');
    this.time.delayedCall(1800, () => this.scene.start('Down', { fresh: true }));
  }
}

// ======================================================================
class Down extends Base {
  constructor() { super('Down'); }
  create(data) {
    this.reviving = false;
    G.at = 'street';
    drawStreet(this.add.graphics(), true);
    this.ui('State Street');
    this.body = this.add.sprite(380, 480, 'badger', 0).setScale(2.5).setAngle(-90).setTint(0x9aa4c8);
    this.soul = this.add.sprite(380, 330, 'badger', 0).setScale(2.5).setTint(0x9be7ff).setAlpha(0.55);
    const float = () => this.tweens.add({ targets: this.soul, y: 310, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.lines = null;
    if (!(data && data.fresh)) float();
    if (data && data.fresh) {
      this.soul.setY(470).setAlpha(0);
      this.tweens.add({ targets: this.soul, y: 330, alpha: 0.55, duration: 1500, onComplete: float });
      this.lines = [
        'Bucky won\'t wake up, and his breathing is slow and shallow. His lips are turning blue. Those are signs of an opioid overdose.',
        'Bucky\'s soul slips out of his body. Narcan (naloxone) can reverse an opioid overdose, but you need to find some, fast.',
        'You have ' + START_TIME + ' seconds. Press M to open the campus map and search for Narcan. (E to start)'
      ];
      this.li = 0; this.say(this.lines[0] + '  (E)');
    } else if (G.hasNarcan) {
      this.say('You made it back with Narcan! Press E to use it.');
    } else {
      this.say('Still no Narcan. Press M to keep searching.');
    }
  }
  tick() {
    const k = this.keys;
    if (this.reviving) return;
    if (this.lines && this.hit('E')) {
      this.li++;
      if (this.li < this.lines.length) this.say(this.lines[this.li] + (this.li < this.lines.length - 1 ? '  (E)' : ''));
      else { this.lines = null; G.running = true; this.say('Press M to open the campus map. Find Narcan and bring it back here.'); }
      return;
    }
    if (!this.lines && this.hit('M')) this.openMap();
    if (!this.lines && G.hasNarcan && this.hit('E')) this.revive();
  }
  revive() {
    this.reviving = true; G.running = false;
    const steps = [
      'Step 1: Call 911. Say someone is not breathing.',
      'Step 2: Spray Narcan into one nostril. If there\'s no response in 2 to 3 minutes, give a second dose.',
      'Step 3: Roll Bucky onto his side and stay with him until help arrives.'
    ];
    steps.forEach((s, i) => this.time.delayedCall(i * 2600, () => this.say(s)));
    this.time.delayedCall(steps.length * 2600, () => {
      this.tweens.killTweensOf(this.soul);
      this.tweens.add({ targets: this.soul, y: 480, alpha: 0, duration: 900 });
      this.tweens.add({ targets: this.body, angle: 0, y: 450, duration: 700, delay: 800, onStart: () => this.body.clearTint() });
      this.say('Bucky gasps and opens his eyes. He\'s alive.');
      this.time.delayedCall(2600, () => this.scene.start('End', { win: true }));
    });
  }
}

// ======================================================================
const PLACES = {
  street: { name: 'State Street (Bucky)', x: 700, y: 410 },
  bascom: { name: 'Bascom Hall', x: 170, y: 300 },
  union: { name: 'Memorial Union', x: 420, y: 180 },
  uhs: { name: 'UHS', x: 470, y: 380 },
  sellery: { name: 'Sellery Hall', x: 300, y: 480 }
};

class CampusMap extends Base {
  constructor() { super('CampusMap'); }
  create() {
    this.leaving = false;
    const g = this.add.graphics();
    g.fillStyle(0x4f8a3c, 1); g.fillRect(0, 0, W, H);
    g.fillStyle(0x2b5fa8, 1); g.fillRect(0, 0, W, 120);
    g.fillStyle(0x3d75c0, 1); for (let x = 0; x < W; x += 24) g.fillRect(x, 40 + (x % 48 ? 0 : 30), 12, 3);
    g.fillStyle(0x6fa65a, 1); g.fillRect(100, 260, 160, 90);
    g.fillStyle(0xb8b2a0, 1);
    g.fillRect(0, 230, W, 16);           // University Ave-ish path
    g.fillRect(240, 120, 16, 520);       // Park St-ish path
    g.fillRect(440, 120, 16, 520);       // East Campus Mall
    for (let i = 0; i < 26; i++) g.fillRect(456 + i * 18, 300 + i * 9, 20, 16); // State Street
    drawPixelCapitol(g, 920, 560, 0.5);
    this.add.text(W / 2, 60, 'Lake Mendota', { fontFamily: FONT, fontSize: '16px', color: '#cfe3ff' }).setOrigin(0.5).setResolution(2);
    this.ui('Campus map');
    this.say(G.hasNarcan ? 'You have Narcan! Click State Street to get back to Bucky.' : `Click a place to search it. Each trip costs ${TRAVEL_COST} extra seconds. M closes the map.`);
    Object.entries(PLACES).forEach(([id, p]) => {
      const here = G.at === id;
      const pin = this.add.rectangle(p.x, p.y, 22, 22, id === 'street' ? 0xc5050c : 0xffd166).setStrokeStyle(3, 0x1a1410);
      this.add.text(p.x, p.y + 20, p.name + (here ? ' (here)' : ''), { fontFamily: FONT, fontSize: '15px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0).setResolution(2);
      this.add.zone(p.x, p.y + 14, 200, 64).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.go(id));
      this.tweens.add({ targets: pin, scale: 1.25, duration: 500, yoyo: true, repeat: -1 });
    });
  }
  go(id) {
    if (this.leaving) return; this.leaving = true;
    if (G.at !== id) G.time -= TRAVEL_COST;
    G.at = id;
    this.say(`Flying to ${PLACES[id].name}...`);
    this.cameras.main.fadeOut(350);
    this.cameras.main.once('camerafadeoutcomplete', () => id === 'street' ? this.scene.start('Down', {}) : this.scene.start('Place', { id }));
  }
  tick() { if (this.hit('M')) this.go(G.at); }
}

// ======================================================================
// Each searchable place: a room with three spots. Only UHS has Narcan.
// UHS (333 East Campus Mall) gives out free naloxone; confirm current details with UHS before demoing.
const ROOMS = {
  bascom: {
    title: 'Bascom Hall', wall: 0x8a7a64, floor: 0x5a4a3a,
    spots: [
      { x: 180, y: 300, w: 120, h: 70, c: 0x6b4a2a, label: 'lecture seats', text: 'Old gum and a lost calculator. No Narcan.' },
      { x: 480, y: 220, w: 140, h: 90, c: 0xd9c9a3, label: 'bulletin board', text: 'A flyer: "Free Narcan at University Health Services, 333 East Campus Mall."' },
      { x: 780, y: 300, w: 80, h: 110, c: 0x7a7a82, label: 'Lincoln statue', text: 'Abe stares back at you. He does not have Narcan.' }
    ]
  },
  union: {
    title: 'Memorial Union', wall: 0x6a7a8a, floor: 0x3a4a5a,
    spots: [
      { x: 180, y: 320, w: 110, h: 60, c: 0xf28c28, label: 'Terrace chairs', text: 'Sunburst chairs and a great lake view. No Narcan.' },
      { x: 480, y: 300, w: 160, h: 70, c: 0x8a5a30, label: 'info desk', text: 'Staff: "Go to UHS on East Campus Mall. They give out Narcan for free."' },
      { x: 780, y: 300, w: 110, h: 80, c: 0xf2e4c8, label: 'ice cream counter', text: 'Tempting, but Bucky needs Narcan, not a cone.' }
    ]
  },
  sellery: {
    title: 'Sellery Hall', wall: 0x7a6a8a, floor: 0x4a3a5a,
    spots: [
      { x: 180, y: 310, w: 110, h: 70, c: 0x3a5a8a, label: 'lounge couch', text: 'Just a freshman asleep on a textbook.' },
      { x: 480, y: 300, w: 120, h: 80, c: 0xc5050c, label: 'RA office', text: 'Your RA: "Call 911 and get Narcan from UHS, right now!"' },
      { x: 780, y: 300, w: 120, h: 90, c: 0x9a8a6a, label: 'mailroom', text: 'Packages everywhere. No Narcan.' }
    ]
  },
  uhs: {
    title: 'UHS · 333 East Campus Mall', wall: 0xdfe8ee, floor: 0x9aa8b4,
    spots: [
      { x: 180, y: 300, w: 120, h: 80, c: 0x5a8aaa, label: 'waiting room', text: 'Rows of chairs. Someone is reading a pamphlet on overdose signs.' },
      { x: 480, y: 300, w: 170, h: 80, c: 0xffffff, label: 'pharmacy counter', text: 'The pharmacist hands you a free Narcan nasal spray. GOT NARCAN! Press M and get back to Bucky.', narcan: true },
      { x: 780, y: 230, w: 120, h: 90, c: 0xf2c94c, label: 'poster', text: 'Poster: "Pills from friends or online can contain fentanyl. You cannot see, smell, or taste it."' }
    ]
  }
};

class Place extends Base {
  constructor() { super('Place'); }
  create(data) {
    this.found = false; this.near = null;
    this.room = ROOMS[data.id];
    const r = this.room, g = this.add.graphics();
    g.fillStyle(r.wall, 1); g.fillRect(0, 0, W, 360);
    g.fillStyle(0x000000, 0.15); for (let x = 0; x < W; x += 80) g.fillRect(x, 0, 4, 360);
    g.fillStyle(r.floor, 1); g.fillRect(0, 360, W, H - 360);
    g.fillStyle(0x000000, 0.12); for (let x = 0; x < W; x += 48) g.fillRect(x, 360, 2, H - 360);
    r.spots.forEach(s => {
      g.fillStyle(0x1a1410, 1); g.fillRect(s.x - s.w / 2 - 3, s.y - s.h / 2 - 3, s.w + 6, s.h + 6);
      g.fillStyle(s.c, 1); g.fillRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
      g.fillStyle(0xffffff, 0.25); g.fillRect(s.x - s.w / 2, s.y - s.h / 2, s.w, 6);
      this.add.text(s.x, s.y + s.h / 2 + 8, s.label, { fontFamily: FONT, fontSize: '14px', color: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0).setResolution(2);
    });
    this.ui(r.title);
    this.soul = this.add.sprite(W / 2, 470, 'badger', 0).setScale(2).setTint(0x9be7ff).setAlpha(0.6).setDepth(5);
    this.say(G.hasNarcan ? 'You already have Narcan. Press M and get back to Bucky!' : 'Move with WASD. Press E near something to search it. M opens the map.');
  }
  tick() {
    const k = this.keys, s = this.soul;
    const dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    s.x = Phaser.Math.Clamp(s.x + dx * 4, 40, W - 40);
    s.y = Phaser.Math.Clamp(s.y + dy * 4, 200, 520);
    if (dx) s.setFlipX(dx < 0);
    const near = this.room.spots.find(p => Math.abs(p.x - s.x) < p.w / 2 + 50 && Math.abs(p.y - s.y) < p.h / 2 + 90);
    if (near !== this.near) { this.near = near; if (near && !this.found) this.say(`E: search the ${near.label}`); }
    if (this.hit('E') && near) {
      this.say(near.text);
      if (near.narcan) { G.hasNarcan = true; this.found = true; }
    }
    if (this.hit('M')) this.openMap();
  }
}

// ======================================================================
class End extends Phaser.Scene {
  constructor() { super('End'); }
  create(data) {
    const win = data.win;
    this.add.rectangle(W / 2, H / 2, W, H, win ? 0x0f2a1a : 0x2a0f12);
    this.add.text(W / 2, 90, win ? 'BUCKY IS ALIVE' : 'GAME OVER', { fontFamily: FONT, fontSize: '52px', color: win ? '#7ee0a1' : '#ff6b6b', fontStyle: 'bold', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5).setResolution(2);
    this.add.text(W / 2, 150, win ? 'You found Narcan in time.' : 'Time ran out before Bucky got Narcan. In real life, every minute counts.', { fontFamily: FONT, fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setResolution(2);
    const lessons = [
      'Signs of an opioid overdose: won\'t wake up, slow or no breathing, blue lips.',
      'Call 911 first. Then give Narcan, roll them on their side, and stay with them.',
      'Pills from friends or online can contain fentanyl you cannot see, smell, or taste.',
      'Free Narcan is available at UHS, 333 East Campus Mall. Carry it.'
    ];
    lessons.forEach((t, i) => this.add.text(120, 230 + i * 62, '• ' + t, { fontFamily: FONT, fontSize: '19px', color: '#ffffff', wordWrap: { width: W - 240 } }).setResolution(2));
    const again = this.add.text(W / 2, 560, 'Press ENTER to play again', { fontFamily: FONT, fontSize: '20px', color: '#ffd166' }).setOrigin(0.5).setResolution(2);
    this.tweens.add({ targets: again, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Street'));
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W, height: H,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Street, Fight, Down, CampusMap, Place, End]
});
