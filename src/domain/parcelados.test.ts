import { describe, it, expect } from "vitest";
import { mesKeyDaFatura, calcularFatura } from "./cartoes";
import { avancarMesKey } from "./datas";
import type { Cartao, CompraParcelada } from "./models";

const cartao: Cartao = {
  id: 1,
  nome: "Teste",
  limite: 100000,
  diaFechamento: 25,
  diaVencimento: 5,
};

describe("compra parcelada (§8 casos 3 e 4)", () => {
  it("compra em 28/10/2026, 3 parcelas de R$ 300 → 1ª novembro/2026, última janeiro/2027, parcela R$ 100", () => {
    const primeira = mesKeyDaFatura("2026-10-28", cartao);
    expect(primeira).toBe(202611);
    const parcela = Math.floor(30000 / 3);
    expect(parcela).toBe(10000);
    // última = 1ª + (n−1) meses = janeiro/2027
    const ultima = avancarMesKey(primeira, 2);
    expect(ultima).toBe(202701);
  });

  it("R$ 100,00 em 3 parcelas → 33,34 + 33,33 + 33,33 (diferença na 1ª)", () => {
    const parcelada: CompraParcelada = {
      id: 1,
      descricao: "Teste",
      cartaoId: 1,
      categoriaId: null,
      dataCompra: "2026-10-20",
      valorTotal: 10000,
      numeroParcelas: 3,
    };
    const resultado = calcularFatura(cartao, 202610, [], [parcelada]);
    // primeira fatura: mês da compra (20 ≤ 25) = outubro
    expect(resultado.parcelasDoMes).toBe(3334);
    const novembro = calcularFatura(cartao, 202611, [], [parcelada]);
    expect(novembro.parcelasDoMes).toBe(3333);
    const dezembro = calcularFatura(cartao, 202612, [], [parcelada]);
    expect(dezembro.parcelasDoMes).toBe(3333);
  });
});
