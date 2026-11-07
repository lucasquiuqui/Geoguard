# 🌿 GeoGuard — Monitoramento geoespacial da Amazônia

**Uma aplicação web para explorar, visualizar e interpretar mapas de risco de desmatamento na Amazônia.**


> **Status:** protótipo acadêmico desenvolvido no Instituto Militar de Engenharia (IME). A versão deste repositório apresenta dados históricos de 2022; não é um serviço de monitoramento em tempo real.

## 🎯 O problema e a solução

A grande extensão da Amazônia dificulta o acompanhamento territorial e a interpretação de informações ambientais. O **GeoGuard** busca tornar resultados de análises geoespaciais mais acessíveis por meio de uma interface de monitoramento.

A aplicação transforma arquivos **GeoTIFF** contendo valores de risco em camadas visuais sobre um mapa interativo. O usuário pode alternar entre períodos, observar a distribuição espacial dos valores e consultar estatísticas resumidas por faixa de risco.

O projeto foi desenvolvido em equipe como parte da disciplina de **Introdução a Projeto de Engenharia II**, no **Instituto Militar de Engenharia (IME)**, com foco em uma possível aplicação de apoio ao monitoramento ambiental e territorial.

## ✨ Funcionalidades

- **Mapa interativo:** visualização das camadas geoespaciais sobre um mapa-base do OpenStreetMap, utilizando OpenLayers.
- **Navegação temporal:** seleção de **nove camadas GeoTIFF**, identificadas por quinzenas entre **janeiro e maio de 2022**.
- **Visualização de risco:** conversão dos valores dos arquivos raster em imagens coloridas com gradiente do verde ao vermelho.
- **Indicadores por camada:** cálculo da proporção de pixels válidos classificados como risco baixo, médio ou alto.
- **Interface web:** páginas de apresentação do projeto, monitoramento, informações da equipe e contato.

### Classificação de risco utilizada no código

| Faixa | Valor no raster | Interpretação na interface |
| --- | --- | --- |
| Baixo | `0 ≤ valor ≤ 0,50` | Risco baixo |
| Médio | `0,50 < valor ≤ 0,75` | Risco moderado |
| Alto | `valor > 0,75` | Risco alto |

Esses limites são definidos na função `calculate_statistics()`, em `meu_app/routes.py`. Os percentuais indicam a **distribuição dos pixels válidos** em cada faixa; não correspondem diretamente a hectares desmatados ou a medições de acurácia do modelo.

## 🛠️ Tecnologias

| Camada | Tecnologias | Papel no projeto |
| --- | --- | --- |
| Backend | **Python, Flask** | Rotas da aplicação e disponibilização dos dados |
| Dados geoespaciais | **Rasterio, NumPy** | Leitura de GeoTIFFs, georreferenciamento e estatísticas |
| Processamento visual | **Matplotlib, Pillow** | Conversão dos dados raster em imagens para exibição |
| Frontend | **HTML, CSS, JavaScript** | Interface e controles de navegação |
| Mapas | **OpenLayers, OpenStreetMap** | Exibição do mapa e sobreposição das camadas |

## 🧩 Como funciona

```text
Arquivos GeoTIFF com resultados de risco (prediction1.tif ... prediction9.tif)
                            │
                            ▼
                   Backend Flask
              ┌─────────────┴─────────────┐
              ▼                           ▼
     Rasterio + NumPy              Conversão em PNG
  (limites e estatísticas)       (gradiente de risco)
              │                           │
              └─────────────┬─────────────┘
                            ▼
                  API HTTP do projeto
                            │
                            ▼
              JavaScript + OpenLayers
                            │
                            ▼
         Mapa interativo e indicadores de risco
```

Entre as principais rotas da aplicação estão:

| Rota | Finalidade |
| --- | --- |
| `/` | Página inicial com mapa e apresentação |
| `/monitoramento` | Página dedicada ao monitoramento interativo |
| `/images` | Lista das camadas disponíveis e suas estatísticas |
| `/bounds/<arquivo.tif>` | Limites geográficos e projeção de uma camada |
| `/tile/<arquivo.tif>` | Imagem PNG gerada a partir de um GeoTIFF |

## ▶️ Executando localmente

### Pré-requisitos

