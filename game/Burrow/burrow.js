const W=960,H=600;
const LEVELS=[
 {x:270,y:238,title:'BUCKY VS COURSEWORK',sign:'COURSEWORK',color:0xd9b16e,description:'Find a class and build your schedule.',href:'../Bucky vs courses/index.html'},
 {x:690,y:238,title:'BUCKY VS DRUGS',sign:'NARCAN',color:0xa7b28a,description:'Learn how naloxone can help in an overdose.',href:'../Narcan/index.html'},
 {x:270,y:397,title:"BUCKY'S INBOX",sign:'PHISHING',color:0xc58b7e,description:'Help Bucky spot suspicious messages.',href:'../Phishing/index.html'},
 {x:690,y:397,title:'THE BEGINNING',sign:'PROLOGUE',color:0xa2a9c7,description:'Start at the beginning of Bucky’s story.',href:'../index.html'}
];

class Burrow extends Phaser.Scene{
 preload(){this.load.spritesheet('badger',BADGER_DATA,{frameWidth:50,frameHeight:48})}
 create(){
  this.drawBurrow();
  const title=this.add.text(W/2,53,'THE BURROW',{fontFamily:'Verdana, "Segoe UI", Tahoma, sans-serif',fontSize:'84px',fontStyle:'bold',color:'#ffffff',stroke:'#c5050c',strokeThickness:12}).setOrigin(.5).setResolution(2);
  title.setShadow(6,6,'#000000',0,true,true);
  this.add.text(W/2,126,'CHAPTER SELECT',{fontFamily:'Verdana, "Segoe UI", Tahoma, sans-serif',fontSize:'22px',color:'#ffffff'}).setOrigin(.5).setResolution(2);
  this.tunnels=LEVELS.map((item,index)=>this.makeTunnel(item,index));
  this.badger=this.add.sprite(480,459,'badger',0).setScale(1.5).setDepth(6);
  this.anims.create({key:'badger-idle',frames:this.anims.generateFrameNumbers('badger',{start:0,end:3}),frameRate:5,repeat:-1});
  this.anims.create({key:'badger-walk',frames:this.anims.generateFrameNumbers('badger',{start:0,end:3}),frameRate:10,repeat:-1});
  this.makeDigFrames();
  this.anims.create({key:'badger-dig',frames:this.anims.generateFrameNumbers('badger-dig',{start:0,end:2}),frameRate:7,repeat:-1});
  this.badger.play('badger-idle');
  this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ENTER,SPACE');
  this.moveHeld=new Set();this.selected=0;this.isEntering=false;this.makeFooter();
  this.input.keyboard.on('keydown',e=>{const d={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'}[e.key];if(d){this.moveHeld.add(d);e.preventDefault()}});
  this.input.keyboard.on('keyup',e=>{const d={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'}[e.key];if(d)this.moveHeld.delete(d)});
  this.refreshSelection();
 }

 drawBurrow(){
  const g=this.add.graphics();
  g.fillGradientStyle(0x17100d,0x17100d,0x49301d,0x49301d,1).fillRect(0,0,W,H);
  // The room is a cutaway of compacted dark soil, with a rough roof and walls.
  g.fillStyle(0x251710).fillPoints([{x:0,y:0},{x:960,y:0},{x:960,y:106},{x:890,y:115},{x:814,y:103},{x:744,y:116},{x:658,y:103},{x:578,y:116},{x:492,y:104},{x:408,y:117},{x:324,y:104},{x:236,y:116},{x:151,y:103},{x:75,y:115},{x:0,y:105}],true);
  g.fillStyle(0x362316).fillPoints([{x:76,y:111},{x:180,y:121},{x:279,y:109},{x:375,y:122},{x:477,y:108},{x:577,y:120},{x:672,y:109},{x:775,y:121},{x:882,y:110},{x:870,y:483},{x:788,y:492},{x:699,y:480},{x:603,y:491},{x:506,y:479},{x:412,y:492},{x:318,y:479},{x:219,y:491},{x:120,y:479}],true);
  g.fillStyle(0x75502f).fillPoints([{x:118,y:136},{x:218,y:127},{x:317,y:143},{x:411,y:131},{x:504,y:145},{x:601,y:132},{x:701,y:145},{x:816,y:134},{x:843,y:452},{x:752,y:464},{x:659,y:453},{x:559,y:465},{x:465,y:452},{x:370,y:465},{x:273,y:452},{x:174,y:462},{x:132,y:444}],true);
  g.fillStyle(0x48301f).fillPoints([{x:163,y:161},{x:254,y:151},{x:350,y:164},{x:442,y:152},{x:538,y:166},{x:637,y:153},{x:733,y:166},{x:808,y:180},{x:792,y:426},{x:704,y:437},{x:611,y:424},{x:514,y:437},{x:419,y:425},{x:323,y:438},{x:230,y:425},{x:181,y:432}],true);
  // A cross-shaped network of packed-earth paths joins four unlit holes.
  g.fillStyle(0x221712).fillRect(435,177,90,284);
  g.fillStyle(0x8d6840).fillRect(438,178,8,275).fillRect(514,178,8,275);
  g.fillStyle(0x241811).fillRect(205,206,550,62);
  g.fillStyle(0x8d6840).fillRect(207,206,545,7).fillRect(207,261,545,7);
  g.fillStyle(0x241811).fillRect(205,365,550,62);
  g.fillStyle(0x8d6840).fillRect(207,365,545,7).fillRect(207,420,545,7);
  // Rough clods, roots, and small pale mushrooms break up the soil surface.
  const clods=[[100,131,34,13],[218,120,23,11],[341,138,38,12],[500,121,32,13],[662,137,37,11],[791,121,32,14],[135,449,39,13],[307,463,29,11],[520,458,42,13],[711,463,37,12],[835,399,23,18],[111,321,20,31],[841,252,17,31]];
  clods.forEach((r,i)=>{g.fillStyle(i%2?0x67462d:0x9a7145).fillRect(r[0],r[1],r[2],r[3]);g.fillStyle(0xc19b65,0.5).fillRect(r[0]+3,r[1]+2,Math.max(5,r[2]-9),2)});
  g.fillStyle(0x41291a).fillTriangle(163,112,179,112,174,156).fillTriangle(750,113,764,113,759,151).fillTriangle(523,113,532,113,528,144);
  [[118,390],[837,365],[177,278],[782,294],[352,430],[617,430]].forEach(([x,y])=>{g.fillStyle(0x39291d).fillRect(x-3,y,6,11);g.fillStyle(0xb6a078).fillRect(x-8,y-4,16,6);g.fillRect(x-5,y-8,10,5)});
  g.fillStyle(0x20140f).fillEllipse(480,468,106,24);
  g.fillStyle(0x4a311f).fillEllipse(480,466,86,14);
 }

 makeTunnel(level,index){
  const c=this.add.container(level.x,level.y).setDepth(3),g=this.add.graphics();
  // A dark hole in the dirt, edged with irregular clods. No neon portal effect.
  g.fillStyle(0x39261a).fillPoints([{x:-68,y:42},{x:-70,y:9},{x:-61,y:-25},{x:-45,y:-49},{x:-20,y:-59},{x:14,y:-59},{x:42,y:-47},{x:62,y:-22},{x:70,y:12},{x:67,y:43}],true);
  g.fillStyle(0x120c09).fillPoints([{x:-54,y:42},{x:-56,y:10},{x:-49,y:-20},{x:-34,y:-39},{x:-12,y:-47},{x:17,y:-46},{x:38,y:-35},{x:51,y:-13},{x:56,y:16},{x:52,y:42}],true);
  g.fillStyle(0x634329).fillRect(-71,-44,18,11).fillRect(-57,-56,20,10).fillRect(-34,-63,20,9).fillRect(-11,-65,22,8).fillRect(15,-62,20,9).fillRect(39,-53,20,10).fillRect(56,-37,17,11);
  g.fillStyle(0xa17a4b).fillRect(-62,-49,13,3).fillRect(-31,-57,15,3).fillRect(4,-58,13,3).fillRect(43,-47,13,3);
  c.add(g);
  const board=this.add.graphics();board.fillStyle(0x372518).fillRect(-67,48,134,23);board.fillStyle(0x765435).fillRect(-66,48,132,3);board.fillStyle(0x24170f).fillRect(-65,68,130,3);c.add(board);
  c.add(this.add.text(0,53,level.sign,{fontFamily:'monospace',fontSize:'13px',fontStyle:'bold',color:'#ead7b4'}).setOrigin(.5));
  c.add(this.add.text(0,84,level.title,{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#f0dfc0',stroke:'#25180f',strokeThickness:4}).setOrigin(.5));
  const rim=this.add.graphics();rim.lineStyle(2,0xd0ad79,0.55).strokePoints([{x:-76,y:42},{x:-78,y:9},{x:-66,y:-32},{x:-43,y:-55},{x:-15,y:-70},{x:22,y:-68},{x:55,y:-49},{x:73,y:-18},{x:79,y:18},{x:76,y:43}],true);c.add(rim);c.rim=rim;
  c.setSize(168,132).setInteractive(new Phaser.Geom.Rectangle(-84,-67,168,134),Phaser.Geom.Rectangle.Contains);
  c.on('pointerover',()=>{this.selected=index;this.refreshSelection()});
  c.on('pointerdown',()=>{this.selected=index;this.refreshSelection()});
  return c;
 }

 makeDigFrames(){
  // Build three transparent digging poses from the same embedded badger art.
  const source=this.textures.get('badger').getSourceImage();
  const canvas=document.createElement('canvas');canvas.width=150;canvas.height=48;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const angles=[0,-0.2,-0.42],sinks=[0,3,8];
  for(let i=0;i<3;i++){
   ctx.save();ctx.translate(i*50+25,22+sinks[i]);ctx.rotate(angles[i]);
   ctx.drawImage(source,i*50,0,50,48,-22,-22,44,42);ctx.restore();
   if(i>0){ctx.fillStyle='#75502f';ctx.fillRect(i*50+3,34,44,i===1?6:12);ctx.fillStyle='#9a7145';ctx.fillRect(i*50+8,33,34,3)}
  }
  const tex=this.textures.addCanvas('badger-dig',canvas);
  tex.add(0,0,0,0,50,48);tex.add(1,0,50,0,50,48);tex.add(2,0,100,0,50,48);
 }

 makeFooter(){
  const panel=this.add.graphics().setDepth(8);panel.fillStyle(0x1c140f,0.98).fillRect(0,514,W,86);panel.fillStyle(0x77502e).fillRect(0,514,W,4);panel.fillStyle(0x342318).fillRect(0,522,W,2);
  this.footerTitle=this.add.text(25,532,'Choose a tunnel',{fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#ead7b4'}).setDepth(9);
  this.footerHint=this.add.text(25,555,'WASD / arrows: move     E: enter nearby tunnel     Click a tunnel to select',{fontFamily:'monospace',fontSize:'11px',color:'#c6b193'}).setDepth(9);
  this.add.text(817,548,'ENTER TUNNEL  ›',{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#ead7b4',backgroundColor:'#49311f',padding:{x:12,y:10}}).setOrigin(.5).setDepth(10);
  this.add.rectangle(817,548,184,50,0xffffff,.001).setDepth(11).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.enterSelected());
 }

 refreshSelection(){
  const level=LEVELS[this.selected];
  if(this.footerTitle){this.footerTitle.setText(level.title);this.footerHint.setText(level.description+'   ·   E or ENTER to play')}
  this.tunnels?.forEach((t,i)=>t.rim.setAlpha(i===this.selected ? .9 : .22));
 }

 enterSelected(){
  if(this.isEntering)return;this.isEntering=true;
  const level=LEVELS[this.selected];this.badger.play('badger-dig',true).setDepth(12);
  for(let i=0;i<10;i++){
   const dirt=this.add.rectangle(this.badger.x+Phaser.Math.Between(-22,22),this.badger.y+14,Phaser.Math.Between(4,8),Phaser.Math.Between(4,8),i%2?0x805c38:0xb18a55).setDepth(13);
   this.tweens.add({targets:dirt,x:dirt.x+Phaser.Math.Between(-35,35),y:dirt.y-Phaser.Math.Between(12,36),alpha:0,duration:480,delay:i*22,onComplete:()=>dirt.destroy()});
  }
  this.add.text(W/2,486,'BUCKY IS DIGGING…',{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#e2cfab',backgroundColor:'#211810',padding:{x:9,y:6}}).setOrigin(.5).setDepth(14);
  this.time.delayedCall(850,()=>{window.location.href=level.href});
 }

 update(){
  if(this.isEntering)return;
  let dx=0,dy=0;
  if(this.keys.LEFT.isDown||this.keys.A.isDown||this.moveHeld.has('left'))dx--;
  if(this.keys.RIGHT.isDown||this.keys.D.isDown||this.moveHeld.has('right'))dx++;
  if(this.keys.UP.isDown||this.keys.W.isDown||this.moveHeld.has('up'))dy--;
  if(this.keys.DOWN.isDown||this.keys.S.isDown||this.moveHeld.has('down'))dy++;
  if(dx||dy){this.badger.play('badger-walk',true);this.badger.x=Phaser.Math.Clamp(this.badger.x+dx*3.2,160,800);this.badger.y=Phaser.Math.Clamp(this.badger.y+dy*3.2,196,493);this.badger.setFlipX(dx<0)}else this.badger.play('badger-idle',true);
  let near=-1,best=Infinity;
  LEVELS.forEach((level,i)=>{const d=Phaser.Math.Distance.Between(this.badger.x,this.badger.y,level.x,level.y+59);if(d<best){best=d;near=i}});
  if(near>=0&&best<130&&this.selected!==near){this.selected=near;this.refreshSelection()}
  if(Phaser.Input.Keyboard.JustDown(this.keys.E)||Phaser.Input.Keyboard.JustDown(this.keys.ENTER)||Phaser.Input.Keyboard.JustDown(this.keys.SPACE))this.enterSelected();
  this.tunnels.forEach((t,i)=>t.rim.setAlpha(i===this.selected ? .68+.22*Math.sin(this.time.now/180) : .2));
 }
}

new Phaser.Game({type:Phaser.AUTO,parent:'game',width:W,height:H,pixelArt:true,backgroundColor:'#17100d',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Burrow]});
