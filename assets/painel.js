/* ============================================================
      Caminhabilidade Urbana - painel da pesquisa
   Graficos em SVG escritos a mao, sem nenhuma biblioteca externa.
   Paleta testada para daltonismo nos dois temas.
   ============================================================ */
"use strict";
/* Os dados chegam de assets/dados.js, que le o CSV normalizado.
   COLS e ROWS sao preenchidos por push e nunca reatribuidos: COLSETS.all
   guarda uma referencia a COLS montada antes do carregamento. */
const COLS = [], ROWS = [], IX = {};
const V = (r,c)=>r[IX[c]];
const NS = "http://www.w3.org/2000/svg";
const css = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
/* var() nao vale em atributo de apresentacao SVG: resolvemos o token na hora de desenhar.
   Todo grafico e redesenhado na troca de tema, entao a cor acompanha o modo. */
const CVAR = {};
function C(v){
  if(typeof v!=="string"||!v.startsWith("var(")) return v;
  const k=v.slice(4,-1).trim();
  if(CVAR[k]==null) CVAR[k]=css(k);
  return CVAR[k]||v;
}
const PAINT = {fill:1,stroke:1};
const el = (t,a,txt)=>{const n=document.createElementNS(NS,t);
  for(const k in a) if(a[k]!=null) n.setAttribute(k,PAINT[k]?C(a[k]):a[k]);
  if(txt!=null)n.textContent=txt;return n;};

/* ---------- numeros ---------- */
const nf = (x,d=1)=> x==null||Number.isNaN(x) ? "–" : x.toFixed(d).replace(".",",");
const pf = x => x==null||Number.isNaN(x) ? "–" : Math.round(x*100)+"%";
const sf = x => (x>0?"+":x<0?"−":"")+Math.abs(x).toFixed(3).replace(".",",");
const nums = (rows,c)=>rows.map(r=>V(r,c)).filter(v=>typeof v==="number");
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : null;
const avg  = (rows,c)=>mean(nums(rows,c));
const share = (rows,c,val)=>{const d=rows.map(r=>V(r,c)).filter(v=>v!=null); return d.length? d.filter(v=>v===val).length/d.length : null;};

function pearson(rows,a,b){
  const p=rows.map(r=>[V(r,a),V(r,b)]).filter(([x,y])=>typeof x==="number"&&typeof y==="number");
  if(p.length<4) return null;
  const mx=mean(p.map(v=>v[0])), my=mean(p.map(v=>v[1]));
  let num=0,dx=0,dy=0;
  for(const [x,y] of p){num+=(x-mx)*(y-my);dx+=(x-mx)**2;dy+=(y-my)**2;}
  return dx&&dy ? num/Math.sqrt(dx*dy) : null;
}
const rng = s => ()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296;};
function permP(a,b,iters=5000){
  if(a.length<3||b.length<3) return null;
  const obs=Math.abs(mean(a)-mean(b)), pool=a.concat(b), na=a.length, rand=rng(20260908);
  let hit=0;
  for(let i=0;i<iters;i++){
    for(let j=pool.length-1;j>0;j--){const k=(rand()*(j+1))|0;const t=pool[j];pool[j]=pool[k];pool[k]=t;}
    let s=0; for(let j=0;j<na;j++) s+=pool[j];
    const ma=s/na; let s2=0; for(let j=na;j<pool.length;j++) s2+=pool[j];
    if(Math.abs(ma-s2/(pool.length-na))>=obs-1e-12) hit++;
  }
  return hit/iters;
}

/* ---------- rotulos ---------- */
const LIKERT = [
  ["nota_largura_calcada","Largura da calçada"],
  ["nota_pavimentacao","Pavimentação"],
  ["nota_espaco_livre","Espaço livre de circulação"],
  ["nota_seguranca_dia","Segurança de dia"],
  ["nota_seguranca_noite","Segurança de noite"],
  ["nota_iluminacao_publica","Iluminação pública"],
  ["nota_faixas_pedestre","Faixas de pedestre visíveis"],
  ["nota_placas_semaforos","Placas e semáforos legíveis"],
  ["nota_estado_bancos","Estado dos bancos"],
  ["nota_acess_pcd_idosos","Acessibilidade p/ idosos e PCD"],
  ["nota_acess_mulher_crianca","Acessib. p/ mulheres com crianças"]];
const MOB = [
  ["presenca_bancos","Bancos ao longo do trecho"],
  ["presenca_lixeiras","Lixeiras em pontos estratégicos"],
  ["bancos_com_sombra","Bancos com sombra"],
  ["presenca_ponto_onibus","Ponto de ônibus em bom estado"],
  ["presenca_sinal_pedestre","Placas e sinalização de pedestres"],
  ["rampas_cadeirantes","Rampas para cadeirantes"],
  ["sinalizacao_inclusiva","Sinalização p/ idosos, crianças e PCD"],
  ["existe_parada_transporte","Paradas de transporte público"],
  ["parada_com_protecao_climatica","Paradas com proteção climática"]];
const DIFS = [
  ["dif_calcadas_ruins","Calçadas ruins"],["dif_inseguranca","Sensação de insegurança"],
  ["dif_falta_bancos","Falta de bancos"],["dif_transito_perigoso","Trânsito perigoso"],
  ["dif_falta_sombra","Falta de sombra"],["dif_carros_estacionados","Carros sobre a calçada"],
  ["dif_construcoes","Construções / obras"]];
const CORR = [
  ["infra_adequada_ordem","Percebe infraestrutura adequada"],["idx_infra_fisica","Índice de infra física"],
  ["presenca_lixeiras_ord","Presença de lixeiras"],["conforto_termico_escala","Desconforto térmico"],
  ["rampas_cadeirantes_ord","Rampas para cadeirantes"],["dificuldades_n","Nº de dificuldades citadas"],
  ["presenca_ponto_onibus_ord","Ponto de ônibus em bom estado"],["nota_iluminacao_publica","Iluminação pública"],
  ["sinalizacao_inclusiva_ord","Sinalização inclusiva"],["nota_pavimentacao","Pavimentação"],
  ["presenca_bancos_ord","Presença de bancos"],["nota_estado_bancos","Estado dos bancos"],
  ["nota_espaco_livre","Espaço livre de circulação"],["idx_acessibilidade","Índice de acessibilidade"],
  ["nota_seguranca_noite","Segurança de noite"],["temperatura_c","Temperatura do ar"],
  ["escolaridade_ordem","Escolaridade"]];
const ASHRAE = [[-3,"Muito frio"],[-2,"Frio"],[-1,"Um pouco de frio"],[0,"Nem frio nem calor"],
  [1,"Um pouco de calor"],[2,"Calor"],[3,"Muito calor"]];
const PREFER = [[-3,"Bem mais refrescado"],[-2,"Mais refrescado"],[-1,"Um pouco mais refrescado"],
  [0,"Assim mesmo"],[1,"Um pouco mais aquecido"],[2,"Mais aquecido"],[3,"Bem mais aquecido"]];
const ORD_LBL = {0:"Não",1:"Parcial",2:"Sim"};

/* ---------- filtros ---------- */
const FILTERS = ["bairro","trecho","raca_cor","genero","perfil_respondente","faixa_etaria"];
const ORDER = {faixa_etaria:["<18","18-29","30-44","45-59","60-69","70+"]};
const state = {};
let cur = [];

