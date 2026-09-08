/* ============================================================
   Carregamento dos dados.
   O painel nao embute os dados: ele le o CSV normalizado em
   tempo de execucao. Trocar o CSV atualiza o painel inteiro,
   sem passo de build.
   ============================================================ */
"use strict";

const FONTE_CSV = "dados_tratados/dados_normalizados.csv";

/* Parser de CSV conforme RFC 4180: campos entre aspas podem conter
   virgula, quebra de linha e aspas escapadas (""). Necessario aqui
   porque a coluna `dificuldades` tem opcoes com virgula no proprio
   texto, como "Construcoes (residencias, lojas, etc)". */
function parseCSV(texto){
  const t = texto.replace(/^﻿/, "");            // descarta BOM
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for(let i = 0; i < t.length; i++){
    const c = t[i];
    if(aspas){
      if(c === '"'){
        if(t[i+1] === '"'){ campo += '"'; i++; }      // aspas escapadas
        else aspas = false;
      } else campo += c;
      continue;
    }
    if(c === '"'){ aspas = true; }
    else if(c === ","){ linha.push(campo); campo = ""; }
    else if(c === "\n" || c === "\r"){
      if(c === "\r" && t[i+1] === "\n") i++;
      linha.push(campo); campo = "";
      if(linha.length > 1 || linha[0] !== "") linhas.push(linha);
      linha = [];
    }
    else campo += c;
  }
  linha.push(campo);
  if(linha.length > 1 || linha[0] !== "") linhas.push(linha);
  return linhas;
}

/* Uma coluna e numerica quando todo valor preenchido dela e um numero.
   Os graficos testam `typeof v === "number"`, entao a tipagem tem de
   acontecer no carregamento e nao no uso. */
const NUMERICO = /^-?\d+(?:\.\d+)?$/;

function tipar(linhas){
  const cols = linhas[0].map(c => c.trim());
  const cruas = linhas.slice(1).filter(l => l.some(v => v.trim() !== ""));
  const ehNum = cols.map((_, j) => {
    let algum = false;
    for(const l of cruas){
      const v = (l[j] ?? "").trim();
      if(v === "") continue;
      if(!NUMERICO.test(v)) return false;
      algum = true;
    }
    return algum;
  });
  const rows = cruas.map(l => cols.map((_, j) => {
    const v = (l[j] ?? "").trim();
    if(v === "") return null;                          // vazio = ausente, nunca 0
    return ehNum[j] ? Number(v) : v;
  }));
  return { cols, rows };
}

/* --- telas de carregamento e erro --- */
function bootBox(){
  let b = document.getElementById("boot");
  if(!b){
    b = document.createElement("div");
    b.id = "boot";
    document.body.prepend(b);
  }
  return b;
}
function bootErro(titulo, corpo){
  const b = bootBox();
  b.innerHTML = '<h2></h2>' + corpo;
  b.querySelector("h2").textContent = titulo;
  document.querySelectorAll("header.top, .wrap").forEach(n => n.style.display = "none");
}

async function carregar(){
  const b = bootBox();
  b.innerHTML = '<div class="spin"></div><p>Carregando as respostas…</p>';

  if(location.protocol === "file:"){
    bootErro("Precisa de um servidor local", `
      <p>Esta página lê o arquivo <code>${FONTE_CSV}</code> na hora de abrir, e o navegador
      bloqueia a leitura de arquivos quando a página é aberta com duplo clique
      (protocolo <code>file://</code>).</p>
      <p>Rode um servidor estático na raiz do projeto e abra pelo endereço que ele imprimir:</p>
      <pre>python3 -m http.server 8000
# depois abra http://localhost:8000</pre>
      <p>No GitHub Pages isso não acontece, porque lá a página já é servida por HTTP.</p>`);
    return;
  }

  let texto;
  try{
    const res = await fetch(FONTE_CSV, { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status + " " + res.statusText);
    texto = await res.text();
  }catch(e){
    bootErro("Não foi possível ler o CSV", `
      <p>A página tentou carregar <code>${FONTE_CSV}</code> e recebeu:</p>
      <pre>${String(e.message || e)}</pre>
      <p>Confira se o arquivo existe nesse caminho, relativo ao <code>index.html</code>,
      e se o servidor está rodando na raiz do projeto.</p>`);
    return;
  }

  let dados;
  try{
    dados = tipar(parseCSV(texto));
    if(!dados.rows.length) throw new Error("o arquivo não tem nenhuma linha de dados");
    if(!dados.cols.includes("id_resposta")) throw new Error("falta a coluna id_resposta");
  }catch(e){
    bootErro("O CSV não está no formato esperado", `
      <p>${String(e.message || e)}</p>
      <p>O painel espera o CSV gerado pelo <code>dados_tratados/normalizar.py</code>,
      com uma linha por resposta e a coluna <code>id_resposta</code> identificando cada uma.</p>`);
    return;
  }

  b.remove();
  iniciarPainel(dados);
}

/* --- tema: respeita o sistema por padrao, memoriza a escolha manual --- */
(function tema(){
  try{
    const salvo = localStorage.getItem("tema");
    if(salvo === "dark" || salvo === "light") document.documentElement.dataset.theme = salvo;
  }catch(e){ /* navegacao privada pode bloquear o acesso: segue no tema do sistema */ }
  document.addEventListener("click", e => {
    if(!e.target.closest(".theme-btn")) return;
    const escuroAgora = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const novo = escuroAgora ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try{ localStorage.setItem("tema", novo); }catch(e){ /* sem persistencia, tudo bem */ }
  });
})();

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", carregar);
else carregar();
