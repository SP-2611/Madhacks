// The Tale of the Badger · Chapter 1
// Scene: StateStreet — sober ending: walking home alone at 3 AM, tail stolen → Burrow.
// Test this scene alone: open 1-party/scenes/test.html

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
      }).setOrigin(0.5).setDepth(-90).setResolution(RES_UI);
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
    }).setOrigin(0.5).setDepth(200).setResolution(RES_UI);
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
    }).setOrigin(0.5).setResolution(RES_UI);
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
          }).setDepth(250).setResolution(RES_UI);
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
    }).setOrigin(0.5).setResolution(RES_UI));
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
      }).setOrigin(0.5).setResolution(RES_UI));
      this.overlay.add(this.add.text(card.x, 402, card.caption, {
        fontFamily: FONT, fontSize: card.x === 480 ? '11px' : '12px', color: '#ffffff',
        align: 'center', wordWrap: { width: 210 }
      }).setOrigin(0.5).setResolution(RES_UI));
    });
    this.overlay.add(this.add.text(W / 2, 455, '3:00 AM · BUCKY WALKED ALONE', {
      fontFamily: FONT, fontSize: '15px', color: '#ffcb05', fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(RES_UI));
    const button = this.add.text(W / 2, 500, 'CONTINUE ▶', {
      fontFamily: FONT, fontSize: '18px', color: '#111827', fontStyle: 'bold',
      backgroundColor: '#ffcb05', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setResolution(RES_UI);
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
    }).setOrigin(0.5).setResolution(RES_UI));
    this.overlay.add(this.add.text(W / 2, 315, 'The trail continues in Chapter 2…', {
      fontFamily: FONT, fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5).setResolution(RES_UI));
    const button = this.add.text(W / 2, 405, 'DIG INTO THE BURROW  ·  ENTER', {
      fontFamily: FONT, fontSize: '17px', color: '#ffffff', backgroundColor: '#c5050c',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setResolution(RES_UI);
    button.on('pointerdown', () => this.returnToTitle());
    this.overlay.add(button);
    this.input.keyboard.once('keydown-ENTER', () => this.returnToTitle());
  }

  returnToTitle() {
    window.location.href = '2-burrow/index.html?done=party';
  }
}