function buildFilters(){
  document.querySelectorAll(".filters select").forEach(sel=>{
    const c = sel.dataset.col;
    let vals = [...new Set(ROWS.map(r=>V(r,c)).filter(Boolean))];
    vals = ORDER[c] ? ORDER[c].filter(v=>vals.includes(v)) : vals.sort((a,b)=>a.localeCompare(b,"pt-BR"));
    sel.append(new Option("Todos",""));
    vals.forEach(v=>sel.append(new Option(v+" ("+ROWS.filter(r=>V(r,c)===v).length+")",v)));
    sel.addEventListener("change",()=>{state[c]=sel.value||null;apply();});
  });
  document.getElementById("clear").addEventListener("click",()=>{
    FILTERS.forEach(c=>state[c]=null);
    document.querySelectorAll(".filters select").forEach(s=>s.value="");
    apply();
  });
}
function apply(){
  cur = ROWS.filter(r=>FILTERS.every(c=>!state[c]||V(r,c)===state[c]));
  document.getElementById("nsel").textContent = cur.length;
  const w = document.getElementById("slicewarn");
  const act = FILTERS.filter(c=>state[c]).map(c=>state[c]);
  if(cur.length < 12 && act.length){
    w.className="warn-slice on";
    w.textContent = "Poucas respostas nesta seleção ("+cur.length+"). Com tão poucos casos as médias "+
      "e as comparações abaixo variam muito e não são confiáveis. Filtros ativos: "+act.join(", ")+".";
  } else w.className="warn-slice";
  drawAll();
  renderTable();
}

/* ---------- tooltip ---------- */
const tip = document.getElementById("tip");
function hover(node, html){
  node.style.cursor="default";
  const show = e=>{tip.innerHTML=html;tip.classList.add("on");move(e);};
  const move = e=>{
    const p = e.touches?e.touches[0]:e, b=tip.getBoundingClientRect();
    let x=(p.clientX||0)+14, y=(p.clientY||0)+14;
    if(x+b.width>innerWidth-8) x=(p.clientX||0)-b.width-14;
    if(y+b.height>innerHeight-8) y=(p.clientY||0)-b.height-14;
    tip.style.left=Math.max(8,x)+"px"; tip.style.top=Math.max(8,y)+"px";
  };
  const hide = ()=>tip.classList.remove("on");
  node.addEventListener("mouseenter",show); node.addEventListener("mousemove",move);
  node.addEventListener("mouseleave",hide);
  node.setAttribute("tabindex","0"); node.setAttribute("role","img");
  node.addEventListener("focus",e=>{
    const r=node.getBoundingClientRect();
    tip.innerHTML=html;tip.classList.add("on");
    tip.style.left=Math.min(innerWidth-tip.offsetWidth-8,r.left)+"px";
    tip.style.top=(r.bottom+8)+"px";
  });
  node.addEventListener("blur",hide);
}
const TP = (k,v)=>'<span class="tk">'+k+'</span><span class="tv">'+v+'</span>';

/* ---------- primitivas ---------- */
function frame(w,h){ return el("svg",{width:w,height:h,viewBox:"0 0 "+w+" "+h}); }
function rr(x,y,w,h,r,ends){ // ends: "r","l","both","none"
  r=Math.max(0,Math.min(r,h/2,Math.abs(w)));
  if(w<=0.35) return "M"+x+" "+y+"h"+Math.max(w,0.35)+"v"+h+"h"+(-Math.max(w,0.35))+"z";
  const L=ends==="l"||ends==="both", R=ends==="r"||ends==="both";
  let p="M"+(x+(L?r:0))+" "+y;
  p+="H"+(x+w-(R?r:0)); if(R)p+="a"+r+" "+r+" 0 0 1 "+r+" "+r;
  p+="V"+(y+h-(R?r:0)); if(R)p+="a"+r+" "+r+" 0 0 1 "+(-r)+" "+r;
  p+="H"+(x+(L?r:0)); if(L)p+="a"+r+" "+r+" 0 0 1 "+(-r)+" "+(-r);
  p+="V"+(y+r); if(L)p+="a"+r+" "+r+" 0 0 1 "+r+" "+(-r);
  return p+"z";
}
function rrTop(x,y,w,h,r){ // coluna vertical: ponta arredondada no topo, base reta na linha zero
  r=Math.max(0,Math.min(r,w/2,h));
  if(h<=0.6) return "M"+x+" "+y+"h"+w+"v"+Math.max(h,0.6)+"h"+(-w)+"z";
  return "M"+x+" "+(y+h)+"V"+(y+r)+"a"+r+" "+r+" 0 0 1 "+r+" "+(-r)+"H"+(x+w-r)+
         "a"+r+" "+r+" 0 0 1 "+r+" "+r+"V"+(y+h)+"z";
}
function xgrid(s,x0,plotW,y0,h,ticks,scale,fmtT){
  ticks.forEach(t=>{
    const x=x0+scale(t);
    s.append(el("line",{x1:x,x2:x,y1:y0,y2:y0+h,stroke:"var(--grid)","stroke-width":1,"shape-rendering":"crispEdges"}));
    s.append(el("text",{x,y:y0+h+15,"text-anchor":"middle","font-size":10.5,fill:"var(--muted)",
      "font-variant-numeric":"tabular-nums"},fmtT(t)));
  });
}
function wrapText(str,max){ // devolve linhas
  const w=str.split(" "),out=[];let l="";
  for(const t of w){ if((l+" "+t).trim().length>max&&l){out.push(l);l=t;} else l=(l+" "+t).trim(); }
  if(l)out.push(l); return out;
}

/* ===== 1. barras horizontais, 1 hue ===== */
function hbar(box,w,{items,max,color="var(--s1)",fmtV=x=>nf(x,2),ticks,rowH=30,labelW=null,unit="",axisFmt=null,sub=null}){
  if(!items.length){box.append(empty());return;}
  const LW = labelW ?? Math.min(210,Math.max(96,w*.34));
  const VW = 58, pad=6;
  const plotW = Math.max(60,w-LW-VW-pad*2);
  const h = items.length*rowH + 26;
  const s = frame(w,h), x0=LW+pad;
  const mx = max ?? (Math.max(...items.map(d=>d.value||0))*1.05 || 1);
  const sc = v=>Math.max(0,Math.min(1,v/mx))*plotW;
  const tk = ticks ?? [0,mx/2,mx];
  xgrid(s,x0,plotW,0,items.length*rowH,tk,sc,axisFmt??(t=>nf(t,mx>20?0:1)));
  s.append(el("line",{x1:x0,x2:x0,y1:0,y2:items.length*rowH,stroke:"var(--axis)","stroke-width":1,"shape-rendering":"crispEdges"}));
  items.forEach((d,i)=>{
    const y=i*rowH, bh=Math.min(15,rowH-13), by=y+(rowH-bh)/2;
    const lines=wrapText(d.label,Math.floor(LW/6.4));
    lines.forEach((ln,j)=>s.append(el("text",{x:LW-2,y:y+rowH/2+4-(lines.length-1)*6+j*12,
      "text-anchor":"end","font-size":lines.length>1?11:12,fill:"var(--ink-2)"},ln)));
    if(d.value==null){
      s.append(el("text",{x:x0+4,y:by+bh-2,"font-size":11.5,fill:"var(--muted)","font-style":"italic"},"sem dado"));
    }else{
      const g=el("g",{});
      g.append(el("path",{d:rr(x0,by,sc(d.value),bh,4,"r"),fill:d.color||color}));
      g.append(el("rect",{x:x0,y,width:plotW,height:rowH,fill:"transparent"}));
      hover(g,TP(d.label,"<b>"+fmtV(d.value)+"</b>"+unit)+(d.n!=null?'<span class="tv" style="color:var(--muted)"> · '+d.n+" respostas</span>":"")+(d.note?'<br><span class="tv" style="color:var(--muted)">'+d.note+"</span>":""));
      s.append(g);
      s.append(el("text",{x:x0+plotW+8,y:by+bh-2.5,"font-size":12,"font-weight":600,fill:"var(--ink)",
        "font-variant-numeric":"tabular-nums"},fmtV(d.value)));
      if(d.n!=null) s.append(el("text",{x:w-2,y:by+bh-2.5,"text-anchor":"end","font-size":10.5,
        fill:"var(--muted)","font-variant-numeric":"tabular-nums"},"n="+d.n));
    }
  });
  box.append(s);
}
function empty(){const d=document.createElement("p");d.className="foot-note";
  d.textContent="Nenhuma resposta nesta seleção. Ajuste os filtros no topo da página.";return d;}

