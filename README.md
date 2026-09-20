# PreçoCerto

Aplicação web para autônomos e freelancers descobrirem quanto cobrar por seus serviços.
HTML5, CSS3 e JavaScript puro. Sem frameworks, sem backend, sem build.

## Como rodar

Abra `index.html` diretamente no navegador. Nenhum servidor é necessário.

## Estrutura

```
index.html          landing page
cadastro.html       onboarding em 3 etapas
app.html            painel inicial
calculadora.html    formulário de precificação
resultado.html      resultado + simulador + comparação
servicos.html       lista de serviços
servico.html        detalhes de um serviço
historico.html      histórico de cálculos
relatorios.html     gráficos e destaques
configuracoes.html  perfil, preferências e reset

css/style.css       design system (tokens, botões, campos, toasts, modais)
css/landing.css     landing page e onboarding
css/app.css         sidebar, topbar, dashboard, listas, relatórios
css/calculator.css  calculadora
css/result.css      resultado e simulador

js/utils.js          formatação, validação, toasts, modais, animações
js/storage.js        única camada que fala com o localStorage
js/pricing.js        motor de cálculo (sem DOM)
js/shell.js          sidebar, topbar, guarda de sessão, categorias, dicas
js/onboarding.js     landing + cadastro
js/dashboard.js      painel inicial
js/calculator.js     formulário da calculadora
js/result.js         resultado, simulador, comparação
js/services.js       lista, edição e exclusão de serviços
js/service-detail.js página de um serviço
js/history.js        histórico
js/reports.js        relatórios
js/settings.js       configurações
```

## Fórmula de preço (js/pricing.js)

1. `custoTotal = materiais + deslocamento + outros`
2. `valorHoraBase = metaMensal / horasDisponiveisMes`
   `custoMaoDeObra = valorHoraBase × horas do serviço`
3. `base = custoTotal + custoMaoDeObra`
   Com quantidade de serviços por mês informada, cada serviço precisa contribuir
   com `metaMensal / quantidade`; a base passa a ser a maior das duas exigências.
4. `baseProtegida = base × (1 + RESERVA_IMPREVISTOS)` e sobre ela se aplicam:
   - `MINIMO_MULTIPLIER` = 1.12
   - `RECOMENDADO_MULTIPLIER` = 1.35
   - `PREMIUM_MULTIPLIER` = 1.72

Todos os multiplicadores são constantes no topo de `js/pricing.js`.

## Chaves do localStorage

`precocerto_user`, `precocerto_services`, `precocerto_calculations`,
`precocerto_settings`, `precocerto_last_calculation`.

Nenhum arquivo além de `js/storage.js` chama `localStorage` diretamente. Para migrar
para Supabase ou outro banco, basta reescrever esse módulo mantendo as assinaturas
(`saveUser`, `getServices`, `saveCalculation`, etc.).

## Observações

- Os depoimentos da landing são fictícios e estão identificados como tal.
- Não há `alert()` nem `confirm()` nativos: toasts e modais são componentes próprios.
- O logout não apaga dados; apenas volta para `index.html`.
