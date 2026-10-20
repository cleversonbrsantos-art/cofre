import { describe, it, expect } from "vitest";
import { calcularCiclo, mesKeyDaFatura } from "./cartoes";
import type { Cartao } from "./models";

const cartao: Cartao = {
  id: 1,
  nome: "Teste",
  limite: 100000,
  diaFechamento: 25,
  diaVencimento: 5,
};

describe("ciclo e fatura do cartão (§8 caso 2)", () => {
  it("outubro/2026: ciclo 26/09 a 25/10, vence 05/11", () => {
    const ciclo = calcularCiclo(cartao, 202610);
    expect(ciclo.inicio).toBe("2026-09-26");
    expect(ciclo.fim).toBe("2026-10-25");
    expect(ciclo.vencimento).toBe("2026-11-05");
  });

  it("compra em 25/10 entra na fatura de outubro", () => {
    expect(mesKeyDaFatura("2026-10-25", cartao)).toBe(202610);
  });

  it("compra em 26/10 entra na fatura de novembro", () => {
    expect(mesKeyDaFatura("2026-10-26", cartao)).toBe(202611);
  });
});