/* ===== 2. barras agrupadas (2 series) ===== */
function groupedBar(box,w,{items,series,max,fmtV=pf,unit=""}){
  if(!items.length){box.append(empty());return;}
  const LW=Math.min(190,Math.max(100,w*.42)), pad=6, VW=6;
  const plotW=Math.max(60,w-LW-pad-VW-46);
  const rowH=series.length*15+20, h=items.length*rowH+26, s=frame(w,h), x0=LW+pad;
  const mx=max ?? (Math.max(...items.flatMap(d=>d.values))*1.12 || 1);
  const sc=v=>Math.max(0,v/mx)*plotW;
  xgrid(s,x0,plotW,0,items.length*rowH,[0,mx/2,mx],sc,t=>pf(t));
  s.append(el("line",{x1:x0,x2:x0,y1:0,y2:items.length*rowH,stroke:"var(--axis)","stroke-width":1,"shape-rendering":"crispEdges"}));
  items.forEach((d,i)=>{
    const y0=i*rowH+8;
    const lines=wrapText(d.label,Math.floor(LW/6.3));
    lines.forEach((ln,j)=>s.append(el("text",{x:LW-2,y:y0+rowH/2-4-(lines.length-1)*6+j*12,
      "text-anchor":"end","font-size":lines.length>1?11:12,fill:"var(--ink-2)"},ln)));
    d.values.forEach((v,k)=>{
      const bh=11, by=y0+k*15;
      const g=el("g",{});
      g.append(el("path",{d:rr(x0,by,sc(v),bh,4,"r"),fill:series[k].color}));
      g.append(el("rect",{x:x0,y:by-2,width:plotW,height:15,fill:"transparent"}));
      hover(g,TP(d.label,series[k].name+" · <b>"+fmtV(v)+"</b>"+unit)+
        (d.ns?'<span class="tv" style="color:var(--muted)"> · '+d.ns[k]+" respostas</span>":""));
      s.append(g);
      s.append(el("text",{x:x0+sc(v)+6,y:by+bh-1.5,"font-size":10.5,fill:"var(--ink-2)",
        "font-variant-numeric":"tabular-nums"},fmtV(v)));
    });
    if(d.flag) s.append(el("text",{x:LW-2,y:y0+rowH-6,"text-anchor":"end","font-size":10,
      fill:"var(--crit)","font-family":"var(--fmono)"},d.flag));
  });
  box.append(s);
}

/* ===== 3. barra empilhada divergente ===== */
function divStack(box,w,{items,cats,fmtMean=x=>nf(x,2),meanLabel="média"}){
  if(!items.length){box.append(empty());return;}
  const LW=Math.min(215,Math.max(104,w*.33)), pad=8, MW=52;
  const plotW=Math.max(80,w-LW-pad-MW-8);
  const rowH=27, h=items.length*rowH+30, s=frame(w,h), x0=LW+pad;
  const neg=cats.filter(c=>c.side<0), pos=cats.filter(c=>c.side>0), mid=cats.find(c=>c.side===0);
  const ext=d=>{const t=cats.reduce((a,c)=>a+(d.p[c.key]||0),0)||1;
    const L=neg.reduce((a,c)=>a+(d.p[c.key]||0),0)/t+(mid?(d.p[mid.key]||0)/t/2:0);
    return {L,R:1-L,t};};
  const maxL=Math.max(...items.map(d=>ext(d).L)), maxR=Math.max(...items.map(d=>ext(d).R));
  const span=maxL+maxR, sc=v=>v/span*plotW, cx=x0+sc(maxL);
  s.append(el("line",{x1:cx,x2:cx,y1:0,y2:items.length*rowH,stroke:"var(--axis)","stroke-width":1,"shape-rendering":"crispEdges"}));
  [[-.5,"−50%"],[-.25,"−25%"],[.25,"25%"],[.5,"50%"]].forEach(([t,lb])=>{
    if(Math.abs(t)>Math.max(maxL,maxR)) return;
    const x=cx+sc(t);
    s.append(el("line",{x1:x,x2:x,y1:0,y2:items.length*rowH,stroke:"var(--grid)","stroke-width":1,"shape-rendering":"crispEdges"}));
    s.append(el("text",{x,y:items.length*rowH+15,"text-anchor":"middle","font-size":10.5,fill:"var(--muted)"},lb));
  });
  s.append(el("text",{x:cx,y:items.length*rowH+15,"text-anchor":"middle","font-size":10.5,fill:"var(--muted)"},"0"));
  items.forEach((d,i)=>{
    const y=i*rowH, bh=15, by=y+(rowH-bh)/2, e=ext(d);
    const lines=wrapText(d.label,Math.floor(LW/6.2));
    lines.forEach((ln,j)=>s.append(el("text",{x:LW-2,y:y+rowH/2+4-(lines.length-1)*6+j*11.5,
      "text-anchor":"end","font-size":lines.length>1?10.5:11.5,fill:"var(--ink-2)"},ln)));
    let x=cx-sc(e.L);
    const seq=neg.slice().reverse().concat(mid?[mid]:[],pos);
    seq.forEach(c=>{
      const frac=(d.p[c.key]||0)/e.t; if(frac<=0) return;
      const bw=sc(frac);
      const isFirst=x<=cx-sc(e.L)+.5, isLast=x+bw>=cx+sc(e.R)-.5;
      const g=el("g",{});
      g.append(el("path",{d:rr(x+1,by,Math.max(bw-2,0.5),bh,4,isFirst&&isLast?"both":isFirst?"l":isLast?"r":"none"),fill:c.color}));
      hover(g,TP(d.label,c.name+" · <b>"+Math.round(frac*100)+"%</b>")+
        '<span class="tv" style="color:var(--muted)"> · '+(d.p[c.key])+" de "+e.t+"</span>");
      s.append(g);
      if(frac>=0.13) s.append(el("text",{x:x+bw/2,y:by+bh-3.5,"text-anchor":"middle","font-size":9.5,
        fill:c.ink||"var(--surface)","font-weight":600,"pointer-events":"none",
        "font-variant-numeric":"tabular-nums"},Math.round(frac*100)));
      x+=bw;
    });
    if(d.mean!=null) s.append(el("text",{x:w-2,y:by+bh-2.5,"text-anchor":"end","font-size":11.5,
      "font-weight":600,fill:"var(--ink)","font-variant-numeric":"tabular-nums"},fmtMean(d.mean)));
  });
  s.append(el("text",{x:w-2,y:items.length*rowH+15,"text-anchor":"end","font-size":9.5,
    fill:"var(--muted)","font-family":"var(--fmono)"},meanLabel));
  box.append(s);
}

