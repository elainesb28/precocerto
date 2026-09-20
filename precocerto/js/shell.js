/* =========================================================
   PreçoCerto — shell.js
   Monta sidebar e topbar das páginas internas, protege as
   rotas e sorteia as dicas. Cada página só declara
   <body data-page="...">.
   ========================================================= */

(function () {
  "use strict";

  const PC = window.PC;
  const Store = window.PCStore;

  const MENU = [
    { id: "inicio", label: "Início", icon: "🏠", href: "app.html" },
    { id: "calculadora", label: "Calculadora", icon: "🧮", href: "calculadora.html" },
    { id: "servicos", label: "Meus Serviços", icon: "📦", href: "servicos.html" },
    { id: "historico", label: "Histórico", icon: "📜", href: "historico.html" },
    { id: "relatorios", label: "Relatórios", icon: "📊", href: "relatorios.html" },
    { id: "configuracoes", label: "Configurações", icon: "⚙️", href: "configuracoes.html" },
  ];

  const TIPS = [
    "Seu tempo também é um custo. Inclua todas as horas, inclusive as de planejamento.",
    "Não esqueça de considerar deslocamento, combustível e tempo de trânsito.",
    "Compare seu preço atual com o recomendado pelo menos uma vez por trimestre.",
    "Nem sempre o menor preço é a melhor estratégia: preço muito baixo pode afastar clientes.",
    "Reserve uma margem para imprevistos: revisões, refações e atrasos acontecem.",
    "Serviços urgentes podem ter um acréscimo. Combine isso antes de começar.",
    "Registre cada cálculo: com o histórico fica fácil perceber sua evolução.",
  ];

  /* ---------- Guarda de sessão ---------- */
  function requireUser() {
    const user = Store.getUser();
    if (!user || !user.nome) {
      window.location.replace("cadastro.html");
      return null;
    }
    return user;
  }

  /* ---------- Sidebar ---------- */
  function buildSidebar(activeId) {
    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    sidebar.id = "sidebar";

    const brand = document.createElement("a");
    brand.className = "brand";
    brand.href = "app.html";
    brand.innerHTML =
      '<span class="brand__mark" aria-hidden="true">₽</span><span>PreçoCerto</span>';
    sidebar.appendChild(brand);

    const nav = document.createElement("nav");
    nav.className = "side-nav";
    nav.setAttribute("aria-label", "Menu principal");

    MENU.forEach(function (item) {
      const link = document.createElement("a");
      link.href = item.href;
      if (item.id === activeId) link.setAttribute("aria-current", "page");
      const icon = document.createElement("span");
      icon.className = "ico";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = item.icon;
      const label = document.createElement("span");
      label.textContent = item.label;
      link.appendChild(icon);
      link.appendChild(label);
      nav.appendChild(link);
    });
    sidebar.appendChild(nav);

    const foot = document.createElement("div");
    foot.className = "side-foot";
    const plan = document.createElement("strong");
    plan.textContent = "Plano gratuito";
    const quota = document.createElement("span");
    quota.id = "sidebar-quota";
    quota.textContent = "Cálculos ilimitados no protótipo";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn--ghost-light btn--sm btn--block";
    button.textContent = "Ver planos";
    button.addEventListener("click", function () {
      PC.openInfo({
        emoji: "🚧",
        title: "Planos chegando em breve",
        text: "Este protótipo funciona inteiramente no seu navegador, sem cobrança. Os planos pagos entram quando o PreçoCerto ganhar sincronização na nuvem.",
      });
    });
    foot.appendChild(plan);
    foot.appendChild(quota);
    foot.appendChild(button);
    sidebar.appendChild(foot);

    return sidebar;
  }

  /* ---------- Topbar ---------- */
  function buildTopbar(user, title) {
    const bar = document.createElement("header");
    bar.className = "topbar";

    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "menu-btn";
    menuBtn.id = "menu-btn";
    menuBtn.setAttribute("aria-label", "Abrir menu");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "☰";

    const heading = document.createElement("span");
    heading.className = "topbar__title";
    heading.textContent = title || "PreçoCerto";

    const userBtn = document.createElement("button");
    userBtn.type = "button";
    userBtn.className = "topbar__user";
    userBtn.setAttribute("aria-label", "Opções da conta de " + user.nome);

    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = PC.initials(user.nome);

    const name = document.createElement("span");
    name.textContent = user.nome;

    userBtn.appendChild(avatar);
    userBtn.appendChild(name);

    userBtn.addEventListener("click", function () {
      PC.openConfirm({
        emoji: "👋",
        title: "Sair do PreçoCerto?",
        text: "Seus serviços e cálculos continuam salvos neste navegador. Você volta a encontrá-los ao entrar de novo.",
        confirmLabel: "Sair",
        cancelLabel: "Continuar aqui",
      }).then(function (confirmed) {
        if (confirmed) window.location.href = "index.html";
      });
    });

    bar.appendChild(menuBtn);
    bar.appendChild(heading);
    bar.appendChild(userBtn);
    return bar;
  }

  /* ---------- Menu móvel ---------- */
  function wireMobileMenu(sidebar, menuBtn) {
    let scrim = null;

    function close() {
      sidebar.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      if (scrim && scrim.parentNode) scrim.parentNode.removeChild(scrim);
      scrim = null;
    }

    menuBtn.addEventListener("click", function () {
      const isOpen = sidebar.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        scrim = document.createElement("div");
        scrim.className = "scrim";
        scrim.addEventListener("click", close);
        document.body.appendChild(scrim);
      } else {
        close();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) close();
    });
  }

  /* ---------- Dicas ---------- */
  function randomTip() {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  }

  function renderTip(container) {
    if (!container) return;
    container.innerHTML = "";
    container.className = "tip";

    const emoji = document.createElement("span");
    emoji.className = "tip__emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = "💡";

    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = "Dica do dia";
    const body = document.createElement("span");
    body.textContent = randomTip();
    text.appendChild(title);
    text.appendChild(body);

    container.appendChild(emoji);
    container.appendChild(text);
  }

  /* ---------- Bootstrap ---------- */
  function mount() {
    const body = document.body;
    const pageId = body.getAttribute("data-page");
    if (!pageId) return;

    const user = requireUser();
    if (!user) return;

    const shell = PC.qs(".shell");
    const main = PC.qs(".main");
    if (!shell || !main) return;

    const sidebar = buildSidebar(pageId);
    shell.insertBefore(sidebar, main);

    const topbar = buildTopbar(user, body.getAttribute("data-title"));
    main.insertBefore(topbar, main.firstChild);

    wireMobileMenu(sidebar, PC.qs("#menu-btn"));
    renderTip(PC.qs("[data-tip]"));

    document.dispatchEvent(
      new CustomEvent("pc:ready", { detail: { user: user, page: pageId } })
    );
  }

  /* ---------- Categorias de serviço ---------- */
  const CATEGORIES = [
    { id: "design", label: "Design", icon: "🎨", tint: "var(--tint-primary)" },
    { id: "tecnologia", label: "Tecnologia", icon: "💻", tint: "var(--tint-secondary)" },
    { id: "marketing", label: "Marketing", icon: "📣", tint: "var(--tint-pink)" },
    { id: "fotografia", label: "Fotografia", icon: "📷", tint: "var(--tint-cyan)" },
    { id: "gastronomia", label: "Gastronomia", icon: "🧁", tint: "var(--tint-warning)" },
    { id: "manutencao", label: "Manutenção e reparos", icon: "🔧", tint: "var(--tint-secondary)" },
    { id: "beleza", label: "Beleza e bem-estar", icon: "💅", tint: "var(--tint-pink)" },
    { id: "educacao", label: "Educação e aulas", icon: "📚", tint: "var(--tint-success)" },
    { id: "eventos", label: "Eventos", icon: "🎉", tint: "var(--tint-warning)" },
    { id: "outros", label: "Outros", icon: "✨", tint: "var(--tint-cyan)" },
  ];

  function getCategory(id) {
    return (
      CATEGORIES.filter(function (category) { return category.id === id; })[0] ||
      CATEGORIES[CATEGORIES.length - 1]
    );
  }

  window.PCShell = {
    CATEGORIES: CATEGORIES,
    getCategory: getCategory,
    requireUser: requireUser,
    randomTip: randomTip,
    renderTip: renderTip,
    TIPS: TIPS,
  };

  document.addEventListener("DOMContentLoaded", mount);
})();
