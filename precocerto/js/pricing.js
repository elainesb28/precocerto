/* =========================================================
   PreçoCerto — pricing.js
   Motor de cálculo. Nenhuma referência ao DOM aqui:
   entra um objeto com os dados do serviço, sai um objeto
   com os três preços e todos os números intermediários.
   ========================================================= */

(function () {
  "use strict";

  /* --------- Constantes ajustáveis do modelo ---------
     Alterar estes números muda toda a política de preço
     do produto, sem tocar em nenhuma outra parte do código. */
  const HORAS_DISPONIVEIS_MES = 160;   // jornada de referência (8h x 20 dias)
  const RESERVA_IMPREVISTOS = 0.08;    // 8% sobre a base, para retrabalho e atrasos
  const MINIMO_MULTIPLIER = 1.12;      // piso: cobre custos + meta com folga mínima
  const RECOMENDADO_MULTIPLIER = 1.35; // equilíbrio entre custo, tempo e lucro
  const PREMIUM_MULTIPLIER = 1.72;     // posicionamento de maior valor percebido
  const ARREDONDAMENTO = 5;            // preços terminam em múltiplos de R$ 5

  function roundPrice(value) {
    if (!isFinite(value) || value <= 0) return 0;
    return Math.ceil(value / ARREDONDAMENTO) * ARREDONDAMENTO;
  }

  function toNumber(value) {
    const number = Number(value);
    return isFinite(number) && number > 0 ? number : 0;
  }

  /**
   * Calcula os três níveis de preço de um serviço.
   *
   * Fórmula, em quatro passos:
   *   1. custoTotal        = materiais + deslocamento + outros
   *   2. valorHoraBase     = metaMensal / horasDisponiveisMes
   *      custoMaoDeObra    = valorHoraBase x horas do serviço
   *   3. base              = custoTotal + custoMaoDeObra
   *      Se o usuário informou quantos serviços pretende fazer por mês,
   *      cada serviço precisa contribuir com metaMensal / quantidade.
   *      A base passa a ser a maior das duas exigências, para que a meta
   *      seja de fato alcançável no volume informado.
   *   4. baseProtegida     = base x (1 + reserva para imprevistos)
   *      e sobre ela aplicam-se os três multiplicadores.
   */
  function calculatePricing(input) {
    const data = input || {};
    const custos = data.custos || {};

    const materiais = toNumber(custos.materiais);
    const deslocamento = toNumber(custos.deslocamento);
    const outros = toNumber(custos.outros);
    const custoTotal = materiais + deslocamento + outros;

    const horas = toNumber(data.horas);
    const metaMensal = toNumber(data.metaMensal);
    const servicosPorMes = toNumber(data.servicosPorMes);
    const horasDisponiveis = toNumber(data.horasDisponiveisMes) || HORAS_DISPONIVEIS_MES;

    const valorHoraBase = metaMensal / horasDisponiveis;
    const custoMaoDeObra = valorHoraBase * horas;

    let base = custoTotal + custoMaoDeObra;
    let contribuicaoPorServico = 0;

    if (servicosPorMes > 0 && metaMensal > 0) {
      contribuicaoPorServico = metaMensal / servicosPorMes;
      base = Math.max(base, custoTotal + contribuicaoPorServico);
    }

    const baseProtegida = base * (1 + RESERVA_IMPREVISTOS);

    const precoMinimo = roundPrice(baseProtegida * MINIMO_MULTIPLIER);
    const precoRecomendado = roundPrice(baseProtegida * RECOMENDADO_MULTIPLIER);
    const precoPremium = roundPrice(baseProtegida * PREMIUM_MULTIPLIER);

    return {
      custoTotal: custoTotal,
      horas: horas,
      metaMensal: metaMensal,
      servicosPorMes: servicosPorMes,
      horasDisponiveisMes: horasDisponiveis,
      valorHoraBase: valorHoraBase,
      custoMaoDeObra: custoMaoDeObra,
      contribuicaoPorServico: contribuicaoPorServico,
      base: base,
      baseProtegida: baseProtegida,
      precoMinimo: precoMinimo,
      precoRecomendado: precoRecomendado,
      precoPremium: precoPremium,
      reservaImprevistos: RESERVA_IMPREVISTOS,
      multiplicadores: {
        minimo: MINIMO_MULTIPLIER,
        recomendado: RECOMENDADO_MULTIPLIER,
        premium: PREMIUM_MULTIPLIER,
      },
    };
  }

  /**
   * Avalia um preço qualquer diante dos custos e do tempo do serviço.
   * Usado pelo simulador e pela comparação com o preço atual.
   *
   *   lucro       = quanto sobra depois de pagar os custos diretos
   *   ganhoPorHora= esse lucro dividido pelas horas do serviço
   *   margemBase  = quanto o preço acrescenta sobre a base de cálculo
   *                 (custos + seu tempo + reserva). É a mesma régua dos
   *                 multiplicadores, então o simulador conversa com as
   *                 três faixas de preço.
   */
  function evaluatePrice(preco, pricing) {
    const valor = toNumber(preco);
    const custoTotal = toNumber(pricing && pricing.custoTotal);
    const horas = toNumber(pricing && pricing.horas);
    const baseProtegida = toNumber(pricing && pricing.baseProtegida);

    const lucro = valor - custoTotal;
    const ganhoPorHora = horas > 0 ? lucro / horas : lucro;
    const margemSobrePreco = valor > 0 ? lucro / valor : 0;
    const margemBase = baseProtegida > 0 ? valor / baseProtegida - 1 : 0;

    return {
      preco: valor,
      lucro: lucro,
      ganhoPorHora: ganhoPorHora,
      margem: margemSobrePreco,
      margemBase: margemBase,
    };
  }

  /**
   * Caminho inverso do simulador: dada uma margem desejada sobre a base
   * de cálculo, qual preço aplicar.
   */
  function priceForMargin(pricing, margem) {
    const base = toNumber(pricing && pricing.baseProtegida);
    const alvo = Math.min(Math.max(Number(margem) || 0, 0), 3);
    return roundPrice(base * (1 + alvo));
  }

  window.PCPricing = {
    calculatePricing: calculatePricing,
    evaluatePrice: evaluatePrice,
    priceForMargin: priceForMargin,
    constants: {
      HORAS_DISPONIVEIS_MES: HORAS_DISPONIVEIS_MES,
      RESERVA_IMPREVISTOS: RESERVA_IMPREVISTOS,
      MINIMO_MULTIPLIER: MINIMO_MULTIPLIER,
      RECOMENDADO_MULTIPLIER: RECOMENDADO_MULTIPLIER,
      PREMIUM_MULTIPLIER: PREMIUM_MULTIPLIER,
      ARREDONDAMENTO: ARREDONDAMENTO,
    },
  };
})();
