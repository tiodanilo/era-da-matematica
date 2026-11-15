'use strict';
/* =========================================================
   Era da Matemática — código comum a todas as telas
   ========================================================= */

/* ===== Progresso salvo no navegador ===== */
const CHAVE_PROGRESSO = 'era-da-matematica-progresso';
function lerProgresso(){ try{ return JSON.parse(localStorage.getItem(CHAVE_PROGRESSO) || '{}') || {}; }catch(e){ return {}; } }
function salvarProgresso(k){ const p = lerProgresso(); p[k] = true; try{ localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(p)); }catch(e){} return p; }

/* ===== Sons e música (criados pelo próprio navegador, sem arquivos) ===== */
const Som = (()=>{
  let ac=null, mudo=false, musicaLigada=false, mestre=null, volMusica=null, timerMusica=null;
  try{ mudo = localStorage.getItem('era-da-matematica-som')==='0'; }catch(e){}
  function iniciar(){
    if(ac) { if(ac.state==='suspended') ac.resume(); return; }
    try{ ac=new (window.AudioContext||window.webkitAudioContext)(); mestre=ac.createGain(); mestre.gain.value=mudo?0:0.5; mestre.connect(ac.destination);
      volMusica=ac.createGain(); volMusica.gain.value=0.10; volMusica.connect(mestre); }catch(e){ ac=null; }
  }
  function nota(freq,dur,tipo,vol,quando,destino){
    if(!ac) return; const t=ac.currentTime+(quando||0), o=ac.createOscillator(), g=ac.createGain();
    o.type=tipo||'triangle'; o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol||0.2,t+0.012); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    o.connect(g); g.connect(destino||mestre); o.start(t); o.stop(t+dur+0.05);
  }
  function ruido(dur,vol,corte){
    if(!ac) return; const n=Math.floor(ac.sampleRate*dur), buf=ac.createBuffer(1,n,ac.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=buf; f.type='lowpass'; f.frequency.value=corte||600; g.gain.value=vol||0.3;
    s.connect(f); f.connect(g); g.connect(mestre); s.start();
  }
  const EF = {
    clique:()=>nota(700,0.05,'square',0.05),
    abrir:()=>{ nota(440,0.08,'triangle',0.1); nota(660,0.12,'triangle',0.1,0.06); },
    moedas:(n)=>{ n=n||4; for(let i=0;i<n;i++) nota(1150+Math.random()*800,0.12,'triangle',0.13,i*0.055); },
    bom:()=>[523,659,784].forEach((f,i)=>nota(f,0.22,'triangle',0.2,i*0.08)),
    ruim:()=>{ nota(247,0.22,'triangle',0.14); nota(208,0.3,'triangle',0.14,0.13); },
    tijolo:()=>{ ruido(0.14,0.35,350); nota(98,0.18,'sine',0.3); },
    chegou:()=>{ nota(392,0.18,'triangle',0.15); nota(523,0.25,'triangle',0.15,0.12); },
    etapa:()=>[523,659,784,1046].forEach((f,i)=>nota(f,0.4,'triangle',0.22,i*0.12)),
    vitoria:()=>[392,523,659,784,659,784,1046].forEach((f,i)=>nota(f,0.45,'triangle',0.22,i*0.14)),
    plantar:()=>{ ruido(0.2,0.2,900); nota(330,0.15,'triangle',0.1,0.05); },
    carga:()=>nota(880,0.07,'sine',0.06)
  };
  // escala com sabor "egípcio" (lá frígio dominante)
  const ESCALA=[220,233.08,277.18,293.66,329.63,349.23,392,440];
  function frase(){
    if(!ac||!musicaLigada) return;
    for(let i=0;i<8;i++) if(Math.random()<0.7){ const f=ESCALA[Math.floor(Math.random()*ESCALA.length)]*(Math.random()<0.25?2:1); nota(f,0.7,'triangle',0.32,i*0.45,volMusica); }
    nota(110,3.7,'sine',0.45,0,volMusica); nota(164.81,3.7,'sine',0.18,0,volMusica);
    timerMusica=setTimeout(frase,3600);
  }
  return {
    iniciar,
    tocar(nome,...a){ iniciar(); if(ac&&!mudo&&EF[nome]) EF[nome](...a); },
    musica(ligar){ iniciar(); musicaLigada=ligar; clearTimeout(timerMusica); if(ligar) frase(); },
    alternarMudo(){ mudo=!mudo; try{ localStorage.setItem('era-da-matematica-som',mudo?'0':'1'); }catch(e){} if(mestre) mestre.gain.value=mudo?0:0.5; return mudo; },
    get mudo(){ return mudo; }
  };
})();
function botaoSom(el){ const r=()=>{ el.textContent=Som.mudo?'🔇 Som':'🔊 Som'; el.setAttribute('aria-label',Som.mudo?'Ligar o som':'Desligar o som'); }; r(); el.onclick=()=>{ Som.alternarMudo(); r(); }; }
document.addEventListener('pointerdown',()=>Som.iniciar(),{once:true});

