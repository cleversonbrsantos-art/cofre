import { describe, it, expect } from "vitest";
import { countPaymentMethodUsage, validatePaymentMethodName } from "./paymentMethodRules";

const existentes = [
  { id: 1, name: "Pix" },
  { id: 2, name: "Crédito" },
];

describe("validatePaymentMethodName (C3)", () => {
  it("nome vazio rejeitado", () => {
    expect(validatePaymentMethodName("", existentes).ok).toBe(false);
  });

  it("61 caracteres rejeitado", () => {
    expect(validatePaymentMethodName("a".repeat(61), existentes).ok).toBe(false);
  });

  it('" pix " duplicata de Pix (espaços e maiúsculas ignorados)', () => {
    expect(validatePaymentMethodName(" pix ", existentes).ok).toBe(false);
  });

  it('"crédito" com acento diferente rejeitado como duplicata', () => {
    expect(validatePaymentMethodName("crédito", existentes).ok).toBe(false);
  });

  it("renomear a própria forma para o mesmo nome (com ignoreId) é aceito", () => {
    const r = validatePaymentMethodName("Pix", existentes, 1);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.name).toBe("Pix");
  });

  it("nome novo aceito e devolvido sem espaços nas pontas", () => {
    const r = validatePaymentMethodName("  Vale-alimentação  ", existentes);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.name).toBe("Vale-alimentação");
  });
});

describe("countPaymentMethodUsage (C3)", () => {
  it("conta lançamentos e contas a pagar que usam a forma", () => {
    const total = countPaymentMethodUsage("Pix", {
      lancamentos: [
        { formaPagamento: "Pix" },
        { formaPagamento: "Pix" },
        { formaPagamento: "Crédito" },
      ],
      contasPagar: [{ formaPagamento: "Pix" }, { formaPagamento: "Boleto" }],
    });
    expect(total).toBe(3);
  });

  it("forma sem uso devolve zero", () => {
    const total = countPaymentMethodUsage("Boleto", {
      lancamentos: [{ formaPagamento: "Pix" }],
      contasPagar: [],
    });
    expect(total).toBe(0);
  });
});
