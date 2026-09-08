# -*- coding: utf-8 -*-
"""Normalizacao dos dados da pesquisa de caminhabilidade (Google Forms).
Entrada : DADOS_NAO_APURADOS - Respostas ao formulario 1.csv
Saidas  : dados_normalizados.csv, dificuldades_long.csv, dicionario_dados.csv,
          log_tratamento.md, dashboard/dados.json
"""
import csv, json, os, re, statistics, unicodedata

BASE = "/home/rodrigo/Programs/extensao"
SRC  = os.path.join(BASE, "DADOS_NAO_APURADOS - Respostas ao formulário 1.csv")
OUT  = os.path.join(BASE, "dados_tratados")
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(BASE, "dashboard"), exist_ok=True)

ANO = 2026
log = []   # (id, campo, valor_original, valor_novo, motivo)

def blank(v):
    return v is None or str(v).strip() == ""

# ---------------------------------------------------------------- utilitarios
MESES = {"janeiro":1,"fevereiro":2,"marco":3,"março":3,"abril":4,"maio":5,"junho":6,
         "julho":7,"agosto":8,"setembro":9,"outubro":10,"novembro":11,"dezembro":12}

def parse_dt(s):
    """'16 de maio 17:15' -> ('2026-05-16', '17:15', '2026-05-16T17:15')"""
    m = re.match(r"\s*(\d{1,2})\s+de\s+([a-zçã]+)\s+(\d{1,2}):(\d{2})", s.strip(), re.I)
    if not m:
        return "", "", ""
    d, mes, h, mi = int(m.group(1)), m.group(2).lower(), int(m.group(3)), int(m.group(4))
    mm = MESES.get(mes)
    if not mm:
        return "", "", ""
    data = f"{ANO}-{mm:02d}-{d:02d}"
    hora = f"{h:02d}:{mi:02d}"
    return data, hora, f"{data}T{hora}"

def num(v):
    """int/float a partir de texto sujo ('21°C', '22C ') -> 21"""
    if blank(v):
        return None
    t = str(v).replace(",", ".")
    m = re.search(r"-?\d+(?:\.\d+)?", t)
    if not m:
        return None
    f = float(m.group(0))
    return int(f) if f == int(f) else f

def txt(v):
    return re.sub(r"\s+", " ", str(v)).strip()

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")

# ------------------------------------------------------- mapas de padronizacao
BAIRRO = {"barra olimpica": "Barra Olímpica", "barra da tijuca": "Barra da Tijuca",
          "fundao": "Fundão", "camorim": "Camorim"}

TRECHO = {"CT | CCMN (lado CCMN)": "CT/CCMN (lado CCMN)",
          "CT | CCMN (lado CT)":   "CT/CCMN (lado CT)"}

SIT_LOC = {"ceu livre": "Céu livre", "sombra de arvore": "Sombra de árvore",
           "sombra da arvore": "Sombra de árvore", "sombra do predio": "Sombra do prédio"}

FAIXA = {"< 18 anos": ("<18", 1), "18–29": ("18-29", 2), "18-29": ("18-29", 2),
         "30–44": ("30-44", 3), "30-44": ("30-44", 3), "45–59": ("45-59", 4),
         "45-59": ("45-59", 4), "60–69": ("60-69", 5), "60-69": ("60-69", 5),
         "70 ou mais": ("70+", 6)}

ESCOLA = {"Ensino Fundamental incompleto": 1, "Ensino Fundamental completo": 2,
          "Ensino Médio incompleto": 3, "Ensino Médio completo": 4,
          "Educação Superior incompleta": 5, "Educação Superior completa": 6,
          "Pós-graduação (especialização, mestrado, doutorado)": 7}

FREQ = {"Esporadicamente": 1, "Só os fins de semana": 2, "Alguns dias da semana": 3,
        "Diariamente": 4, "Todos os dias da semana": 4}

CLO = {"Até 0.5 clo (vestimenta de verão)":                 ("Até 0,5 clo (verão)", 1, 0.5),
       "Entre 0.5 e 1 clo (vestimenta de meia estação)":     ("0,5–1 clo (meia estação)", 2, 0.75),
       "Acima de 1 clo (vestimenta de inverno)":             ("Acima de 1 clo (inverno)", 3, 1.25)}

