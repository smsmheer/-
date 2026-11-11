'use strict';
/* ===== أدوات مساعدة ===== */
var $=function(id){return document.getElementById(id)};
var clamp=function(v,a,b){return v<a?a:(v>b?b:v)};
var rand=function(a,b){return a+Math.random()*(b-a)};
var irand=function(a,b){return Math.floor(rand(a,b+1))};

/* ===== التخزين ===== */
var store={
 get:function(k,d){try{var v=localStorage.getItem('sb_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
 set:function(k,v){try{localStorage.setItem('sb_'+k,JSON.stringify(v))}catch(e){}}
};

/* ===== الصوت ===== */
var ac=null;
function A(){if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(ac&&ac.state==='suspended'){ac.resume()}return ac}
function tone(f0,f1,dur,type,vol,when){var c=A();if(!c||!S.sound)return;dur=dur||0.15;type=type||'sine';vol=vol||0.2;when=when||0;var t=c.currentTime+when;var o=c.createOscillator();var g=c.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(1,f0),t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+0.05)}
function noiseS(dur,vol,fq,when){var c=A();if(!c||!S.sound)return;dur=dur||0.3;vol=vol||0.25;fq=fq||1000;when=when||0;var t=c.currentTime+when;var len=Math.max(1,Math.floor(c.sampleRate*dur));var b=c.createBuffer(1,len,c.sampleRate);var d=b.getChannelData(0);for(var i=0;i<len;i++){d[i]=Math.random()*2-1}var s=c.createBufferSource();s.buffer=b;var f=c.createBiquadFilter();f.type='bandpass';f.Q.value=0.8;f.frequency.setValueAtTime(fq,t);f.frequency.exponentialRampToValueAtTime(Math.max(40,fq*0.25),t+dur);var g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(g);g.connect(c.destination);s.start(t)}
var SFX={
 jump:function(){tone(280,640,0.18,'sine',0.25)},
 djump:function(){tone(430,920,0.18,'sine',0.25)},
 collect:function(){tone(880,1500,0.09,'triangle',0.22);tone(1320,1900,0.1,'triangle',0.14,0.06)},
 hit:function(){tone(220,60,0.32,'sawtooth',0.3);noiseS(0.22,0.22,420)},
 nitro:function(){noiseS(0.65,0.32,2600);tone(180,880,0.5,'sawtooth',0.11)},
 shoot:function(){tone(720,170,0.09,'square',0.25)},
 pop:function(){tone(500,900,0.12,'square',0.2);noiseS(0.1,0.15,3000)},
 win:function(){var n=[523,659,784,1046];for(var i=0;i<n.length;i++){tone(n[i],n[i],0.17,'triangle',0.25,i*0.13)}},
 lose:function(){var n=[392,311,262,196];for(var i=0;i<n.length;i++){tone(n[i],n[i]*0.8,0.22,'sawtooth',0.2,i*0.16)}},
 unlock:function(){var n=[660,880,1174];for(var i=0;i<n.length;i++){tone(n[i],n[i],0.13,'triangle',0.24,i*0.1)}},
 click:function(){tone(600,820,0.06,'square',0.13)}
};

/* ===== موسيقى بسيطة (لحن إيقاعي مبهج) ===== */
var MEL_MENU=[392,440,392,330,392,494,440,0,392,440,523,494,440,392,330,0];
var MEL_GAME=[523,0,659,0,587,0,659,784,523,0,659,0,880,0,784,659,587,0,698,0,659,0,587,659,523,0,392,0,440,494,523,0];
var mStep=0,mNext=0,mOn=false;
function musicTick(){if(!mOn)return;if(!S.music){mOn=false;return}var c=ac;if(c&&c.state==='running'){if(mNext<c.currentTime-0.5){mNext=c.currentTime+0.05}while(mNext<c.currentTime+0.25){var mel=(G.state==='play')?MEL_GAME:MEL_MENU;var f=mel[mStep%mel.length];if(f){var v=(G.state==='play')?0.09:0.07;tone(f,f,0.17,'triangle',v,mNext-c.currentTime);if(G.state==='play'&&mStep%4===0){tone(f/2,f/2,0.2,'sine',0.08,mNext-c.currentTime)}}mStep++;mNext+=0.21}}requestAnimationFrame(musicTick)}
function startMusic(){if(mOn)return;mOn=true;mNext=0;musicTick()}

/* ===== الشخصيات (بتتفتح بأطباق القريش) ===== */
var CHARS=[
 {id:'bateekh',em:'🍉',name:'البطيخة',desc:'البطل الأصلي… بيجرى في الحارة بكل حب',cost:0},
 {id:'strawb',em:'🍓',name:'الفراولة',desc:'نطتين ورا بعض (Double Jump)',cost:15},
 {id:'mango',em:'🥭',name:'المانجو',desc:'طبقين جبنة قريش بدل طبق واحد (Double Score)',cost:30},
 {id:'cucumb',em:'🥒',name:'الخيار',desc:'نيترو خارق بصوت التوكتوك (Nitro Speed)',cost:50},
 {id:'tomato',em:'🍅',name:'الطماطم',desc:'بيضرب بذور زي الرصاص (Shooter)',cost:75}
];

/* ===== الإعدادات والحالة ===== */
var S={sound:store.get('sound',true),music:store.get('music',true),quality:store.get('quality',true)};
var G={state:'menu',bank:store.get('bank',0),unlocked:store.get('unlocked',['bateekh']),char:store.get('char','bateekh'),plates:0,hearts:3,time:60,speed:6,dist:0,nitro:0,nitroCd:0,shake:0};

/* ===== الكانفس ===== */
var cvs=$('game'),ctx=cvs.getContext('2d');
var LW=960,LH=540,GY=440;
var scl=1,ox=0,oy=0,dpr=1;
function resize(){dpr=(S.quality&&window.devicePixelRatio)?Math.min(2,window.devicePixelRatio):1;cvs.width=Math.floor(window.innerWidth*dpr);cvs.height=Math.floor(window.innerHeight*dpr);var cw=cvs.width/dpr,ch=cvs.height/dpr;scl=Math.min(cw/LW,ch/LH);ox=(cw-LW*scl)/2;oy=(ch-LH*scl)/2}
window.addEventListener('resize',resize);resize();
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

/* ===== الكيانات ===== */
var player=null,enemy=null,obstacles=[],platesArr=[],shots=[],parts=[];
var shootCd=0,obIn=380,plIn=220,enemyIn=8;

/* ===== مبانى مولّدة للخلفية ===== */
var farB=[],midB=[];
(function(){var x=0;while(x<LW*2+200){var w=irand(90,170),h=irand(120,230);farB.push({x:x,w:w,h:h,win:irand(3,6)});x+=w+irand(10,40)}})();
(function(){var x=0;while(x<LW*2+200){var w=irand(120,220),h=irand(180,300);var laundry=[];var n=irand(2,4);for(var i=0;i<n;i++){laundry.push({dx:rand(24,w-40),dy:rand(-8,8),c:['#e74c3c','#3498db','#f1c40f','#ecf0f1','#e67e22'][irand(0,4)],w:rand(14,26),h:rand(16,28)})}midB.push({x:x,w:w,h:h,laundry:laundry,win:irand(3,7)});x+=w+irand(30,80)}})();

/* ===== الرسم: السماء ===== */
function cloud(x,y){ctx.beginPath();ctx.arc(x,y,22,0,7);ctx.arc(x+24,y+6,18,0,7);ctx.arc(x-24,y+7,16,0,7);ctx.fill()}
function drawSky(t){
 var g=ctx.createLinearGradient(0,0,0,LH);
 g.addColorStop(0,'#3b2a63');g.addColorStop(0.45,'#a04a7a');g.addColorStop(0.75,'#ff9a5a');g.addColorStop(1,'#ffc46b');
 ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
 ctx.fillStyle='rgba(255,220,130,0.25)';ctx.beginPath();ctx.arc(LW*0.72,120,70,0,7);ctx.fill();
 ctx.fillStyle='rgba(255,230,140,0.95)';ctx.beginPath();ctx.arc(LW*0.72,120,46,0,7);ctx.fill();
 if(S.quality){ctx.fillStyle='rgba(255,205,205,0.35)';for(var i=0;i<3;i++){var cx=((t*9+i*400)%(LW+320))-160;cloud(cx,55+i*42)}}
}
function drawFar(){
 var off=(G.dist*0.22)%LW;
 ctx.fillStyle='#5a3a6e';
 for(var i=0;i<farB.length;i++){var b=farB[i];var x=b.x-off;if(x+b.w<0||x>LW)continue;ctx.fillRect(x,GY-b.h,b.w,b.h);
  if(S.quality){ctx.fillStyle='rgba(255,230,150,0.45)';for(var k=0;k<b.win;k++){ctx.fillRect(x+10+(k%3)*24,GY-b.h+16+Math.floor(k/3)*36,10,14)}ctx.fillStyle='#5a3a6e'}}
}
function drawMid(){
 var off=(G.dist*0.55)%LW;
 for(var i=0;i<midB.length;i++){var b=midB[i];var x=b.x-off;if(x+b.w<-60||x>LW+60)continue;
  ctx.fillStyle='#8e5a4a';ctx.fillRect(x,GY-b.h,b.w,b.h);
  ctx.fillStyle='#7a4a3d';ctx.fillRect(x,GY-b.h,b.w,8);
  for(var k=0;k<b.win;k++){var wx=x+14+(k%3)*((b.w-28)/3),wy=GY-b.h+22+Math.floor(k/3)*52;
   ctx.fillStyle='#ffe9a8';ctx.fillRect(wx,wy,20,26);
   ctx.strokeStyle='#4a2c22';ctx.lineWidth=3;ctx.strokeRect(wx,wy,20,26);
   ctx.beginPath();ctx.moveTo(wx,wy+13);ctx.lineTo(wx+20,wy+13);ctx.stroke();
   if(S.quality){ctx.fillStyle='#4a2c22';ctx.fillRect(wx-4,wy+28,28,4);ctx.fillRect(wx-2,wy+32,3,10);ctx.fillRect(wx+19,wy+32,3,10)}}
  if(S.quality){for(var l=0;l<b.laundry.length;l++){var ld=b.laundry[l];var lx=x+ld.dx,ly=GY-b.h+10+ld.dy;
   ctx.strokeStyle='#e8e8e8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(lx-16,ly);ctx.lineTo(lx+16,ly);ctx.stroke();
   ctx.fillStyle=ld.c;ctx.fillRect(lx-ld.w/2,ly,ld.w,ld.h)}}
 }
}
function chair(x,y,c){ctx.strokeStyle=c;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-30);ctx.moveTo(x+24,y);ctx.lineTo(x+24,y-30);ctx.moveTo(x,y-30);ctx.lineTo(x+24,y-30);ctx.stroke();ctx.fillStyle=c;rr(x-5,y-62,9,34,3);ctx.fill()}
function toktok(x,t){
 ctx.save();ctx.translate(x,GY);
 ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(70,12,80,10,0,0,7);ctx.fill();
 ctx.fillStyle='#27ae60';rr(0,-64,120,50,12);ctx.fill();ctx.strokeStyle='#145a32';ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle='#1e8449';rr(14,-94,72,36,10);ctx.fill();ctx.stroke();
 ctx.fillStyle='#bfefff';rr(20,-88,60,24,6);ctx.fill();
 ctx.save();ctx.shadowColor='#00ffe0';ctx.shadowBlur=18;ctx.fillStyle='#00ffe0';ctx.fillRect(10,-70,100,5);ctx.restore();
 ctx.fillStyle='#222';var ws=[22,70,104];for(var i=0;i<3;i++){ctx.beginPath();ctx.arc(ws[i],-8,13,0,7);ctx.fill()}
 ctx.fillStyle='#999';for(var j=0;j<3;j++){ctx.beginPath();ctx.arc(ws[j],-8,5,0,7);ctx.fill()}
 ctx.save();ctx.shadowColor='#fff7b0';ctx.shadowBlur=24;ctx.fillStyle='#fff7b0';ctx.beginPath();ctx.arc(118,-40,7,0,7);ctx.fill();ctx.restore();
 ctx.restore();
}
function drawCafe(){
 var off=(G.dist*0.8)%(LW+520);
 var x=LW*0.82-off;
 if(x>-420&&x<LW+60){
  ctx.fillStyle='#6d4423';ctx.fillRect(x,GY-170,300,170);
  ctx.fillStyle='#54331a';ctx.fillRect(x,GY-170,300,14);
  ctx.fillStyle='#ffd24a';rr(x+60,GY-152,180,38,8);ctx.fill();ctx.strokeStyle='#7a4a12';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#7a2c1a';ctx.font='900 20px Tahoma';ctx.textAlign='center';ctx.fillText('قهوة الحارة ☕',x+150,GY-126);
  ctx.fillStyle='#3a2413';ctx.fillRect(x+125,GY-92,55,92);
  ctx.fillStyle='#ffe9a8';ctx.fillRect(x+30,GY-112,70,60);ctx.strokeStyle='#3a2413';ctx.lineWidth=3;ctx.strokeRect(x+30,GY-112,70,60);
  chair(x+216,GY,'#e74c3c');chair(x+256,GY,'#2980b9');
  ctx.fillStyle='#f4c531';ctx.fillRect(x+20,GY-46,54,46);ctx.fillRect(x+26,GY-88,48,42);
  ctx.fillStyle='#c0392b';ctx.font='900 12px Tahoma';ctx.fillText('شاي',x+50,GY-68);ctx.fillText('العروسة',x+49,GY-22);
 }
 var tx=LW*0.28-((G.dist*0.7)%(LW+700))*0.55;
 if(tx>-260&&tx<LW+60){toktok(tx)}
}
function drawGround(){
 ctx.fillStyle='#4b4b55';ctx.fillRect(0,GY,LW,LH-GY);
 ctx.fillStyle='#5c5c66';ctx.fillRect(0,GY,LW,10);
 ctx.fillStyle='#3c3c44';ctx.fillRect(0,GY+44,LW,3);
 ctx.fillStyle='#f7e08a';var off=G.dist%90;for(var x=-off;x<LW;x+=90){ctx.fillRect(x,GY+62,44,6)}
}

/* ===== رسم: العناصر ===== */
function drawObstacles(){
 for(var i=0;i<obstacles.length;i++){var o=obstacles[i];
  if(o.type==='pit'){
   ctx.fillStyle='#20202a';ctx.beginPath();ctx.ellipse(o.x+o.w/2,GY+16,o.w/2,13,0,0,7);ctx.fill();
   ctx.fillStyle='rgba(120,180,255,0.35)';ctx.beginPath();ctx.ellipse(o.x+o.w/2,GY+13,o.w/2-8,6,0,0,7);ctx.fill();
   ctx.fillStyle='#3a3a44';ctx.fillRect(o.x-3,GY-2,6,10);ctx.fillRect(o.x+o.w-3,GY-2,6,10);
  }else{
   ctx.fillStyle='#e8c33a';ctx.beginPath();ctx.moveTo(o.x,GY);ctx.quadraticCurveTo(o.x+o.w/2,GY-o.h,o.x+o.w,GY);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#8a6d1a';ctx.lineWidth=2;ctx.stroke();
   ctx.fillStyle='#3a3a44';ctx.fillRect(o.x+8,GY-12,10,6);ctx.fillRect(o.x+26,GY-18,10,6);ctx.fillRect(o.x+44,GY-12,10,6);
  }}
}
var PLSP=[[-6,-1],[0,2],[5,-2],[2,0],[-2,2]];
function drawPlate(p,t){
 var y=p.y+Math.sin(t*3+p.ph)*3;
 ctx.save();ctx.translate(p.x,y);
 ctx.fillStyle='rgba(0,0,0,0.15)';ctx.beginPath();ctx.ellipse(0,15,16,4,0,0,7);ctx.fill();
 ctx.fillStyle='#fdfdfd';ctx.beginPath();ctx.ellipse(0,0,18,9,0,0,7);ctx.fill();ctx.strokeStyle='#d8d8d8';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#fffbe8';ctx.beginPath();ctx.ellipse(0,0,12,6,0,0,7);ctx.fill();
 ctx.fillStyle='#4c944c';for(var i=0;i<PLSP.length;i++){ctx.beginPath();ctx.arc(PLSP[i][0],PLSP[i][1],1.1,0,7);ctx.fill()}
 ctx.restore();
}
function drawPlayer(t){
 var p=player;var bob=(p.y>=GY-1)?Math.sin(p.runT*0.35)*3:0;
 ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(p.x,GY+8,26,6,0,0,7);ctx.fill();
 ctx.save();ctx.translate(p.x,p.y+bob);
 if(p.inv>0&&Math.floor(t*20)%2===0){ctx.globalAlpha=0.4}
 ctx.rotate(clamp(p.vy*0.02,-0.25,0.35));
 ctx.fillStyle='#2e7d32';var st=Math.sin(p.runT*0.35);
 ctx.fillRect(-16+st*6,-6,12,8);ctx.fillRect(6-st*6,-6,12,8);
 var r=30;
 ctx.beginPath();ctx.moveTo(-r,0);ctx.arc(0,0,r,Math.PI,0);ctx.closePath();
 ctx.fillStyle='#2e9e4f';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#1d6b35';ctx.stroke();
 ctx.beginPath();ctx.moveTo(-r+6,0);ctx.arc(0,-2,r-6,Math.PI,0);ctx.closePath();
 ctx.fillStyle='#ff5a66';ctx.fill();
 ctx.fillStyle='#33222a';var seeds=[[-12,-14],[4,-20],[14,-10],[-2,-8]];
 for(var i=0;i<seeds.length;i++){ctx.beginPath();ctx.ellipse(seeds[i][0],seeds[i][1],2.4,3.6,0.3,0,7);ctx.fill()}
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(2,-22,6,0,7);ctx.arc(18,-22,6,0,7);ctx.fill();
 ctx.fillStyle='#222';ctx.beginPath();ctx.arc(4,-22,2.6,0,7);ctx.arc(20,-22,2.6,0,7);ctx.fill();
 ctx.strokeStyle='#7a1f2b';ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(11,-14,7,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
 ctx.fillStyle='rgba(255,150,150,0.6)';ctx.beginPath();ctx.arc(-2,-14,3.4,0,7);ctx.fill();
 ctx.restore();
}
function drawEnemy(t){
 var e=enemy;if(!e)return;
 ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(e.x,GY+8,24,6,0,0,7);ctx.fill();
 ctx.save();ctx.translate(e.x,e.y-24);
 var sq=1+Math.sin(e.t*0.4)*0.06;ctx.scale(1/sq,sq);
 ctx.beginPath();ctx.arc(0,0,26,0,7);ctx.fillStyle='#e8c07a';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#a97f3c';ctx.stroke();
 ctx.save();ctx.beginPath();ctx.arc(0,0,26,0,7);ctx.clip();ctx.strokeStyle='rgba(160,110,50,0.55)';ctx.lineWidth=1.6;
 for(var i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*11,-26);ctx.quadraticCurveTo(i*11+6,0,i*11,26);ctx.stroke();ctx.beginPath();ctx.moveTo(-26,i*11);ctx.quadraticCurveTo(0,i*11+6,26,i*11);ctx.stroke()}
 ctx.restore();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-9,-6,6,0,7);ctx.arc(9,-6,6,0,7);ctx.fill();
 ctx.fillStyle='#222';ctx.beginPath();ctx.arc(-7,-6,2.6,0,7);ctx.arc(11,-6,2.6,0,7);ctx.fill();
 ctx.strokeStyle='#7a4a12';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-14,-14);ctx.lineTo(-4,-10);ctx.moveTo(14,-14);ctx.lineTo(4,-10);ctx.stroke();
 ctx.fillStyle='#7a2c1a';ctx.beginPath();ctx.ellipse(2,9,7,5+Math.sin(e.t*0.6)*1.5,0,0,7);ctx.fill();
 ctx.restore();
 var gap=player?player.x-e.x:999;
 if(gap<260&&S.quality&&player){ctx.fillStyle='#9adcff';ctx.beginPath();ctx.ellipse(e.x+20,e.y-54+Math.sin(t*6)*3,3,5,0.3,0,7);ctx.fill()}
}
function drawShots(){
 for(var i=0;i<shots.length;i++){var s=shots[i];
  ctx.fillStyle='#c0392b';ctx.beginPath();ctx.ellipse(s.x,s.y,8,4,0,0,7);ctx.fill();
  ctx.fillStyle='#7fb069';ctx.beginPath();ctx.ellipse(s.x+6,s.y,3,2,0,0,7);ctx.fill()}
}
function drawParts(){
 for(var i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,4,0,7);ctx.fill()}
 ctx.globalAlpha=1;
}

