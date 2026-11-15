// The Tale of the Badger · Chapter 1
// Scene: Party — the house party: kitchen → living room, quests, depth meter, Brody/Kayla/Maya/Jake.
// Ends → StateStreet (sober first night), Blackout (drank), or the Jake ending (dig-back replay).
// Test this scene alone: open 1-party/scenes/test.html

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
    cam.setBounds(20, 340, 880, 540).setZoom(1.4 * RS).fadeIn(600);
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

    this.prompt = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffd166', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(6000).setResolution(RES_WORLD);

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

    this.marker = this.add.text(0, 0, '▼', { fontFamily: FONT, fontSize: '20px', color: '#ffd166', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(7000).setResolution(RES_WORLD).setVisible(false);
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
    this.bathLabel = this.add.text(255, 530, 'WC', { fontFamily: FONT, fontSize: '10px', color: '#f0e0c0' }).setOrigin(0.5).setDepth(542).setResolution(RES_WORLD).setAlpha(0);
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
    this.fogLabel = this.add.text(620, 640, '♪ the living room is packed ♪', { fontFamily: FONT, fontSize: '14px', color: '#555566' }).setOrigin(0.5).setDepth(5901).setResolution(RES_WORLD);
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
      ({ n, t: this.add.text(n.x, n.y - 30, t, { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setResolution(RES_WORLD).setDepth(5800) }));

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
      VOICE: { x: 260, y: 520 }, CHAD: this.chad || this.player, CROWD: this.revealed ? this.livingCrowd[0] : this.kitchenCrowd[0]
    };
    return m[who] || this.player;
  }

  // ---------- loop ----------
  update(time) {
    if (!this.player || this.ended) return;
    this.movePlayer(time);
    if (!this.brodyWalking) this.brody.setDepth(CHAR_D + this.brody.y);
    this.updateBuzz(time);
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
  }
  markCurrent(id) {
    const isNew = S.current !== id;
    if (S.current && S.current !== id && !S.done.includes(S.current)) S.done.push(S.current);
    S.current = id;
    const st = STEPS.find(x => x.id === id);
    if (isNew && st && id !== 'tail' && id !== 'end' && !this.ui.phoneOpen) {
      this.ui.toast(`📳 New quest: ${st.label}`, 3000);
      this.buzz();
    }
    if (this.ui.phoneOpen) this.ui.drawPhone();
  }
  buzz() {
    this.buzzLeft = 3;
    this.nextBuzz = 0;
  }
  updateBuzz(time) {
    if (!this.buzzLeft) return;
    if (this.ui.phoneOpen) { this.buzzLeft = 0; return; }
    if (time < this.nextBuzz) return;
    this.buzzLeft--;
    this.nextBuzz = time + 3500;
    this.cameras.main.shake(160, 0.004);
    this.floatText(this.player.x + 18, this.player.y - 40, '📳 bzzz', '#ffffff');
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
    if (time < this.shakeUntil) return;
    this.shakeUntil = time + 1300;
    this.tweens.add({ targets: this.player, scaleY: 0.88, duration: 160, yoyo: true, repeat: 3 });
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
        const pushBack = () => this.ui.lines([
          { who: 'BRODY', text: 'Bro, this is Madison. We don\'t do "one drink."' },
          { who: 'BRODY', text: 'You wanna be the guy who made us look soft?' }
        ], () => this.ui.choose({
          who: 'BRODY', text: '*shakes the cup at you*', choices: [
            { label: '🍺 "Fine, for the reputation."', fn: () => { this.drink(2, 'A school\'s reputation is still just pressure.'); this.ui.learn('pressure'); this.brodyHomeWalk(); fin(false); } },
            { label: '🦶 "The school will survive without me."', sober: true, fn: () => this.say('BRODY', '...fair, fair.', refusedFollow) },
            { label: '😎 "Rankings don\'t drink for you."', sober: true, fn: () => this.say('BRODY', 'Okay that was kinda hard.', refusedFollow) }
          ]
        }));
        this.ui.choose({
          who: 'BRODY', text: '*holds out a red cup*', timer: 5,
          choices: [
            { label: '🍺 "Let\'s go!"', fn: () => { this.drink(2); this.say('BRODY', 'THAT\'S what I\'m talking about!', () => { this.ui.learn('pressure'); this.brodyHomeWalk(); fin(false); }); } },
            { label: '🥔 "Lemme grab chips first."', fn: () => { this.say('BRODY', 'Fair, fair. I\'ll catch you later, legend.', () => { this.brodyHomeWalk(); fin(false); }); } },
            { label: '💧 "I\'m on water rn."', sober: true, fn: () => this.say('BRODY', 'Water?? At a Langdon party??', pushBack) },
            { label: '🦶 Dig in your heels: "Nah, I\'m good."', sober: true, fn: () => this.say('BRODY', 'Come onnn.', pushBack) }
          ],
          waterOk: () => this.say('BRODY', 'That\'s water. I can tell it\'s water.', pushBack),
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
    if (!S.rewind && S.drinks === 0) { // sober first night -> State Street (the dig-back replay keeps its Jake ending)
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
  // right before you black out, a guy shows up with a White Monster
  blackout() {
    if (this.ended || this.monsterBusy) return;
    if (this.monsterDone) { this.doBlackout(); return; }
    this.monsterBusy = true;
    this.frozen = true;
    this.player.setVelocity(0, 0);
    this.ui.close();
    if (this.ui.phoneOpen) this.ui.togglePhone(false);
    const chad = this.chad = this.add.sprite(this.player.x + 140, this.player.y, 'chad').setDepth(CHAR_D + this.player.y).setFlipX(true);
    const can = this.add.image(chad.x - 12, chad.y + 6, 'whiteMonster').setDepth(CHAR_D + this.player.y + 1);
    this.tweens.add({ targets: [chad, can], x: '-=88', duration: 700, onComplete: () => {
      this.ui.lines([
        { who: 'CHAD', text: 'Yooo you good?? 😂' },
        { who: 'CHAD', text: 'Wait. Wait wait wait. What if we mixed it with White Monster?' },
        { who: '', text: '*he cracks open a White Monster and pours it into your cup*' },
        { who: '', text: 'The caffeine makes you feel less drunk than you are. So you keep drinking.' }
      ], () => { this.ui.learn('energy'); this.monsterDone = true; this.monsterBusy = false; this.doBlackout(); });
    } });
  }
  doBlackout() {
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
