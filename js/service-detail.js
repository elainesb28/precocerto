/* =========================================================
   PreçoCerto — service-detail.js
   Página de um serviço: resumo do cálculo, histórico de
   recálculos, orçamento e exclusão.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;
  const Pricing = window.PCPricing;

  let service = null;

  function kvRow(label, value) {
    const line = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    line.appendChild(span);
    line.appendChild(strong);
    return line;
  }

  function renderHeader() {
    const category = window.PCShell.getCategory(service.categoria);
    const icon = PC.qs("#detail-icon");
    icon.textContent = category.icon;
    icon.style.background = category.tint;

    PC.qs("#detail-name").textContent = service.nome;
    PC.qs("#detail-meta").textContent =
      category.label + " · cadastrado em " + PC.formatDate(service.criadoEm);

    PC.animateNumber(PC.qs("#detail-min"), service.precoMinimo, PC.formatCurrency, 700);
    PC.animateNumber(PC.qs("#detail-reco"), service.precoRecomendado, PC.formatCurrency, 700);
    PC.animateNumber(PC.qs("#detail-premium"), service.precoPremium, PC.formatCurrency, 700);
  }

  function renderSummary() {
    const box = PC.qs("#detail-kv");
    box.innerHTML = "";

    const custos = service.custos || {};
    const evaluation = Pricing.evaluatePrice(service.precoRecomendado, service);

    box.appendChild(kvRow("Materiais e ferramentas", PC.formatCurrency(custos.materiais)));
    box.appendChild(kvRow("Deslocamento", PC.formatCurrency(custos.deslocamento)));
    box.appendChild(kvRow("Outros custos", PC.formatCurrency(custos.outros)));
    box.appendChild(kvRow("Custo total", PC.formatCurrency(service.custoTotal)));
    box.appendChild(
      kvRow("Tempo do serviço", PC.formatNumber(service.horas, service.horas % 1 ? 1 : 0) + " horas")
    );
    box.appendChild(kvRow("Meta mensal", PC.formatCurrency(service.metaMensal)));
    if (service.servicosPorMes > 0) {
      box.appendChild(kvRow("Serviços por mês", PC.formatNumber(service.servicosPorMes)));
    }
    box.appendChild(
      kvRow("Preço atual", service.precoAtual > 0 ? PC.formatCurrency(service.precoAtual) : "Não informado")
    );
    box.appendChild(kvRow("Ganho por hora no recomendado", PC.formatCurrency(evaluation.ganhoPorHora)));
    box.appendChild(kvRow("Margem sobre a base no recomendado", PC.formatNumber(evaluation.margemBase * 100, 1) + "%"));
  }

  function renderTimeline() {
    const list = PC.qs("#detail-timeline");
    list.innerHTML = "";

    const calculations = Store.getCalculations().filter(function (calc) {
      return calc.servicoId === service.id;
    });

    if (!calculations.length) {
      const li = document.createElement("li");
      const text = document.createElement("div");
      text.className = "muted";
      text.textContent = "Ainda não há recálculos registrados para este serviço.";
      li.appendChild(document.createElement("span"));
      li.appendChild(text);
      list.appendChild(li);
      return;
    }

    calculations.forEach(function (calc) {
      const li = document.createElement("li");

      const dot = document.createElement("span");
      dot.className = "dot";
      dot.setAttribute("aria-hidden", "true");

      const content = document.createElement("div");
      const link = document.createElement("a");
      link.href = "resultado.html?id=" + encodeURIComponent(calc.id);
      link.textContent = "Recomendado de " + PC.formatCurrency(calc.precoRecomendado);
      link.style.fontWeight = "700";

      const when = document.createElement("time");
      when.dateTime = calc.criadoEm;
      when.textContent = PC.formatDateTime(calc.criadoEm);

      content.appendChild(link);
      content.appendChild(when);
      li.appendChild(dot);
      li.appendChild(content);
      list.appendChild(li);
    });
  }

  /* Orçamento: pré-visualização em modal, pronto para copiar. */
  function openQuote() {
    const user = Store.getUser();
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Orçamento do serviço");
    modal.style.width = "min(560px, 100%)";

    const title = document.createElement("h2");
    title.className = "modal__title";
    title.textContent = "Orçamento — " + service.nome;

    const text = document.createElement("p");
    text.className = "modal__text";
    text.textContent = "Uma prévia do texto que você pode enviar ao cliente.";

    const preview = document.createElement("pre");
    preview.style.whiteSpace = "pre-wrap";
    preview.style.background = "var(--bg)";
    preview.style.border = "1px solid var(--border)";
    preview.style.borderRadius = "16px";
    preview.style.padding = "18px";
    preview.style.marginTop = "18px";
    preview.style.fontFamily = "inherit";
    preview.style.fontSize = "0.9rem";

    const linhas = [
      "Orçamento — " + service.nome,
      "Emitido por: " + (user ? user.nome : ""),
      "Data: " + PC.formatDate(new Date().toISOString()),
      "",
      "Escopo: " + window.PCShell.getCategory(service.categoria).label,
      "Tempo estimado: " + PC.formatNumber(service.horas, service.horas % 1 ? 1 : 0) + " horas",
      "Materiais e custos inclusos: " + PC.formatCurrency(service.custoTotal),
      "",
      "Valor proposto: " + PC.formatCurrency(service.precoRecomendado),
      "Faixa mínima: " + PC.formatCurrency(service.precoMinimo),
      "Faixa premium: " + PC.formatCurrency(service.precoPremium),
      "",
      "Validade da proposta: 15 dias.",
    ];
    preview.textContent = linhas.join("\n");

    const actions = document.createElement("div");
    actions.className = "modal__actions";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "btn btn--ghost";
    close.textContent = "Fechar";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn--primary";
    copy.textContent = "Copiar texto";

    actions.appendChild(close);
    actions.appendChild(copy);

    modal.appendChild(title);
    modal.appendChild(text);
    modal.appendChild(preview);
    modal.appendChild(actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    copy.focus();

    function dismiss() {
      document.removeEventListener("keydown", onKey);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }
    function onKey(event) { if (event.key === "Escape") dismiss(); }

    close.addEventListener("click", dismiss);
    backdrop.addEventListener("mousedown", function (event) {
      if (event.target === backdrop) dismiss();
    });
    document.addEventListener("keydown", onKey);

    copy.addEventListener("click", function () {
      const content = preview.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(content).then(
          function () { PC.showToast("Orçamento copiado.", "success"); dismiss(); },
          function () { PC.showToast("Não foi possível copiar. Selecione o texto e copie manualmente.", "error"); }
        );
      } else {
        PC.showToast("Seu navegador não permite copiar automaticamente. Selecione o texto.", "error");
      }
    });
  }

  function wireActions() {
    PC.qs("#recalc").setAttribute(
      "href",
      "calculadora.html?servico=" + encodeURIComponent(service.id)
    );

    PC.qs("#quote").addEventListener("click", openQuote);

    PC.qs("#delete-service").addEventListener("click", function () {
      PC.openConfirm({
        emoji: "🗑️",
        title: "Excluir “" + service.nome + "”?",
        text: "O serviço sai da sua lista. Os cálculos continuam no histórico.",
        confirmLabel: "Excluir serviço",
        cancelLabel: "Manter",
        danger: true,
      }).then(function (confirmed) {
        if (!confirmed) return;
        Store.deleteService(service.id);
        PC.showToast("Serviço removido.", "success");
        window.location.href = "servicos.html";
      });
    });
  }

  document.addEventListener("pc:ready", function () {
    const params = new URLSearchParams(window.location.search);
    service = Store.getServiceById(params.get("id"));

    if (!service) {
      PC.qs("#detail-missing").hidden = false;
      return;
    }

    PC.qs("#detail-page").hidden = false;
    renderHeader();
    renderSummary();
    renderTimeline();
    wireActions();
  });
})();