/* ===== اللعب ===== */
function burst(x,y,c,n){if(!S.quality){n=Math.min(n,4)}for(var i=0;i<n;i++){parts.push({x:x,y:y,vx:rand(-3,3),vy:rand(-6,-1),life:1,c:c})}}
function updateParts(dt){
 for(var i=parts.length-1;i>=0;i--){var p=parts[i];p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vy+=0.15*dt*60;p.life-=dt;if(p.life<=0){parts.splice(i,1)}}
}
function spawnObstacle(){
 if(Math.random()<0.5){obstacles.push({type:'pit',x:LW+80,w:rand(64,100)})}
 else{obstacles.push({type:'bump',x:LW+80,w:62,h:28})}
}
function spawnPlates(){
 var kind=irand(0,2);
 if(kind===0){var n=irand(3,5);for(var i=0;i<n;i++){platesArr.push({x:LW+80+i*46,y:GY-52,ph:rand(0,6)})}}
 else if(kind===1){for(var j=0;j<5;j++){platesArr.push({x:LW+80+j*52,y:GY-40-Math.sin(j/4*Math.PI)*130,ph:rand(0,6)})}}
 else{for(var k=0;k<4;k++){platesArr.push({x:LW+80+k*48,y:GY-200,ph:rand(0,6)})}}
}
function jump(){
 if(G.state!=='play'){return}
 var maxJ=(G.char==='strawb')?2:1;
 if(player.y>=GY-0.5&&player.vy===0){player.vy=-15.5;player.jumps=1;SFX.jump()}
 else if(player.jumps<maxJ){player.vy=-14;player.jumps++;SFX.djump();burst(player.x,player.y-10,'#ffb3c0',6)}
}
function shoot(){
 if(G.char!=='tomato'||G.state!=='play'||shootCd>0){return}
 shootCd=0.4;shots.push({x:player.x+26,y:player.y-30,vx:16});SFX.shoot();
}
function nitroGo(){
 if(G.char!=='cucumb'||G.state!=='play'||G.nitroCd>0||G.nitro>0){return}
 G.nitro=2.6;G.nitroCd=8;SFX.nitro();burst(player.x,player.y-20,'#b6ff9e',12);
}
function hit(from){
 if(player.inv>0||G.nitro>0){return}
 G.hearts--;player.inv=1.4;G.shake=14;SFX.hit();burst(player.x,player.y-20,'#ff6b6b',10);
 if(from==='enemy'&&enemy){enemy.x=player.x-430}
 updateHUD();
 if(G.hearts<=0){endGame(false)}
}
function startGame(){
 G.state='play';G.plates=0;G.hearts=3;G.time=60;G.dist=0;G.nitro=0;G.nitroCd=0;G.shake=0;
 player={x:220,y:GY,vy:0,jumps:0,runT:0,inv:0};
 obstacles=[];platesArr=[];shots=[];parts=[];enemy=null;enemyIn=rand(6,10);obIn=380;plIn=220;shootCd=0;
 hideAll();$('hud').classList.remove('hidden');updateHUD();
 startMusic();toast('اضغط في أي مكان للنط 👆 اجمع الجبنة وتجنب الحفر!');
}
function endGame(won){
 G.state='over';
 G.bank+=G.plates;store.set('bank',G.bank);
 if(won){SFX.win()}else{SFX.lose()}
 $('overTitle').textContent=won?'🎉 ألف مبروك! عدّيت المرحلة':'😵 الشمام كسبك!';
 $('overMsg').textContent=won?'البطيخة عدّت الحارة سليمة والجبنة اتجمعت':'بس متزعلش… جمعتك محفوظة، جرب تاني!';
 $('overPlates').textContent=G.plates;
 $('hud').classList.add('hidden');show('over');
 if(won){var cs=['#ffd76e','#ff6b81','#7CFC00','#6bcbff'];for(var i=0;i<40;i++){parts.push({x:rand(0,LW),y:rand(-120,0),vx:rand(-1,1),vy:rand(2,5),life:rand(1.5,3),c:cs[irand(0,3)]})}}
}
function update(dt){
 updateParts(dt);
 if(G.state!=='play'){return}
 G.time-=dt;
 if(G.time<=0){G.time=0;endGame(true);return}
 var spd=G.speed+Math.min(5,G.dist/4000);
 if(G.nitro>0){G.nitro-=dt;spd+=9}else{G.nitroCd=Math.max(0,G.nitroCd-dt)}
 G.dist+=spd*dt*60;
 player.runT+=dt*(8+spd);
 player.vy+=0.82*(dt*60);player.y+=player.vy*(dt*60);
 if(player.y>=GY){player.y=GY;if(player.vy>0){player.vy=0}player.jumps=0}
 player.inv=Math.max(0,player.inv-dt);shootCd=Math.max(0,shootCd-dt);
 obIn-=spd*dt*60;if(obIn<=0){spawnObstacle();obIn=rand(430,800)}
 plIn-=spd*dt*60;if(plIn<=0){spawnPlates();plIn=rand(250,430)}
 var i,o,p,s;
 for(i=obstacles.length-1;i>=0;i--){o=obstacles[i];o.x-=spd*dt*60;
  if(o.x<-160){obstacles.splice(i,1);continue}
  if(!o.dead){
   if(o.type==='pit'){
    if(player.y>=GY-1&&player.x+14>o.x&&player.x-14<o.x+o.w){o.dead=true;player.vy=-10;hit('pit')}
   }else if(!o.hit&&player.x+18>o.x&&player.x-18<o.x+o.w&&player.y>GY-o.h-6){o.hit=true;player.vy=-9;hit('bump')}
  }}
 for(i=platesArr.length-1;i>=0;i--){p=platesArr[i];p.x-=spd*dt*60;
  if(p.x<-60){platesArr.splice(i,1);continue}
  if(Math.abs(p.x-player.x)<34&&Math.abs(p.y-(player.y-26))<44){
   platesArr.splice(i,1);
   G.plates+=(G.char==='mango')?2:1;SFX.collect();burst(p.x,p.y,'#fff3b0',7);
  }}
 if(enemy){enemy.t+=dt;var gap=player.x-enemy.x;
  var boost=clamp((430-gap)/430,0,1)*5.2;
  enemy.x+=(spd*0.9+boost)*dt*60;
  if(gap<34&&player.y>GY-46){hit('enemy')}
  if(enemy&&enemy.x>player.x+40){enemy=null;enemyIn=rand(9,15)}
 }else{enemyIn-=dt;if(enemyIn<=0){enemy={x:player.x-560,t:0};toast('⚠️ الشمام بيجري وراك!')}}
 for(i=shots.length-1;i>=0;i--){s=shots[i];s.x+=s.vx*dt*60;
  if(s.x>LW+40){shots.splice(i,1);continue}
  if(enemy&&Math.abs(s.x-enemy.x)<30&&s.y>GY-80){
   burst(enemy.x,GY-30,'#e8c07a',14);enemy=null;enemyIn=rand(11,17);G.plates+=5;SFX.pop();toast('🎯 صفقت الشمام! +5 جبنة');shots.splice(i,1)}}
 updateHUD();
}
function updateHUD(){
 $('hudPlates').textContent='🧀 '+G.plates;
 $('hudTimer').textContent='⏱ '+Math.ceil(G.time);
 var h='';for(var i=0;i<3;i++){h+=(i<G.hearts)?'❤️':'🖤'}
 $('hudHearts').textContent=h;
 $('btnShoot').classList.toggle('hidden',G.char!=='tomato');
 $('btnNitro').classList.toggle('hidden',G.char!=='cucumb');
 $('btnNitro').textContent=(G.nitro>0)?'💨':((G.nitroCd>0)?'⏳':'⚡');
}
function render(t){
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle='#150b26';ctx.fillRect(0,0,cvs.width/dpr,cvs.height/dpr);
 ctx.setTransform(dpr*scl,0,0,dpr*scl,ox*dpr,oy*dpr);
 if(G.shake>0){G.shake=Math.max(0,G.shake-0.9);ctx.translate(rand(-G.shake,G.shake),rand(-G.shake,G.shake))}
 drawSky(t);drawFar();drawMid();drawGround();drawCafe();
 drawObstacles();
 for(var i=0;i<platesArr.length;i++){drawPlate(platesArr[i],t)}
 drawShots();drawEnemy(t);
 if(player){drawPlayer(t)}
 drawParts();
}

