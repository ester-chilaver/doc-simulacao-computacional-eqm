Teste# Luz no Fim do Túnel
### Neurociência Computacional — Simulação Computacional do Córtex Visual

> Uma série de módulos didáticos que conduz do movimento browniano à simulação do córtex visual primário em isquemia — construindo as ferramentas para investigar se essa simulação consegue reproduzir os fenômenos perceptuais relatados em experiências de quase-morte.

**Autores:** Ester Chilaver & Victor Gomes  
**Hospedagem:** GitHub Pages  

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Estrutura do Repositório](#estrutura-do-repositório)
- [Módulos](#módulos)
- [Design System](#design-system)
- [Como Adicionar um Novo Módulo](#como-adicionar-um-novo-módulo)
- [Como Linkar um Notebook do Colab](#como-linkar-um-notebook-do-colab)
- [Convenções de Código](#convenções-de-código)
- [Referências](#referências)

---

## Sobre o Projeto

O material é estruturado como uma progressão: cada módulo constrói sobre o anterior, usando **difusão** como fio condutor.

---

## Estrutura do Repositório

```
/
├── index.html                  ← Página inicial (hero + mapa dos módulos)
├── css/
│   ├── theme.css               ← Design system global (variáveis, componentes)
│   └── home.css                ← Estilos exclusivos da página inicial
├── js/
│   ├── utils.js                ← Utilitários compartilhados (progress bar, reveal, copy)
│   └── home.js                 ← Animação do canvas da página inicial (túnel)
└── modulos/
    ├── difusao.html            ← Módulo 01 — Fundamentos da Difusão
    ├── metodos-numericos.html  ← Módulo 02 — Métodos Numéricos
    ├── wilson-cowan.html       ← Módulo 03 — Modelos de População (em breve)
    └── campo-neural.html       ← Módulo 04 — Modelos de Campo (em breve)
```

### Caminhos de assets nos módulos

Cada página em `modulos/` referencia os assets com caminho relativo:

```html
<link rel="stylesheet" href="../css/theme.css">
<script src="../js/utils.js"></script>
```

A página `index.html` (na raiz) usa:

```html
<link rel="stylesheet" href="css/theme.css">
<script src="js/utils.js"></script>
```

---

## Módulos

| # | Arquivo | Status | Notebook Colab | Conteúdo principal |
|---|---------|--------|----------------|--------------------|
| 01 | `modulos/difusao.html` | ✅ Disponível | [Linkar](#como-linkar-um-notebook-do-colab) | Movimento Browniano · Lei de Einstein · MSD · Gaussiana |
| 02 | `modulos/metodos-numericos.html` | ✅ Disponível | [Linkar](#como-linkar-um-notebook-do-colab) | Euler · RK4 · Diferenças Finitas · Critério de von Neumann |
| 03 | `modulos/wilson-cowan.html` | 🔜 Em breve | — | Equações Wilson-Cowan · Dinâmica E-I · Análise de estabilidade |
| 04 | `modulos/campo-neural.html` | 🔜 Em breve | — | Wilson-Cowan + Difusão · Córtex V1 · Simulação de isquemia |

### Fio condutor — a difusão em cada módulo

```
Módulo 01  →  Base física: como moléculas se movem no tecido neural
Módulo 02  →  Implementação numérica: como calcular ∂²/∂x² na grade
Módulo 03  →  Ausente: apenas dinâmica temporal local
Módulo 04  →  Integração completa: termo espacial D∇²A no córtex
```

---

## Design System

Todas as variáveis visuais estão centralizadas em `css/theme.css`. **Não defina cores ou tipografia inline nos módulos** — use sempre as variáveis.

### Paleta

| Variável | Valor | Uso |
|----------|-------|-----|
| `--bg` | `#0e0e10` | Fundo global |
| `--bg-card` | `#161618` | Cards, blocos de código |
| `--amber` | `#f5a623` | Destaque principal, ícones, equações |
| `--teal` | `#4ecdc4` | Destaque secundário, gráficos, badges |
| `--text` | `#e8e4dc` | Texto principal |
| `--text-dim` | `rgba(232,228,220,0.55)` | Texto secundário, parágrafos |
| `--text-muted` | `rgba(232,228,220,0.28)` | Labels, metadados |

### Tipografia

| Variável | Fonte | Uso |
|----------|-------|-----|
| `--serif` | DM Serif Display | Títulos h1, h2, h3, blockquotes |
| `--sans` | Inter | Corpo de texto, parágrafos |
| `--mono` | IBM Plex Mono | Labels, equações, código, badges |

### Componentes disponíveis em `theme.css`

Todos os componentes abaixo existem prontos — basta usar as classes:

- **`.section`** + **`.section-label`** + **`.section-anchor`** — seção numerada com âncora para scroll
- **`.aside`** + **`.aside-title`** + **`.aside-icon`** — caixa lateral explicativa (borda âmbar)
- **`blockquote`** — citação com borda âmbar
- **`.math-block`** + **`.eq`** + **`.eq-parts`** + **`.sym`** — bloco de equação com legenda de símbolos
- **`.sim-card`** + **`.sim-header`** + **`.sim-body`** — container de simulação interativa
- **`.canvas-wrap`** — wrapper escuro para `<canvas>`
- **`.sim-controls`** + **`.ctrl-label`** — grid de controles deslizantes
- **`.sim-stat`** + **`.stat-item`** + **`.stat-l`** + **`.stat-v`** — estatísticas em tempo real
- **`.code-block`** + **`.code-header`** + **`.copy-btn`** — bloco de código com botão de copiar
- **`.notebook-bridge`** + **`.btn-colab`** — seção de chamada para o notebook
- **`.roadmap`** + **`.mod-badge`** — tabela de progresso do curso
- **`.reveal`** — animação de entrada por scroll (gerenciada por `utils.js`)
- **`.progress-bar`** — barra de progresso de leitura (gerenciada por `utils.js`)

### Syntax highlighting no código

Use as classes inline dentro de `<code>`:

```html
<span class="kw">def</span>   <!-- keyword: vermelho -->
<span class="fn">func</span>  <!-- function: azul -->
<span class="nm">42</span>    <!-- number: laranja -->
<span class="cm"># comment</span>  <!-- comment: cinza itálico -->
<span class="op">+</span>    <!-- operator: teal -->
<span class="str">"text"</span>  <!-- string: verde -->
```

---

## Como Adicionar um Novo Módulo

1. **Copie** `modulos/metodos-numericos.html` como ponto de partida.

2. **Atualize o header** — número do módulo, título, lead, meta.

3. **Atualize o rodapé** — links para módulo anterior e próximo.

4. **Atualize `index.html`** — no grid `.modules-grid`, mude o card correspondente de `div.mod-card` para `a.mod-card.active` e adicione `href`:

```html
<!-- Antes -->
<div class="mod-card">
  <div class="mod-badge-chip">Em breve</div>
  ...
</div>

<!-- Depois -->
<a href="modulos/wilson-cowan.html" class="mod-card active">
  <div class="mod-badge-chip active">Disponível</div>
  ...
  <div class="mod-cta">Acessar módulo →</div>
</a>
```

5. **Atualize a tabela roadmap** em todos os módulos existentes — marque o módulo anterior sem `.current` e o novo com `.current`.

6. Adicione **simulações interativas em JavaScript puro** — sem dependências externas, dentro de `<script>` no próprio arquivo.

---

## Como Linkar um Notebook do Colab

Cada módulo tem um bloco `.notebook-bridge` com um botão `.btn-colab`. Para linkar:

1. Abra o notebook no Google Colab.
2. Clique em **Compartilhar** → mude permissão para **"Qualquer pessoa com o link"** → **Visualizador**.
3. Copie o link. O formato será:
   ```
   https://colab.research.google.com/drive/1ABC...XYZ?usp=sharing
   ```
4. No HTML do módulo, substitua o `href` do botão:
   ```html
   <!-- Antes -->
   <a href="COLE_AQUI_O_LINK_DO_COLAB" class="btn-colab" ...>

   <!-- Depois -->
   <a href="https://colab.research.google.com/drive/SEU_ID" class="btn-colab" ...>
   ```

> **Dica:** O link direto mais limpo usa apenas o ID, sem parâmetros:  
> `https://colab.research.google.com/drive/SEU_ID`

---

## Convenções de Código

### HTML dos módulos

- Cada seção começa com `<section class="section reveal">` e um `<span class="section-anchor" id="ancora">`.
- Seções separadas por `<hr class="divider">`.
- Adicione `class="reveal"` a qualquer bloco que deve animar na entrada — o `utils.js` cuida do resto.
- IDs de âncora seguem o padrão `kebab-case` em português: `id="metodo-euler"`, `id="diferencias-finitas"`.

### JavaScript das simulações

- Cada simulação é uma IIFE `(function() { ... })()` — isolamento de escopo.
- Canvas: sempre chamar `resize()` no início e no `window.addEventListener('resize', ...)`.
- Escalar pelo `devicePixelRatio` para nitidez em telas retina.
- Controles `<input type="range">` atualizam em tempo real via `addEventListener('input', ...)`.
- Sem dependências externas — JavaScript puro.

### CSS dos módulos

- Estilos **globais** → `css/theme.css` (edite lá, não nos arquivos de módulo).
- Estilos **exclusivos do módulo** → bloco `<style>` no `<head>` do módulo.
- Nunca redefina variáveis `--` fora do `:root` em `theme.css`.

---

## Referências

1. Einstein, A. (1905). *Über die von der molekularkinetischen Theorie der Wärme geforderte Bewegung von in ruhenden Flüssigkeiten suspendierten Teilchen.* Annalen der Physik, 322(8), 549–560.
2. Fourier, J. (1822). *Théorie analytique de la chaleur.* Paris: Firmin Didot.
3. Burden, R. L., & Faires, J. D. (2011). *Numerical Analysis* (9ª ed.). Cengage Learning.
4. Strikwerda, J. C. (2004). *Finite Difference Schemes and Partial Differential Equations.* SIAM.
5. Wilson, H. R., & Cowan, J. D. (1972). Excitatory and inhibitory interactions in localized populations of model neurons. *Biophysical Journal*, 12(1), 1–24.
6. Balasubramanian, V. (2021). Brain power: Cortical organization informed by entropy and information theory. *Neuron*, 109(1), 32–42.
