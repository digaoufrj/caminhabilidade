# Caminhabilidade urbana: dados tratados e painel

## Como rodar

A página lê o CSV na hora de abrir, então precisa ser servida por HTTP. Abrir o
`index.html` com duplo clique não funciona, porque o navegador bloqueia a leitura de
arquivos no protocolo `file://`. Se você tentar, a própria página avisa e mostra o
comando abaixo.

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
│   ├── dificuldades_long.csv        uma linha por dificuldade citada
│   ├── log_tratamento.csv           as 129 alterações feitas no dado bruto
│   └── normalizar.py                script que regenera tudo acima
├── DADOS_NAO_APURADOS - ....csv     o export original do Google Forms
├── .nojekyll                        desliga o Jekyll no GitHub Pages
└── LEIA-ME.md
```

O CSV tratado é ao mesmo tempo o arquivo de entrega e a fonte de dados da página, e não
existe nenhuma cópia dos dados dentro do código. Trocar `dados_tratados/dados_normalizados.csv` por uma
versão com mais respostas atualiza todos os gráficos, filtros e contagens sem tocar em
nenhum arquivo `.js`. As contagens do cabeçalho (respostas, trechos, variáveis, período
de coleta) são derivadas do arquivo; só os números citados nos textos de análise estão
escritos à mão, porque descrevem os resultados destas 66 respostas.

### Para regerar o CSV a partir do bruto

```bash
python3 dados_tratados/normalizar.py
```

Usa apenas a biblioteca padrão do Python, sem pandas.

## Como publicar no GitHub Pages

O projeto já está no formato que o Pages espera (site estático servido da raiz):

1. Crie o repositório e envie os arquivos.
2. No repositório: **Settings → Pages**.
3. Em *Source*, escolha **Deploy from a branch**; em *Branch*, `main` e pasta `/ (root)`.
4. Salve. Em cerca de um minuto o site fica em
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Os caminhos são todos relativos, então funciona em subdiretório de repositório sem
ajuste nenhum. As duas únicas requisições externas são as fontes do Google Fonts, que
têm fontes de reserva declaradas, então a página continua legível se elas não carregarem.

## Como o CSV foi padronizado

- **Temperatura**: estava escrita de várias formas (`21°C`, `22C `, `29°c`) e ficou só o número,
  em 25 registros.
- **Bairro, trecho e tipo de abrigo**: escrita e acentos unificados (`Barra Olimpica` virou
  `Barra Olímpica`, `Ceu livre` virou `Céu livre`, `Sombra da árvore` virou `Sombra de árvore`).
  O `|` do nome do trecho virou `/`, para não conflitar com ferramentas que usam esse caractere
  como separador de coluna.
- **Faixa etária**: todas no mesmo formato. O original misturava dois tipos de traço
  (`18–29` e `60-69`), e `< 18 anos` virou `<18`.
- **Respostas de Sim / Parcial / Não**: a pergunta sobre rampas usava
  `Atende plenamente / parcialmente / Não atende`, diferente de todas as outras. Ficou no mesmo
  padrão das demais e ganhou uma coluna `_ord` com 0, 1 e 2, o que deixa os itens comparáveis
  entre si.
- **Respostas sobre calor e frio**: a sensação e a preferência foram numeradas de −3 a +3, o
  conforto de 0 a 3, e a faixa de roupa ganhou um valor numérico na coluna `clo_ref`.
- **Pergunta de marcar várias opções**: a coluna `dificuldades` virou 7 colunas de 0 e 1
  (`dif_*`) mais a contagem `dificuldades_n`. A separação respeita a opção
  *"Construções (residências, lojas, etc)"*, que tem vírgulas dentro do próprio texto.
- **Colunas criadas por mim**: `idx_infra_fisica`, `idx_seguranca` e `idx_acessibilidade` são
  médias temáticas das notas de 1 a 5. Também criei `periodo_dia`, `raca_cor_agrupada` e as
  colunas `_ordem` e `_ord`, que servem para ordenar e para calcular correlações.
- **Datas**: `16 de maio 17:15` virou `2026-05-16`, `17:15` e `2026-05-16T17:15`.

### As três decisões que mudaram algum valor

1. **Uma temperatura de 38 °C virou 28 °C** (resposta R057, 23/jun 13:30, CT/CCMN). Todas as
   outras medições do mesmo dia e do mesmo trecho ficaram entre 27 e 29 °C, então era erro de
   digitação. Está marcado na coluna `obs_tratamento` e no `log_tratamento.csv`.
2. **Um tipo de abrigo inválido ficou em branco** (a resposta R031 trazia `Nublado`, que é
   resposta de clima). Não havia como saber o valor certo.
3. **Os campos vazios continuaram vazios**, sem preencher com estimativa: 3 temperaturas,
   5 respostas sobre a roupa e 1 nota geral. A coluna `obs_tratamento` marca cada caso.

## O que os dados mostram

1. **A diferença mais forte é a de sombra.** Árvores e sombra têm a maior nota média da pesquisa
   (4,62 de 5), mas 67% das pessoas pretas responderam que falta sombra no trecho, contra 16% das
   brancas. São 51 pontos de diferença, e a chance de isso ser efeito de quem por acaso respondeu
   é de 0,6%. Carro estacionado na calçada segue o mesmo padrão: 44% contra 12%, com 4,6% de chance
   de ser acaso.
2. **A nota do trecho cai de 7,32 entre pessoas brancas para 6,80 entre pardas e 5,44 entre
   pretas.** Essa ordem continua a mesma olhando só para o Fundão (7,17 / 6,64 / 5,88) e só para
   os estudantes (7,06 / 6,12 / 4,50). Mas com 66 respostas a chance de ser acaso é de cerca de
   10%, alta demais para tratar como conclusão.
3. **A avaliação da calçada em si quase não muda entre os grupos** (índice de 2,92 / 2,79 / 2,93
   dentro do Fundão). A diferença aparece na sensação de segurança e na falta de sombra, não no
   julgamento técnico do piso e da largura.
4. **Segurança de noite é a pior nota da pesquisa** (2,03 de 5), e 85% das pessoas disseram que
   evitam certos caminhos por medo. As mulheres deram 1,70 e os homens 2,29.
5. **A sombra muda a sensação de calor.** Quem estava na sombra de árvore ficou mais perto do
   neutro (−0,05) do que quem estava a céu livre (−0,71), mesmo tendo sido entrevistado em
   temperaturas mais altas.

## O que a pesquisa não permite concluir

- **Quem respondeu é, em boa parte, gente da universidade**: 39 das 66 pessoas são estudantes e
  55 foram entrevistadas na Ilha do Fundão. Os resultados falam sobre esses trechos, e não sobre a
  cidade toda.
- **Não existe pergunta de renda nem de tipo de moradia no formulário.** Onde a análise fala de
  moradia, o que está sendo usado no lugar é a coluna `perfil_respondente` (moradora, estudante,
  trabalhadora, visitante) junto com o bairro. Onde fala de perfil econômico, o que está sendo
  usado é a escolaridade. Incluir renda e tipo de casa numa próxima rodada deixaria essa parte
  bem mais firme.
- **Alguns grupos têm pouquíssimas respostas**: 9 pessoas pretas, 3 com ensino fundamental
  incompleto, 2 com pós-graduação. As médias desses grupos variam muito e não são confiáveis.
- **As respostas vieram todas da mesma pessoa na mesma entrevista.** Quem gostou do trecho tende
  a dar nota boa para tudo, e isso infla as correlações. Andar junto não quer dizer causar.