/* ===== واجهات ===== */
function show(id){['menu','chars','set','over'].forEach(function(s){$(s).classList.toggle('hidden',s!==id)});if(id==='menu'){$('menuBank').textContent=G.bank}}
function hideAll(){['menu','chars','set','over'].forEach(function(s){$(s).classList.add('hidden')})}
var toastEl=null,toastT=null;
function toast(msg){toastEl=toastEl||$('toast');toastEl.textContent=msg;toastEl.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(function(){toastEl.style.opacity=0},1900)}
function buildChars(){
 $('charBank').textContent=G.bank;
 var box=$('cards');box.innerHTML='';
 CHARS.forEach(function(ch){
  var unlocked=G.unlocked.indexOf(ch.id)>=0;
  var card=document.createElement('div');card.className='card'+(G.char===ch.id?' sel':'');
  var btn;
  if(unlocked){btn=(G.char===ch.id)?'<button disabled>✅ مختار</button>':'<button data-a="sel">اختيار</button>'}
  else{btn='<button data-a="unlock"'+((G.bank<ch.cost)?' disabled':'')+'>🔓 '+ch.cost+' 🧀</button>'}
  card.innerHTML='<div class="em">'+ch.em+'</div><div class="nm">'+ch.name+'</div><div class="ds">'+ch.desc+'</div>'+btn;
  var b=card.querySelector('button');
  if(b&&!b.disabled){b.addEventListener('click',function(){
   if(b.dataset.a==='unlock'){
    if(G.bank>=ch.cost){G.bank-=ch.cost;G.unlocked.push(ch.id);store.set('bank',G.bank);store.set('unlocked',G.unlocked);SFX.unlock();toast('🔓 اتفتحت '+ch.name+'! اختارها بقى');buildChars()}
   }else{G.char=ch.id;store.set('char',G.char);SFX.click();buildChars()}
  })}
  box.appendChild(card);
 });
}
function bindSw(id,key){
 var el=$(id);el.classList.toggle('on',S[key]);
 el.addEventListener('pointerdown',function(e){e.preventDefault();S[key]=!S[key];store.set(key,S[key]);el.classList.toggle('on',S[key]);SFX.click();if(key==='quality'){resize()}});
}
bindSw('swSound','sound');bindSw('swMusic','music');bindSw('swQual','quality');
function onBtn(id,fn){$(id).addEventListener('click',function(){A();fn()})}
onBtn('bPlay',function(){SFX.click();startMusic();startGame()});
onBtn('bChars',function(){SFX.click();buildChars();show('chars')});
onBtn('bSet',function(){SFX.click();show('set')});
onBtn('bQuit',function(){SFX.click();if(window.navigator&&navigator.app&&navigator.app.exitApp){navigator.app.exitApp()}else{toast('اقفل التبويب من المتصفح 🙂');try{window.close()}catch(e){}}});
onBtn('bCharsBack',function(){SFX.click();show('menu')});
onBtn('bSetBack',function(){SFX.click();show('menu')});
onBtn('bAgain',function(){SFX.click();startGame()});
onBtn('bMenu2',function(){SFX.click();show('menu')});
onBtn('bReset',function(){SFX.click();if(confirm('متأكد إنك عايز تمسح كل التقدم؟')){['bank','unlocked','char'].forEach(function(k){try{localStorage.removeItem('sb_'+k)}catch(e){}});G.bank=0;G.unlocked=['bateekh'];G.char='bateekh';toast('اتمسح التقدم 🗑')}});
cvs.addEventListener('pointerdown',function(e){e.preventDefault();A();startMusic();jump()});
document.addEventListener('keydown',function(e){
 if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();A();startMusic();jump()}
 if(e.code==='KeyF'){shoot()}
 if(e.code==='KeyN'){nitroGo()}
});
$('btnShoot').addEventListener('pointerdown',function(e){e.preventDefault();shoot()});
$('btnNitro').addEventListener('pointerdown',function(e){e.preventDefault();nitroGo()});
document.addEventListener('touchmove',function(e){e.preventDefault()},{passive:false});
document.addEventListener('dblclick',function(e){e.preventDefault()});

/* ===== الحلقة الرئيسية ===== */
var last=0;
function loop(ts){
 var dt=Math.min(0.05,(ts-last)/1000||0.016);last=ts;
 update(dt);render(ts/1000);
 requestAnimationFrame(loop);
}
show('menu');
requestAnimationFrame(loop);