/* ===== 4. barra divergente simples (r de Pearson) ===== */
function divBar(box,w,{items,max=null,fmtV=sf}){
  if(!items.length){box.append(empty());return;}
  const LW=Math.min(210,Math.max(108,w*.42)), pad=8, VW=50;
  const plotW=Math.max(70,w-LW-pad-VW);
  const rowH=22, h=items.length*rowH+28, s=frame(w,h), x0=LW+pad;
  const mx=max ?? (Math.max(...items.map(d=>Math.abs(d.value||0)))*1.08 || 1);
  const cx=x0+plotW/2, sc=v=>v/mx*(plotW/2);
  [-mx/2,mx/2].forEach(t=>{const x=cx+sc(t);
    s.append(el("line",{x1:x,x2:x,y1:0,y2:items.length*rowH,stroke:"var(--grid)","stroke-width":1,"shape-rendering":"crispEdges"}));
    s.append(el("text",{x,y:items.length*rowH+15,"text-anchor":"middle","font-size":10.5,fill:"var(--muted)"},sf(t)));});
  s.append(el("line",{x1:cx,x2:cx,y1:0,y2:items.length*rowH,stroke:"var(--axis)","stroke-width":1,"shape-rendering":"crispEdges"}));
  s.append(el("text",{x:cx,y:items.length*rowH+15,"text-anchor":"middle","font-size":10.5,fill:"var(--muted)"},"0"));
  items.forEach((d,i)=>{
    const y=i*rowH, bh=12, by=y+(rowH-bh)/2, v=d.value||0, bw=Math.abs(sc(v));
    const lines=wrapText(d.label,Math.floor(LW/6.1));
    lines.forEach((ln,j)=>s.append(el("text",{x:LW-2,y:y+rowH/2+4-(lines.length-1)*5.5+j*11,
      "text-anchor":"end","font-size":lines.length>1?10:11.5,fill:"var(--ink-2)"},ln)));
    const g=el("g",{});
    g.append(el("path",{d:rr(v>=0?cx+1:cx-bw-1,by,bw,bh,4,v>=0?"r":"l"),fill:v>=0?"var(--d5)":"var(--d1)"}));
    g.append(el("rect",{x:x0,y,width:plotW,height:rowH,fill:"transparent"}));
    hover(g,TP(d.label,"r = <b>"+sf(v)+"</b> (de −1 a +1)")+'<span class="tv" style="color:var(--muted)"> · '+d.n+" respostas<br>"+
      (v>=0?"anda junto com nota alta":"anda junto com nota baixa")+"</span>");
    s.append(g);
    s.append(el("text",{x:v>=0?cx+bw+7:cx-bw-7,y:by+bh-1.5,"text-anchor":v>=0?"start":"end","font-size":11,
      fill:"var(--ink-2)","font-variant-numeric":"tabular-nums"},fmtV(v)));
  });
  box.append(s);
}

/* ===== 5. dumbbell ===== */
function dumbbell(box,w,{items,series,min=1,max=5}){
  if(!items.length){box.append(empty());return;}
  const LW=Math.min(160,Math.max(92,w*.3)), pad=10, VW=56;
  const plotW=Math.max(70,w-LW-pad-VW);
  const rowH=34, h=items.length*rowH+28, s=frame(w,h), x0=LW+pad;
  const sc=v=>(v-min)/(max-min)*plotW;
  [1,2,3,4,5].filter(t=>t>=min&&t<=max).forEach(t=>{const x=x0+sc(t);
    s.append(el("line",{x1:x,x2:x,y1:0,y2:items.length*rowH,stroke:"var(--grid)","stroke-width":1,"shape-rendering":"crispEdges"}));
    s.append(el("text",{x,y:items.length*rowH+15,"text-anchor":"middle","font-size":10.5,fill:"var(--muted)"},t));});
  items.forEach((d,i)=>{
    const y=i*rowH, cy=y+rowH/2-2;
    s.append(el("text",{x:LW-2,y:cy+4,"text-anchor":"end","font-size":12,fill:"var(--ink-2)"},d.label));
    if(d.a==null||d.b==null) return;
    s.append(el("line",{x1:x0+sc(d.a),x2:x0+sc(d.b),y1:cy,y2:cy,stroke:"var(--axis)","stroke-width":2,
      "stroke-linecap":"round"}));
    [[d.b,series[1]],[d.a,series[0]]].forEach(([v,se])=>{
      const g=el("g",{});
      g.append(el("circle",{cx:x0+sc(v),cy,r:6,fill:se.color,stroke:"var(--surface)","stroke-width":2}));
      g.append(el("circle",{cx:x0+sc(v),cy,r:13,fill:"transparent"}));
      hover(g,TP(d.label,se.name+" · <b>"+nf(v,2)+"</b> de 5")+'<span class="tv" style="color:var(--muted)"> · '+d.n+" respostas</span>");
      s.append(g);
    });
    s.append(el("text",{x:w-2,y:cy+4,"text-anchor":"end","font-size":11.5,fill:"var(--crit)","font-weight":600,
      "font-variant-numeric":"tabular-nums"},"−"+nf(d.a-d.b,2)));
  });
  s.append(el("text",{x:w-2,y:items.length*rowH+15,"text-anchor":"end","font-size":9.5,fill:"var(--muted)",
    "font-family":"var(--fmono)"},"queda"));
  box.append(s);
}

/* ===== 6. colunas verticais (escala ordenada) ===== */
function columns(box,w,{items,xlabel=[null,null],fmtV=x=>x}){
  const tot=items.reduce((a,d)=>a+d.value,0);
  if(!tot){box.append(empty());return;}
  const h=210, padL=30, padB=52, padT=16;
  const plotW=Math.max(60,w-padL-8), plotH=h-padB-padT;
  const s=frame(w,h);
  const mx=Math.max(...items.map(d=>d.value))*1.15||1;
  const bw=Math.min(46,plotW/items.length-8), step=plotW/items.length;
  [0,mx/2,mx].forEach(t=>{const y=padT+plotH-t/mx*plotH;
    s.append(el("line",{x1:padL,x2:padL+plotW,y1:y,y2:y,stroke:"var(--grid)","stroke-width":1,"shape-rendering":"crispEdges"}));
    s.append(el("text",{x:padL-6,y:y+3.5,"text-anchor":"end","font-size":10.5,fill:"var(--muted)",
      "font-variant-numeric":"tabular-nums"},Math.round(t)));});
  items.forEach((d,i)=>{
    const x=padL+i*step+(step-bw)/2, bh=d.value/mx*plotH, y=padT+plotH-bh;
    if(d.value>0){
      const g=el("g",{});
      g.append(el("path",{d:rrTop(x,y,bw,bh,4),fill:d.color}));
      g.append(el("rect",{x:padL+i*step,y:padT,width:step,height:plotH,fill:"transparent"}));
      hover(g,TP(d.label,"<b>"+d.value+"</b> resposta"+(d.value===1?"":"s"))+
        '<span class="tv" style="color:var(--muted)"> · '+Math.round(d.value/tot*100)+"% da seleção</span>");
      s.append(g);
      s.append(el("text",{x:x+bw/2,y:y-5,"text-anchor":"middle","font-size":11,"font-weight":600,
        fill:"var(--ink)","font-variant-numeric":"tabular-nums"},d.value));
    }
    s.append(el("text",{x:x+bw/2,y:padT+plotH+14,"text-anchor":"middle","font-size":10.5,fill:"var(--muted)",
      "font-variant-numeric":"tabular-nums"},d.tick));
  });
  s.append(el("line",{x1:padL,x2:padL+plotW,y1:padT+plotH,y2:padT+plotH,stroke:"var(--axis)","stroke-width":1,"shape-rendering":"crispEdges"}));
  if(xlabel[0]) s.append(el("text",{x:padL,y:h-14,"font-size":10.5,fill:"var(--muted)"},"← "+xlabel[0]));
  if(xlabel[1]) s.append(el("text",{x:padL+plotW,y:h-14,"text-anchor":"end","font-size":10.5,
    fill:"var(--muted)"},xlabel[1]+" →"));
  box.append(s);
}

