export interface ResultadoJurosCompostos {
  taxaMensal: number;
  pontos: { mes: number; ano: number; aportes: number; montante: number; juros: number }[];
  totalAportado: number;
  montanteFinal: number;
  jurosTotal: number;
  valorFuturoHoje: number; // poder de compra de hoje: VF ÷ (1+inflação)^anos
}

/**
 * Juros compostos (4.14.1): VF = inicial·(1+i)^n + aporte·((1+i)^n − 1)/i.
 * Aporte no fim do mês. taxaAa e inflacaoAa em % a.a.
 */
export function simularJurosCompostos(
  inicial: number,
  aporteMensal: number,
  taxaAa: number,
  anos: number,
  inflacaoAa: number,
): ResultadoJurosCompostos {
  const meses = anos * 12;
  const i = Math.pow(1 + taxaAa / 100, 1 / 12) - 1;
  const fatorCrescimento = Math.pow(1 + i, meses);
  const montanteExato =
    i === 0 ? inicial + aporteMensal * meses : inicial * fatorCrescimento + (aporteMensal * (fatorCrescimento - 1)) / i;
  const montanteFinal = Math.round(montanteExato);
  const totalAportado = inicial + aporteMensal * meses;

  // pontos ano a ano (para gráfico/tabela)
  const pontos: { mes: number; ano: number; aportes: number; montante: number; juros: number }[] = [];
  let saldo = inicial;
  let aportado = inicial;
  for (let m = 1; m <= meses; m++) {
    saldo = Math.round(saldo * (1 + i) + aporteMensal);
    aportado += aporteMensal;
    if (m % 12 === 0 || m === meses) {
      pontos.push({ mes: m, ano: Math.ceil(m / 12), aportes: aportado, montante: saldo, juros: saldo - aportado });
    }
  }

  const fatorInflacao = Math.pow(1 + inflacaoAa / 100, anos);
  return {
    taxaMensal: i,
    pontos,
    totalAportado,
    montanteFinal,
    jurosTotal: montanteFinal - totalAportado,
    valorFuturoHoje: Math.round(montanteFinal / fatorInflacao),
  };
}

export interface ResultadoIndependencia {
  patrimonioNecessario: number; // renda desejada × 12 × 25
  falta: number;
  percentualPercorrido: number | null;
  rendaPassivaHoje: number; // patrimônio × 4% ÷ 12
  anosParaChegar: number | null; // NPER com taxa real mensal
  aporteNecessario: number | null; // PMT para o prazo
}

/** Independência financeira (4.14.2): regra dos 25× / 4% a.a., taxa real = (rendimento − inflação) equivalente. */
export function independenciaFinanceira(
  rendaDesejada: number,
  aporteMensal: number,
  patrimonioAtual: number,
  rendimentoAa: number,
  inflacaoAa: number,
  anosPrazo: number,
): ResultadoIndependencia {
  const patrimonioNecessario = rendaDesejada * 12 * 25;
  const falta = Math.max(0, patrimonioNecessario - patrimonioAtual);
  const percentual = patrimonioNecessario > 0 ? (patrimonioAtual / patrimonioNecessario) * 100 : null;
  const rendaPassivaHoje = Math.round((patrimonioAtual * 0.04) / 12);
  // taxa real mensal ≈ (1+real_aa)^(1/12)−1 com real_aa = (1+aa)/(1+infl) − 1
  const realAa = (1 + rendimentoAa / 100) / (1 + inflacaoAa / 100) - 1;
  const iReal = Math.pow(1 + realAa, 1 / 12) - 1;

  // NPER: anos para chegar com o aporte atual
  let anosParaChegar: number | null = null;
  if (falta === 0) {
    anosParaChegar = 0;
  } else if (aporteMensal > 0) {
    let saldo = patrimonioAtual;
    for (let m = 1; m <= 12 * 80; m++) {
      saldo = Math.round(saldo * (1 + iReal) + aporteMensal);
      if (saldo >= patrimonioNecessario) {
        anosParaChegar = Math.ceil(m / 12);
        break;
      }
    }
  }

  // PMT: aporte para chegar no prazo
  let aporteNecessario: number | null = null;
  if (falta > 0 && anosPrazo > 0) {
    const meses = anosPrazo * 12;
    const fvDoVP = patrimonioAtual * Math.pow(1 + iReal, meses);
    const fvFaltante = Math.max(0, falta - fvDoVP);
    const fator = (Math.pow(1 + iReal, meses) - 1) / iReal;
    aporteNecessario = Math.ceil(fvFaltante / fator);
  }

  return {
    patrimonioNecessario,
    falta,
    percentualPercorrido: percentual,
    rendaPassivaHoje,
    anosParaChegar,
    aporteNecessario,
  };
}

export interface ResultadoCustoHabito {
  meses: number;
  gastoTotal: number;
  investidoTotal: number;
  diferenca: number;
}

/** Custo do hábito (4.14.3): gasto por vez × vezes/mês × 12 × anos; e se investido todo mês. */
export function custoDoHabito(
  valorPorVez: number,
  vezesPorMes: number,
  taxaAa: number,
  anos: number,
): ResultadoCustoHabito {
  const meses = anos * 12;
  const gastoTotal = valorPorVez * vezesPorMes * meses;
  const aporteMensal = valorPorVez * vezesPorMes;
  const i = Math.pow(1 + taxaAa / 100, 1 / 12) - 1;
  let saldo = 0;
  for (let m = 1; m <= meses; m++) {
    saldo = Math.round(saldo * (1 + i) + aporteMensal);
  }
  return { meses, gastoTotal, investidoTotal: saldo, diferenca: saldo - gastoTotal };
}
