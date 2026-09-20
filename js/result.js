/* =========================================================
   PreçoCerto — result.js
   Exibe o cálculo, explica a conta, roda o simulador e
   compara com o preço atual informado.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;
  const Pricing = window.PCPricing;

  let calc = null;

  /* ---------- Carregamento ---------- */
  function loadCalculation() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? Store.getCalculationById(id) : Store.getLastCalculation();
  }

  /* ---------- Cabeçalho ---------- */
  function renderHero() {
    const evaluation = Pricing.evaluatePrice(calc.precoRecomendado, calc);

    PC.qs("#result-service").textContent =
      "Seu preço ideal para “" + calc.nome + "” é:";

    PC.animateNumber(PC.qs("#price-reco"), calc.precoRecomendado, PC.formatCurrency, 1100);

    PC.qs("#meta-custo").textContent = "Custo do serviço: " + PC.formatCurrency(calc.custoTotal);
    PC.qs("#meta-horas").textContent =
      PC.formatNumber(calc.horas, calc.horas % 1 ? 1 : 0) + " horas de trabalho";
    PC.qs("#meta-hora").textContent =
      "Ganho por hora: " + PC.formatCurrency(evaluation.ganhoPorHora);

    PC.animateNumber(PC.qs("#tier-min"), calc.precoMinimo, PC.formatCurrency, 800);
    PC.animateNumber(PC.qs("#tier-reco"), calc.precoRecomendado, PC.formatCurrency, 800);
    PC.animateNumber(PC.qs("#tier-premium"), calc.precoPremium, PC.formatCurrency, 800);
  }

  /* Pequena comemoração ao abrir o resultado. */
  function confetti() {
    if (PC.prefersReducedMotion) return;
    const hero = PC.qs("#result-hero");
    if (!hero) return;
    const colors = ["#7C3AED", "#2563EB", "#06B6D4", "#16A34A", "#F59E0B", "#EC4899"];

    for (let i = 0; i < 26; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 0.8).toFixed(2) + "s";
      piece.setAttribute("aria-hidden", "true");
      hero.appendChild(piece);
      window.setTimeout(function () {
        if (piece.parentNode) piece.parentNode.removeChild(piece);
      }, 4000);
    }
  }

  /* ---------- Explicação ---------- */
  function renderWhy() {
    const list = PC.qs("#why-list");
    list.innerHTML = "";

    const reserva = Math.round((calc.baseProtegida - calc.base) * 100) / 100;

    const items = [
      {
        title: "Seus custos foram considerados",
        detail: "Materiais, deslocamento e outras despesas somam " + PC.formatCurrency(calc.custoTotal) + ".",
      },
      {
        title: "Seu tempo de trabalho foi considerado",
        detail:
          PC.formatNumber(calc.horas, calc.horas % 1 ? 1 : 0) +
          " horas a " +
          PC.formatCurrency(calc.valorHoraBase) +
          " por hora, o que dá " +
          PC.formatCurrency(calc.custoMaoDeObra) +
          ".",
      },
      {
        title: "Sua meta financeira foi considerada",
        detail:
          calc.servicosPorMes > 0
            ? "Para chegar a " + PC.formatCurrency(calc.metaMensal) + " com " +
              PC.formatNumber(calc.servicosPorMes) + " serviços, cada um precisa contribuir com pelo menos " +
              PC.formatCurrency(calc.metaMensal / calc.servicosPorMes) + "."
            : "Sua meta de " + PC.formatCurrency(calc.metaMensal) + " por mês definiu o valor da sua hora.",
      },
      {
        title: "Sua margem foi considerada",
        detail:
          "O preço recomendado aplica um multiplicador de " +
          PC.formatNumber(Pricing.constants.RECOMENDADO_MULTIPLIER * 100) +
          "% sobre a base de cálculo.",
      },
      {
        title: "Existe espaço para imprevistos",
        detail:
          "Uma reserva de " +
          PC.formatNumber(Pricing.constants.RESERVA_IMPREVISTOS * 100) +
          "% (" + PC.formatCurrency(reserva) + ") cobre revisões e atrasos.",
      },
    ];

    items.forEach(function (item) {
      const li = document.createElement("li");

      const check = document.createElement("span");
      check.className = "check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";

      const text = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = item.title;
      const detail = document.createElement("span");
      detail.textContent = item.detail;
      text.appendChild(strong);
      text.appendChild(detail);

      li.appendChild(check);
      li.appendChild(text);
      list.appendChild(li);
    });
  }

  /* ---------- Simulador ---------- */
  function renderSimulator() {
    const priceInput = PC.qs("#sim-price");
    const slider = PC.qs("#sim-margin");
    const marginLabel = PC.qs("#margin-label");

    const profitOut = PC.qs("#sim-profit");
    const hourOut = PC.qs("#sim-hour");
    const marginOut = PC.qs("#sim-margin-out");
    const verdict = PC.qs("#sim-verdict");

    function paintSlider() {
      const percent = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
      slider.style.background =
        "linear-gradient(90deg, var(--primary) 0%, var(--primary) " + percent + "%, #E7EAF3 " + percent + "%, #E7EAF3 100%)";
      slider.setAttribute("aria-valuenow", slider.value);
      marginLabel.textContent = slider.value + "%";
    }

    function update(price) {
      const result = Pricing.evaluatePrice(price, calc);

      profitOut.textContent = PC.formatCurrency(result.lucro);
      profitOut.className = result.lucro >= 0 ? "pos" : "neg";

      hourOut.textContent = PC.formatCurrency(result.ganhoPorHora);
      marginOut.textContent = PC.formatNumber(result.margemBase * 100, 1) + "%";

      if (result.preco <= 0) {
        verdict.className = "sim-verdict sim-verdict--warn";
        verdict.textContent = "Informe um valor para ver a simulação.";
      } else if (result.preco < calc.precoMinimo) {
        verdict.className = "sim-verdict sim-verdict--warn";
        verdict.textContent =
          "Esse valor fica abaixo do preço mínimo calculado (" + PC.formatCurrency(calc.precoMinimo) + ").";
      } else if (result.preco >= calc.precoPremium) {
        verdict.className = "sim-verdict sim-verdict--good";
        verdict.textContent =
          "Esse valor está na faixa premium. Vale reforçar entregas e diferenciais na proposta.";
      } else if (result.preco >= calc.precoRecomendado) {
        verdict.className = "sim-verdict sim-verdict--good";
        verdict.textContent = "Esse valor está dentro da faixa recomendada para o cenário que você descreveu.";
      } else {
        verdict.className = "sim-verdict";
        verdict.textContent =
          "Esse valor cobre seus custos, mas fica abaixo do recomendado (" +
          PC.formatCurrency(calc.precoRecomendado) + ").";
      }
    }

    priceInput.value = PC.formatNumber(calc.precoRecomendado, 2);
    /* O slider começa na margem que corresponde ao preço recomendado. */
    const margemInicial = Math.round(
      Pricing.evaluatePrice(calc.precoRecomendado, calc).margemBase * 100
    );
    slider.value = String(Math.min(Math.max(margemInicial, Number(slider.min)), Number(slider.max)));
    update(calc.precoRecomendado);

    priceInput.addEventListener(
      "input",
      PC.debounce(function () {
        update(PC.parseNumber(priceInput.value));
      }, 140)
    );

    slider.addEventListener("input", function () {
      paintSlider();
      const price = Pricing.priceForMargin(calc, Number(slider.value) / 100);
      priceInput.value = PC.formatNumber(price, 2);
      update(price);
    });

    paintSlider();
  }

  /* ---------- Comparação com o preço atual ---------- */
  function renderCompare() {
    const box = PC.qs("#compare-box");
    if (!calc.precoAtual || calc.precoAtual <= 0) return;

    box.hidden = false;
    const bars = PC.qs("#compare-bars");
    bars.innerHTML = "";

    const rows = [
      { label: "Seu preço atual", value: calc.precoAtual, fill: "fill--current" },
      { label: "Preço mínimo", value: calc.precoMinimo, fill: "fill--min" },
      { label: "Preço recomendado", value: calc.precoRecomendado, fill: "fill--reco" },
      { label: "Preço premium", value: calc.precoPremium, fill: "fill--premium" },
    ];

    const max = Math.max.apply(
      null,
      rows.map(function (row) { return row.value; })
    );

    rows.forEach(function (row, index) {
      const wrapper = document.createElement("div");
      wrapper.className = "compare__row";

      const header = document.createElement("header");
      const label = document.createElement("span");
      label.textContent = row.label;
      const value = document.createElement("strong");
      value.textContent = PC.formatCurrency(row.value);
      header.appendChild(label);
      header.appendChild(value);

      const track = document.createElement("div");
      track.className = "compare__track";
      const fill = document.createElement("div");
      fill.className = "compare__fill " + row.fill;
      track.appendChild(fill);

      wrapper.appendChild(header);
      wrapper.appendChild(track);
      bars.appendChild(wrapper);

      const percent = max > 0 ? (row.value / max) * 100 : 0;
      window.setTimeout(function () { fill.style.width = percent + "%"; }, 120 + index * 110);
    });

    const diff = calc.precoRecomendado - calc.precoAtual;
    const note = PC.qs("#compare-note");

    if (Math.abs(diff) < 0.01) {
      note.textContent = "Seu preço atual coincide com o valor recomendado para este cenário.";
    } else if (diff > 0) {
      note.textContent =
        "Seu preço atual está " + PC.formatCurrency(diff) +
        " abaixo do valor recomendado calculado para este cenário. A diferença aparece no seu ganho por hora: " +
        PC.formatCurrency(Pricing.evaluatePrice(calc.precoAtual, calc).ganhoPorHora) + " hoje, contra " +
        PC.formatCurrency(Pricing.evaluatePrice(calc.precoRecomendado, calc).ganhoPorHora) + " no recomendado.";
    } else {
      note.textContent =
        "Seu preço atual está " + PC.formatCurrency(Math.abs(diff)) +
        " acima do valor recomendado. Isso costuma indicar um posicionamento mais próximo da faixa premium.";
    }
  }

  /* ---------- Salvar como serviço ---------- */
  function wireSave() {
    const button = PC.qs("#save-service");

    function payload() {
      return {
        nome: calc.nome,
        categoria: calc.categoria,
        custos: calc.custos,
        custoTotal: calc.custoTotal,
        horas: calc.horas,
        horasDisponiveisMes: calc.horasDisponiveisMes,
        metaMensal: calc.metaMensal,
        servicosPorMes: calc.servicosPorMes,
        precoAtual: calc.precoAtual,
        precoMinimo: calc.precoMinimo,
        precoRecomendado: calc.precoRecomendado,
        precoPremium: calc.precoPremium,
      };
    }

    function refreshButton() {
      if (calc.servicoId && Store.getServiceById(calc.servicoId)) {
        button.textContent = "📦 Ver serviço salvo";
      }
    }

    button.addEventListener("click", function () {
      const existing = calc.servicoId ? Store.getServiceById(calc.servicoId) : null;

      if (existing) {
        Store.updateService(existing.id, payload());
        PC.showToast("Serviço atualizado com este cálculo.", "success");
        window.location.href = "servico.html?id=" + encodeURIComponent(existing.id);
        return;
      }

      const service = Store.saveService(payload());
      /* Vincula o cálculo ao serviço recém-criado. */
      Store.updateCalculation(calc.id, { servicoId: service.id });
      calc.servicoId = service.id;

      PC.showToast("Serviço salvo com sucesso!", "success");
      refreshButton();
      window.location.href = "servico.html?id=" + encodeURIComponent(service.id);
    });

    refreshButton();
  }

  document.addEventListener("pc:ready", function () {
    calc = loadCalculation();

    if (!calc) {
      PC.qs("#result-missing").hidden = false;
      return;
    }

    Store.setLastCalculationId(calc.id);
    PC.qs("#result-page").hidden = false;

    renderHero();
    renderWhy();
    renderSimulator();
    renderCompare();
    wireSave();
    confetti();
  });
})();
