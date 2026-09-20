<h1 align="center">💰 PreçoCerto</h1>

<p align="center">
  <strong>Seu trabalho vale mais do que você imagina.</strong><br>
  Aplicação web que ajuda autônomos, freelancers e pequenos empreendedores<br>
  a descobrir quanto cobrar pelos seus serviços — sem trabalhar no prejuízo.
</p>

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black">
  <img alt="Sem dependências" src="https://img.shields.io/badge/depend%C3%AAncias-0-16A34A?style=flat-square">
  <img alt="Status" src="https://img.shields.io/badge/status-prot%C3%B3tipo%20funcional-7C3AED?style=flat-square">
</p>

<p align="center">
  <img src="assets/images/preview-hero.png" alt="Tela inicial do PreçoCerto" width="820">
</p>

---

## O problema

A maior parte dos profissionais autônomos define preço olhando para o concorrente ou
chutando um valor "que parece justo". O resultado aparece meses depois: trabalho
acumulado, agenda cheia e pouco dinheiro sobrando.

O PreçoCerto inverte a ordem. Ele começa pelos **seus** números — custos, horas e meta
de faturamento — e devolve três faixas de preço com a conta explicada linha por linha.

## O que ele faz

| | |
|---|---|
| 🧮 **Calculadora de preços** | Custos, tempo, meta mensal e volume de serviços viram preço mínimo, recomendado e premium |
| 🔍 **Resultado explicado** | Um checklist mostra exatamente o que entrou na conta e por quê |
| 🎚️ **Simulador ao vivo** | Slider de margem e campo de valor livre recalculam lucro e ganho por hora na hora |
| ⚖️ **Comparação** | Confronta o que você cobra hoje com as três faixas, em linguagem neutra |
| 📦 **Meus serviços** | Serviços salvos em cards, com edição rápida e orçamento pronto para copiar |
| 📜 **Histórico** | Todo cálculo fica registrado e pode ser reaberto |
| 📊 **Relatórios** | Gráficos de barras e donut feitos só com HTML e CSS — nenhuma biblioteca |
| ⚙️ **Configurações** | Perfil, jornada mensal e exclusão total dos dados |

## Como rodar

```bash
git clone https://github.com/seu-usuario/precocerto.git
cd precocerto
```

Abra o `index.html` no navegador. **É só isso.** Sem `npm install`, sem build,
sem servidor local, sem variáveis de ambiente.

## Stack

JavaScript puro, sem framework. A escolha foi deliberada: o projeto existe para mostrar
domínio de fundamentos — arquitetura de módulos, manipulação de DOM, acessibilidade,
animação em CSS e organização de estado — sem a rede de segurança de uma biblioteca.

```
HTML5 semântico · CSS3 (custom properties, grid, flexbox) · JavaScript ES5+/vanilla
Persistência: localStorage · Tipografia: Plus Jakarta Sans + Caveat (Google Fonts)
```

## Estrutura

```
precocerto/
├── index.html              landing page
├── cadastro.html           onboarding em 3 etapas
├── app.html                painel inicial
├── calculadora.html        formulário de precificação
├── resultado.html          resultado + simulador + comparação
├── servicos.html           lista de serviços
├── servico.html            detalhes de um serviço
├── historico.html          histórico de cálculos
├── relatorios.html         gráficos e destaques
├── configuracoes.html      perfil, preferências e reset
│
├── css/
│   ├── style.css           design system: tokens, botões, campos, toasts, modais
│   ├── landing.css         landing page e onboarding
│   ├── app.css             sidebar, topbar, dashboard, listas, relatórios
│   ├── calculator.css      calculadora
│   └── result.css          resultado e simulador
│
├── js/
│   ├── utils.js            formatação, validação, toasts, modais, animações
│   ├── storage.js          única camada que fala com o localStorage
│   ├── pricing.js          motor de cálculo (zero DOM)
│   ├── shell.js            sidebar, topbar, guarda de sessão, categorias, dicas
│   ├── onboarding.js       landing + cadastro
│   ├── dashboard.js        painel inicial
│   ├── calculator.js       formulário da calculadora
│   ├── result.js           resultado, simulador, comparação
│   ├── services.js         lista, edição e exclusão de serviços
│   ├── service-detail.js   página de um serviço
│   ├── history.js          histórico
│   ├── reports.js          relatórios
│   └── settings.js         configurações
│
└── assets/
    ├── images/
    └── icons/
```

