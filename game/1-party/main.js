// The Tale of the Badger · Chapter 1 entry point: hooks + starts the Phaser game with every scene.

// teammates' Prologue scene (prologue.js): fit it to the sharp renderer without editing that file
if (typeof Prologue !== 'undefined') {
  const prologueCreate = Prologue.prototype.create;
  Prologue.prototype.create = function () {
    fitCam(this);
    prologueCreate.call(this);
    this.children.list.forEach(o => { if (o.type === 'Text') o.setResolution(RES_UI); });
  };
}

// ======================================================================
window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W * RS, height: H * RS,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Title, Prologue, Street, Party, StateStreet, Blackout, Terrace, Ending, UI]
});
