/* =========================================================
   PreçoCerto — storage.js
   Única camada que conhece o localStorage.
   Para migrar para Supabase/banco real no futuro, basta
   reescrever as funções deste arquivo mantendo a assinatura.
   ========================================================= */

(function () {
  "use strict";

  const KEYS = {
    user: "precocerto_user",
    services: "precocerto_services",
    calculations: "precocerto_calculations",
    settings: "precocerto_settings",
    lastCalculation: "precocerto_last_calculation",
  };

  const DEFAULT_SETTINGS = {
    horasDisponiveisMes: 160,
    moeda: "BRL",
  };

  /* ---------- Leitura/escrita brutas ---------- */
  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (error) {
      console.warn("[PreçoCerto] Falha ao ler " + key, error);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("[PreçoCerto] Falha ao salvar " + key, error);
      return false;
    }
  }

  /* ---------- Inicialização ---------- */
  function initializeStorage() {
    if (window.localStorage.getItem(KEYS.services) === null) write(KEYS.services, []);
    if (window.localStorage.getItem(KEYS.calculations) === null) write(KEYS.calculations, []);
    if (window.localStorage.getItem(KEYS.settings) === null) write(KEYS.settings, DEFAULT_SETTINGS);
  }

  /* ---------- Usuário ---------- */
  function saveUser(user) {
    const record = Object.assign(
      {
        id: window.PC.generateId("user"),
        criadoEm: new Date().toISOString(),
      },
      user
    );
    write(KEYS.user, record);
    return record;
  }

  function getUser() {
    return read(KEYS.user, null);
  }

  function updateUser(patch) {
    const current = getUser();
    if (!current) return null;
    const updated = Object.assign({}, current, patch, {
      atualizadoEm: new Date().toISOString(),
    });
    write(KEYS.user, updated);
    return updated;
  }

  /* ---------- Serviços ---------- */
  function getServices() {
    const list = read(KEYS.services, []);
    return Array.isArray(list) ? list : [];
  }

  function getServiceById(id) {
    return getServices().filter(function (service) { return service.id === id; })[0] || null;
  }

  function saveService(service) {
    const list = getServices();
    const record = Object.assign(
      {
        id: window.PC.generateId("service"),
        criadoEm: new Date().toISOString(),
      },
      service
    );
    list.push(record);
    write(KEYS.services, list);
    return record;
  }

  function updateService(id, patch) {
    const list = getServices();
    let updated = null;
    const next = list.map(function (service) {
      if (service.id !== id) return service;
      updated = Object.assign({}, service, patch, {
        atualizadoEm: new Date().toISOString(),
      });
      return updated;
    });
    write(KEYS.services, next);
    return updated;
  }

  function deleteService(id) {
    const next = getServices().filter(function (service) { return service.id !== id; });
    write(KEYS.services, next);
    /* Os cálculos do serviço permanecem no histórico, mas perdem o vínculo. */
    const calculations = getCalculations().map(function (calc) {
      return calc.servicoId === id ? Object.assign({}, calc, { servicoId: null }) : calc;
    });
    write(KEYS.calculations, calculations);
    return true;
  }

  /* ---------- Cálculos ---------- */
  function getCalculations() {
    const list = read(KEYS.calculations, []);
    return Array.isArray(list) ? list : [];
  }

  function saveCalculation(calculation) {
    const list = getCalculations();
    const record = Object.assign(
      {
        id: window.PC.generateId("calc"),
        criadoEm: new Date().toISOString(),
      },
      calculation
    );
    list.unshift(record);
    write(KEYS.calculations, list);
    write(KEYS.lastCalculation, record.id);
    return record;
  }

  function getCalculationById(id) {
    return getCalculations().filter(function (calc) { return calc.id === id; })[0] || null;
  }

  function updateCalculation(id, patch) {
    let updated = null;
    const next = getCalculations().map(function (calc) {
      if (calc.id !== id) return calc;
      updated = Object.assign({}, calc, patch);
      return updated;
    });
    write(KEYS.calculations, next);
    return updated;
  }

  function deleteCalculation(id) {
    const next = getCalculations().filter(function (calc) { return calc.id !== id; });
    write(KEYS.calculations, next);
    return true;
  }

  function getLastCalculation() {
    const id = read(KEYS.lastCalculation, null);
    return id ? getCalculationById(id) : getCalculations()[0] || null;
  }

  function setLastCalculationId(id) {
    write(KEYS.lastCalculation, id);
  }

  function clearCalculations() {
    write(KEYS.calculations, []);
    window.localStorage.removeItem(KEYS.lastCalculation);
  }

  /* ---------- Preferências ---------- */
  function getSettings() {
    return Object.assign({}, DEFAULT_SETTINGS, read(KEYS.settings, {}));
  }

  function updateSettings(patch) {
    const updated = Object.assign(getSettings(), patch);
    write(KEYS.settings, updated);
    return updated;
  }

  /* ---------- Reset ---------- */
  function clearAllData() {
    Object.keys(KEYS).forEach(function (name) {
      window.localStorage.removeItem(KEYS[name]);
    });
    initializeStorage();
  }

  window.PCStore = {
    KEYS: KEYS,
    initializeStorage: initializeStorage,
    saveUser: saveUser,
    getUser: getUser,
    updateUser: updateUser,
    getServices: getServices,
    getServiceById: getServiceById,
    saveService: saveService,
    updateService: updateService,
    deleteService: deleteService,
    getCalculations: getCalculations,
    getCalculationById: getCalculationById,
    saveCalculation: saveCalculation,
    updateCalculation: updateCalculation,
    deleteCalculation: deleteCalculation,
    getLastCalculation: getLastCalculation,
    setLastCalculationId: setLastCalculationId,
    clearCalculations: clearCalculations,
    getSettings: getSettings,
    updateSettings: updateSettings,
    clearAllData: clearAllData,
  };

  initializeStorage();
})();
