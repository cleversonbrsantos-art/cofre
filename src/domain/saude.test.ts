import { describe, it, expect } from "vitest";
import { calcularNotaSaude } from "./saude";

/** §8 caso 1: 5 regras com 10 pts cada → 50 de 100 → nota 50; sem reserva → 40 de 80 → nota 50. */
describe("saude — §8 caso 1: nota de saúde", () => {
  it("5 regras com 10 pontos cada → soma 50 de 100 → nota 50", () => {
    const r = calcularNotaSaude({
      taxaPoupanca: 0.1, // 10% ÷ 20% → clamp(0,5) × 20 = 10
      coberturaMeses: 3, // 3 ÷ 6 → 0,5 × 20 = 10
      mesesAlvoReserva: 6,
      parcelasMinimasSobreReceitas: 0.45, // (0,6 − 0,45) ÷ 0,3 = 0,5 → 10
      necessidadesSobreReceitas: 0.65, // (0,8 − 0,65) ÷ 0,3 = 0,5 → 10
      usoOrcamento: 115, // (1,3 − 1,15) ÷ 0,3 = 0,5 → 10
    });
    expect(r.regrasComDados).toBe(5);
    for (const regra of r.regras) {
      expect(regra.pontos).toBeCloseTo(10, 2);
      expect(regra.situacao).toBe("Atenção"); // 10 pts → Atenção (≥ 6, < 12)
    }
    expect(r.pontosObtidos).toBeCloseTo(50, 2);
    expect(r.pontosPossiveis).toBe(100);
    expect(r.nota).toBeCloseTo(50, 5);
  });

  it("reserva sem dados (cobertura null) → 4 regras, 40 de 80 → nota 50", () => {
    const r = calcularNotaSaude({
      taxaPoupanca: 0.1,
      coberturaMeses: null,
      mesesAlvoReserva: 6,
      parcelasMinimasSobreReceitas: 0.45,
      necessidadesSobreReceitas: 0.65,
      usoOrcamento: 115,
    });
    const reserva = r.regras.find((x) => x.chave === "reserva");
    expect(reserva?.pontos).toBe(null);
    expect(reserva?.situacao).toBe("Sem dados");
    expect(r.regrasComDados).toBe(4);
    expect(r.pontosObtidos).toBeCloseTo(40, 2);
    expect(r.pontosPossiveis).toBe(80);
    expect(r.nota).toBeCloseTo(50, 5);
  });

  it("meses-alvo 0 → reserva sem dados", () => {
    const r = calcularNotaSaude({
      taxaPoupanca: null,
      coberturaMeses: 3,
      mesesAlvoReserva: 0,
      parcelasMinimasSobreReceitas: null,
      necessidadesSobreReceitas: null,
      usoOrcamento: null,
    });
    const reserva = r.regras.find((x) => x.chave === "reserva");
    expect(reserva?.pontos).toBe(null);
    expect(r.regrasComDados).toBe(0);
    expect(r.pontosObtidos).toBe(0);
    expect(r.nota).toBe(null);
  });

  it("clamp: valores extremos produzem 0 ou 20", () => {
    const r = calcularNotaSaude({
      taxaPoupanca: 0.5, // 0,5 ÷ 0,2 = 2,5 → clamp 1 → 20
      coberturaMeses: 24, // 24 ÷ 6 = 4 → clamp 1 → 20
      mesesAlvoReserva: 6,
      parcelasMinimasSobreReceitas: 0.9, // (0,6 − 0,9) negativo → 0
      necessidadesSobreReceitas: 0.1, // (0,8 − 0,1) ÷ 0,3 = 2,33 → clamp → 20
      usoOrcamento: 300, // (1,3 − 3) negativo → 0
    });
    expect(r.regras.find((x) => x.chave === "poupanca")?.pontos).toBe(20);
    expect(r.regras.find((x) => x.chave === "reserva")?.pontos).toBe(20);
    expect(r.regras.find((x) => x.chave === "dividas")?.pontos).toBe(0);
    expect(r.regras.find((x) => x.chave === "gastosFixos")?.pontos).toBe(20);
    expect(r.regras.find((x) => x.chave === "orcamento")?.pontos).toBe(0);
    expect(r.regras.find((x) => x.chave === "poupanca")?.situacao).toBe("Ótimo");
    expect(r.regras.find((x) => x.chave === "dividas")?.situacao).toBe("Crítico");
  });

  it("nenhuma regra com dados → nota null", () => {
    const r = calcularNotaSaude({
      taxaPoupanca: null,
      coberturaMeses: null,
      mesesAlvoReserva: null,
      parcelasMinimasSobreReceitas: null,
      necessidadesSobreReceitas: null,
      usoOrcamento: null,
    });
    expect(r.regrasComDados).toBe(0);
    expect(r.nota).toBe(null);
    expect(r.pontosObtidos).toBe(0);
  });
});