/* ===== Hieróglifos numéricos (desenhados à mão) ===== */
const HIERO = {
  traco:'<svg viewBox="0 0 8 28" width="8" aria-hidden="true"><line x1="4" y1="5" x2="4" y2="24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  arco:'<svg viewBox="0 0 20 28" width="20" aria-hidden="true"><path d="M4 25V13a6 6 0 0 1 12 0v12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  rolo:'<svg viewBox="0 0 20 28" width="20" aria-hidden="true"><path d="M10 14a1.5 1.5 0 0 1 3 0a3 3 0 0 1 -6 0a4.5 4.5 0 0 1 9 0a6 6 0 0 1 -12 0v10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  lotus:'<svg viewBox="0 0 22 28" width="22" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"><path d="M11 27V14"/><path d="M11 14C8 10 9 5 11 2C13 5 14 10 11 14Z"/><path d="M11 14C7 13.5 4 10.5 3 6.5C6.5 7.5 9 10 11 14Z"/><path d="M11 14C15 13.5 18 10.5 19 6.5C15.5 7.5 13 10 11 14Z"/><path d="M11 22C8.5 22.5 6.5 21 5.5 19"/></g></svg>'
};
const VALOR = {lotus:1000, rolo:100, arco:10, traco:1};
const ORDEM = ['lotus','rolo','arco','traco'];
const NOME_SIMB = {lotus:'flor de lótus', rolo:'rolo de corda', arco:'arco', traco:'traço'};
function partes(n){ n = Math.max(0, Math.floor(n)); return {lotus:Math.floor(n/1000)%10, rolo:Math.floor(n/100)%10, arco:Math.floor(n/10)%10, traco:n%10}; }
const valorDe = q => ORDEM.reduce((s,t)=>s+(q[t]||0)*VALOR[t], 0);
function glifosHTML(q){
  if(typeof q === 'number') q = partes(q);
  let h = '';
  for(const t of ORDEM) for(let i=0;i<(q[t]||0);i++) h += `<span class="g">${HIERO[t]}</span>`;
  return h || '<span class="vazio">—</span>';
}

