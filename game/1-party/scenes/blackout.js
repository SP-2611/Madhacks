// The Tale of the Badger · Chapter 1
// Scene: Blackout — memory fragments → Terrace.
// Test this scene alone: open 1-party/scenes/test.html

// ======================================================================
class Blackout extends Phaser.Scene {
  constructor() { super('Blackout'); }
  create() {
    fitCam(this);
    this.cameras.main.setBackgroundColor('#000000');
    const frags = ['"one more, legend!"', '*bass thumping*', '...where\'s Jake...', '"bro is GONE lol"', '...the room is spinning...', '...my tail...'];
    frags.forEach((f, i) => {
      const t = this.add.text(Phaser.Math.Between(160, W - 160), Phaser.Math.Between(120, H - 160), f, { fontFamily: FONT, fontSize: '22px', color: '#888888', fontStyle: 'italic' }).setOrigin(0.5).setAlpha(0).setResolution(RES_UI);
      this.tweens.add({ targets: t, alpha: 0.9, duration: 500, delay: 600 + i * 900, yoyo: true, hold: 500 });
    });
    this.time.delayedCall(600 + frags.length * 900 + 1500, () => this.scene.start('Terrace'));
  }
}
