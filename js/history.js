/* =========================================================
   PreçoCerto — history.js
   Lista os cálculos realizados, com filtro por serviço.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;

  function priceMini(label, value, variant) {
    const box = document.createElement("div");
    box.className = "price-mini" + (variant ? " price-mini--" + variant : "");
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = PC.formatCurrency(value);
    box.appendChild(span);
    box.appendChild(strong);
    return box;
  }

  function fillFilter(calculations) {
    const select = PC.qs("#filter-service");
    const current = select.value;

    while (select.options.length > 1) select.remove(1);

    const names = [];
    calculations.forEach(function (calc) {
      if (names.indexOf(calc.nome) === -1) names.push(calc.nome);
    });

    names.sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
    names.forEach(function (name) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    if (names.indexOf(current) !== -1) select.value = current;
  }

  function createItem(calc) {
    const category = window.PCShell.getCategory(calc.categoria);

    const item = document.createElement("article");
    item.className = "history-item";

    const mark = document.createElement("span");
    mark.className = "history-item__mark";
    mark.style.background = category.tint;
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = category.icon;

    const info = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = calc.nome;
    const meta = document.createElement("p");
    meta.className = "history-item__meta";
    meta.textContent =
      PC.formatDateTime(calc.criadoEm) +
      " · " +
      PC.formatNumber(calc.horas, calc.horas % 1 ? 1 : 0) +
      " h · custo de " +
      PC.formatCurrency(calc.custoTotal);
    info.appendChild(title);
    info.appendChild(meta);

    const prices = document.createElement("div");
    prices.className = "history-item__prices";
    prices.appendChild(priceMini("Mínimo", calc.precoMinimo));
    prices.appendChild(priceMini("Recomendado", calc.precoRecomendado, "reco"));
    prices.appendChild(priceMini("Premium", calc.precoPremium));

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const open = document.createElement("a");
    open.className = "btn btn--soft btn--sm";
    open.href = "resultado.html?id=" + encodeURIComponent(calc.id);
    open.textContent = "Ver cálculo";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-btn icon-btn--danger";
    remove.setAttribute("aria-label", "Excluir cálculo de " + calc.nome);
    remove.textContent = "🗑️";
    remove.addEventListener("click", function () {
      PC.openConfirm({
        emoji: "🗑️",
        title: "Excluir este cálculo?",
        text: "Ele sai do histórico. O serviço salvo, se houver, continua na sua lista.",
        confirmLabel: "Excluir",
        cancelLabel: "Manter",
        danger: true,
      }).then(function (confirmed) {
        if (!confirmed) return;
        Store.deleteCalculation(calc.id);
        PC.showToast("Cálculo removido do histórico.", "success");
        render();
      });
    });

    actions.appendChild(open);
    actions.appendChild(remove);
    prices.appendChild(actions);

    item.appendChild(mark);
    item.appendChild(info);
    item.appendChild(prices);
    return item;
  }

  function render() {
    const container = PC.qs("#history-container");
    const filters = PC.qs("#history-filters");
    const count = PC.qs("#history-count");
    container.innerHTML = "";

    const all = Store.getCalculations();

    if (!all.length) {
      filters.hidden = true;
      count.textContent = "Cada cálculo que você fizer fica registrado aqui.";

      const empty = document.createElement("div");
      empty.className = "empty";
      const emoji = document.createElement("div");
      emoji.className = "empty__emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = "📜";
      const title = document.createElement("h3");
      title.textContent = "Seu histórico ainda está vazio.";
      const text = document.createElement("p");
      text.textContent = "Faça seu primeiro cálculo para começar.";
      const action = document.createElement("a");
      action.className = "btn btn--primary";
      action.href = "calculadora.html";
      action.textContent = "Calcular agora";
      empty.appendChild(emoji);
      empty.appendChild(title);
      empty.appendChild(text);
      empty.appendChild(action);
      container.appendChild(empty);
      return;
    }

    filters.hidden = false;
    fillFilter(all);

    const serviceFilter = PC.qs("#filter-service").value;
    const filtered = serviceFilter
      ? all.filter(function (calc) { return calc.nome === serviceFilter; })
      : all;

    count.textContent =
      filtered.length === all.length
        ? all.length + (all.length === 1 ? " cálculo registrado." : " cálculos registrados.")
        : "Mostrando " + filtered.length + " de " + all.length + " cálculos.";

    const list = document.createElement("div");
    list.className = "history-list";
    filtered.forEach(function (calc) { list.appendChild(createItem(calc)); });
    container.appendChild(list);
  }

  document.addEventListener("pc:ready", function () {
    PC.qs("#filter-service").addEventListener("change", render);
    render();
  });
})();
