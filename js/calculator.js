/* =========================================================
   PreçoCerto — calculator.js
   Interface da calculadora: validação, custo ao vivo e
   envio para o motor de cálculo (js/pricing.js).
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;
  const Pricing = window.PCPricing;

  let editingServiceId = null;

  function fillCategories() {
    const select = PC.qs("#categoria");
    if (!select) return;
    window.PCShell.CATEGORIES.forEach(function (category) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.icon + "  " + category.label;
      select.appendChild(option);
    });
  }

  function readForm() {
    return {
      nome: PC.qs("#nome").value.trim(),
      categoria: PC.qs("#categoria").value,
      custos: {
        materiais: PC.parseNumber(PC.qs("#materiais").value),
        deslocamento: PC.parseNumber(PC.qs("#deslocamento").value),
        outros: PC.parseNumber(PC.qs("#outros").value),
      },
      horas: PC.parseNumber(PC.qs("#horas").value),
      horasDisponiveisMes: PC.parseNumber(PC.qs("#horasMes").value) || 160,
      metaMensal: PC.parseNumber(PC.qs("#metaMensal").value),
      servicosPorMes: PC.parseNumber(PC.qs("#servicosMes").value),
      precoAtual: PC.parseNumber(PC.qs("#precoAtual").value),
    };
  }

  function updateLiveCost() {
    const data = readForm();
    const total = data.custos.materiais + data.custos.deslocamento + data.custos.outros;
    PC.qs("#live-cost").textContent = PC.formatCurrency(total);
  }

  /* Validação campo a campo, com mensagem no próprio bloco. */
  function validate(data) {
    let valid = true;

    function fail(selector, message) {
      PC.setFieldError(PC.qs(selector), message);
      valid = false;
    }

    ["#nome", "#materiais", "#deslocamento", "#outros", "#horas", "#horasMes", "#metaMensal", "#servicosMes", "#precoAtual"]
      .forEach(function (selector) { PC.setFieldError(PC.qs(selector), ""); });

    if (data.nome.length < 2) fail("#nome", "Dê um nome ao serviço para reconhecê-lo depois.");

    [["#materiais", data.custos.materiais], ["#deslocamento", data.custos.deslocamento], ["#outros", data.custos.outros]]
      .forEach(function (pair) {
        if (pair[1] < 0) fail(pair[0], "Use apenas valores positivos.");
      });

    if (!(data.horas > 0)) fail("#horas", "Informe quantas horas o serviço leva.");
    else if (data.horas > 720) fail("#horas", "Esse número parece alto demais para um único serviço.");

    if (!(data.horasDisponiveisMes > 0)) fail("#horasMes", "Informe quantas horas você trabalha por mês.");
    else if (data.horasDisponiveisMes > 744) fail("#horasMes", "Um mês tem no máximo 744 horas.");
    else if (data.horas > data.horasDisponiveisMes) {
      fail("#horas", "O serviço não pode levar mais horas do que você tem no mês.");
    }

    if (!(data.metaMensal > 0)) fail("#metaMensal", "Informe quanto deseja ganhar por mês.");

    if (data.servicosPorMes < 0) fail("#servicosMes", "Use apenas valores positivos.");
    if (data.precoAtual < 0) fail("#precoAtual", "Use apenas valores positivos.");

    return valid;
  }

  function showLoading() {
    const overlay = document.createElement("div");
    overlay.className = "calc-loading";
    overlay.setAttribute("role", "status");

    const inner = document.createElement("div");
    inner.className = "calc-loading__inner";

    const spinner = document.createElement("div");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");

    const title = document.createElement("p");
    title.textContent = "Calculando seu preço…";

    const text = document.createElement("span");
    text.textContent = "Somando custos, tempo e meta do mês.";

    inner.appendChild(spinner);
    inner.appendChild(title);
    inner.appendChild(text);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
    return overlay;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const data = readForm();
    if (!validate(data)) {
      PC.showToast("Confira os campos destacados para continuar.", "error");
      const invalid = PC.qs('[aria-invalid="true"]');
      if (invalid) invalid.focus();
      return;
    }

    const pricing = Pricing.calculatePricing(data);

    const record = Store.saveCalculation({
      servicoId: editingServiceId,
      nome: data.nome,
      categoria: data.categoria,
      custos: data.custos,
      custoTotal: pricing.custoTotal,
      horas: data.horas,
      horasDisponiveisMes: data.horasDisponiveisMes,
      metaMensal: data.metaMensal,
      servicosPorMes: data.servicosPorMes,
      precoAtual: data.precoAtual,
      valorHoraBase: pricing.valorHoraBase,
      custoMaoDeObra: pricing.custoMaoDeObra,
      base: pricing.base,
      baseProtegida: pricing.baseProtegida,
      precoMinimo: pricing.precoMinimo,
      precoRecomendado: pricing.precoRecomendado,
      precoPremium: pricing.precoPremium,
    });

    const overlay = showLoading();
    const delay = PC.prefersReducedMotion ? 120 : 900;
    window.setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      window.location.href = "resultado.html?id=" + encodeURIComponent(record.id);
    }, delay);
  }

  /* Pré-preenche a calculadora ao recalcular um serviço salvo. */
  function prefillFromService() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("servico");
    if (!id) return;

    const service = Store.getServiceById(id);
    if (!service) {
      PC.showToast("Não encontramos esse serviço. Começando um cálculo novo.", "error");
      return;
    }

    editingServiceId = service.id;
    PC.qs("#nome").value = service.nome || "";
    PC.qs("#categoria").value = service.categoria || "outros";
    PC.qs("#materiais").value = service.custos ? service.custos.materiais || "" : "";
    PC.qs("#deslocamento").value = service.custos ? service.custos.deslocamento || "" : "";
    PC.qs("#outros").value = service.custos ? service.custos.outros || "" : "";
    PC.qs("#horas").value = service.horas || "";
    PC.qs("#horasMes").value = service.horasDisponiveisMes || 160;
    PC.qs("#metaMensal").value = service.metaMensal || "";
    PC.qs("#servicosMes").value = service.servicosPorMes || "";
    PC.qs("#precoAtual").value = service.precoAtual || "";

    updateLiveCost();
    PC.showToast("Dados de “" + service.nome + "” carregados.", "success");
  }

  document.addEventListener("pc:ready", function () {
    fillCategories();

    const form = PC.qs("#calc-form");
    if (!form) return;

    /* Sugestão inicial de jornada mensal. */
    PC.qs("#horasMes").value = Store.getSettings().horasDisponiveisMes || 160;

    ["#materiais", "#deslocamento", "#outros"].forEach(function (selector) {
      PC.qs(selector).addEventListener("input", PC.debounce(updateLiveCost, 120));
    });

    form.addEventListener("submit", handleSubmit);
    prefillFromService();
    updateLiveCost();
  });
})();
