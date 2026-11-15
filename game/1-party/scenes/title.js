// The Tale of the Badger · Chapter 1
// Scene: Title — title screen with the Capitol. ENTER → Prologue.
// Test this scene alone: open 1-party/scenes/test.html

// ======================================================================
class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    fitCam(this);
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

    this.add.text(W / 2, 62, 'THE TALE OF THE', { fontFamily: FONT, fontSize: '34px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setResolution(RES_UI);
    const t = this.add.text(W / 2, 122, 'BADGER', { fontFamily: FONT, fontSize: '84px', color: '#ffffff', fontStyle: 'bold', stroke: '#c5050c', strokeThickness: 12 }).setOrigin(0.5).setResolution(RES_UI);
    t.setShadow(6, 6, '#000000', 0, true, true);

    const tail = this.add.image(196, 506, 'tail').setScale(3).setOrigin(0.9, 0.5).setFlipX(true);
    const b = this.add.sprite(230, 478, 'badger', 0).setScale(3);
    this.tweens.add({ targets: tail, angle: { from: -20, to: 25 }, duration: 160, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: b, y: 470, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const start = this.add.text(W / 2, 560, 'Press ENTER or click to start', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5).setResolution(RES_UI);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    this.add.text(W / 2, 600, 'WASD move · E interact · SPACE tail shake · ↑ phone · ↑↓ + Enter choose', { fontFamily: FONT, fontSize: '14px', color: '#cccccc' }).setOrigin(0.5).setResolution(RES_UI);

    const go = () => {
      if (this.going) return; this.going = true;
      resetState(false);
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Prologue'));
    };
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.once('pointerdown', go);
  }
}