# Sim / Parcial / Nao  -> texto padronizado + ordinal 0..2
SPN = {"sim": ("Sim", 2), "parcial": ("Parcial", 1), "nao": ("Não", 0),
       "atende plenamente": ("Sim", 2), "atende parcialmente": ("Parcial", 1),
       "nao atende": ("Não", 0), "mais ou menos": ("Parcial", 1)}

INFRA3 = {"sim": ("Sim", 2), "mais ou menos": ("Mais ou menos", 1), "nao": ("Não", 0)}

SENSACAO = {"Muito frio": -3, "Frio": -2, "Um pouco de frio": -1, "Nem frio nem calor": 0,
            "Um pouco de calor": 1, "Calor": 2, "Muito calor": 3}

PREFERE = {"Bem mais aquecido": 3, "Mais aquecido": 2, "Um pouco mais aquecido": 1,
           "Assim mesmo": 0, "Um pouco mais refrescado": -1, "Mais refrescado": -2,
           "Bem mais refrescado": -3}

CONFORTO = {"Confortável": 0, "Um pouco desconfortável": 1, "Desconfortável": 2,
            "Muito desconfortável": 3}

DIFICULDADES = ["Construções (residências, lojas, etc)",   # primeiro: contem virgulas
                "Falta de bancos ou locais para descanso",
                "Excesso de carros e/ou motos estacionados",
                "Sensação de insegurança", "Trânsito perigoso",
                "Calçadas ruins", "Falta de sombra"]

DIF_COL = {"Construções (residências, lojas, etc)":      "dif_construcoes",
           "Falta de bancos ou locais para descanso":     "dif_falta_bancos",
           "Excesso de carros e/ou motos estacionados":   "dif_carros_estacionados",
           "Sensação de insegurança":                     "dif_inseguranca",
           "Trânsito perigoso":                           "dif_transito_perigoso",
           "Calçadas ruins":                              "dif_calcadas_ruins",
           "Falta de sombra":                             "dif_falta_sombra"}

def key(v):
    return slug(txt(v)).replace("_", " ")

def spn(v, rid, campo):
    if blank(v):
        return "", ""
    k = key(v)
    if k not in SPN:
        log.append((rid, campo, txt(v), "", "valor fora do dominio Sim/Parcial/Não"))
        return "", ""
    return SPN[k]

def split_dificuldades(v):
    """separa o multi-select respeitando a opcao que contem virgulas"""
    if blank(v):
        return []
    resto, achadas = txt(v), []
    for opt in DIFICULDADES:
        if opt in resto:
            achadas.append(opt)
            resto = resto.replace(opt, "")
    sobra = [t.strip() for t in resto.split(",") if t.strip(" ,")]
    return sorted(achadas, key=lambda o: DIFICULDADES.index(o)) + sobra

# ------------------------------------------------------------------- leitura
with open(SRC, encoding="utf-8") as f:
    raw = list(csv.reader(f))
hdr, rows = raw[0], [r for r in raw[1:] if any(c.strip() for c in r)]

C = {  # indices das colunas de origem
 "bairro":0, "trecho":1, "sit":2, "dt":3, "clima":4, "temp":5, "clo":6, "perfil":7,
 "remedio":8, "comorb":9, "faixa":10, "genero":11, "raca":12, "escola":13, "freq":14,
 "motivo":15, "barreira":16, "infra":17, "larg":18, "pav":19, "espaco":20, "arvores":21,
 "seg_dia":22, "seg_noite":23, "acess_pcd":24, "acess_mul":25, "evita":26, "dific":27,
 "p_bancos":28, "p_lixeiras":29, "p_onibus":30, "p_placas":31, "n_bancos":32,
 "n_ilum":33, "n_faixas":34, "n_placas":35, "rampas":36, "bancos_sombra":37,
 "sinal_incl":38, "existe_parada":39, "parada_prot":40, "usa_mob":41, "sinal_ajuda":42,
 "sensacao":43, "prefere":44, "conforto":45, "sol":46, "vento":47, "umidade":48,
 "conf_atm":49, "nota":50 }