/* ===== 7. dispersao ===== */
function scatter(box,w,{pts,groups}){
  if(!pts.length){box.append(empty());return;}
  const h=290, padL=54, padB=46, padT=14, padR=12;
  const plotW=Math.max(80,w-padL-padR), plotH=h-padB-padT;
  const xs=pts.map(p=>p.x), x1=Math.min(...xs)-1, x2=Math.max(...xs)+1;
  const sx=v=>padL+(v-x1)/(x2-x1)*plotW, sy=v=>padT+(3-v)/6*plotH;
  const s=frame(w,h);
  for(let t=-3;t<=3;t++){const y=sy(t);
    s.append(el("line",{x1:padL,x2:padL+plotW,y1:y,y2:y,stroke:t===0?"var(--axis)":"var(--grid)",
      "stroke-width":1,"shape-rendering":"crispEdges"}));
    s.append(el("text",{x:padL-6,y:y+3.5,"text-anchor":"end","font-size":10.5,fill:"var(--muted)",
      "font-variant-numeric":"tabular-nums"},(t>0?"+":"")+t));}
  const step=(x2-x1)>12?2:1;
  for(let t=Math.ceil(x1);t<=Math.floor(x2);t+=step){
    s.append(el("text",{x:sx(t),y:padT+plotH+16,"text-anchor":"middle","font-size":10.5,fill:"var(--muted)",
      "font-variant-numeric":"tabular-nums"},t+"°"));}
  s.append(el("text",{x:padL,y:h-10,"font-size":10.5,fill:"var(--muted)"},"temperatura do ar (°C)"));
  s.append(el("text",{x:13,y:padT+plotH/2,"text-anchor":"middle","font-size":9.5,fill:"var(--muted)",
    transform:"rotate(-90 13 "+(padT+plotH/2)+")"},"← frio    como se sentia    calor →"));
  const rand=rng(7);
  pts.forEach(p=>{
    const jx=(rand()-.5)*(plotW/(x2-x1))*.62, jy=(rand()-.5)*(plotH/6)*.52;
    const g=el("g",{});
    g.append(el("circle",{cx:sx(p.x)+jx,cy:sy(p.y)+jy,r:5.5,fill:p.color,"fill-opacity":.9,
      stroke:"var(--surface)","stroke-width":2}));
    g.append(el("circle",{cx:sx(p.x)+jx,cy:sy(p.y)+jy,r:12,fill:"transparent"}));
    hover(g,TP(p.grp,p.id)+'<span class="tv">'+p.x+" °C · sensação <b>"+(p.y>0?"+":"")+p.y+
      "</b><br></span><span class=\"tv\" style=\"color:var(--muted)\">"+p.trecho+" · "+p.sens+"</span>");
    s.append(g);
  });
  box.append(s);
}

/* ---------- legendas & tabelas ---------- */
function legend(id,items,dot){
  const b=document.getElementById(id); if(!b) return; b.innerHTML="";
  items.forEach(it=>{const d=document.createElement("span");d.className="lg"+(dot?" dot":"");
    d.innerHTML='<i style="background:'+it.color+'"></i>'+it.name;b.append(d);});
}
function table(id,head,rows){
  const b=document.getElementById(id+"-t"); if(!b) return;
  let html="<table class='dv'><thead><tr>"+head.map(h=>"<th>"+h+"</th>").join("")+"</tr></thead><tbody>";
  rows.forEach(r=>{html+="<tr>"+r.map(c=>"<td>"+(c==null?"–":c)+"</td>").join("")+"</tr>";});
  b.innerHTML=html+"</tbody></table>";
}
document.querySelectorAll(".tt-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const id=btn.dataset.tt, on=btn.getAttribute("aria-pressed")==="true";
    btn.setAttribute("aria-pressed",String(!on));
    document.getElementById(id).style.display = on?"":"none";
    document.getElementById(id+"-t").classList.toggle("on",!on);
  });
});


/* ============ RENDERIZADORES ============ */
const SERIES = ()=>({s1:css("--s1"),s2:css("--s2"),s3:css("--s3")});
const LIK_CATS = ()=>[
  {key:1,name:"1 · muito ruim",side:-1,color:"var(--d1)"},
  {key:2,name:"2",side:-1,color:"var(--d2)",ink:"var(--ink)"},
  {key:3,name:"3 · neutro",side:0,color:"var(--d0)",ink:"var(--ink)"},
  {key:4,name:"4",side:1,color:"var(--d4)",ink:"var(--ink)"},
  {key:5,name:"5 · muito bom",side:1,color:"var(--d5)"}];
const MOB_CATS = ()=>[
  {key:0,name:"Não existe",side:-1,color:"var(--d1)"},
  {key:1,name:"Mais ou menos",side:0,color:"var(--d0)",ink:"var(--ink)"},
  {key:2,name:"Existe",side:1,color:"var(--d5)"}];

/* ---- KPIs + tese ---- */
function renderKpis(){
  const n=cur.length;
  const nota=avg(cur,"nota_caminhabilidade"), noite=avg(cur,"nota_seguranca_noite");
  const evita=share(cur,"evita_areas_inseguranca","Sim");
  const semBanco=share(cur,"presenca_bancos","Não");
  const sombraImp=avg(cur,"nota_import_arvores_sombra");
  const tiles=[
    {k:"Nota geral do trecho",v:nf(nota,2),u:" / 10",d:"Média das notas de 0 a 10 dadas pelas pessoas",
      pill:nota==null?null:[nota>=7?"good":nota>=5?"warn":"crit",nota>=7?"acima de 7":nota>=5?"entre 5 e 7":"abaixo de 5"]},
    {k:"Segurança de noite",v:nf(noite,2),u:" / 5",d:"A pior nota média de toda a pesquisa",
      pill:noite==null?null:["crit","pior nota"]},
    {k:"Evitam ruas por medo",v:pf(evita),u:"",d:"Disseram que evitam certos caminhos por segurança",
      pill:evita>=.8?["crit","quase todos"]:null},
    {k:"Trecho sem bancos",v:pf(semBanco),u:"",d:"Disseram que não há banco nenhum no trecho",
      pill:semBanco>=.5?["warn","maioria dos trechos"]:null},
    {k:"Importância da sombra",v:nf(sombraImp,2),u:" / 5",d:"A maior nota média de toda a pesquisa",
      pill:["good","consenso"]}];
  const box=document.getElementById("kpis"); box.innerHTML="";
  tiles.forEach(t=>{
    const d=document.createElement("div"); d.className="kpi";
    d.innerHTML='<div class="k">'+t.k+'</div><div class="v">'+t.v+(t.u?"<small>"+t.u+"</small>":"")+
      '</div><div class="d">'+t.d+"</div>"+(t.pill?'<span class="pill '+t.pill[0]+'">'+t.pill[1]+"</span>":"");
    box.append(d);
  });
  const gaps=[
    {l:"O quanto as pessoas valorizam a sombra",v:sombraImp==null?null:sombraImp/5,
      raw:nf(sombraImp,2)+" / 5",c:"var(--s3)"},
    {l:"Trechos onde há banco na sombra",v:share(cur,"bancos_com_sombra","Sim"),
      raw:pf(share(cur,"bancos_com_sombra","Sim")),c:"var(--s2)"},
    {l:"Paradas de ônibus com cobertura",v:share(cur,"parada_com_protecao_climatica","Sim"),
      raw:pf(share(cur,"parada_com_protecao_climatica","Sim")),c:"var(--s2)"}];
  const tb=document.getElementById("thesisbars"); tb.innerHTML="";
  tb.insertAdjacentHTML("beforeend",'<span class="eyebrow">O que as pessoas querem e o que existe</span>');
  gaps.forEach(g=>{
    const d=document.createElement("div"); d.className="gapbar";
    d.innerHTML='<div class="gl"><span>'+g.l+'</span><b>'+g.raw+'</b></div>'+
      '<div class="gaptrack"><div class="gapfill" style="width:'+((g.v||0)*100)+'%;background:'+g.c+'"></div></div>';
    tb.append(d);
  });
  tb.insertAdjacentHTML("beforeend",'<p style="font-size:12px;color:var(--muted);margin:2px 0 0">'+
    "A barra de cima é a nota que as pessoas deram à importância da sombra. As duas de baixo mostram "+
    "o quanto ela existe de fato nos trechos onde elas foram entrevistadas.</p>");
}

