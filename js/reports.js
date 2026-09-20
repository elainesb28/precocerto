/* =========================================================
   PreçoCerto — reports.js
   Gráficos simples construídos apenas com HTML e CSS:
   barras proporcionais e um donut via conic-gradient.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;
  const Pricing = window.PCPricing;

  const PALETTE = ["#7C3AED", "#2563EB", "#06B6D4", "#16A34A", "#F59E0B", "#EC4899", "#64708A"];
  const FILLS = ["", "bar-fill--cyan", "bar-fill--green", "bar-fill--pink"];

  function renderStats(services, calculations) {
    const somaRecomendado = services.reduce(function (total, service) {
      return total + (Number(service.precoRecomendado) || 0);
    }, 0);
    const media = services.length ? somaRecomendado / services.length : 0;

    const ganhoHora = services.reduce(function (total, service) {
      return total + Pricing.evaluatePrice(service.precoRecomendado, service).ganhoPorHora;
    }, 0);
    const mediaHora = services.length ? ganhoHora / services.length : 0;

    PC.animateNumber(PC.qs("#rep-servicos"), services.length, function (value) {
      return PC.formatNumber(Math.round(value));
    });
    PC.animateNumber(PC.qs("#rep-calculos"), calculations.length, function (value) {
      return PC.formatNumber(Math.round(value));
    });
    PC.animateNumber(PC.qs("#rep-media"), media, PC.formatCurrency);
    PC.animateNumber(PC.qs("#rep-hora"), mediaHora, PC.formatCurrency);
  }

  function renderBars(services) {
    const container = PC.qs("#chart-prices");
    container.innerHTML = "";

    const top = services
      .slice()
      .sort(function (a, b) { return (b.precoRecomendado || 0) - (a.precoRecomendado || 0); })
      .slice(0, 6);

    const max = Math.max.apply(
      null,
      top.map(function (service) { return Number(service.precoRecomendado) || 0; })
    );

    top.forEach(function (service, index) {
      const row = document.createElement("div");
      row.className = "bar-row";

      const label = document.createElement("div");
      label.className = "bar-row__label";
      const name = document.createElement("span");
      name.textContent = service.nome;
      const value = document.createElement("strong");
      value.textContent = PC.formatCurrency(service.precoRecomendado);
      label.appendChild(name);
      label.appendChild(value);

      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("div");
      fill.className = "bar-fill " + FILLS[index % FILLS.length];
      track.appendChild(fill);

      row.appendChild(label);
      row.appendChild(track);
      container.appendChild(row);

      const percent = max > 0 ? ((Number(service.precoRecomendado) || 0) / max) * 100 : 0;
      window.setTimeout(function () { fill.style.width = percent + "%"; }, 100 + index * 90);
    });
  }

  function renderDonut(services) {
    const donut = PC.qs("#donut");
    const legend = PC.qs("#donut-legend");
    legend.innerHTML = "";

    const counts = {};
    services.forEach(function (service) {
      const category = window.PCShell.getCategory(service.categoria);
      counts[category.label] = (counts[category.label] || 0) + 1;
    });

    const entries = Object.keys(counts).map(function (label) {
      return { label: label, value: counts[label] };
    });
    entries.sort(function (a, b) { return b.value - a.value; });

    const total = services.length;
    PC.qs("#donut-total").textContent = PC.formatNumber(total);

    let cursor = 0;
    const stops = [];

    entries.forEach(function (entry, index) {
      const color = PALETTE[index % PALETTE.length];
      const slice = (entry.value / total) * 100;
      stops.push(color + " " + cursor.toFixed(2) + "% " + (cursor + slice).toFixed(2) + "%");
      cursor += slice;

      const li = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = color;
      dot.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent =
        entry.label + " — " + entry.value + " (" + PC.formatNumber((entry.value / total) * 100) + "%)";
      li.appendChild(dot);
      li.appendChild(text);
      legend.appendChild(li);
    });

    donut.style.background = "conic-gradient(" + stops.join(", ") + ")";
  }

  function highlightRow(label, value, extra) {
    const row = document.createElement("div");
    row.className = "highlight-row";

    const left = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.style.display = "block";
    strong.textContent = value;
    left.appendChild(span);
    left.appendChild(strong);

    row.appendChild(left);

    if (extra) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = extra;
      row.appendChild(badge);
    }
    return row;
  }

  function renderHighlights(services, calculations) {
    const container = PC.qs("#report-highlights");
    container.innerHTML = "";

    const maisCaro = services.slice().sort(function (a, b) {
      return (b.precoRecomendado || 0) - (a.precoRecomendado || 0);
    })[0];

    const maisRentavel = services.slice().sort(function (a, b) {
      return (
        Pricing.evaluatePrice(b.precoRecomendado, b).ganhoPorHora -
        Pricing.evaluatePrice(a.precoRecomendado, a).ganhoPorHora
      );
    })[0];

    const menorMargem = services.slice().sort(function (a, b) {
      return (
        Pricing.evaluatePrice(a.precoRecomendado, a).margemBase -
        Pricing.evaluatePrice(b.precoRecomendado, b).margemBase
      );
    })[0];

    if (maisCaro) {
      container.appendChild(
        highlightRow("Serviço mais caro", maisCaro.nome, PC.formatCurrency(maisCaro.precoRecomendado))
      );
    }

    if (maisRentavel) {
      const ganho = Pricing.evaluatePrice(maisRentavel.precoRecomendado, maisRentavel).ganhoPorHora;
      container.appendChild(
        highlightRow("Serviço mais rentável por hora", maisRentavel.nome, PC.formatCurrency(ganho) + "/h")
      );
    }

    if (menorMargem && services.length > 1) {
      const margem = Pricing.evaluatePrice(menorMargem.precoRecomendado, menorMargem).margemBase;
      container.appendChild(
        highlightRow("Menor margem", menorMargem.nome, PC.formatNumber(margem * 100, 1) + "%")
      );
    }

    if (calculations.length) {
      container.appendChild(
        highlightRow("Último cálculo", calculations[0].nome, PC.formatDate(calculations[0].criadoEm))
      );
    }
  }

  document.addEventListener("pc:ready", function () {
    const services = Store.getServices();
    const calculations = Store.getCalculations();

    if (!services.length) {
      PC.qs("#reports-empty").hidden = false;
      return;
    }

    PC.qs("#reports-content").hidden = false;
    renderStats(services, calculations);
    renderBars(services);
    renderDonut(services);
    renderHighlights(services, calculations);
  });
})();
