import { describe, it, expect } from "vitest";
import { calcularPrevisao } from "./recorrentes";
import type { Categoria, Recorrente } from "./models";

const CATS: Categoria[] = [
  { id: 1, nome: "Salário", grupo: "Receita" },
  { id: 2, nome: "Aluguel", grupo: "Necessidade" },
  { id: 3, nome: "Reserva", grupo: "Poupança" },
];

const mapaCats = new Map(CATS.map((c) => [c.id, c]));

function rec(
  id: number,
  categoriaId: number,
  valorMensal: number,
  diaMes = 5,
  inicio: string | null = null,
  fim: string | null = null,
): Recorrente {
  return { id, descricao: `R${id}`, categoriaId, valorMensal, diaMes, inicio, fim };
}

describe("recorrentes — calcularPrevisao", () => {
  it("projeta 12 meses com saldo do mês e caixa acumulado", () => {
    const recorrentes = [
      rec(1, 1, 5_000_00, 5),
      rec(2, 2, 1_500_00, 10),
    ];
    const r = calcularPrevisao(202601, recorrentes, mapaCats, new Map(), 2_000_00);

    expect(r.meses).toHaveLength(12);
    expect(r.meses[0].mesKey).toBe(202601);
    expect(r.meses[0].receitasRecorrentes).toBe(5_000_00);
    expect(r.meses[0].despesasRecorrentes).toBe(1_500_00);
    expect(r.meses[0].saldoMes).toBe(3_500_00);
    expect(r.meses[0].caixaProjetado).toBe(5_500_00);
    expect(r.meses[11].mesKey).toBe(202612);
    expect(r.meses[11].caixaProjetado).toBe(2_000_00 + 12 * 3_500_00);
  });

  it("aportes de poupança saem do saldo do mês", () => {
    const recorrentes = [
      rec(1, 1, 3_000_00, 5),
      rec(2, 3, 500_00, 15),
    ];
    const r = calcularPrevisao(202601, recorrentes, mapaCats, new Map(), 0);
    expect(r.meses[0].aportes).toBe(500_00);
    expect(r.meses[0].saldoMes).toBe(2_500_00);
  });

  it("parcelas de cartão entram no mês correspondente", () => {
    const parcelas = new Map<number, number>([
      [202602, 100_00],
      [202603, 100_00],
    ]);
    const r = calcularPrevisao(202601, [], mapaCats, parcelas, 1_000_00);
    expect(r.meses[0].parcelasCartoes).toBe(0);
    expect(r.meses[1].parcelasCartoes).toBe(100_00);
    expect(r.meses[1].saldoMes).toBe(-100_00);
    // jan: 1000, fev: 1000−100=900, mar: 900−100=800
    expect(r.meses[2].caixaProjetado).toBe(800_00);
  });

  it("respeita diaMes maior que o número de dias do mês", () => {
    const recorrentes = [rec(1, 2, 300_00, 31)];
    const r = calcularPrevisao(202601, recorrentes, mapaCats, new Map(), 0);
    // meses[0]=jan (31 dias, cobra), meses[1]=fev/2026 (28 dias, não cobra)
    expect(r.meses[0].despesasRecorrentes).toBe(300_00);
    expect(r.meses[1].despesasRecorrentes).toBe(0);
    expect(r.meses[2].despesasRecorrentes).toBe(300_00);
  });

  it("respeita vigência início/fim", () => {
    const recorrentes = [
      rec(1, 2, 100_00, 5, "2026-03-01", "2026-04-30"),
    ];
    const r = calcularPrevisao(202601, recorrentes, mapaCats, new Map(), 0);
    expect(r.meses[0].despesasRecorrentes).toBe(0); // jan < início
    expect(r.meses[1].despesasRecorrentes).toBe(0); // fev < início
    expect(r.meses[2].despesasRecorrentes).toBe(100_00); // mar
    expect(r.meses[3].despesasRecorrentes).toBe(100_00); // abr
    expect(r.meses[4].despesasRecorrentes).toBe(0); // mai > fim
  });
});