/* ---- 01 gradiente racial ---- */
const RACAS=["Branca","Parda","Preta"];
function renderGrad(box,w){
  const panels=[
    {t:"Todas as respostas",rows:cur},
    {t:"Só Ilha do Fundão",rows:cur.filter(r=>V(r,"bairro")==="Fundão")},
    {t:"Só estudantes",rows:cur.filter(r=>V(r,"perfil_respondente")==="Estudante")}];
  const tblRows=[];
  panels.forEach((p,i)=>{
    const items=RACAS.map(ra=>{const g=p.rows.filter(r=>V(r,"raca_cor")===ra);
      return {label:ra,value:avg(g,"nota_caminhabilidade"),n:g.length};});
    const head=document.createElement("div");
    head.innerHTML='<span class="eyebrow" style="display:block;margin:'+(i?18:2)+'px 0 2px">'+
      (i+1)+" · "+p.t+" ("+p.rows.length+")</span>";
    box.append(head);
    hbar(box,w,{items,max:10,ticks:[0,5,10],rowH:26,color:"var(--s1)",
      fmtV:x=>nf(x,2),axisFmt:t=>t});
    items.forEach(it=>tblRows.push([p.t,it.label,it.n,nf(it.value,2)]));
  });
  table("ch-grad",["Recorte","Raça/cor","n","Nota média"],tblRows);
}

/* ---- 01 dificuldades por raca ---- */
function renderDif(box,w){
  const A=cur.filter(r=>V(r,"raca_cor_agrupada")==="Branca");
  const B=cur.filter(r=>V(r,"raca_cor_agrupada")==="Preta/Parda");
  const S=SERIES();
  const series=[{name:"Branca (n="+A.length+")",color:S.s1},{name:"Preta ou parda (n="+B.length+")",color:S.s2}];
  const items=DIFS.map(([k,lb])=>{
    const a=A.map(r=>V(r,k)), b=B.map(r=>V(r,k));
    const p=permP(a,b,5000);
    return {label:lb,values:[mean(a)||0,mean(b)||0],ns:[A.length,B.length],
      gap:(mean(b)||0)-(mean(a)||0), p, flag:p!=null&&p<.05?"p = "+nf(p,3):null};
  }).sort((x,y)=>y.gap-x.gap);
  groupedBar(box,w,{items,series,max:.8});
  legend("lg-dif",series);
  table("ch-dif",["Dificuldade","Branca","Preta ou parda","Diferença","p (permutação)"],
    items.map(d=>[d.label,pf(d.values[0]),pf(d.values[1]),
      (d.gap>=0?"+":"−")+Math.abs(Math.round(d.gap*100))+" pp",d.p==null?"–":nf(d.p,3)]));
  const fn=document.createElement("p"); fn.className="foot-note";
  fn.textContent="Cada pessoa podia marcar mais de uma dificuldade, por isso as barras não somam "+
    "100%. O aviso em vermelho marca as diferenças que dificilmente são efeito de quem por acaso "+
    "respondeu: menos de 5% de chance.";
  box.append(fn);
}

/* ---- 01 dia -> noite ---- */
function renderNoite(box,w){
  const grp=[["Todas as respostas",cur],
    ["Feminino",cur.filter(r=>V(r,"genero")==="Feminino")],
    ["Masculino",cur.filter(r=>V(r,"genero")==="Masculino")],
    ["Branca",cur.filter(r=>V(r,"raca_cor_agrupada")==="Branca")],
    ["Preta ou parda",cur.filter(r=>V(r,"raca_cor_agrupada")==="Preta/Parda")]];
  const items=grp.map(([lb,rows])=>({label:lb,a:avg(rows,"nota_seguranca_dia"),
    b:avg(rows,"nota_seguranca_noite"),n:rows.length})).filter(d=>d.n>0);
  const S=SERIES();
  const series=[{name:"De dia",color:"var(--d4)"},{name:"De noite",color:"var(--d5)"}];
  dumbbell(box,w,{items,series});
  const lg=document.createElement("div"); lg.className="legend";
  series.forEach(s=>{const d=document.createElement("span");d.className="lg dot";
    d.innerHTML='<i style="background:'+s.color+'"></i>'+s.name;lg.append(d);});
  box.append(lg);
  table("ch-noite",["Grupo","n","Segurança de dia","Segurança de noite","Queda"],
    items.map(d=>[d.label,d.n,nf(d.a,2),nf(d.b,2),"−"+nf(d.a-d.b,2)]));
}

/* ---- 01 escolaridade ---- */
const ESC_ORD=["Ensino Fundamental incompleto","Ensino Médio incompleto","Ensino Médio completo",
  "Educação Superior incompleta","Educação Superior completa","Pós-graduação (especialização, mestrado, doutorado)"];
const ESC_SHORT={"Ensino Fundamental incompleto":"Fundamental incompleto","Ensino Médio incompleto":"Médio incompleto",
  "Ensino Médio completo":"Médio completo","Educação Superior incompleta":"Superior incompleto",
  "Educação Superior completa":"Superior completo",
  "Pós-graduação (especialização, mestrado, doutorado)":"Pós-graduação"};
function renderEsc(box,w){
  const items=ESC_ORD.map(e=>{const g=cur.filter(r=>V(r,"escolaridade")===e);
    return {label:ESC_SHORT[e],value:g.length?avg(g,"nota_caminhabilidade"):null,n:g.length,
      note:g.length<4&&g.length?"pouquíssimas respostas":null};}).filter(d=>d.n>0);
  hbar(box,w,{items,max:10,ticks:[0,5,10],rowH:28,color:"var(--s1)",fmtV:x=>nf(x,2),axisFmt:t=>t});
  const r=pearson(cur,"escolaridade_ordem","nota_caminhabilidade");
  const fn=document.createElement("p"); fn.className="foot-note";
  fn.textContent="Na seleção atual, a ligação entre escolaridade e nota do trecho é de r = "+
    (r==null?"–":sf(r))+", numa escala que vai de −1 a +1 onde 0 é nenhuma ligação. Os dois grupos de "+
    "menor escolaridade têm só 3 e 4 respostas, então as médias mais altas do gráfico são também as "+
    "menos confiáveis.";
  box.append(fn);
  table("ch-esc",["Escolaridade","n","Nota média"],items.map(d=>[d.label,d.n,nf(d.value,2)]));
}

/* ---- 02 likert ---- */
function renderLikert(box,w){
  const items=LIKERT.map(([k,lb])=>{
    const p={1:0,2:0,3:0,4:0,5:0}; let vals=[];
    cur.forEach(r=>{const v=V(r,k); if(typeof v==="number"){p[v]=(p[v]||0)+1;vals.push(v);}});
    return {label:lb,p,mean:mean(vals),n:vals.length};
  }).filter(d=>d.n>0).sort((a,b)=>a.mean-b.mean);
  divStack(box,w,{items,cats:LIK_CATS()});
  legend("lg-likert",LIK_CATS().map(c=>({name:c.name,color:c.color})));
  table("ch-likert",["Item","n","1","2","3","4","5","Média"],
    items.map(d=>[d.label,d.n,d.p[1],d.p[2],d.p[3],d.p[4],d.p[5],nf(d.mean,2)]));
  const fn=document.createElement("p"); fn.className="foot-note";
  fn.textContent="Os números dentro das barras são porcentagens e o valor à direita é a média de 1 "+
    "a 5. A pergunta sobre árvores e sombra ficou fora deste gráfico porque ela mede o quanto a pessoa "+
    "acha a sombra importante, e não a qualidade do que existe no trecho. Ela está no começo da página.";
  box.append(fn);
}

/* ---- 02 mobiliario ---- */
function renderMob(box,w){
  const items=MOB.map(([k,lb])=>{
    const p={0:0,1:0,2:0}; let vals=[];
    cur.forEach(r=>{const v=V(r,k+"_ord"); if(typeof v==="number"){p[v]=(p[v]||0)+1;vals.push(v);}});
    return {label:lb,p,mean:mean(vals),n:vals.length};
  }).filter(d=>d.n>0).sort((a,b)=>a.mean-b.mean);
  divStack(box,w,{items,cats:MOB_CATS(),fmtMean:x=>nf(x,2),meanLabel:"0 a 2"});
  legend("lg-mob",MOB_CATS().map(c=>({name:c.name,color:c.color})));
  table("ch-mob",["Elemento","n","Não","Parcial","Sim","Índice 0–2"],
    items.map(d=>[d.label,d.n,d.p[0],d.p[1],d.p[2],nf(d.mean,2)]));
}

