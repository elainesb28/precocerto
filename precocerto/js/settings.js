/* =========================================================
   PreçoCerto — settings.js
   Edição do perfil, preferências e ações destrutivas.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;

  function fillForm(user) {
    const settings = Store.getSettings();
    PC.qs("#set-nome").value = user.nome || "";
    PC.qs("#set-email").value = user.email || "";
    PC.qs("#set-tipo").value = user.tipoUso || "profissional";
    PC.qs("#set-horas").value = settings.horasDisponiveisMes || 160;
  }

  function renderSummary() {
    const box = PC.qs("#storage-summary");
    box.innerHTML = "";

    const rows = [
      ["Serviços cadastrados", PC.formatNumber(Store.getServices().length)],
      ["Cálculos no histórico", PC.formatNumber(Store.getCalculations().length)],
      ["Conta criada em", PC.formatDate((Store.getUser() || {}).criadoEm)],
    ];

    rows.forEach(function (pair) {
      const line = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = pair[0];
      const strong = document.createElement("strong");
      strong.textContent = pair[1];
      line.appendChild(span);
      line.appendChild(strong);
      box.appendChild(line);
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nomeInput = PC.qs("#set-nome");
    const emailInput = PC.qs("#set-email");
    const horasInput = PC.qs("#set-horas");

    PC.setFieldError(nomeInput, "");
    PC.setFieldError(emailInput, "");
    PC.setFieldError(horasInput, "");

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const horas = PC.parseNumber(horasInput.value);

    let valid = true;
    if (nome.length < 2) {
      PC.setFieldError(nomeInput, "O nome precisa ter pelo menos duas letras.");
      valid = false;
    }
    if (!PC.isValidEmail(email)) {
      PC.setFieldError(emailInput, "Confira o e-mail: faltou algo como nome@dominio.com.");
      valid = false;
    }
    if (!(horas > 0) || horas > 744) {
      PC.setFieldError(horasInput, "Informe um número de horas entre 1 e 744.");
      valid = false;
    }
    if (!valid) {
      PC.showToast("Confira os campos destacados.", "error");
      return;
    }

    Store.updateUser({
      nome: nome,
      email: email,
      tipoUso: PC.qs("#set-tipo").value,
    });
    Store.updateSettings({ horasDisponiveisMes: horas });

    PC.showToast("Alterações salvas.", "success");
    window.setTimeout(function () { window.location.reload(); }, 700);
  }

  function wireDangerZone() {
    PC.qs("#clear-history").addEventListener("click", function () {
      if (!Store.getCalculations().length) {
        PC.showToast("Seu histórico já está vazio.");
        return;
      }
      PC.openConfirm({
        emoji: "🧹",
        title: "Limpar todo o histórico?",
        text: "Os cálculos salvos serão apagados. Seus serviços continuam cadastrados.",
        confirmLabel: "Limpar histórico",
        cancelLabel: "Cancelar",
        danger: true,
      }).then(function (confirmed) {
        if (!confirmed) return;
        Store.clearCalculations();
        PC.showToast("Histórico limpo.", "success");
        renderSummary();
      });
    });

    PC.qs("#clear-all").addEventListener("click", function () {
      PC.openConfirm({
        emoji: "⚠️",
        title: "Tem certeza que deseja apagar seus dados?",
        text: "Cadastro, serviços e histórico serão removidos deste navegador. Não há como recuperar.",
        confirmLabel: "Apagar tudo",
        cancelLabel: "Cancelar",
        danger: true,
      }).then(function (confirmed) {
        if (!confirmed) return;
        Store.clearAllData();
        window.location.href = "index.html";
      });
    });
  }

  document.addEventListener("pc:ready", function (event) {
    fillForm(event.detail.user);
    renderSummary();
    PC.qs("#profile-form").addEventListener("submit", handleSubmit);
    wireDangerZone();
  });
})();