/* ===== Motor isométrico: desenha a vila ===== */
class Cena {
  constructor(canvas, N, folgaTopo){
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.N = N; this.folga = folgaTopo || 70;
    this.TW = 64; this.TH = 32; this.T = 0; this.flutuantes = []; this.particulas = [];
    this.barco = {x:-1.5, vel:0.35};
    this.passaros = [...Array(4)].map((_,i)=>({x:Math.random(), y:0.08+Math.random()*0.18, v:0.012+Math.random()*0.01, f:Math.random()*6}));
    this.ruido = []; let s = 7; for(let i=0;i<N*N*4;i++){ s=(s*16807)%2147483647; this.ruido.push(s/2147483647); }
    this.ajustar(); window.addEventListener('resize', ()=>this.ajustar());
  }
  ajustar(){
    const cv=this.cv; this.DPR = window.devicePixelRatio||1; this.W = cv.clientWidth; this.H = cv.clientHeight;
    cv.width = Math.round(this.W*this.DPR); cv.height = Math.round(this.H*this.DPR);
    this.escala = Math.min((this.W-20)/(this.N*this.TW+20), (this.H-this.folga-20)/(this.N*this.TH+60), 1.7);
    this.ox = this.W/2; this.oy = this.folga + Math.max(0, ((this.H-this.folga-10)-(this.N*this.TH)*this.escala)/2);
  }
  p(x,y){ return [(x-y)*this.TW/2, (x+y)*this.TH/2]; }
  inv(mx,my){ const a=mx/(this.TW/2), b=my/(this.TH/2); return [(a+b)/2,(b-a)/2]; }
  ptJogo(e){ const r=this.cv.getBoundingClientRect(); return [(e.clientX-r.left-this.ox)/this.escala, (e.clientY-r.top-this.oy)/this.escala]; }
  rr(x,y,k=0){ const L=this.ruido.length; return this.ruido[((((y*this.N+x)*4+k)%L)+L)%L]; }
  cor(r,g,b,f){ return `rgb(${Math.round(Math.min(255,r*f))},${Math.round(Math.min(255,g*f))},${Math.round(Math.min(255,b*f))})`; }
  losango(x,y,c){ const ctx=this.ctx; ctx.beginPath(); let q=this.p(x,y); ctx.moveTo(q[0],q[1]); q=this.p(x+1,y); ctx.lineTo(q[0],q[1]); q=this.p(x+1,y+1); ctx.lineTo(q[0],q[1]); q=this.p(x,y+1); ctx.lineTo(q[0],q[1]); ctx.closePath(); ctx.fillStyle=c; ctx.fill(); }
  poli(pts,c){ const ctx=this.ctx; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(const q of pts.slice(1)) ctx.lineTo(q[0],q[1]); ctx.closePath(); ctx.fillStyle=c; ctx.fill(); }
  contorno(r,c,larg,traco){ const ctx=this.ctx; const A=this.p(r.x,r.y),B=this.p(r.x+r.w,r.y),C=this.p(r.x+r.w,r.y+r.d),D=this.p(r.x,r.y+r.d);
    ctx.setLineDash(traco||[]); ctx.strokeStyle=c; ctx.lineWidth=larg; ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.lineTo(C[0],C[1]); ctx.lineTo(D[0],D[1]); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); }

  /* começa um quadro: céu e transformação */
  comecar(dt){
    this.T += dt; this._dt = dt; const ctx=this.ctx, w=this.cv.width, h=this.cv.height;
    ctx.setTransform(1,0,0,1,0,0);
    const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#f5d59c'); g.addColorStop(0.5,'#e2aa6c'); g.addColorStop(1,'#9a6438'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#d99d60'; ctx.beginPath(); ctx.moveTo(0,h*0.42); for(let x=0;x<=w;x+=w/8) ctx.quadraticCurveTo(x+w/16,h*0.36+(x%3)*6,x+w/8,h*0.42); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.fill();
    ctx.fillStyle='#c98a50'; ctx.beginPath(); ctx.moveTo(0,h*0.55); for(let x=0;x<=w;x+=w/6) ctx.quadraticCurveTo(x+w/12,h*0.49,x+w/6,h*0.55); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.fill();
    // sol e pássaros
    const sx=w*0.82, sy=h*0.2; const gs=ctx.createRadialGradient(sx,sy,0,sx,sy,h*0.22); gs.addColorStop(0,'rgba(255,240,190,.9)'); gs.addColorStop(0.25,'rgba(255,220,150,.35)'); gs.addColorStop(1,'rgba(255,220,150,0)');
    ctx.fillStyle=gs; ctx.fillRect(sx-h*0.22,sy-h*0.22,h*0.44,h*0.44);
    ctx.strokeStyle='rgba(70,45,25,.55)'; ctx.lineWidth=2*this.DPR; ctx.lineCap='round';
    for(const p of this.passaros){ p.x=(p.x+p.v*dt)%1.1; p.f+=dt*7; const px=p.x*w, py=p.y*h+Math.sin(p.f*0.3)*6*this.DPR, a=Math.sin(p.f)*4*this.DPR, s=7*this.DPR;
      ctx.beginPath(); ctx.moveTo(px-s,py-a); ctx.quadraticCurveTo(px-s/2,py-s/2-a/2,px,py); ctx.quadraticCurveTo(px+s/2,py-s/2-a/2,px+s,py-a); ctx.stroke(); }
    ctx.setTransform(this.DPR*this.escala,0,0,this.DPR*this.escala,this.DPR*this.ox,this.DPR*this.oy);
  }
  /* barco a vela descendo o rio (casas y entre 0 e 2) */
  desenharBarco(dt){
    const b=this.barco, N=this.N; b.x+=b.vel*dt; if(b.x>N+1.5) b.x=-1.5;
    if(b.x<0.3||b.x>N-0.3) return;
    const ctx=this.ctx, [sx,sy]=this.p(b.x,0.95), bal=Math.sin(this.T*2)*1.2;
    ctx.fillStyle='rgba(30,60,90,.25)'; ctx.beginPath(); ctx.ellipse(sx,sy+3,20,5,0.46,0,7); ctx.fill();
    ctx.save(); ctx.translate(sx,sy+bal); ctx.rotate(0.46);
    ctx.fillStyle='#6d441d'; ctx.beginPath(); ctx.moveTo(-20,-4); ctx.lineTo(20,-4); ctx.lineTo(14,3); ctx.lineTo(-14,3); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle='#4a2f16'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sx,sy-2+bal); ctx.lineTo(sx,sy-34+bal); ctx.stroke();
    ctx.fillStyle='#f4ecd8'; ctx.beginPath(); ctx.moveTo(sx+1,sy-33+bal); ctx.lineTo(sx+1,sy-6+bal); ctx.lineTo(sx+18,sy-9+bal); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(sx-26,sy+6); ctx.lineTo(sx-14,sy+5); ctx.stroke();
  }
  /* partículas: 'moeda', 'poeira', 'brilho', 'confete' */
  emitir(x,y,tipo,n){
    const [sx,sy]=this.p(x,y), cores={moeda:['#f2c14e','#e0a62e','#fff0a8'],poeira:['#c9a878','#b08e5e','#d8c09a'],brilho:['#fff7c8','#ffe17a'],confete:['#e0452b','#2f6fa0','#f2c14e','#3f7a26','#8a3a6a']}[tipo];
    for(let i=0;i<(n||12);i++){ const a=Math.random()*Math.PI*2, v=tipo==='poeira'?20+Math.random()*30:60+Math.random()*90;
      this.particulas.push({x:sx+(Math.random()-.5)*16, y:sy-20+(Math.random()-.5)*10, vx:Math.cos(a)*v*(tipo==='poeira'?1:0.6), vy:tipo==='poeira'?-10-Math.random()*20:-80-Math.random()*90,
        g:tipo==='poeira'?-10:tipo==='brilho'?40:220, vida:0, max:tipo==='poeira'?1.1:tipo==='brilho'?0.9:1.4, cor:cores[Math.floor(Math.random()*cores.length)], tipo, tam:tipo==='poeira'?6+Math.random()*6:3+Math.random()*3, rot:Math.random()*6}); }
  }
  desenharParticulas(dt){
    const ctx=this.ctx;
    for(let i=this.particulas.length-1;i>=0;i--){ const p=this.particulas[i]; p.vida+=dt; if(p.vida>p.max){ this.particulas.splice(i,1); continue; }
      p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=dt*8; const k=1-p.vida/p.max; ctx.globalAlpha=Math.max(0,Math.min(1,k*1.4));
      ctx.fillStyle=p.cor;
      if(p.tipo==='moeda'){ ctx.beginPath(); ctx.ellipse(p.x,p.y,p.tam,p.tam*Math.abs(Math.cos(p.rot)),0,0,7); ctx.fill(); }
      else if(p.tipo==='poeira'){ ctx.beginPath(); ctx.arc(p.x,p.y,p.tam*(1.6-k),0,7); ctx.fill(); }
      else if(p.tipo==='brilho'){ const s=p.tam*(0.6+k); ctx.beginPath(); ctx.moveTo(p.x,p.y-s*2); ctx.lineTo(p.x+s*0.5,p.y); ctx.lineTo(p.x,p.y+s*2); ctx.lineTo(p.x-s*0.5,p.y); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(p.x-s*2,p.y); ctx.lineTo(p.x,p.y+s*0.5); ctx.lineTo(p.x+s*2,p.y); ctx.lineTo(p.x,p.y-s*0.5); ctx.closePath(); ctx.fill(); }
      else { ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillRect(-p.tam,-p.tam/2,p.tam*2,p.tam); ctx.restore(); }
    }
    ctx.globalAlpha=1;
  }
  /* chão: tipo(x,y) devolve 'agua' | 'margem' | 'lama' | 'areia' */
  chao(tipo){
    const ctx=this.ctx, N=this.N, T=this.T;
    const BASE={agua:[74,138,196],margem:[128,156,78],lama:[136,104,66],areia:[230,200,140]};
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const t=tipo(x,y), b=BASE[t]; let f=0.94+this.rr(x,y)*0.1;
      if(t==='agua') f=(y===0?0.88:0.98)+Math.sin(T*1.2+x*0.8+y)*0.025;
      this.losango(x,y,this.cor(...b,f));
      if(t==='areia'){ ctx.fillStyle='rgba(150,105,55,.28)'; for(let k=1;k<3;k++){ const [sx,sy]=this.p(x+this.rr(x,y,k),y+this.rr(x,y,k+1)); ctx.fillRect(sx,sy,2,1.5); } }
      if(t==='lama'&&this.rr(x,y,3)>0.78){ const [sx,sy]=this.p(x+.5,y+.5); ctx.fillStyle='rgba(255,255,255,.07)'; ctx.beginPath(); ctx.ellipse(sx,sy,14,5,0,0,7); ctx.fill(); }
    }
    const esp=22;
    for(let x=0;x<N;x++){ const a=this.p(x,N),b=this.p(x+1,N); this.poli([a,b,[b[0],b[1]+esp],[a[0],a[1]+esp]],this.cor(...BASE[tipo(x,N-1)],0.62)); }
    for(let y=0;y<N;y++){ const a=this.p(N,y),b=this.p(N,y+1); this.poli([a,b,[b[0],b[1]+esp],[a[0],a[1]+esp]],this.cor(...BASE[tipo(N-1,y)],0.48)); }
    ctx.lineCap='round';
    for(let x=0;x<N;x++) if(tipo(x,2)==='margem') for(let k=0;k<2;k++){
      const [sx,sy]=this.p(x+0.25+0.5*k+this.rr(x,2,k)*0.2,2.2+this.rr(x,2,k+2)*0.3), h=13+this.rr(x,2,3)*6, bal=Math.sin(T*1.5+x+k)*1.5;
      ctx.strokeStyle='#4f7d2a'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+bal,sy-h); ctx.stroke();
      ctx.strokeStyle='#6f9a35'; ctx.lineWidth=1.2; ctx.beginPath(); for(let i=-2;i<=2;i++){ ctx.moveTo(sx+bal,sy-h); ctx.lineTo(sx+bal+i*2.6,sy-h-4+Math.abs(i)*1.2); } ctx.stroke();
    }
    ctx.lineWidth=1.6;
    for(let i=0;i<Math.round(N*2.3);i++){ const xx=(i*2.37+T*0.35)%N, yy=0.15+((i*0.618)%1)*1.7; const al=0.25+0.35*Math.max(0,Math.sin(T*2+i));
      const [sx,sy]=this.p(xx,yy); ctx.strokeStyle=`rgba(255,255,255,${al})`; ctx.beginPath(); ctx.moveTo(sx-6,sy); ctx.lineTo(sx+6,sy); ctx.stroke(); }
    if(tipo(0,0)==='agua') this.desenharBarco(this._dt||0);
  }
  /* campo de trigo (estado: 'crescendo' com k de 0 a 1, ou 'maduro') com cerca */
  campo(c, k, maduro){
    const ctx=this.ctx, T=this.T;
    for(let i=0;i<c.w;i++) for(let j=0;j<c.d;j++){ const f=0.95+this.rr(c.x+i,c.y+j)*0.08; this.losango(c.x+i,c.y+j, maduro?this.cor(206,164,62,f):this.cor(120+20*k,104+50*k,62,f)); }
    ctx.lineCap='round'; const cab=[];
    ctx.strokeStyle=maduro?'#b8861f':'#5f9a2e'; ctx.lineWidth=1.3; ctx.beginPath();
    for(let i=0;i<c.w;i++) for(let j=0;j<c.d;j++) for(let q=0;q<4;q++){
      const [sx,sy]=this.p(c.x+i+0.25+0.5*(q%2),c.y+j+0.25+0.5*(q>>1)), h=maduro?12:2+9*k, bal=Math.sin(T*2+(c.x+i)*0.7+(c.y+j)*0.3)*(maduro?1.6:0.6);
      for(const o of [-2.2,0,2.2]){ ctx.moveTo(sx+o,sy); ctx.lineTo(sx+o+bal,sy-h); if(maduro) cab.push([sx+o+bal,sy-h]); }
    }
    ctx.stroke(); ctx.fillStyle='#ecc75c'; for(const [x,y] of cab){ ctx.beginPath(); ctx.ellipse(x,y-1.5,1.4,3,0,0,7); ctx.fill(); }
    this.cerca(c);
  }
  cerca(c){
    const ctx=this.ctx; const A=this.p(c.x,c.y),B=this.p(c.x+c.w,c.y),C=this.p(c.x+c.w,c.y+c.d),D=this.p(c.x,c.y+c.d);
    ctx.strokeStyle='#7a5228'; ctx.lineWidth=1.6;
    for(const h of [4,8]){ ctx.beginPath(); ctx.moveTo(A[0],A[1]-h); ctx.lineTo(B[0],B[1]-h); ctx.lineTo(C[0],C[1]-h); ctx.lineTo(D[0],D[1]-h); ctx.closePath(); ctx.stroke(); }
    const pts=[]; for(let i=0;i<=c.w;i++){ pts.push([c.x+i,c.y],[c.x+i,c.y+c.d]); } for(let j=1;j<c.d;j++){ pts.push([c.x,c.y+j],[c.x+c.w,c.y+j]); }
    for(const [x,y] of pts){ const [sx,sy]=this.p(x,y); ctx.fillStyle='#5a3818'; ctx.fillRect(sx-1.5,sy-11,3,11); ctx.fillStyle='#9a7040'; ctx.fillRect(sx-1.5,sy-11,3,2); }
  }
  caixa(b,h,cores){ const A=this.p(b.x,b.y),B=this.p(b.x+b.w,b.y),C=this.p(b.x+b.w,b.y+b.d),D=this.p(b.x,b.y+b.d),up=q=>[q[0],q[1]-h];
    this.poli([D,C,up(C),up(D)],cores[0]); this.poli([C,B,up(B),up(C)],cores[1]); this.poli([up(A),up(B),up(C),up(D)],cores[2]); return {A,B,C,D,up}; }
  sombra(b){ const pts=[this.p(b.x,b.y),this.p(b.x+b.w,b.y),this.p(b.x+b.w,b.y+b.d),this.p(b.x,b.y+b.d)].map(q=>[q[0]+20,q[1]+5]); this.poli(pts,'rgba(70,40,10,.22)'); }
  cabana(b){
    const ctx=this.ctx; this.sombra(b);
    const k=this.caixa(b,32,['#d4b282','#b08e5e','#ead5aa']); const {A,B,C,D,up}=k, u5=q=>[q[0],q[1]-5];
    this.poli([D,C,u5(C),u5(D)],'#b8935f'); this.poli([C,B,u5(B),u5(C)],'#93734a');
    ctx.strokeStyle='#f6e7c6'; ctx.lineWidth=2; ctx.beginPath(); const t=[up(A),up(B),up(C),up(D)]; ctx.moveTo(t[0][0],t[0][1]); for(const q of t.slice(1)) ctx.lineTo(q[0],q[1]); ctx.closePath(); ctx.stroke();
    const mx=(D[0]+C[0])/2,my=(D[1]+C[1])/2;
    this.poli([[mx-8,my-4],[mx+8,my+4],[mx+8,my-18],[mx-8,my-26]],'#4a2f16');
    ctx.strokeStyle='#7a5a30'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(mx-11,my-28); ctx.lineTo(mx+11,my-17); ctx.stroke();
    for(const f of [0.3,0.7]){ const wx=C[0]+(B[0]-C[0])*f, wy=C[1]+(B[1]-C[1])*f; this.poli([[wx-4,wy-19],[wx+4,wy-23],[wx+4,wy-16],[wx-4,wy-12]],'#4a2f16'); }
    const toldo=[[b.x+0.15,b.y+0.15],[b.x+0.95,b.y+0.15],[b.x+0.95,b.y+0.95],[b.x+0.15,b.y+0.95]].map(([x,y])=>up(this.p(x,y)));
    ctx.strokeStyle='#6d441d'; ctx.lineWidth=2; ctx.beginPath(); for(const q of toldo){ ctx.moveTo(q[0],q[1]); ctx.lineTo(q[0],q[1]-13); } ctx.stroke();
    this.poli(toldo.map(q=>[q[0],q[1]-13]),'#c9a052');
  }
  silo(x,y,r,h,base){
    const ctx=this.ctx, [cx,cy0]=this.p(x,y), cy=cy0-base;
    const g=ctx.createLinearGradient(cx-r,0,cx+r,0); g.addColorStop(0,'#ecd09a'); g.addColorStop(0.55,'#cfa566'); g.addColorStop(1,'#9c7240');
    ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(cx-r,cy-h); ctx.lineTo(cx-r,cy); ctx.ellipse(cx,cy,r,r*0.5,0,Math.PI,0,true); ctx.lineTo(cx+r,cy-h); ctx.lineTo(cx,cy-h-r*1.3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(90,60,25,.45)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(cx,cy-h,r,r*0.45,0,0,Math.PI); ctx.stroke();
    ctx.fillStyle='#4a2f16'; ctx.fillRect(cx-3,cy-h*0.55,6,6);
  }
  /* celeiro: prog de 0 a 1 faz ele "subir" */
  celeiro(c, prog){
    prog = prog===undefined?1:prog; if(prog<=0) return;
    this.sombra(c); this.caixa(c,6*Math.min(1,prog*2),['#b8935f','#93734a','#d8bd8a']);
    if(prog>0.3){ const k=(prog-0.3)/0.7; for(const [dx,dy] of [[0.55,0.55],[1.45,0.6],[0.6,1.45],[1.45,1.45]]) this.silo(c.x+dx,c.y+dy,11,18*k,6); }
    if(prog<0.999){ // andaimes de madeira enquanto a obra não termina
      const ctx=this.ctx, h=46; ctx.strokeStyle='#8a5a2a'; ctx.lineWidth=2;
      const cantos=[[c.x,c.y],[c.x+c.w,c.y],[c.x+c.w,c.y+c.d],[c.x,c.y+c.d]].map(([x,y])=>this.p(x,y));
      ctx.beginPath(); for(const [sx,sy] of cantos){ ctx.moveTo(sx,sy); ctx.lineTo(sx,sy-h); }
      for(const alt of [h*0.45,h*0.9]){ ctx.moveTo(cantos[3][0],cantos[3][1]-alt); ctx.lineTo(cantos[2][0],cantos[2][1]-alt); ctx.lineTo(cantos[1][0],cantos[1][1]-alt); }
      ctx.moveTo(cantos[3][0],cantos[3][1]); ctx.lineTo(cantos[2][0],cantos[2][1]-h*0.45); ctx.stroke();
    }
  }
  palmeira(r){
    const ctx=this.ctx, T=this.T, [sx,sy]=this.p(r.x,r.y);
    ctx.fillStyle='rgba(70,40,10,.2)'; ctx.beginPath(); ctx.ellipse(sx+14,sy+3,18,6,0,0,7); ctx.fill();
    const alt=48, tx=sx+6, ty=sy-alt, bal=Math.sin(T*1.5+r.x)*1.5;
    ctx.lineCap='round'; ctx.strokeStyle='#8a5a2a'; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(sx-6,sy-alt/2,tx,ty); ctx.stroke();
    ctx.strokeStyle='#5e3a18'; ctx.lineWidth=1.2; ctx.beginPath();
    for(let i=1;i<7;i++){ const t=i/7, bx=(1-t)*(1-t)*sx+2*(1-t)*t*(sx-6)+t*t*tx, by=(1-t)*(1-t)*sy+2*(1-t)*t*(sy-alt/2)+t*t*ty; ctx.moveTo(bx-3.5,by); ctx.lineTo(bx+3.5,by-1); } ctx.stroke();
    const folha=(a,i)=>{ const ex=tx+Math.cos(a)*24+bal, ey=ty+Math.sin(a)*9+9, cx=tx+Math.cos(a)*14, cy=ty+Math.sin(a)*5-9;
      ctx.fillStyle=i%2?'#3f7622':'#4e8a2a'; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.quadraticCurveTo(cx,cy-3,ex,ey); ctx.quadraticCurveTo(cx,cy+4,tx,ty); ctx.fill(); };
    const angs=[...Array(8)].map((_,i)=>i/8*Math.PI*2+0.2);
    angs.forEach((a,i)=>{ if(Math.sin(a)<0) folha(a,i); });
    ctx.fillStyle='#b8641e'; for(const [dx,dy] of [[-3,4],[1,6],[4,4],[-1,8],[3,8]]){ ctx.beginPath(); ctx.arc(tx+dx,ty+dy,1.8,0,7); ctx.fill(); }
    angs.forEach((a,i)=>{ if(Math.sin(a)>=0) folha(a,i); });
  }
  /* pessoa: a = {x, y, andando, trabalhando, carga, tipoCarga}; balao = texto curto acima da cabeça */
  pessoa(a, roupa, opcoes){
    opcoes = opcoes||{}; const ctx=this.ctx, T=this.T;
    const [sx,sy0]=this.p(a.x,a.y), passo=a.andando?Math.sin(T*10):0, respira=a.andando?0:Math.sin(T*2.2+a.x*3)*0.7, sy=sy0-(a.andando?Math.abs(passo)*1.5:respira+0.7), pele=opcoes.pele||'#9a6234';
    ctx.fillStyle='rgba(70,40,10,.25)'; ctx.beginPath(); ctx.ellipse(sx+3,sy0+1,9,4,0,0,7); ctx.fill();
    if(opcoes.selecionado){ ctx.strokeStyle='#ffd23a'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(sx,sy0,12+Math.sin(T*4),6,0,0,7); ctx.stroke(); }
    ctx.lineCap='round'; ctx.strokeStyle=pele; ctx.lineWidth=3; ctx.beginPath();
    ctx.moveTo(sx-2,sy-10); ctx.lineTo(sx-2-passo*3,sy0); ctx.moveTo(sx+2,sy-10); ctx.lineTo(sx+2+passo*3,sy0); ctx.stroke();
    const longa=opcoes.longa, fim=longa?sy-4:sy-8;
    ctx.fillStyle=pele; ctx.beginPath(); ctx.moveTo(sx-4.5,sy-14); ctx.lineTo(sx+4.5,sy-14); ctx.lineTo(sx+4,sy-24); ctx.lineTo(sx-4,sy-24); ctx.closePath(); ctx.fill();
    ctx.fillStyle=roupa; ctx.beginPath(); ctx.moveTo(sx-5,sy-15); ctx.lineTo(sx+5,sy-15); ctx.lineTo(sx+7,fim); ctx.lineTo(sx-7,fim); ctx.closePath(); ctx.fill();
    if(longa) ctx.fillRect(sx-4.5,sy-24,9,10);
    ctx.strokeStyle=opcoes.colar||'#2f78a8'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sx-4,sy-22.5); ctx.lineTo(sx+4,sy-22.5); ctx.stroke();
    const trab=a.trabalhando, s=trab?Math.sin(T*12)*4:0;
    ctx.strokeStyle=pele; ctx.lineWidth=2.4; ctx.beginPath();
    ctx.moveTo(sx-4.5,sy-22); ctx.lineTo(sx-6+passo*3,sy-13);
    ctx.moveTo(sx+4.5,sy-22); ctx.lineTo(trab?sx+10:sx+6-passo*3, trab?sy-17+s:sy-13); ctx.stroke();
    ctx.fillStyle=pele; ctx.beginPath(); ctx.arc(sx,sy-29,5,0,7); ctx.fill();
    ctx.fillStyle=opcoes.cabelo||'#1b1b1b'; ctx.beginPath(); ctx.moveTo(sx-5.6,sy-25); ctx.lineTo(sx-5.6,sy-30); ctx.quadraticCurveTo(sx,sy-38,sx+5.6,sy-30); ctx.lineTo(sx+5.6,sy-25); ctx.lineTo(sx+3,sy-27); ctx.lineTo(sx+3,sy-30); ctx.lineTo(sx-3,sy-30); ctx.lineTo(sx-3,sy-27); ctx.closePath(); ctx.fill();
    if(opcoes.papiro){ ctx.fillStyle='#f1e2b6'; ctx.fillRect(sx-11,sy-21,6,9); ctx.fillStyle='#a8823a'; ctx.fillRect(sx-11,sy-21,6,1.5); }
    if(a.carga>0){ if(a.tipoCarga==='trigo'){ ctx.strokeStyle='#c8961f'; ctx.lineWidth=1.5; ctx.beginPath(); for(let i=-4;i<=4;i+=2){ ctx.moveTo(sx-7,sy-36+i*0.3); ctx.lineTo(sx+8,sy-40+i); } ctx.stroke(); }
      else { ctx.fillStyle='#8a5a2a'; ctx.fillRect(sx-9,sy-41,18,4); ctx.fillStyle='#6d441d'; ctx.fillRect(sx-9,sy-37,18,3); } }
    if(opcoes.balao){ const txt=opcoes.balao; ctx.font='bold 14px Trebuchet MS'; const w=Math.max(20,ctx.measureText(txt).width+12);
      ctx.fillStyle='#fff7e0'; ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(sx+4,sy-60,w,22,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#3b2a14'; ctx.textAlign='left'; ctx.fillText(txt,sx+10,sy-44); }
  }
  seta(x,y,alt){ const ctx=this.ctx, [sx,sy]=this.p(x,y), top=sy-(alt||50)-14+Math.sin(this.T*5)*5;
    ctx.fillStyle='#e0452b'; ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sx-11,top-14); ctx.lineTo(sx+11,top-14); ctx.lineTo(sx,top+4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  flutuar(x,y,txt,c){ this.flutuantes.push({x,y,txt,c:c||'#ffd968',t0:this.T}); }
  desenharFlutuantes(){
    this.desenharParticulas(this._dt||0);
    const ctx=this.ctx; ctx.font='bold 18px Trebuchet MS'; ctx.textAlign='center'; ctx.lineWidth=4;
    for(let i=this.flutuantes.length-1;i>=0;i--){ const f=this.flutuantes[i], idade=this.T-f.t0; if(idade>1.6){ this.flutuantes.splice(i,1); continue; }
      const [sx,sy]=this.p(f.x,f.y), y=sy-50-idade*28; ctx.globalAlpha=Math.min(1,(1.6-idade)*1.5);
      ctx.strokeStyle='#2a1a08'; ctx.strokeText(f.txt,sx,y); ctx.fillStyle=f.c; ctx.fillText(f.txt,sx,y); ctx.globalAlpha=1; }
  }
  vinheta(){ const ctx=this.ctx; ctx.setTransform(1,0,0,1,0,0); const w=this.cv.width,h=this.cv.height, g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*0.35,w/2,h/2,Math.max(w,h)*0.75);
    g.addColorStop(0,'rgba(60,30,5,0)'); g.addColorStop(1,'rgba(60,30,5,.35)'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    // luz que muda devagar: manhã dourada e tarde mais quente
    const luz=Math.sin(this.T*0.05); ctx.fillStyle=luz>0?`rgba(255,200,120,${0.06*luz})`:`rgba(255,140,90,${-0.07*luz})`; ctx.fillRect(0,0,w,h); }
}
function moverPara(a,tx,ty,vel,dt){ const d=Math.hypot(a.x-tx,a.y-ty); if(d<0.05){ a.andando=false; return true; } const s=Math.min(d,vel*dt); a.x+=(tx-a.x)/d*s; a.y+=(ty-a.y)/d*s; a.andando=true; return false; }