/* ---- 02 trechos ---- */
function renderTrecho(box,w){
  const ts=[...new Set(cur.map(r=>V(r,"trecho")))];
  const items=ts.map(t=>{const g=cur.filter(r=>V(r,"trecho")===t);
    return {label:t,value:avg(g,"nota_caminhabilidade"),n:g.length,
      note:"infra "+nf(avg(g,"idx_infra_fisica"),2)+" · acessib. "+nf(avg(g,"idx_acessibilidade"),2)};})
    .filter(d=>d.value!=null).sort((a,b)=>b.value-a.value);
  hbar(box,w,{items,max:10,ticks:[0,5,10],rowH:28,color:"var(--s1)",fmtV:x=>nf(x,2),axisFmt:t=>t});
  table("ch-trecho",["Trecho","n","Nota média","Índice infra","Índice segurança","Índice acessib."],
    items.map(d=>{const g=cur.filter(r=>V(r,"trecho")===d.label);
      return [d.label,d.n,nf(d.value,2),nf(avg(g,"idx_infra_fisica"),2),
        nf(avg(g,"idx_seguranca"),2),nf(avg(g,"idx_acessibilidade"),2)];}));
}

/* ---- 02 correlacoes ---- */
function renderCorr(box,w){
  const items=CORR.map(([k,lb])=>{
    const r=pearson(cur,k,"nota_caminhabilidade");
    const n=cur.filter(x=>typeof V(x,k)==="number"&&typeof V(x,"nota_caminhabilidade")==="number").length;
    return {label:lb,value:r,n};
  }).filter(d=>d.value!=null).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)).slice(0,14);
  divBar(box,w,{items});
  table("ch-corr",["Variável","n","r de Pearson"],items.map(d=>[d.label,d.n,sf(d.value)]));
  const fn=document.createElement("p"); fn.className="foot-note";
  fn.textContent="Andar junto não quer dizer causar. Todas essas respostas vieram da mesma pessoa na "+
    "mesma entrevista, e quem gostou do trecho tende a dar nota boa para tudo, o que infla os valores. "+
    "Desconforto térmico e número de dificuldades aparecem para a esquerda porque neles um valor alto "+
    "significa experiência pior.";
  box.append(fn);
}

/* ---- 03 dispersao termica ---- */
const SIT=["Céu livre","Sombra de árvore","Sombra do prédio"];
function renderScatter(box,w){
  const S=SERIES(), cmap={"Céu livre":S.s1,"Sombra de árvore":S.s3,"Sombra do prédio":S.s2};
  const groups=SIT.map(n=>({name:n,color:cmap[n]}));
  const pts=cur.filter(r=>typeof V(r,"temperatura_c")==="number"&&typeof V(r,"sensacao_termica_escala")==="number"
    &&SIT.includes(V(r,"situacao_locacional")))
    .map(r=>({x:V(r,"temperatura_c"),y:V(r,"sensacao_termica_escala"),grp:V(r,"situacao_locacional"),
      color:cmap[V(r,"situacao_locacional")],id:V(r,"id_resposta"),trecho:V(r,"trecho"),
      sens:V(r,"sensacao_termica")}));
  scatter(box,w,{pts,groups});
  legend("lg-scatter",groups.map(g=>{
    const gp=pts.filter(p=>p.grp===g.name), m=gp.length?mean(gp.map(p=>p.y)):null;
    return {name:g.name+", "+gp.length+" respostas"+(m==null?"":" · média "+nf(m,2)),color:g.color};
  }),true);
  table("ch-scatter",["Situação locacional","n","Temperatura média","Sensação média (−3…+3)","Desconforto médio"],
    SIT.map(n=>{const g=cur.filter(r=>V(r,"situacao_locacional")===n);
      return [n,g.length,nf(avg(g,"temperatura_c"),1)+" °C",nf(avg(g,"sensacao_termica_escala"),2),
        nf(avg(g,"conforto_termico_escala"),2)];}));
  const fn=document.createElement("p"); fn.className="foot-note";
  fn.textContent="A média de cada grupo está na legenda abaixo. As medições na sombra de árvore "+
    "aconteceram nos dias e horários mais quentes da coleta. Mesmo assim a sensação ficou mais perto "+
    "do neutro, o que reforça o efeito da sombra.";
  box.append(fn);
}

/* ---- 03 ashrae ---- */
function renderAshrae(box,w){
  const HEAT={"-3":"var(--d5)","-2":"var(--d4)","-1":"var(--seq2)","0":"var(--d0)","1":"var(--d2)",
    "2":"var(--d1)","3":"var(--d1)"};
  const items=ASHRAE.map(([v,lb])=>({label:lb,tick:(v>0?"+":"")+v,
    value:cur.filter(r=>V(r,"sensacao_termica_escala")===v).length,color:HEAT[String(v)]}));
  columns(box,w,{items,xlabel:["muito frio","muito calor"]});
  table("ch-ashrae",["Sensação declarada","Escala","Respostas"],
    items.map(d=>[d.label,d.tick,d.value]));
}

/* ---- 03 situacao locacional ---- */
function renderSit(box,w){
  const S=SERIES();
  const series=[{name:"Temperatura registrada (°C)",color:S.s1},
    {name:"Desconforto (0 é confortável)",color:S.s2},{name:"Nota do trecho (0 a 10)",color:S.s3}];
  const rows=SIT.map(n=>({n,g:cur.filter(r=>V(r,"situacao_locacional")===n)})).filter(d=>d.g.length);
  const sets=[["Temperatura registrada","temperatura_c",32,S.s1,"°C",1,[0,10,20,30]],
              ["Desconforto térmico","conforto_termico_escala",3,S.s2,"",2,[0,1,2,3]],
              ["Nota do trecho","nota_caminhabilidade",10,S.s3,"",2,[0,5,10]]];
  const tbl=[];
  sets.forEach(([t,k,mx,col,u,dg,tk],i)=>{
    box.insertAdjacentHTML("beforeend",'<span class="eyebrow" style="display:block;margin:'+(i?16:2)+
      'px 0 2px">'+t+(u?" ("+u+")":"")+"</span>");
    const items=rows.map(d=>({label:d.n,value:avg(d.g,k),n:d.g.length}));
    hbar(box,w,{items,max:mx,ticks:tk,rowH:25,color:col,fmtV:x=>nf(x,dg),axisFmt:x=>nf(x,0)});
    items.forEach(it=>tbl.push([t,it.label,it.n,nf(it.value,dg)]));
  });
  legend("lg-sit",series);
  table("ch-sit",["Medida","Situação locacional","n","Média"],tbl);
  const fn=document.createElement("p"); fn.className="foot-note";
  fn.textContent="São três escalas diferentes, por isso estão em três gráficos separados. Colocar "+
    "temperatura e nota no mesmo eixo daria a impressão de uma relação que os dados não mostram.";
  box.append(fn);
}

/* ---- 03 preferencia ---- */
function renderPref(box,w){
  const C={"-3":"var(--d5)","-2":"var(--d5)","-1":"var(--d4)","0":"var(--d0)","1":"var(--d2)",
    "2":"var(--d1)","3":"var(--d1)"};
  const items=PREFER.map(([v,lb])=>({label:lb,tick:(v>0?"+":"")+v,
    value:cur.filter(r=>V(r,"preferencia_termica_escala")===v).length,color:C[String(v)]}));
  columns(box,w,{items,xlabel:["queria se refrescar","queria se aquecer"]});
  table("ch-pref",["Preferência declarada","Escala","Respostas"],items.map(d=>[d.label,d.tick,d.value]));
}

