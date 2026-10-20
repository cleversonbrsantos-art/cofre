import { describe, it, expect } from "vitest";
import { calcularMeta, pmt, nper, diferencaMesesReais } from "./metas";

import type { Meta } from "./models";

/** §8 caso 5: PMT de meta — alvo 12.000, guardado 0, 12 meses, taxa 0,5% a.m. → ≈ R$ 972,80; taxa 0 → R$ 1.000,00. */
describe("metas — §8 caso 5: PMT", () => {
  it("alvo 12.000 em 12 meses a 0,5% a.m. exige aporte ≈ R$ 972,80", () => {
    const aporte = pmt(1_200_000, 0, 12, 0.005);
    expect(aporte).toBeCloseTo(97_280, 0); // R$ 972,80
    expect(Math.abs(aporte - 97_280)).toBeLessThanOrEqual(1);
  });

  it("taxa 0 → R$ 1.000,00/mês", () => {
    const aporte = pmt(1_200_000, 0, 12, 0);
    expect(aporte).toBe(100_000);
  });

  it("com valor presente, PMT cobre só o que falta", () => {
    // 12.000 alvo, já guardado 6.000, taxa 0, 12 meses → 6.000/12 = 500
    expect(pmt(1_200_000, 600_000, 12, 0)).toBe(50_000);
  });
});

/** §8 caso 6: NPER retorna "Sem aporte" quando aporte 0 e guardado < alvo. */
describe("metas — §8 caso 6: NPER", () => {
  it("aporte 0 e guardado menor que alvo → conclusaoComAporteAtual null (Sem aporte)", () => {
    const meta: Meta = {
      id: 1,
      nome: "Viagem",
      valorAlvo: 1_000_000,
      prazo: null,
      jaGuardado: 100_000,
      aporteMensal: 0,
      rendimentoAa: 10.5,
    };
    const r = calcularMeta(meta, 202601, 0.005);
    expect(r.situacao).toBe("Sem aporte");
    expect(r.conclusaoComAporteAtual).toBe(null);
    expect(r.falta).toBe(900_000);
  });

  it("aporte suficiente com taxa 0 → NPER arredondado para cima", () => {
    expect(nper(1_000_000, 0, 100_000, 0)).toBe(10);
    const meta: Meta = {
      id: 1,
      nome: "Viagem",
      valorAlvo: 1_000_000,
      prazo: null,
      jaGuardado: 0,
      aporteMensal: 100_000,
      rendimentoAa: 0,
    };
    const r = calcularMeta(meta, 202601, 0);
    expect(r.conclusaoComAporteAtual).toBe(10);
    expect(r.situacao).toBe("Sem prazo");
  });

  it("concluída quando guardado ≥ alvo", () => {
    const meta: Meta = {
      id: 1,
      nome: "Viagem",
      valorAlvo: 500_000,
      prazo: "2026-12-01",
      jaGuardado: 500_000,
      aporteMensal: 0,
      rendimentoAa: null,
    };
    const r = calcularMeta(meta, 202601, 0.005);
    expect(r.situacao).toBe("Concluída");
    expect(r.aporteNecessario).toBe(0);
    expect(r.falta).toBe(0);
  });

  it("no prazo quando conclusão ≤ meses até o prazo", () => {
    const meta: Meta = {
      id: 1,
      nome: "Meta",
      valorAlvo: 1_200_000,
      prazo: "2027-01-15",
      jaGuardado: 0,
      aporteMensal: 100_000,
      rendimentoAa: 0,
    };
    // hoje 202601 → prazo 202701 = 12 meses; aporte 1.000 taxa 0 → 12 meses → no prazo
    const r = calcularMeta(meta, 202601, 0);
    expect(r.mesesAtePrazo).toBe(12);
    expect(r.situacao).toBe("No prazo");
  });

  it("atrasada quando a conclusão passa do prazo", () => {
    const meta: Meta = {
      id: 1,
      nome: "Meta",
      valorAlvo: 1_200_000,
      prazo: "2026-12-15",
      jaGuardado: 0,
      aporteMensal: 100_000,
      rendimentoAa: 0,
    };
    // prazo 11 meses, aporte só cobre em 12 → atrasada
    const r = calcularMeta(meta, 202601, 0);
    expect(r.situacao).toBe("Atrasada: aumente o aporte");
  });
});

describe("metas — meses até o prazo", () => {
  it("diferença mínima 0 e cruzando ano", () => {
    expect(diferencaMesesReais(202601, 202610)).toBe(9);
    expect(diferencaMesesReais(202612, 202701)).toBe(1);
    expect(diferencaMesesReais(202601, 202601)).toBe(0);
    expect(diferencaMesesReais(202606, 202601)).toBe(0); // prazo no passado
  });
});

describe("metas — evolução (pontos)", () => {
  it("cresce mês a mês até o alvo", () => {
    const meta: Meta = {
      id: 2,
      nome: "Reserva",
      valorAlvo: 500_000,
      prazo: null,
      jaGuardado: 100_000,
      aporteMensal: 100_000,
      rendimentoAa: 10.5,
    };
    const r = calcularMeta(meta, 202601, 0.005);
    expect(r.pontos.length).toBeGreaterThanOrEqual(4);
    expect(r.pontos[0].mesKey).toBe(202602);
    const ultimo = r.pontos[r.pontos.length - 1];
    expect(ultimo.saldo).toBeGreaterThanOrEqual(500_000);
  });
});
