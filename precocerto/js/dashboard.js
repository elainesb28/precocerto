/* =========================================================
   PreçoCerto — dashboard.js
   Monta a saudação personalizada e os números do painel.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;

  function greet(user) {
    const hour = new Date().getHours();
    const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    const heading = PC.qs("#greeting");
    const sub = PC.qs("#greeting-sub");
    if (heading) heading.textContent = saudacao + ", " + PC.firstName(user.nome) + "! 👋";
    if (sub) {
      sub.textContent =
        Store.getServices().length === 0
          ? "Seu painel está pronto. Que tal calcular o preço do primeiro serviço?"
          : "Pronto para descobrir o valor do seu próximo serviço?";
    }
  }

  function updateStats() {
    const services = Store.getServices();
    const calculations = Store.getCalculations();

    const lucro = services.reduce(function (total, service) {
      const custo = Number(service.custoTotal) || 0;
      const preco = Number(service.precoRecomendado) || 0;
      return total + Math.max(preco - custo, 0);
    }, 0);

    const somaRecomendado = services.reduce(function (total, service) {
      return total + (Number(service.precoRecomendado) || 0);
    }, 0);
    const media = services.length ? somaRecomendado / services.length : 0;

    PC.animateNumber(PC.qs("#stat-lucro"), lucro, PC.formatCurrency);
    PC.animateNumber(PC.qs("#stat-servicos"), services.length, function (value) {
      return PC.formatNumber(Math.round(value));
    });
    PC.animateNumber(PC.qs("#stat-calculos"), calculations.length, function (value) {
      return PC.formatNumber(Math.round(value));
    });
    PC.animateNumber(PC.qs("#stat-media"), media, PC.formatCurrency);
  }

  function emptyState(container, options) {
    const box = document.createElement("div");
    box.className = "empty";

    const emoji = document.createElement("div");
    emoji.className = "empty__emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = options.emoji;

    const title = document.createElement("h3");
    title.textContent = options.title;

    const text = document.createElement("p");
    text.textContent = options.text;

    const action = document.createElement("a");
    action.className = "btn btn--primary";
    action.href = options.href;
    action.textContent = options.action;

    box.appendChild(emoji);
    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(action);
    container.appendChild(box);
  }

  function renderRecentServices() {
    const container = PC.qs("#recent-services");
    if (!container) return;
    container.innerHTML = "";

    const services = Store.getServices().slice(-3).reverse();

    if (!services.length) {
      emptyState(container, {
        emoji: "📦",
        title: "Você ainda não cadastrou nenhum serviço.",
        text: "Vamos descobrir quanto vale o seu primeiro serviço?",
        action: "Calcular agora",
        href: "calculadora.html",
      });
      return;
    }

    const list = document.createElement("div");
    list.className = "history-list";

    services.forEach(function (service) {
      const category = window.PCShell.getCategory(service.categoria);

      const item = document.createElement("a");
      item.className = "history-item";
      item.href = "servico.html?id=" + encodeURIComponent(service.id);

      const mark = document.createElement("span");
      mark.className = "history-item__mark";
      mark.style.background = category.tint;
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = category.icon;

      const info = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = service.nome;
      const meta = document.createElement("p");
      meta.className = "history-item__meta";
      meta.textContent = category.label + " · custo de " + PC.formatCurrency(service.custoTotal);
      info.appendChild(title);
      info.appendChild(meta);

      const prices = document.createElement("div");
      prices.className = "history-item__prices";
      prices.appendChild(priceMini("Recomendado", service.precoRecomendado, true));

      item.appendChild(mark);
      item.appendChild(info);
      item.appendChild(prices);
      list.appendChild(item);
    });

    container.appendChild(list);
  }

  function priceMini(label, value, highlight) {
    const box = document.createElement("div");
    box.className = "price-mini" + (highlight ? " price-mini--reco" : "");
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = PC.formatCurrency(value);
    box.appendChild(span);
    box.appendChild(strong);
    return box;
  }

  function renderRecentHistory() {
    const container = PC.qs("#recent-history");
    if (!container) return;
    container.innerHTML = "";

    const calculations = Store.getCalculations().slice(0, 3);

    if (!calculations.length) {
      emptyState(container, {
        emoji: "📜",
        title: "Seu histórico ainda está vazio.",
        text: "Faça seu primeiro cálculo para começar.",
        action: "Fazer um cálculo",
        href: "calculadora.html",
      });
      return;
    }

    const list = document.createElement("div");
    list.className = "history-list";

    calculations.forEach(function (calc) {
      const item = document.createElement("a");
      item.className = "history-item";
      item.href = "resultado.html?id=" + encodeURIComponent(calc.id);

      const mark = document.createElement("span");
      mark.className = "history-item__mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "🧮";

      const info = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = calc.nome;
      const meta = document.createElement("p");
      meta.className = "history-item__meta";
      meta.textContent = PC.formatDateTime(calc.criadoEm);
      info.appendChild(title);
      info.appendChild(meta);

      const prices = document.createElement("div");
      prices.className = "history-item__prices";
      prices.appendChild(priceMini("Recomendado", calc.precoRecomendado, true));

      item.appendChild(mark);
      item.appendChild(info);
      item.appendChild(prices);
      list.appendChild(item);
    });

    container.appendChild(list);
  }

  document.addEventListener("pc:ready", function (event) {
    greet(event.detail.user);
    updateStats();
    renderRecentServices();
    renderRecentHistory();
  });
})();