- **Python 3.11** (versão indicada no arquivo `runtime.txt`);
- `pip` e acesso à internet para instalar as dependências;
- os arquivos GeoTIFF na pasta `meu_app/static/images/GeoTIFs/` (incluídos nesta versão do projeto).

**1.** Clone o repositório ou baixe o ZIP e abra a pasta principal do projeto, onde estão `run.py` e `requirements.txt`.

**2.** Crie um ambiente virtual:

```bash
python -m venv .venv
```

**3.** Ative o ambiente virtual:

No Windows (PowerShell):

```powershell
.venv\Scripts\Activate.ps1
```

No Linux/macOS:

```bash
source .venv/bin/activate
```

**4.** Instale as dependências:

```bash
python -m pip install -r requirements.txt
```

**5.** Inicie a aplicação:

```bash
python run.py
```

**6.** Acesse **http://localhost:5000** no navegador.

> **Nota:** estas instruções refletem a configuração presente no repositório. A execução completa não foi validada em todos os ambientes. A aplicação utiliza o servidor de desenvolvimento do Flask; para disponibilização pública, é necessário configurar um servidor e um ambiente de produção adequados.

## 📁 Estrutura principal

```text
GeoGuard/
├── meu_app/
│   ├── __init__.py            # Inicialização da aplicação Flask
│   ├── routes.py              # Páginas, endpoints e processamento raster
│   ├── templates/             # Páginas HTML
│   └── static/
│       ├── css/               # Estilos da interface
│       ├── js/                # Interação com os mapas e elementos da página
│       └── images/
│           └── GeoTIFs/       # Nove arquivos de resultados geoespaciais
├── run.py                     # Ponto de entrada da aplicação
├── requirements.txt           # Dependências Python
├── runtime.txt                # Versão de Python indicada pelo projeto
└── README.md
```

## 🤖 Onde entra a inteligência artificial?

Os arquivos `prediction1.tif` a `prediction9.tif` são apresentados pelo projeto como resultados preditivos de risco de desmatamento. **Esta versão do repositório contém a aplicação de visualização desses resultados, mas não inclui o código de treinamento, geração das previsões ou avaliação do modelo de IA.**

Assim, o que pode ser examinado diretamente neste código é a **integração de resultados geoespaciais a uma aplicação web**: leitura dos arquivos, processamento, classificação por faixas, disponibilização via rotas HTTP e visualização interativa. A origem detalhada dos dados e a metodologia de predição precisam ser documentadas separadamente para permitir a reprodução integral do processo.

## 👥 Equipe e contribuições

O GeoGuard é um **projeto em equipe**. Segundo a descrição de participantes disponível na página `Sobre`:

- **Lucas Quiuqui:** desenvolvimento de frontend, estrutura e personalização das interfaces, componentes, estilos e responsividade.
- **Brenno Lopes Nóbrega:** desenvolvimento frontend/backend e integração entre interface e serviços.
- **Mateus Alves:** documentação técnica, metodologia e relatórios.
- **Guilherme:** backend e integração com os resultados do modelo.
- **Caio Harley:** backend, preparação de dados e integração dos fluxos de monitoramento.

## 🚧 Limitações e próximos passos

O código disponibilizado é um **protótipo**, não uma plataforma comercial em produção. Entre as melhorias previstas ou necessárias estão:

- Documentar a **origem dos dados**, o método que produziu as previsões e as métricas de validação do modelo.
- Adicionar **capturas de tela** ou um vídeo curto demonstrando o mapa e a seleção das camadas.
- Revisar **links para manuais e relatórios** cujos arquivos não estão incluídos nesta versão do repositório.
- Revisar a configuração de **deploy**, as dependências de produção e eventuais arquivos estáticos ausentes.
- Implementar, caso faça parte da evolução do projeto, **atualização automatizada de dados**, testes e monitoramento operacional.

## 🌎 Contexto

O projeto foi pensado como uma contribuição acadêmica à aplicação de tecnologia no monitoramento ambiental, em alinhamento temático com os **Objetivos de Desenvolvimento Sustentável 13 (Ação Climática) e 15 (Vida Terrestre)**.

---

**GeoGuard** · Instituto Militar de Engenharia (IME) · Protótipo acadêmico de visualização geoespacial
