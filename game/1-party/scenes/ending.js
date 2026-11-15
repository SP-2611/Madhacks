// The Tale of the Badger · Chapter 1
// Scene: Ending — tail restored after saving Jake, lessons recap → Burrow.
// Test this scene alone: open 1-party/scenes/test.html

// ======================================================================
class Ending extends Phaser.Scene {
  constructor() { super('Ending'); }
  create() {
    fitCam(this);
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
    this.add.text(W / 2, 64, 'What you dug up', { fontFamily: FONT, fontSize: '24px', color: '#ffd166', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2001).setResolution(RES_UI);
    const L = [
      '🦶 Saying no is normal. You don\'t owe anyone a reason.',
      '🥔 Eat food, hold water, pace yourself. Shots and punch hit harder.',
      '😴 "Sleeping it off" is a myth. Can\'t wake up, slow breathing,',
      '   vomiting, cold/clammy skin = alcohol poisoning.',
      '📞 Roll them on their side, call 911, stay with them.',
      '🛡  Ask UHS about UW–Madison\'s Responsible Action policy for',
      '   students who call for help.'
    ];
    this.add.text(W / 2 - 380, 100, L.join('\n'), { fontFamily: FONT, fontSize: '17px', color: '#ffffff', lineSpacing: 10 }).setDepth(2001).setResolution(RES_UI);
    this.add.text(W / 2, 330, 'Bucky lost his tail. Don\'t lose yourself.', { fontFamily: FONT, fontSize: '20px', color: '#ff5a5f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2001).setResolution(RES_UI);
    const burrowButton = this.add.text(W / 2, 372, 'RETURN TO BURROW  ·  ENTER / CLICK', { fontFamily: FONT, fontSize: '17px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#c5050c', padding: { x: 12, y: 8 } }).setOrigin(0.5).setDepth(2001).setResolution(RES_UI).setInteractive({ useHandCursor: true });
    const returnToBurrow = () => { window.location.href = '2-burrow/index.html?done=party'; };
    burrowButton.once('pointerdown', returnToBurrow);
    this.input.keyboard.once('keydown-ENTER', returnToBurrow);
  }
}
