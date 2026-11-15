// The Tale of the Badger · Chapter 1
// Scene: Terrace — wake up at Memorial Union, tail gone. → Burrow, or dig back (replay the party).
// Test this scene alone: open 1-party/scenes/test.html

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
    fitCam(this);
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
    const t = this.add.text(this.bucky.x + 40, this.bucky.y - 10, '...', { fontFamily: FONT, fontSize: '28px', color: '#ffffff', stroke: '#000', strokeThickness: 5 }).setDepth(900).setResolution(RES_UI);
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
    this.add.text(W / 2, 240, 'LAST NIGHT (what you remember)', { fontFamily: FONT, fontSize: '18px', color: '#ffd166', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2001).setResolution(RES_UI);
    this.add.text(W / 2 - 240, 270, lines.join('\n'), { fontFamily: FONT, fontSize: '17px', color: '#ffffff', lineSpacing: 8 }).setDepth(2001).setResolution(RES_UI);
    this.time.delayedCall(800, () => this.ui.choose({
      who: 'BUCKY', text: 'Your tail is somewhere in last night. So is Jake.', scrambleChoices: false,
      choices: [
        { label: 'Return to the Burrow', fn: () => { window.location.href = '2-burrow/index.html?done=party'; } },
        { label: 'Replay the party from the beginning', fn: () => this.dig() },
        { label: 'Back to the title screen', fn: () => { this.scene.stop('UI'); this.scene.start('Title'); } }
      ]
    }));
  }
  dig() {
    this.cameras.main.shake(800, 0.01);
    this.cameras.main.fadeOut(900);
    this.cameras.main.once('camerafadeoutcomplete', () => { resetState(true); this.scene.stop('UI'); this.scene.start('Party'); });
  }
}