## Como o preço é calculado

Toda a lógica vive em [`js/pricing.js`](js/pricing.js), isolada da interface.

**1. Custos diretos**
```
custoTotal = materiais + deslocamento + outros
```

**2. Valor do seu tempo**
```
valorHoraBase  = metaMensal / horasDisponiveisMes
custoMaoDeObra = valorHoraBase × horas do serviço
```

**3. Base de cálculo**
```
base = custoTotal + custoMaoDeObra
```
Se você informar quantos serviços pretende fazer por mês, cada um precisa contribuir
com `metaMensal / quantidade`. A base passa a ser **a maior das duas exigências** —
assim a meta é de fato alcançável no volume informado.

**4. Reserva e faixas**
```
baseProtegida = base × (1 + RESERVA_IMPREVISTOS)

precoMinimo     = baseProtegida × 1.12
precoRecomendado= baseProtegida × 1.35
precoPremium    = baseProtegida × 1.72
```

Os multiplicadores são constantes nomeadas no topo do arquivo. Mudar a política de
preço do produto inteiro é mudar quatro números — nenhum valor está solto no meio do código.

> A margem exibida no simulador é medida **sobre a base de cálculo**, a mesma régua dos
> multiplicadores. Por isso o slider de 10% a 50% percorre exatamente o intervalo entre
> o preço mínimo e o premium, em vez de produzir valores desconectados das faixas.

## Arquitetura de dados

Nenhum arquivo além de `js/storage.js` chama `localStorage` diretamente. A interface
pede `saveService(service)`, nunca `localStorage.setItem(...)`.

```js
// js/storage.js — a interface só conhece estas assinaturas
saveUser()    getUser()        updateUser()
saveService() getServices()    getServiceById()  updateService()  deleteService()
saveCalculation()  getCalculations()  updateCalculation()  deleteCalculation()
getSettings() updateSettings() clearAllData()    initializeStorage()
```

Chaves usadas: `precocerto_user`, `precocerto_services`, `precocerto_calculations`,
`precocerto_settings`, `precocerto_last_calculation`.

**Por que isso importa:** migrar para Supabase, Firebase ou uma API REST significa
reescrever um único arquivo mantendo as assinaturas. Nenhuma tela precisa mudar.

## Decisões de produto

- **Nada de `alert()` ou `confirm()` nativos.** Toasts e modais são componentes próprios,
  com foco gerenciado, fechamento por `Esc` e clique fora.
- **Nenhuma tela vazia sem saída.** Todo estado vazio traz um convite à ação, nunca
  apenas "sem registros".
- **Linguagem neutra na comparação.** O app diz *"seu preço atual está abaixo do valor
  recomendado para este cenário"*, nunca *"você está cobrando errado"*.
- **Depoimentos identificados como fictícios**, no rótulo de cada um e em nota abaixo
  da seção. Protótipo não finge ter clientes.
- **O logout não apaga nada.** Só a exclusão explícita, em Configurações, com confirmação.

## Acessibilidade e qualidade

- HTML semântico com `fieldset`/`legend`, `aria-live` nas mensagens de erro e
  `aria-current` na navegação
- Navegação completa por teclado, com `focus-visible` em todos os controles
- `prefers-reduced-motion` respeitado: animações e contadores desligam sozinhos
- Conteúdo inserido no DOM via `textContent`, não `innerHTML`, evitando injeção
- Validação de todos os campos: sem negativos, sem horas impossíveis, e-mail conferido
- Responsivo de 320px ao desktop, sem overflow horizontal; no mobile a sidebar vira
  menu deslizante com scrim

## Roadmap

- [ ] Backend com Supabase (substituindo apenas `storage.js`)
- [ ] Geração de orçamento em PDF
- [ ] Modelos de serviço por categoria
- [ ] Comparação de cenários lado a lado
- [ ] Exportação do histórico em CSV

## Licença

MIT. Use, estude e adapte à vontade.

---

<p align="center">
  <sub>Protótipo de portfólio. Todos os dados ficam no navegador do usuário — nada é enviado a servidores.</sub>
</p>
