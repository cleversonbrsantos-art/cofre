import { describe, it, expect } from "vitest";
import { calcularDividas } from "./dividas";
import type { Divida } from "./models";
import type { MetodoDividas } from "./dividas";

const divida = (id: number, saldoDevedor: number, jurosMes: number, parcelaMinima: number): Divida => ({
  id,
  nome: `Dívida ${id}`,
  saldoDevedor,
  jurosMes,
  parcelaMinima,
});

const MES_KEY = 202610;

const dividasAB: Divida[] = [divida(1, 100_000, 2, 10_000), divida(2, 500_000, 3, 20_000)];
const dividasCD: Divida[] = [divida(1, 200_000, 5, 20_000), divida(2, 80_000, 1, 8_000)];

interface Cenario {
  dividas: Divida[];
  metodo: MetodoDividas;
  extra: number;
  meses: number;
  jurosTotais: number;
  totalPago: number;
  ordemQuitacao: number[];
}

const cenarios: Cenario[] = [
  // Caso AB
  { dividas: dividasAB, metodo: "minimo", extra: 0, meses: 47, jurosTotais: 450_715, totalPago: 1_050_715, ordemQuitacao: [1, 2] },
  { dividas: dividasAB, metodo: "minimo", extra: 5_000, meses: 47, jurosTotais: 450_715, totalPago: 1_050_715, ordemQuitacao: [1, 2] },
  { dividas: dividasAB, metodo: "neve", extra: 0, meses: 31, jurosTotais: 316_024, totalPago: 916_024, ordemQuitacao: [1, 2] },
  { dividas: dividasAB, metodo: "neve", extra: 5_000, meses: 25, jurosTotais: 247_142, totalPago: 847_142, ordemQuitacao: [1, 2] },
  { dividas: dividasAB, metodo: "avalanche", extra: 0, meses: 31, jurosTotais: 316_024, totalPago: 916_024, ordemQuitacao: [1, 2] },
  { dividas: dividasAB, metodo: "avalanche", extra: 5_000, meses: 25, jurosTotais: 243_514, totalPago: 843_514, ordemQuitacao: [1, 2] },
  // Caso CD
  { dividas: dividasCD, metodo: "minimo", extra: 5_000, meses: 15, jurosTotais: 88_934, totalPago: 368_934, ordemQuitacao: [2, 1] },
  { dividas: dividasCD, metodo: "neve", extra: 5_000, meses: 11, jurosTotais: 75_171, totalPago: 355_171, ordemQuitacao: [2, 1] },
  { dividas: dividasCD, metodo: "avalanche", extra: 5_000, meses: 11, jurosTotais: 66_619, totalPago: 346_619, ordemQuitacao: [1, 2] },
  { dividas: dividasCD, metodo: "neve", extra: 0, meses: 14, jurosTotais: 86_996, totalPago: 366_996, ordemQuitacao: [2, 1] },
  { dividas: dividasCD, metodo: "avalanche", extra: 0, meses: 14, jurosTotais: 86_996, totalPago: 366_996, ordemQuitacao: [2, 1] },
  { dividas: dividasCD, metodo: "minimo", extra: 0, meses: 15, jurosTotais: 88_934, totalPago: 368_934, ordemQuitacao: [2, 1] },
];

const rotulo = (c: Cenario): string =>
  `caso ${c.dividas === dividasAB ? "AB" : "CD"} / ${c.metodo} / extra ${c.extra}`;

describe("debtMethods — valores exatos da SPEC 2 (C1)", () => {
  for (const c of cenarios) {
    it(`${rotulo(c)}: meses, jurosTotais, totalPago e ordemQuitacao`, () => {
      const r = calcularDividas(c.dividas, c.extra, MES_KEY).porMetodo[c.metodo];
      expect(r.meses).toBe(c.meses);
      expect(r.jurosTotais).toBe(c.jurosTotais);
      expect(r.totalPago).toBe(c.totalPago);
      expect(r.ordemQuitacao).toEqual(c.ordemQuitacao);
    });
  }

  it("conservação: totalPago = soma dos saldos originais + jurosTotais, em todo cenário", () => {
    for (const c of cenarios) {
      const r = calcularDividas(c.dividas, c.extra, MES_KEY).porMetodo[c.metodo];
      const saldos = c.dividas.reduce((s, d) => s + d.saldoDevedor, 0);
      expect(r.totalPago).toBe(saldos + r.jurosTotais);
    }
  });

  it("sem redirecionamento: no caso AB com mínimo, a dívida 2 paga exatamente a parcela mínima até o último mês", () => {
    const r = calcularDividas(dividasAB, 0, MES_KEY).porMetodo.minimo;
    const serie = r.serie;
    expect(serie.length).toBe(47);
    for (let i = 0; i < serie.length - 1; i++) {
      const estado = serie[i].dividas.find((d) => d.id === 2);
      expect(estado?.pagoMes).toBe(20_000);
    }
    // último mês paga o restante exato
    const ultimo = serie[serie.length - 1].dividas.find((d) => d.id === 2);
    expect(ultimo?.saldo).toBe(0);
    expect(serie.slice(0, serie.length - 1).every((m) => (m.dividas.find((d) => d.id === 2)?.saldo ?? 0) > 0)).toBe(true);
  });

  it("extra irrelevante no método mínimo: extra 0 e extra 5000 produzem resultados idênticos", () => {
    const r0 = calcularDividas(dividasAB, 0, MES_KEY).porMetodo.minimo;
    const r5 = calcularDividas(dividasAB, 5_000, MES_KEY).porMetodo.minimo;
    expect(r5).toEqual(r0);
  });

  it("sem valor extra, neve economiza por redirecionamento: menos meses e menos juros que o mínimo", () => {
    const r = calcularDividas(dividasAB, 0, MES_KEY);
    expect(r.porMetodo.neve.meses).toBeLessThan(r.porMetodo.minimo.meses as number);
    expect(r.porMetodo.neve.jurosTotais).toBeLessThan(r.porMetodo.minimo.jurosTotais);
  });

  it("alerta mantido: parcela ≤ juros do mês gera o alerta", () => {
    const r = calcularDividas([divida(1, 100_000, 2, 2_000)], 0, MES_KEY);
    expect(r.alertas).toHaveLength(1);
    expect(r.alertas[0].mensagem).toBe("A parcela não cobre os juros.");
  });
});
