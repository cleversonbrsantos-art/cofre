export interface EntradaRegraSaude {
  chave: "poupanca" | "reserva" | "dividas" | "gastosFixos" | "orcamento";
  rotulo: string;
  valor: number | null; // valor medido (0-1 ou % conforme a regra); null = sem dados
  metaRotulo: string;
  pontos: number | null; // null = sem dados (regra fora da nota)
  situacao: "Ótimo" | "Bom" | "Atenção" | "Crítico" | "Sem dados";
}

export interface ResultadoSaude {
  regras: EntradaRegraSaude[];
  pontosObtidos: number; // soma das regras com dados
  pontosPossiveis: number; // 20 × regras com dados
  nota: number | null; // 0-100; null se nenhuma regra com dados
  regrasComDados: number;
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

function situacaoDe(pontos: number): EntradaRegraSaude["situacao"] {
  if (pontos >= 18) return "Ótimo";
  if (pontos >= 12) return "Bom";
  if (pontos >= 6) return "Atenção";
  return "Crítico";
}

/**
 * Nota de saúde financeira (4.15): 5 regras de até 20 pontos.
 * Regra sem dados fica fora da nota; nota = pontos ÷ (20 × regras com dados) × 100.
 * taxas em fração (ex.: 0,10 = 10%); cobertura em meses; usoOrcamento em % (ex.: 115).
 */
export function calcularNotaSaude(entrada: {
  taxaPoupanca: number | null; // fração
  coberturaMeses: number | null;
  mesesAlvoReserva: number | null;
  parcelasMinimasSobreReceitas: number | null; // fração
  necessidadesSobreReceitas: number | null; // fração
  usoOrcamento: number | null; // % (100 = 100%)
}): ResultadoSaude {
  const regras: EntradaRegraSaude[] = [];

  // 1. Poupança: taxa ÷ 0,20 × 20
  const taxa = entrada.taxaPoupanca;
  const ptsPoupanca =
    taxa === null
      ? null
      : Math.round(clamp01(taxa / 0.2) * 20 * 100) / 100;
  regras.push({
    chave: "poupanca",
    rotulo: "Poupança",
    valor: taxa,
    metaRotulo: "≥ 20% da receita",
    pontos: ptsPoupanca,
    situacao: ptsPoupanca === null ? "Sem dados" : situacaoDe(ptsPoupanca),
  });

  // 2. Reserva: cobertura ÷ meses-alvo × 20
  const cobertura = entrada.coberturaMeses;
  const alvo = entrada.mesesAlvoReserva;
  const ptsReserva =
    cobertura === null || alvo === null || alvo === 0
      ? null
      : Math.round(clamp01(cobertura / alvo) * 20 * 100) / 100;
  regras.push({
    chave: "reserva",
    rotulo: "Reserva de emergência",
    valor: cobertura,
    metaRotulo: "Cobertura ≥ meses-alvo",
    pontos: ptsReserva,
    situacao: ptsReserva === null ? "Sem dados" : situacaoDe(ptsReserva),
  });

  // 3. Dívidas: parcelas mínimas ÷ receitas ≤ 30% → (0,6 − x) ÷ 0,3 × 20
  const dividas = entrada.parcelasMinimasSobreReceitas;
  const ptsDividas =
    dividas === null
      ? null
      : Math.round(clamp01((0.6 - dividas) / 0.3) * 20 * 100) / 100;
  regras.push({
    chave: "dividas",
    rotulo: "Dívidas",
    valor: dividas,
    metaRotulo: "Parcelas ≤ 30% da receita",
    pontos: ptsDividas,
    situacao: ptsDividas === null ? "Sem dados" : situacaoDe(ptsDividas),
  });

  // 4. Gastos fixos: necessidades ÷ receitas ≤ 50% → (0,8 − x) ÷ 0,3 × 20
  const fixos = entrada.necessidadesSobreReceitas;
  const ptsFixos =
    fixos === null
      ? null
      : Math.round(clamp01((0.8 - fixos) / 0.3) * 20 * 100) / 100;
  regras.push({
    chave: "gastosFixos",
    rotulo: "Gastos fixos (necessidades)",
    valor: fixos,
    metaRotulo: "Necessidades ≤ 50% da receita",
    pontos: ptsFixos,
    situacao: ptsFixos === null ? "Sem dados" : situacaoDe(ptsFixos),
  });

  // 5. Orçamento: uso ≤ 100% → (1,3 − x) ÷ 0,3 × 20 (x em fração)
  const uso = entrada.usoOrcamento; // em % (ex.: 115) ou null
  const usoFrac = uso === null ? null : uso / 100;
  const ptsOrcamento =
    usoFrac === null
      ? null
      : Math.round(clamp01((1.3 - usoFrac) / 0.3) * 20 * 100) / 100;
  regras.push({
    chave: "orcamento",
    rotulo: "Orçamento",
    valor: uso,
    metaRotulo: "Uso do orçamento ≤ 100%",
    pontos: ptsOrcamento,
    situacao: ptsOrcamento === null ? "Sem dados" : situacaoDe(ptsOrcamento),
  });

  const comDados = regras.filter((r) => r.pontos !== null);
  const pontosObtidos = comDados.reduce((s, r) => s + (r.pontos ?? 0), 0);
  const pontosPossiveis = comDados.length * 20;
  const nota = comDados.length === 0 ? null : (pontosObtidos / pontosPossiveis) * 100;

  return {
    regras,
    pontosObtidos,
    pontosPossiveis,
    nota,
    regrasComDados: comDados.length,
  };
}
