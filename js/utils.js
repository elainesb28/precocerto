/* =========================================================
   PreçoCerto — utils.js
   Funções reutilizáveis de formatação, UI e validação.
   Expostas em window.PC para os demais módulos.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Seletores ---------- */
  const qs = (selector, scope) => (scope || document).querySelector(selector);
  const qsa = (selector, scope) =>
    Array.prototype.slice.call((scope || document).querySelectorAll(selector));

  /* ---------- Formatação ---------- */
  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

  function formatCurrency(value) {
    const number = Number(value);
    return currencyFormatter.format(isFinite(number) ? number : 0);
  }

  function formatNumber(value, decimals) {
    const number = Number(value);
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals || 0,
      maximumFractionDigits: decimals || 0,
    }).format(isFinite(number) ? number : 0);
  }

  function formatDate(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "—";
    return (
      date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
      " às " +
      date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  }

  /* Converte texto digitado ("1.500,50" ou "1500.5") em número. */
  function parseNumber(value) {
    if (typeof value === "number") return isFinite(value) ? value : 0;
    if (!value) return 0;
    const cleaned = String(value)
      .replace(/\s/g, "")
      .replace(/R\$/gi, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const number = parseFloat(cleaned);
    return isFinite(number) ? number : 0;
  }

  function generateId(prefix) {
    const random = Math.random().toString(36).slice(2, 8);
    return (prefix || "id") + "_" + Date.now().toString(36) + random;
  }

  /* Remove caracteres perigosos antes de exibir no DOM. */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function firstName(fullName) {
    return String(fullName || "").trim().split(/\s+/)[0] || "";
  }

  function initials(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "PC";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /* ---------- Validação ---------- */
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(value).trim());
  }

  function isPositiveNumber(value) {
    const number = parseNumber(value);
    return isFinite(number) && number >= 0;
  }

  function setFieldError(input, message) {
    if (!input) return;
    const wrapper = input.closest(".field") || input.parentElement;
    const slot = wrapper ? wrapper.querySelector(".error-msg") : null;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (slot) slot.textContent = message;
    } else {
      input.removeAttribute("aria-invalid");
      if (slot) slot.textContent = "";
    }
  }

  /* ---------- Toasts ---------- */
  function toastStack() {
    let stack = qs(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("role", "status");
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    return stack;
  }

  function showToast(message, type) {
    const stack = toastStack();
    const toast = document.createElement("div");
    toast.className = "toast" + (type ? " toast--" + type : "");

    const icon = document.createElement("span");
    icon.className = "toast__icon";
    icon.textContent = type === "error" ? "⚠️" : type === "success" ? "✅" : "💬";

    const text = document.createElement("span");
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    stack.appendChild(toast);

    window.setTimeout(function () {
      toast.classList.add("toast--out");
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, 3200);
  }

  /* ---------- Modal de confirmação ---------- */
  function openConfirm(options) {
    const config = Object.assign(
      {
        emoji: "🤔",
        title: "Tem certeza?",
        text: "",
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        danger: false,
      },
      options || {}
    );

    return new Promise(function (resolve) {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";

      const modal = document.createElement("div");
      modal.className = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", config.title);

      const emoji = document.createElement("div");
      emoji.className = "modal__emoji";
      emoji.textContent = config.emoji;

      const title = document.createElement("h2");
      title.className = "modal__title";
      title.textContent = config.title;

      const text = document.createElement("p");
      text.className = "modal__text";
      text.textContent = config.text;

      const actions = document.createElement("div");
      actions.className = "modal__actions";

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "btn btn--ghost";
      cancel.textContent = config.cancelLabel;

      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "btn " + (config.danger ? "btn--danger" : "btn--primary");
      confirm.textContent = config.confirmLabel;

      actions.appendChild(cancel);
      actions.appendChild(confirm);
      modal.appendChild(emoji);
      modal.appendChild(title);
      if (config.text) modal.appendChild(text);
      modal.appendChild(actions);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      const previousFocus = document.activeElement;
      confirm.focus();

      function close(result) {
        document.removeEventListener("keydown", onKeydown);
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        if (previousFocus && previousFocus.focus) previousFocus.focus();
        resolve(result);
      }

      function onKeydown(event) {
        if (event.key === "Escape") close(false);
        if (event.key === "Tab") {
          const focusables = [cancel, confirm];
          const index = focusables.indexOf(document.activeElement);
          event.preventDefault();
          const next = event.shiftKey ? index - 1 : index + 1;
          focusables[(next + focusables.length) % focusables.length].focus();
        }
      }

      cancel.addEventListener("click", function () { close(false); });
      confirm.addEventListener("click", function () { close(true); });
      backdrop.addEventListener("mousedown", function (event) {
        if (event.target === backdrop) close(false);
      });
      document.addEventListener("keydown", onKeydown);
    });
  }

  /* Modal informativo simples (um único botão). */
  function openInfo(options) {
    return openConfirm(
      Object.assign({ confirmLabel: "Entendi", cancelLabel: "Fechar" }, options || {})
    );
  }

  /* ---------- Animações ---------- */
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Conta de 0 até o valor final, formatando a cada quadro. */
  function animateNumber(element, target, formatter, duration) {
    if (!element) return;
    const format = formatter || formatCurrency;
    const end = Number(target) || 0;

    if (prefersReducedMotion) {
      element.textContent = format(end);
      return;
    }

    const total = duration || 900;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / total, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = format(end * eased);
      if (progress < 1) requestAnimationFrame(frame);
      else element.textContent = format(end);
    }
    requestAnimationFrame(frame);
  }

  /* Revela elementos .reveal conforme entram na viewport. */
  function initReveal() {
    const items = qsa(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (item, index) {
      item.style.transitionDelay = Math.min(index * 60, 300) + "ms";
      observer.observe(item);
    });
  }

  function debounce(fn, wait) {
    let timer = null;
    return function () {
      const args = arguments;
      const context = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { fn.apply(context, args); }, wait || 180);
    };
  }

  /* ---------- Exportação ---------- */
  window.PC = Object.assign(window.PC || {}, {
    qs: qs,
    qsa: qsa,
    formatCurrency: formatCurrency,
    formatNumber: formatNumber,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    parseNumber: parseNumber,
    generateId: generateId,
    escapeHtml: escapeHtml,
    firstName: firstName,
    initials: initials,
    isValidEmail: isValidEmail,
    isPositiveNumber: isPositiveNumber,
    setFieldError: setFieldError,
    showToast: showToast,
    openConfirm: openConfirm,
    openInfo: openInfo,
    animateNumber: animateNumber,
    initReveal: initReveal,
    debounce: debounce,
    prefersReducedMotion: prefersReducedMotion,
  });

  document.addEventListener("DOMContentLoaded", initReveal);
})();