/* ---- 04 perfil ---- */
const PERFIL_CARDS=[
  ["raca_cor","Raça/cor autodeclarada",["Branca","Parda","Preta"]],
  ["faixa_etaria","Faixa etária",["<18","18-29","30-44","45-59","60-69","70+"]],
  ["genero","Gênero",null],
  ["escolaridade","Escolaridade",ESC_ORD],
  ["perfil_respondente","Vínculo com o lugar",["Morador","Estudante","Trabalhador da região","Visitante"]],
  ["freq_caminhada","Frequência de caminhada",
    ["Diariamente","Todos os dias da semana","Alguns dias da semana","Só os fins de semana","Esporadicamente"]]];
function buildPerfil(){
  const g=document.getElementById("perfilgrid"); g.innerHTML="";
  PERFIL_CARDS.forEach(([col,titulo,ord],i)=>{
    const id="pf-"+i;
    const d=document.createElement("div"); d.className="card c4";
    d.innerHTML='<div class="card-top"><div><span class="eyebrow">Respostas</span><h3>'+titulo+
      '</h3></div><button class="tt-btn" data-tt="'+id+'" aria-pressed="false">Tabela</button></div>'+
      '<div class="plot" id="'+id+'"></div><div class="tbl-wrap" id="'+id+'-t"></div>';
    g.append(d);
    mount(id,(box,w)=>{
      let vals=ord?ord.slice():[...new Set(ROWS.map(r=>V(r,col)).filter(Boolean))];
      const items=vals.map(v=>({label:ESC_SHORT[v]||v,value:cur.filter(r=>V(r,col)===v).length}))
        .filter(d=>d.value>0||!ord);
      hbar(box,w,{items,color:"var(--s1)",rowH:25,fmtV:x=>String(x),
        max:Math.max(...items.map(x=>x.value),1),axisFmt:t=>Math.round(t)});
      table(id,[titulo,"Respostas","% da seleção"],items.map(x=>[x.label,x.value,
        cur.length?Math.round(x.value/cur.length*100)+"%":"–"]));
    });
  });
  g.querySelectorAll(".tt-btn").forEach(btn=>btn.addEventListener("click",()=>{
    const id=btn.dataset.tt, on=btn.getAttribute("aria-pressed")==="true";
    btn.setAttribute("aria-pressed",String(!on));
    document.getElementById(id).style.display=on?"":"none";
    document.getElementById(id+"-t").classList.toggle("on",!on);
  }));
}

/* ============ tabela geral ============ */
const COLSETS={
  base:["id_resposta","bairro","trecho","situacao_locacional","data","hora","clima","temperatura_c",
    "perfil_respondente","faixa_etaria","genero","raca_cor","escolaridade","freq_caminhada",
    "motivo_caminhar","infra_adequada_pedestres","nota_caminhabilidade","obs_tratamento"],
  notas:["id_resposta","trecho","raca_cor"].concat(LIKERT.map(l=>l[0]),
    ["idx_infra_fisica","idx_seguranca","idx_acessibilidade","nota_caminhabilidade"]),
  mob:["id_resposta","trecho"].concat(MOB.map(m=>m[0]),["utiliza_mobiliario","sinalizacao_ajuda_seguranca"]),
  term:["id_resposta","trecho","situacao_locacional","clima","temperatura_c","isolamento_roupa","clo_ref",
    "sensacao_termica","sensacao_termica_escala","preferencia_termica","conforto_termico",
    "percepcao_sol","percepcao_vento","percepcao_umidade","confortavel_cond_atmosfericas"],
  all:COLS};
let sortCol=null, sortDir=1;
function renderTable(){
  const set=COLSETS[document.getElementById("colset").value]||COLSETS.base;
  const q=(document.getElementById("q").value||"").toLowerCase().trim();
  let rows=cur.filter(r=>!q||set.some(c=>String(V(r,c)??"").toLowerCase().includes(q)));
  if(sortCol&&set.includes(sortCol)){
    rows=rows.slice().sort((a,b)=>{
      const x=V(a,sortCol),y=V(b,sortCol);
      if(x==null)return 1; if(y==null)return -1;
      return (typeof x==="number"&&typeof y==="number" ? x-y : String(x).localeCompare(String(y),"pt-BR"))*sortDir;
    });
  }
  let h="<table><thead><tr>"+set.map(c=>"<th data-c='"+c+"'>"+c.replace(/_/g," ")+
    (sortCol===c?(sortDir>0?" ↑":" ↓"):"")+"</th>").join("")+"</tr></thead><tbody>";
  rows.forEach(r=>{h+="<tr>"+set.map(c=>{const v=V(r,c);
    return "<td>"+(v==null?'<span style="color:var(--muted)">—</span>':String(v))+"</td>";}).join("")+"</tr>";});
  document.getElementById("bigtable").innerHTML=h+"</tbody></table>";
  document.getElementById("tblcount").textContent=rows.length+" linha"+(rows.length===1?"":"s")+
    " · "+set.length+" colunas";
  document.querySelectorAll("#bigtable thead th").forEach(th=>th.addEventListener("click",()=>{
    const c=th.dataset.c;
    if(sortCol===c) sortDir*=-1; else {sortCol=c;sortDir=1;}
    renderTable();
  }));
}

/* ============ montagem ============ */
const mounted=[];
function mount(id,fn){const box=document.getElementById(id); if(box) mounted.push({id,box,fn});}
function drawAll(){
  renderKpis();
  mounted.forEach(m=>{
    const w=Math.max(260,Math.floor(m.box.clientWidth||m.box.parentElement.clientWidth||600));
    m.box.innerHTML=""; m.fn(m.box,w);
  });
}
/* ============ ponto de entrada ============
   Chamado por assets/dados.js quando o CSV termina de carregar. */
function iniciarPainel(dados){
  COLS.push(...dados.cols);
  ROWS.push(...dados.rows);
  COLS.forEach((c,i)=>IX[c]=i);

  cabecalho();

  mount("ch-grad",renderGrad); mount("ch-dif",renderDif); mount("ch-noite",renderNoite);
  mount("ch-esc",renderEsc); mount("ch-likert",renderLikert); mount("ch-mob",renderMob);
  mount("ch-trecho",renderTrecho); mount("ch-corr",renderCorr); mount("ch-scatter",renderScatter);
  mount("ch-ashrae",renderAshrae); mount("ch-sit",renderSit); mount("ch-pref",renderPref);
  buildPerfil();
  buildFilters();

  document.getElementById("q").addEventListener("input",renderTable);
  document.getElementById("colset").addEventListener("change",()=>{sortCol=null;renderTable();});

  let rt;
  new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(drawAll,140);}).observe(document.querySelector(".wrap"));
  /* a resolucao de token de cor e cacheada, entao o cache cai junto com o tema */
  const themeChanged=()=>{for(const k in CVAR) delete CVAR[k]; drawAll();};
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>setTimeout(themeChanged,60));
  new MutationObserver(()=>setTimeout(themeChanged,20))
    .observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});

  apply();
}

/* Contagens do cabecalho vindas do proprio arquivo, para nao mentirem
   se o CSV for regerado com mais respostas. */
function cabecalho(){
  const datas=ROWS.map(r=>V(r,"data")).filter(Boolean).sort();
  const MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const fmt=d=>{const [a,m,dd]=d.split("-");return dd+" "+MES[+m-1]+" "+a;};
  const set=(id,txt)=>{const n=document.getElementById(id); if(n) n.textContent=txt;};
  set("ntot",ROWS.length);
  set("m-respostas",ROWS.length);
  set("m-trechos",new Set(ROWS.map(r=>V(r,"trecho")).filter(Boolean)).size);
  set("m-variaveis",COLS.length);
  set("m-periodo",datas.length?fmt(datas[0])+" – "+fmt(datas[datas.length-1]):"–");
}
