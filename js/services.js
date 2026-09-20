/* =========================================================
   PreçoCerto — services.js
   Lista de serviços em cards, com filtro, ordenação,
   edição rápida e exclusão com confirmação.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;

  function fillFilter() {
    const select = PC.qs("#filter-category");
    window.PCShell.CATEGORIES.forEach(function (category) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.icon + "  " + category.label;
      select.appendChild(option);
    });
  }

  function sortServices(list, mode) {
    const copy = list.slice();
    if (mode === "maior") {
      return copy.sort(function (a, b) { return (b.precoRecomendado || 0) - (a.precoRecomendado || 0); });
    }
    if (mode === "menor") {
      return copy.sort(function (a, b) { return (a.precoRecomendado || 0) - (b.precoRecomendado || 0); });
    }
    if (mode === "nome") {
      return copy.sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome), "pt-BR"); });
    }
    return copy.reverse();
  }

  function row(label, value, highlight) {
    const line = document.createElement("div");
    line.className = "srow";
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    if (highlight) strong.className = "is-reco";
    strong.textContent = value;
    line.appendChild(span);
    line.appendChild(strong);
    return line;
  }

  function createCard(service) {
    const category = window.PCShell.getCategory(service.categoria);

    const card = document.createElement("article");
    card.className = "service-card";

    const top = document.createElement("div");
    top.className = "service-card__top";

    const icon = document.createElement("span");
    icon.className = "service-card__icon";
    icon.style.background = category.tint;
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = category.icon;

    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = service.nome;
    const cat = document.createElement("p");
    cat.className = "service-card__cat";
    cat.textContent = category.label;
    heading.appendChild(title);
    heading.appendChild(cat);

    top.appendChild(icon);
    top.appendChild(heading);

    const rows = document.createElement("div");
    rows.className = "service-card__rows";
    rows.appendChild(row("Custo total", PC.formatCurrency(service.custoTotal)));
    rows.appendChild(
      row("Preço atual", service.precoAtual > 0 ? PC.formatCurrency(service.precoAtual) : "Não informado")
    );
    rows.appendChild(row("Preço recomendado", PC.formatCurrency(service.precoRecomendado), true));

    const actions = document.createElement("div");
    actions.className = "service-card__actions";

    const details = document.createElement("a");
    details.className = "btn btn--soft btn--sm";
    details.href = "servico.html?id=" + encodeURIComponent(service.id);
    details.textContent = "Ver detalhes";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "icon-btn";
    edit.setAttribute("aria-label", "Editar " + service.nome);
    edit.textContent = "✏️";
    edit.addEventListener("click", function () { openEditor(service); });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-btn icon-btn--danger";
    remove.setAttribute("aria-label", "Excluir " + service.nome);
    remove.textContent = "🗑️";
    remove.addEventListener("click", function () { confirmDelete(service); });

    actions.appendChild(details);
    actions.appendChild(edit);
    actions.appendChild(remove);

    card.appendChild(top);
    card.appendChild(rows);
    card.appendChild(actions);
    return card;
  }

  /* ---------- Edição rápida em modal ---------- */
  function openEditor(service) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Editar serviço");

    const title = document.createElement("h2");
    title.className = "modal__title";
    title.textContent = "Editar serviço";

    const text = document.createElement("p");
    text.className = "modal__text";
    text.textContent = "Ajuste o nome, a categoria e o preço que você cobra hoje.";

    const form = document.createElement("form");
    form.style.display = "grid";
    form.style.gap = "14px";
    form.style.marginTop = "18px";
    form.noValidate = true;

    const nameField = document.createElement("div");
    nameField.className = "field";
    const nameLabel = document.createElement("label");
    nameLabel.setAttribute("for", "edit-name");
    nameLabel.textContent = "Nome do serviço";
    const nameInput = document.createElement("input");
    nameInput.className = "input";
    nameInput.id = "edit-name";
    nameInput.type = "text";
    nameInput.value = service.nome || "";
    const nameError = document.createElement("p");
    nameError.className = "error-msg";
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);
    nameField.appendChild(nameError);

    const catField = document.createElement("div");
    catField.className = "field";
    const catLabel = document.createElement("label");
    catLabel.setAttribute("for", "edit-cat");
    catLabel.textContent = "Categoria";
    const catSelect = document.createElement("select");
    catSelect.className = "select";
    catSelect.id = "edit-cat";
    window.PCShell.CATEGORIES.forEach(function (category) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.icon + "  " + category.label;
      if (category.id === service.categoria) option.selected = true;
      catSelect.appendChild(option);
    });
    catField.appendChild(catLabel);
    catField.appendChild(catSelect);

    const priceField = document.createElement("div");
    priceField.className = "field";
    const priceLabel = document.createElement("label");
    priceLabel.setAttribute("for", "edit-price");
    priceLabel.textContent = "Preço que você cobra hoje (R$)";
    const priceInput = document.createElement("input");
    priceInput.className = "input";
    priceInput.id = "edit-price";
    priceInput.type = "text";
    priceInput.inputMode = "decimal";
    priceInput.value = service.precoAtual ? PC.formatNumber(service.precoAtual, 2) : "";
    const priceError = document.createElement("p");
    priceError.className = "error-msg";
    priceField.appendChild(priceLabel);
    priceField.appendChild(priceInput);
    priceField.appendChild(priceError);

    const actions = document.createElement("div");
    actions.className = "modal__actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn btn--ghost";
    cancel.textContent = "Cancelar";
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "btn btn--primary";
    save.textContent = "Salvar alterações";
    actions.appendChild(cancel);
    actions.appendChild(save);

    form.appendChild(nameField);
    form.appendChild(catField);
    form.appendChild(priceField);
    form.appendChild(actions);

    modal.appendChild(title);
    modal.appendChild(text);
    modal.appendChild(form);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    nameInput.focus();

    function close() {
      document.removeEventListener("keydown", onKey);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }
    function onKey(event) { if (event.key === "Escape") close(); }

    cancel.addEventListener("click", close);
    backdrop.addEventListener("mousedown", function (event) {
      if (event.target === backdrop) close();
    });
    document.addEventListener("keydown", onKey);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const nome = nameInput.value.trim();
      const preco = PC.parseNumber(priceInput.value);

      PC.setFieldError(nameInput, "");
      PC.setFieldError(priceInput, "");

      if (nome.length < 2) {
        PC.setFieldError(nameInput, "O nome precisa ter pelo menos duas letras.");
        return;
      }
      if (preco < 0) {
        PC.setFieldError(priceInput, "Use apenas valores positivos.");
        return;
      }

      Store.updateService(service.id, {
        nome: nome,
        categoria: catSelect.value,
        precoAtual: preco,
      });

      close();
      PC.showToast("Alterações salvas.", "success");
      render();
    });
  }

  /* ---------- Exclusão ---------- */
  function confirmDelete(service) {
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
      render();
    });
  }

  /* ---------- Render ---------- */
  function render() {
    const container = PC.qs("#services-container");
    const filters = PC.qs("#services-filters");
    const count = PC.qs("#services-count");
    container.innerHTML = "";

    const all = Store.getServices();

    if (!all.length) {
      filters.hidden = true;
      count.textContent = "Aqui ficam os serviços que você já precificou.";

      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML = "";

      const emoji = document.createElement("div");
      emoji.className = "empty__emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = "📦";
      const title = document.createElement("h3");
      title.textContent = "Você ainda não cadastrou nenhum serviço.";
      const text = document.createElement("p");
      text.textContent = "Vamos descobrir quanto vale o seu primeiro serviço?";
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

    const categoryFilter = PC.qs("#filter-category").value;
    const sortMode = PC.qs("#sort-services").value;

    const filtered = categoryFilter
      ? all.filter(function (service) { return service.categoria === categoryFilter; })
      : all;

    count.textContent =
      filtered.length === all.length
        ? all.length + (all.length === 1 ? " serviço cadastrado." : " serviços cadastrados.")
        : "Mostrando " + filtered.length + " de " + all.length + " serviços.";

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      const emoji = document.createElement("div");
      emoji.className = "empty__emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = "🔍";
      const title = document.createElement("h3");
      title.textContent = "Nenhum serviço nessa categoria.";
      const text = document.createElement("p");
      text.textContent = "Escolha outra categoria ou cadastre um serviço novo.";
      empty.appendChild(emoji);
      empty.appendChild(title);
      empty.appendChild(text);
      container.appendChild(empty);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "service-grid";
    sortServices(filtered, sortMode).forEach(function (service) {
      grid.appendChild(createCard(service));
    });
    container.appendChild(grid);
  }

  document.addEventListener("pc:ready", function () {
    fillFilter();
    PC.qs("#filter-category").addEventListener("change", render);
    PC.qs("#sort-services").addEventListener("change", render);
    render();
  });
})();
