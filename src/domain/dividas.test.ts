import { describe, it, expect } from "vitest";
import { calcularDividas } from "./dividas";
import type { Divida } from "./models";

const divida = (id: number, nome: string, saldoDevedor: number, jurosMes: number, parcelaMinima: number): Divida => ({
  id,
  nome,
  saldoDevedor,
  jurosMes,
  parcelaMinima,
});

/** §8 caso 7: saldo 1.000, juros 2% a.m., parcela 100 → quita em 12 meses. */
describe("dividas — §8 caso 7: só o mínimo", () => {
  it("saldo 1.000, 2% a.m., parcela 100 → 12 meses", () => {
    const r = calcularDividas([divida(1, "Cartão", 100_000, 2, 10_000)], 0, 202601);
    expect(r.porMetodo.minimo.meses).toBe(12);
    expect(r.porMetodo.minimo.rotuloMeses).toBe("12");
    expect(r.porMetodo.minimo.dataQuitacao).toBe("2026-12-31");
    // juros totais: soma dos saldos × 2% mês a mês
    const jurosEsperados = [100_000, 92_000, 83_840, 75_517, 67_027, 58_368, 49_535, 40_526, 31_337, 21_964, 12_403, 2_651]
      .reduce((s, saldo) => s + Math.round(saldo * 0.02), 0);
    expect(r.porMetodo.minimo.jurosTotais).toBe(jurosEsperados);
  });

  it("parcela 20 (= juros) → alerta e 'mais de 60'", () => {
    const r = calcularDividas([divida(1, "Cartão", 100_000, 2, 2_000)], 0, 202601);
    expect(r.porMetodo.minimo.meses).toBe(null);
    expect(r.porMetodo.minimo.rotuloMeses).toBe("mais de 60");
    expect(r.alertas).toHaveLength(1);
    expect(r.alertas[0].mensagem).toBe("A parcela não cobre os juros.");
  });

  it("juros estimados do 1º mês = saldo × taxa", () => {
    const r = calcularDividas(
      [divida(1, "A", 100_000, 2, 10_000), divida(2, "B", 50_000, 5, 5_000)],
      0,
      202601,
    );
    expect(r.jurosPrimeiroMes).toBe(2_000 + 2_500);
  });
});

/** §8 caso 8: duas dívidas com saldo e juros em ordem oposta → ordens de quitação diferem; avalanche paga menos juros. */
describe("dividas — §8 caso 8: avalanche vs. bola de neve", () => {
  // A (id 1): saldo 1.000, juros 5% a.m., parcela 500; B (id 2): saldo 500, juros 1% a.m., parcela 250.
  // Extra 500 → total mensal 1.250. Neve ataca B primeiro (menor saldo); avalanche ataca A primeiro (maior juros).
  const dividas = [
    divida(1, "Grande cara", 100_000, 5, 50_000),
    divida(2, "Pequena barata", 50_000, 1, 25_000),
  ];

  it("ordens de quitação diferem", () => {
    const r = calcularDividas(dividas, 50_000, 202601);
    expect(r.porMetodo.neve.ordemQuitacao).toEqual([2, 1]);
    expect(r.porMetodo.avalanche.ordemQuitacao).toEqual([1, 2]);
  });

  it("avalanche paga menos juros totais que a neve", () => {
    const r = calcularDividas(dividas, 50_000, 202601);
    expect(r.porMetodo.avalanche.jurosTotais).toBeLessThan(r.porMetodo.neve.jurosTotais);
    // mínimo (sem extra) paga juros ≥ avalanche (com extra)
    expect(r.porMetodo.minimo.jurosTotais).toBeGreaterThanOrEqual(r.porMetodo.avalanche.jurosTotais);
  });

  it("saldo total decresce mês a mês com redirecionamento", () => {
    const r = calcularDividas(dividas, 50_000, 202601);
    const serieNeve = r.porMetodo.neve.serie;
    expect(serieNeve.length).toBeGreaterThan(0);
    for (let i = 1; i < serieNeve.length; i++) {
      expect(serieNeve[i].saldoTotal).toBeLessThanOrEqual(serieNeve[i - 1].saldoTotal);
    }
  });
});
