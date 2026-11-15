// The Tale of the Badger · Chapter 1
// Scene: Street — Langdon St at 9 PM, phone tutorial, knock on the door → Party.
// Test this scene alone: open 1-party/scenes/test.html

// ======================================================================
class Street extends Walk {
  constructor() { super('Street'); }
  create() {
    const WW = 1400, WH = 460;
    this.cameras.main.setBounds(0, 0, WW, WH).setZoom(1.4 * RS).fadeIn(600);
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
    this.add.text(601, 179, 'LANGDON ST', { fontFamily: FONT, fontSize: '11px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(-40).setResolution(RES_WORLD);
    // thump text
    this.time.addEvent({ delay: 1400, loop: true, callback: () => this.floatText(1070 + Phaser.Math.Between(-150, 150), 110, '♪ thump ♪', '#ff9de2') });

    this.setupPlayer(120, 330);
    this.jake = this.add.sprite(80, 330, 'jake');
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.prompt = this.add.text(0, 0, '[E] Knock', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffd166', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(6000).setResolution(RES_WORLD).setVisible(false);

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
      if (ui.phoneOpen) { this.tut = 'read'; ui.objective('New quest on your phone. Press Esc to put it away'); }
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
      if (time < this.shakeUntil) return;
      this.shakeUntil = time + 1300;
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
