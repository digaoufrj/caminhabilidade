# Pesquisa de caminhabilidade e conforto térmico — dados tratados

## Como rodar

A página lê o CSV em tempo de execução, então precisa ser servida por HTTP — abrir o
`index.html` com duplo clique não funciona (o navegador bloqueia leitura de arquivo no
protocolo `file://`, e a própria página avisa isso se você tentar).

Na raiz do projeto:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Qualquer servidor estático serve (`npx serve`, `php -S localhost:8000`, extensão Live
Server do VS Code). Não há passo de build, dependência de pacote nem framework.

## Estrutura

```
.
├── index.html                       página única do painel
├── assets/
│   ├── estilos.css                  tokens de cor, tipografia e layout
│   ├── painel.js                    gráficos em SVG e cálculos
│   └── dados.js                     leitura e tipagem do CSV
├── dados_tratados/
│   ├── dados_normalizados.csv       ← a fonte que a página lê
│   ├── dicionario_dados.csv         dicionário das 90 colunas
│   ├── dificuldades_long.csv        múltipla escolha em formato longo (3FN)
│   ├── log_tratamento.csv           as 129 alterações feitas no dado bruto
│   └── normalizar.py                script que regenera tudo acima
├── DADOS_NAO_APURADOS - ....csv     o export original do Google Forms
├── .nojekyll                        desliga o Jekyll no GitHub Pages
└── LEIA-ME.md
```

O CSV tratado é ao mesmo tempo o entregável e a fonte de dados da página — não existe
cópia dos dados dentro do código. Trocar `dados_tratados/dados_normalizados.csv` por uma
versão com mais respostas atualiza todos os gráficos, filtros e contagens sem tocar em
nenhum arquivo `.js`. As contagens do cabeçalho (respostas, trechos, variáveis, período
de coleta) são derivadas do arquivo; só os números citados nos textos de análise estão
escritos à mão, porque descrevem achados da amostra atual.

### Para regerar o CSV a partir do bruto

```bash
python3 dados_tratados/normalizar.py
```

Usa apenas a biblioteca padrão do Python — sem pandas.

## Como publicar no GitHub Pages

O projeto já está no formato que o Pages espera (site estático servido da raiz):

1. Crie o repositório e envie os arquivos.
2. No repositório: **Settings → Pages**.
3. Em *Source*, escolha **Deploy from a branch**; em *Branch*, `main` e pasta `/ (root)`.
4. Salve. Em cerca de um minuto o site fica em
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Os caminhos são todos relativos, então funciona em subdiretório de repositório sem
ajuste nenhum. As duas únicas requisições externas são as fontes do Google Fonts, que
têm pilha de fallback declarada — a página continua legível se elas não carregarem.

## Como o CSV foi padronizado

- **Temperatura** — unidade e símbolo de grau removidos (`21°C`, `22C `, `29°c` → `21`, `22`, `29`) em 25 registros.
- **Bairro, trecho, situação locacional** — grafia e acentuação unificadas (`Barra Olimpica` → `Barra Olímpica`, `Ceu livre` → `Céu livre`, `Sombra da árvore` → `Sombra de árvore`). O separador `|` do nome do trecho virou `/` para não conflitar com ferramentas que usam pipe como delimitador.
- **Faixa etária** — notação uniformizada para hífen simples (`18–29` e `60-69` misturavam en-dash e hífen; `< 18 anos` → `<18`).
- **Escalas Sim/Parcial/Não** — a pergunta de rampas usava `Atende plenamente / parcialmente / Não atende`; foi harmonizada com as demais e ganhou coluna `_ord` (0/1/2), tornando os itens comparáveis entre si.
- **Escalas térmicas** — sensação e preferência codificadas na escala ASHRAE de 7 pontos (−3 a +3); conforto em 0–3; faixa de clo em valor numérico de referência (`clo_ref`).
- **Múltipla escolha** — `dificuldades` virou 7 colunas binárias `dif_*` mais a contagem `dificuldades_n`. O split respeita a opção *"Construções (residências, lojas, etc)"*, que contém vírgulas.
- **Colunas derivadas** — `idx_infra_fisica`, `idx_seguranca`, `idx_acessibilidade` (médias temáticas das notas 1–5), `periodo_dia`, `raca_cor_agrupada` e as colunas `_ordem`/`_ord` para ordenar e correlacionar.
- **Datas** — `16 de maio 17:15` → `2026-05-16`, `17:15`, `2026-05-16T17:15`.

### Decisões que alteraram valor

1. **Um 38 °C virou 28 °C** (registro R057, 23/jun 13:30, CT/CCMN). Todas as outras medições do mesmo dia e trecho ficaram entre 27 e 29 °C — erro de digitação. Está marcado em `obs_tratamento` e em `log_tratamento.csv`.
2. **Uma situação locacional inválida virou nulo** (R031 trazia `Nublado`, que é resposta de clima). Não havia como inferir o valor correto.
3. **Vazios ficaram vazios, sem imputação**: 3 temperaturas, 5 isolamentos de vestimenta e 1 nota geral. A coluna `obs_tratamento` sinaliza cada caso.

## Achados principais

1. **O gap de sombra é o achado mais forte.** Árvores e sombra têm a maior nota média da pesquisa (4,62 de 5), mas 67% das pessoas pretas citaram falta de sombra contra 16% das brancas — 51 pontos de diferença, p = 0,006 num teste de permutação. Excesso de carros sobre a calçada segue o mesmo padrão (44% vs 12%, p = 0,046).
2. **A nota de caminhabilidade cai de brancos (7,32) para pardos (6,80) e pretos (5,44)** e o gradiente resiste ao controle por bairro (7,17 / 6,64 / 5,88 só no Fundão) e por vínculo (7,06 / 6,12 / 4,50 só entre estudantes). Com n = 66 fica em p ≈ 0,10 — tendência consistente, não conclusiva.
3. **O índice de infraestrutura física quase não varia por raça** (2,92 / 2,79 / 2,93 no Fundão). A desigualdade aparece na sensação de segurança e na privação de sombra, não no julgamento técnico da calçada.
4. **Segurança noturna é o pior indicador da pesquisa** (2,03 de 5) e 85% da amostra evita trajetos por medo. Mulheres pontuam 1,70 contra 2,29 dos homens.
5. **A sombra desloca a sensação térmica**: sob árvore a sensação média é −0,05 contra −0,71 a céu livre, apesar de as medições sob árvore terem ocorrido em temperaturas mais altas.

## Ressalvas metodológicas

- **A amostra é universitária**: 39 das 66 pessoas são estudantes e 55 estão na Ilha do Fundão. Não generaliza para a cidade.
- **Não há pergunta de renda nem de tipo de moradia.** Onde a análise fala de moradia, a proxy é `perfil_respondente` (morador / estudante / trabalhador / visitante) somada ao bairro; onde fala de perfil econômico, a proxy é a escolaridade. Incluir renda e tipo de domicílio numa próxima rodada tornaria essa parte conclusiva.
- **n pequeno nos subgrupos**: 9 pessoas pretas, 3 com ensino fundamental incompleto, 2 com pós-graduação. As médias desses grupos são instáveis.
- **Efeito de halo**: as correlações cruzam percepções da mesma pessoa na mesma entrevista, então parte da associação é a própria disposição de quem respondeu.