def g(row, k):
    i = C[k]
    return row[i] if i < len(row) else ""

registros, dif_long = [], []

for n, row in enumerate(rows, start=1):
    rid = f"R{n:03d}"
    obs = []

    # --- localizacao -------------------------------------------------------
    b_raw = txt(g(row, "bairro"))
    bairro = BAIRRO.get(key(b_raw), b_raw)
    if bairro != b_raw:
        log.append((rid, "bairro", b_raw, bairro, "grafia/acentuacao padronizada"))
        obs.append("bairro padronizado")

    t_raw = txt(g(row, "trecho"))
    trecho = TRECHO.get(t_raw, t_raw)
    if trecho != t_raw:
        log.append((rid, "trecho", t_raw, trecho, "separador '|' trocado por '/'"))

    s_raw = txt(g(row, "sit"))
    if blank(s_raw):
        sit = ""
    elif key(s_raw) in SIT_LOC:
        sit = SIT_LOC[key(s_raw)]
        if sit != s_raw:
            log.append((rid, "situacao_locacional", s_raw, sit, "grafia/acentuacao padronizada"))
    else:
        sit = ""
        log.append((rid, "situacao_locacional", s_raw, "", "valor invalido (resposta de clima) -> nulo"))
        obs.append(f"situacao_locacional invalida ('{s_raw}') -> nulo")

    # --- tempo -------------------------------------------------------------
    dt_raw = txt(g(row, "dt"))
    data, hora, iso = parse_dt(dt_raw)
    if not iso:
        log.append((rid, "data_hora", dt_raw, "", "nao foi possivel interpretar"))
    hh = int(hora[:2]) if hora else None
    periodo = "" if hh is None else ("Manhã" if hh < 12 else "Tarde" if hh < 18 else "Noite")

    clima = txt(g(row, "clima"))

    temp_raw = txt(g(row, "temp"))
    temp = num(temp_raw)
    if temp is not None and str(temp) != temp_raw:
        log.append((rid, "temperatura_c", temp_raw, str(temp), "unidade/simbolo removido"))
    if temp == 38:  # outlier confirmado: demais medicoes do dia/trecho entre 27 e 29
        log.append((rid, "temperatura_c", "38", "28", "erro de digitacao (dia/trecho com 27-29 °C)"))
        obs.append("temperatura 38 -> 28 (erro de digitacao)")
        temp = 28
    if blank(temp_raw):
        obs.append("temperatura nao informada")

    clo_raw = txt(g(row, "clo"))
    clo_lbl, clo_ord, clo_ref = CLO.get(clo_raw, ("", "", ""))
    if blank(clo_raw):
        obs.append("isolamento da roupa nao informado")
    elif not clo_lbl:
        log.append((rid, "isolamento_roupa", clo_raw, "", "valor fora do dominio"))

    # --- perfil ------------------------------------------------------------
    f_raw = txt(g(row, "faixa"))
    faixa, faixa_ord = FAIXA.get(f_raw, ("", ""))
    if f_raw and not faixa:
        log.append((rid, "faixa_etaria", f_raw, "", "valor fora do dominio"))
    elif faixa != f_raw and f_raw:
        log.append((rid, "faixa_etaria", f_raw, faixa, "notacao padronizada (hifen simples)"))

    esc = txt(g(row, "escola"))
    freq = txt(g(row, "freq"))
    infra_txt, infra_ord = INFRA3.get(key(g(row, "infra")), ("", ""))

    # --- dificuldades ------------------------------------------------------
    difs = split_dificuldades(g(row, "dific"))
    for d in difs:
        dif_long.append({"id_resposta": rid, "dificuldade": d})
    flags = {DIF_COL[d]: (1 if d in difs else 0) for d in DIFICULDADES}

    # --- notas 1-5 / 0-10 --------------------------------------------------
    N = {k: num(g(row, k)) for k in ("larg","pav","espaco","arvores","seg_dia","seg_noite",
                                     "acess_pcd","acess_mul","n_bancos","n_ilum","n_faixas","n_placas")}
    nota = num(g(row, "nota"))
    if blank(g(row, "nota")):
        obs.append("nota geral nao informada")

    def media(keys):
        vals = [N[k] for k in keys if N[k] is not None]
        return round(statistics.mean(vals), 2) if vals else ""

    rampas_txt, rampas_ord = spn(g(row, "rampas"), rid, "rampas_cadeirantes")

    reg = {
      "id_resposta": rid,
      # contexto
      "bairro": bairro, "trecho": trecho, "situacao_locacional": sit,
      "data": data, "hora": hora, "data_hora_iso": iso,
      "mes": {5:"Maio",6:"Junho"}.get(int(data[5:7]), "") if data else "",
      "periodo_dia": periodo,
      "clima": clima, "temperatura_c": temp if temp is not None else "",
      "isolamento_roupa": clo_lbl, "clo_ordinal": clo_ord, "clo_ref": clo_ref,
      # perfil
      "perfil_respondente": txt(g(row, "perfil")),
      "usa_remedio_continuo": txt(g(row, "remedio")),
      "comorbidade": txt(g(row, "comorb")),
      "faixa_etaria": faixa, "faixa_etaria_ordem": faixa_ord,
      "genero": txt(g(row, "genero")),
      "raca_cor": txt(g(row, "raca")),
      "raca_cor_agrupada": {"Preta":"Preta/Parda","Parda":"Preta/Parda"}.get(txt(g(row,"raca")), txt(g(row,"raca"))),
      "escolaridade": esc, "escolaridade_ordem": ESCOLA.get(esc, ""),
      # habitos e percepcao geral
      "freq_caminhada": freq, "freq_caminhada_ordem": FREQ.get(freq, ""),
      "motivo_caminhar": txt(g(row, "motivo")),
      "barreira_principal": txt(g(row, "barreira")),
      "infra_adequada_pedestres": infra_txt, "infra_adequada_ordem": infra_ord,
      # notas 1-5
      "nota_largura_calcada": N["larg"] if N["larg"] is not None else "",
      "nota_pavimentacao": N["pav"] if N["pav"] is not None else "",
      "nota_espaco_livre": N["espaco"] if N["espaco"] is not None else "",
      "nota_import_arvores_sombra": N["arvores"] if N["arvores"] is not None else "",
      "nota_seguranca_dia": N["seg_dia"] if N["seg_dia"] is not None else "",
      "nota_seguranca_noite": N["seg_noite"] if N["seg_noite"] is not None else "",
      "nota_acess_pcd_idosos": N["acess_pcd"] if N["acess_pcd"] is not None else "",
      "nota_acess_mulher_crianca": N["acess_mul"] if N["acess_mul"] is not None else "",
      "nota_estado_bancos": N["n_bancos"] if N["n_bancos"] is not None else "",
      "nota_iluminacao_publica": N["n_ilum"] if N["n_ilum"] is not None else "",
      "nota_faixas_pedestre": N["n_faixas"] if N["n_faixas"] is not None else "",
      "nota_placas_semaforos": N["n_placas"] if N["n_placas"] is not None else "",
      "evita_areas_inseguranca": txt(g(row, "evita")),
      # dificuldades
      "dificuldades": "; ".join(difs), "dificuldades_n": len(difs), **flags,
      # mobiliario / auditoria do trecho (Sim/Parcial/Nao + ordinal)
      "presenca_bancos": spn(g(row,"p_bancos"), rid,"presenca_bancos")[0],
      "presenca_bancos_ord": spn(g(row,"p_bancos"), rid,"presenca_bancos")[1],
      "presenca_lixeiras": spn(g(row,"p_lixeiras"), rid,"presenca_lixeiras")[0],
      "presenca_lixeiras_ord": spn(g(row,"p_lixeiras"), rid,"presenca_lixeiras")[1],
      "presenca_ponto_onibus": spn(g(row,"p_onibus"), rid,"presenca_ponto_onibus")[0],
      "presenca_ponto_onibus_ord": spn(g(row,"p_onibus"), rid,"presenca_ponto_onibus")[1],
      "presenca_sinal_pedestre": spn(g(row,"p_placas"), rid,"presenca_sinal_pedestre")[0],
      "presenca_sinal_pedestre_ord": spn(g(row,"p_placas"), rid,"presenca_sinal_pedestre")[1],
      "rampas_cadeirantes": rampas_txt, "rampas_cadeirantes_ord": rampas_ord,
      "bancos_com_sombra": spn(g(row,"bancos_sombra"), rid,"bancos_com_sombra")[0],
      "bancos_com_sombra_ord": spn(g(row,"bancos_sombra"), rid,"bancos_com_sombra")[1],
      "sinalizacao_inclusiva": spn(g(row,"sinal_incl"), rid,"sinalizacao_inclusiva")[0],
      "sinalizacao_inclusiva_ord": spn(g(row,"sinal_incl"), rid,"sinalizacao_inclusiva")[1],
      "existe_parada_transporte": spn(g(row,"existe_parada"), rid,"existe_parada_transporte")[0],
      "existe_parada_transporte_ord": spn(g(row,"existe_parada"), rid,"existe_parada_transporte")[1],
      "parada_com_protecao_climatica": spn(g(row,"parada_prot"), rid,"parada_com_protecao_climatica")[0],
      "parada_com_protecao_climatica_ord": spn(g(row,"parada_prot"), rid,"parada_com_protecao_climatica")[1],
      "utiliza_mobiliario": spn(g(row,"usa_mob"), rid,"utiliza_mobiliario")[0],
      "utiliza_mobiliario_ord": spn(g(row,"usa_mob"), rid,"utiliza_mobiliario")[1],
      "sinalizacao_ajuda_seguranca": spn(g(row,"sinal_ajuda"), rid,"sinalizacao_ajuda_seguranca")[0],
      "sinalizacao_ajuda_seguranca_ord": spn(g(row,"sinal_ajuda"), rid,"sinalizacao_ajuda_seguranca")[1],
      # conforto termico
      "sensacao_termica": txt(g(row, "sensacao")),
      "sensacao_termica_escala": SENSACAO.get(txt(g(row, "sensacao")), ""),
      "preferencia_termica": txt(g(row, "prefere")),
      "preferencia_termica_escala": PREFERE.get(txt(g(row, "prefere")), ""),
      "conforto_termico": txt(g(row, "conforto")),
      "conforto_termico_escala": CONFORTO.get(txt(g(row, "conforto")), ""),
      "percepcao_sol": txt(g(row, "sol")),
      "percepcao_vento": txt(g(row, "vento")),
      "percepcao_umidade": txt(g(row, "umidade")),
      "confortavel_cond_atmosfericas": INFRA3.get(key(g(row, "conf_atm")), ("", ""))[0],
      "confortavel_cond_atm_ordem": INFRA3.get(key(g(row, "conf_atm")), ("", ""))[1],
      # indices derivados e nota final
      "idx_infra_fisica": media(["larg","pav","espaco","n_faixas","n_placas","n_ilum","n_bancos"]),
      "idx_seguranca": media(["seg_dia","seg_noite"]),
      "idx_acessibilidade": media(["acess_pcd","acess_mul"]),
      "nota_caminhabilidade": nota if nota is not None else "",
      "obs_tratamento": "; ".join(obs),
    }
    registros.append(reg)

# fix: 'Mais ou menos' na coluna atmosferica veio como 'Parcial' no mapa SPN? (usa INFRA3, ok)

# ------------------------------------------------------------------- escrita
campos = list(registros[0].keys())
with open(os.path.join(OUT, "dados_normalizados.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=campos)
    w.writeheader(); w.writerows(registros)

with open(os.path.join(OUT, "dificuldades_long.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id_resposta", "dificuldade"])
    w.writeheader(); w.writerows(dif_long)

with open(os.path.join(OUT, "log_tratamento.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id_resposta", "campo", "valor_original", "valor_normalizado", "motivo"])
    w.writerows(log)

with open(os.path.join(BASE, "dashboard", "dados.json"), "w", encoding="utf-8") as f:
    json.dump(registros, f, ensure_ascii=False, separators=(",", ":"))

print(f"linhas: {len(registros)} | colunas: {len(campos)} | dificuldades_long: {len(dif_long)} | log: {len(log)}")
print("\n".join(f"  {c}" for c in campos))
