import { describe, it, expect } from "vitest";
import {
  calcularRentabilidade,
  calcularAlocacao,
  calcularPatrimonio,
  seriePatrimonio,
} from "./investimentos";
import type {
  AlvoAlocacao,
  AtivoInvestimento,
  BemPassivo,
  Conta,
  Divida,
  HistoricoPatrimonio,
  Lancamento,
} from "./models";

describe("investimentos — rentabilidade por ativo (4.12)", () => {
  it("R$ = atual − aportado; % = R$ ÷ aportado; % da carteira", () => {
    const ativos: AtivoInvestimento[] = [
      { id: 1, nome: "CDB", classe: "Renda fixa", totalAportado: 1_000_00, valorAtual: 1_100_00 },
      { id: 2, nome: "Ações", classe: "Ações", totalAportado: 500_00, valorAtual: 400_00 },
    ];
    const r = calcularRentabilidade(ativos);
    expect(r[0].rentabilidadeReais).toBe(100_00);
    expect(r[0].rentabilidadePercentual).toBeCloseTo(10, 5);
    expect(r[0].percentualCarteira).toBeCloseTo(110000 / 150000 * 100, 5);
    expect(r[1].rentabilidadeReais).toBe(-100_00);
    expect(r[1].rentabilidadePercentual).toBeCloseTo(-20, 5);
  });

  it("aportado 0 → % null", () => {
    const r = calcularRentabilidade([{ id: 1, nome: "X", classe: "Outros", totalAportado: 0, valorAtual: 50_00 }]);
    expect(r[0].rentabilidadePercentual).toBe(null);
    expect(r[0].percentualCarteira).toBe(100);
  });
});

describe("investimentos — alocação por classe (4.12)", () => {
  const ativos: AtivoInvestimento[] = [
    { id: 1, nome: "CDB", classe: "Renda fixa", totalAportado: 60_000, valorAtual: 60_000 },
    { id: 2, nome: "Ações", classe: "Ações", totalAportado: 40_000, valorAtual: 40_000 },
  ];
  const alvos: AlvoAlocacao[] = [
    { id: 1, classe: "Renda fixa", percentual: 50 },
    { id: 2, classe: "Ações", percentual: 50 },
  ];

  it("valores, % atual, diferença em p.p. e ajuste", () => {
    const r = calcularAlocacao(ativos, alvos);
    expect(r.alvosOk).toBe(true);
    expect(r.porClasse[0].valorAtual).toBe(60_000);
    expect(r.porClasse[0].percentualAtual).toBeCloseTo(60, 5);
    expect(r.porClasse[0].diferencaPp).toBeCloseTo(10, 5);
    expect(r.porClasse[0].ajuste).toBe(-10_000); // 50% × 100.000 − 60.000
    expect(r.porClasse[0].situacao).toBe("Acima");
    expect(r.porClasse[1].ajuste).toBe(10_000);
    expect(r.porClasse[1].situacao).toBe("Abaixo");
  });

  it("soma de alvos ≠ 100 → alvosOk false (alerta)", () => {
    const r = calcularAlocacao(ativos, [
      { id: 1, classe: "Renda fixa", percentual: 60 },
      { id: 2, classe: "Ações", percentual: 30 },
    ]);
    expect(r.somaAlvos).toBe(90);
    expect(r.alvosOk).toBe(false);
  });

  it("classe com ativo mas sem alvo entra com alvo 0", () => {
    const r = calcularAlocacao(
      [...ativos, { id: 3, nome: "Cripto", classe: "Cripto", totalAportado: 0, valorAtual: 0 }],
      alvos,
    );
    const cripto = r.porClasse.find((c) => c.classe === "Cripto");
    expect(cripto?.percentualAlvo).toBe(0);
    expect(cripto?.situacao).toBe("Dentro");
  });
});

/** §8 caso 10: PL = (contas sem Investimentos + carteira + bens) − (dívidas + outros passivos). */
describe("investimentos — patrimônio líquido (§8 caso 10)", () => {
  const contas: Conta[] = [
    { id: 1, nome: "Corrente", tipo: "Corrente", saldoInicial: 100_00, saldoExtrato: null },
    { id: 2, nome: "Carteira", tipo: "Carteira", saldoInicial: 50_00, saldoExtrato: null },
    { id: 3, nome: "Investimentos", tipo: "Investimentos", saldoInicial: 999_00, saldoExtrato: null },
  ];
  const lancamentos: Lancamento[] = []; // sem movimentos: saldos = saldos iniciais
  const bens: BemPassivo[] = [{ id: 1, nome: "Carro", valor: 2_000_00 }];
  const dividas: Divida[] = [
    { id: 1, nome: "Cartão", saldoDevedor: 300_00, jurosMes: 2, parcelaMinima: 50_00 },
  ];
  const outrosPassivos: BemPassivo[] = [{ id: 2, nome: "Imposto a pagar", valor: -100_00 }];

  it("ativos = contas sem Investimentos + bens; passivos = dívidas + outros", () => {
    const r = calcularPatrimonio(contas, lancamentos, [...bens, ...outrosPassivos], dividas);
    // ativos = 100 + 50 (sem Investimentos 999) + 2.000 = 2.150
    expect(r.ativos).toBe(100_00 + 50_00 + 2_000_00);
    // passivos = 300 + 100 = 400
    expect(r.passivos).toBe(300_00 + 100_00);
    expect(r.patrimonioLiquido).toBe(2_150_00 - 400_00);
  });

  it("bens negativos são passivos, não ativos", () => {
    const r = calcularPatrimonio(contas, lancamentos, [{ id: 3, nome: "Financiamento", valor: -50_00 }], []);
    // contas sem Investimentos: 100 + 50
    expect(r.ativos).toBe(150_00);
    expect(r.passivos).toBe(50_00);
    expect(r.patrimonioLiquido).toBe(100_00);
  });
});

describe("investimentos — série do patrimônio (gráfico 12)", () => {
  it("ordena por mesKey e calcula PL = ativos − passivos", () => {
    const hist: HistoricoPatrimonio[] = [
      { id: 2, mesKey: 202602, ativos: 1_200_00, passivos: 200_00 },
      { id: 1, mesKey: 202601, ativos: 1_000_00, passivos: 300_00 },
    ];
    const serie = seriePatrimonio(hist);
    expect(serie[0].mesKey).toBe(202601);
    expect(serie[0].patrimonio).toBe(700_00);
    expect(serie[1].patrimonio).toBe(1_000_00);
  });
});
