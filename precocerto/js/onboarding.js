/* =========================================================
   PreçoCerto — onboarding.js
   Cobre a porta de entrada do produto: comportamento da
   landing page e o cadastro em etapas.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;

  /* ---------------------------------------------------------
     Landing page
     --------------------------------------------------------- */
  function initLanding() {
    const toggle = PC.qs("#nav-toggle");
    const nav = PC.qs("#site-nav");

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        const isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
      PC.qsa("a", nav).forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    const user = Store.getUser();

    /* "Entrar" leva ao app se já houver cadastro; senão, ao cadastro. */
    const enterLink = PC.qs("#enter-link");
    if (enterLink) {
      enterLink.setAttribute("href", user ? "app.html" : "cadastro.html");
      if (user) enterLink.textContent = "Entrar";
    }

    /* Quem já se cadastrou vai direto para o painel. */
    const start = PC.qs("#cta-start");
    if (start && user) {
      start.setAttribute("href", "app.html");
      start.textContent = "✨ Voltar para o meu painel";
    }
  }

  /* ---------------------------------------------------------
     Cadastro em etapas
     --------------------------------------------------------- */
  function initOnboarding() {
    const form = PC.qs("#onboard-form");
    if (!form) return;

    const TOTAL_STEPS = 3;
    const panels = PC.qsa(".step-panel", form);
    const bar = PC.qs("#progress-bar");
    const progress = PC.qs(".progress");
    const nomeInput = PC.qs("#nome");
    const emailInput = PC.qs("#email");
    const helloName = PC.qs("#hello-name");
    const choiceError = PC.qs("#choice-error");

    const draft = { nome: "", email: "", tipoUso: "" };
    let current = 1;

    function showStep(step) {
      current = step;
      panels.forEach(function (panel) {
        const isActive = Number(panel.getAttribute("data-step")) === step;
        panel.classList.toggle("is-active", isActive);
        if (isActive) {
          const focusable = panel.querySelector("input, button");
          if (focusable) window.setTimeout(function () { focusable.focus(); }, 60);
        }
      });

      const percent = Math.min((step / TOTAL_STEPS) * 100, 100);
      if (bar) bar.style.width = percent + "%";
      if (progress) progress.setAttribute("aria-valuenow", String(Math.min(step, TOTAL_STEPS)));
    }

    function validateStep(step) {
      if (step === 1) {
        const value = nomeInput.value.trim();
        if (value.length < 2) {
          PC.setFieldError(nomeInput, "Escreva seu nome com pelo menos duas letras.");
          nomeInput.focus();
          return false;
        }
        PC.setFieldError(nomeInput, "");
        draft.nome = value;
        if (helloName) helloName.textContent = PC.firstName(value);
        return true;
      }

      if (step === 2) {
        const value = emailInput.value.trim();
        if (!PC.isValidEmail(value)) {
          PC.setFieldError(emailInput, "Confira o e-mail: faltou algo como nome@dominio.com.");
          emailInput.focus();
          return false;
        }
        PC.setFieldError(emailInput, "");
        draft.email = value;
        return true;
      }

      if (step === 3) {
        if (!draft.tipoUso) {
          if (choiceError) choiceError.textContent = "Escolha uma das duas opções para continuar.";
          return false;
        }
        if (choiceError) choiceError.textContent = "";
        return true;
      }

      return true;
    }

    /* Avançar / voltar */
    PC.qsa("[data-next]", form).forEach(function (button) {
      button.addEventListener("click", function () {
        const step = Number(button.getAttribute("data-next"));
        if (!validateStep(step)) return;
        if (step === TOTAL_STEPS) persist();
        showStep(step + 1);
      });
    });

    PC.qsa("[data-back]", form).forEach(function (button) {
      button.addEventListener("click", function () {
        showStep(Number(button.getAttribute("data-back")) - 1);
      });
    });

    /* Enter avança de etapa sem enviar o formulário */
    form.addEventListener("submit", function (event) { event.preventDefault(); });
    form.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      const target = event.target;
      if (target && target.tagName === "INPUT") {
        event.preventDefault();
        if (validateStep(current)) {
          if (current === TOTAL_STEPS) persist();
          showStep(current + 1);
        }
      }
    });

    /* Cards de tipo de uso */
    PC.qsa("[data-choice]", form).forEach(function (card) {
      card.addEventListener("click", function () {
        PC.qsa("[data-choice]", form).forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === card));
        });
        draft.tipoUso = card.getAttribute("data-choice");
        if (choiceError) choiceError.textContent = "";
      });
    });

    function persist() {
      Store.saveUser({
        nome: draft.nome,
        email: draft.email,
        tipoUso: draft.tipoUso,
      });
      PC.showToast("Cadastro concluído. Bem-vindo(a)!", "success");
    }

    const finish = PC.qs("#finish");
    if (finish) {
      finish.addEventListener("click", function () {
        window.location.href = "app.html";
      });
    }

    /* Se já existe cadastro, pré-preenche para uma nova entrada. */
    const existing = Store.getUser();
    if (existing) {
      nomeInput.value = existing.nome || "";
      emailInput.value = existing.email || "";
      draft.tipoUso = existing.tipoUso || "";
      if (draft.tipoUso) {
        const selected = PC.qs('[data-choice="' + draft.tipoUso + '"]', form);
        if (selected) selected.setAttribute("aria-pressed", "true");
      }
    }

    showStep(1);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLanding();
    initOnboarding();
  });
})();
