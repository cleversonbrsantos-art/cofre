import { describe, it, expect } from "vitest";
import { countCategoryReferences, validateCategoryName } from "./categoryRules";

const existentes = [
  { id: 1, nome: "Mercado" },
  { id: 2, nome: "Salário" },
];

describe("validateCategoryName (C3)", () => {
  it("nome vazio rejeitado", () => {
    const r = validateCategoryName("", existentes);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeTruthy();
  });

  it("nome só com espaços rejeitado", () => {
    expect(validateCategoryName("   ", existentes).ok).toBe(false);
  });

  it("61 caracteres rejeitado", () => {
    const r = validateCategoryName("a".repeat(61), existentes);
    expect(r.ok).toBe(false);
  });

  it("60 caracteres aceito", () => {
    expect(validateCategoryName("a".repeat(60), existentes).ok).toBe(true);
  });

  it('"  Mercado " com existente Mercado rejeitado e sem espaços nas pontas', () => {
    const r = validateCategoryName("  Mercado ", existentes);
    expect(r.ok).toBe(false);
  });

  it('"mercado" rejeitado como duplicata (maiúsculas/minúsculas ignoradas)', () => {
    expect(validateCategoryName("mercado", existentes).ok).toBe(false);
  });

  it('"MERCADÓ" rejeitado como duplicata (acentos ignorados)', () => {
    expect(validateCategoryName("MERCADÓ", existentes).ok).toBe(false);
  });

  it("renomear a própria categoria para o mesmo nome (com ignoreId) é aceito", () => {
    const r = validateCategoryName("Mercado", existentes, 1);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.name).toBe("Mercado");
  });

  it("nome novo aceito e devolvido sem espaços nas pontas", () => {
    const r = validateCategoryName("  Farmácia  ", existentes);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.name).toBe("Farmácia");
  });
});

describe("countCategoryReferences (C3)", () => {
  it("conta corretamente por entidade", () => {
    const n = countCategoryReferences(7, {
      lancamentos: [
        { categoriaId: 7 },
        { categoriaId: 7 },
        { categoriaId: null },
        { categoriaId: 8 },
      ],
      parceladas: [{ categoriaId: 7 }, { categoriaId: null }],
      contasPagar: [{ categoriaId: null }],
      assinaturas: [{ categoriaId: 7 }],
      recorrentes: [],
      orcamentoPlanos: [{ categoriaId: 7 }, { categoriaId: 7 }, { categoriaId: 9 }],
    });
    expect(n).toEqual({
      lancamentos: 2,
      parceladas: 1,
      contasPagar: 0,
      assinaturas: 1,
      recorrentes: 0,
      orcamentoPlanos: 2,
    });
  });

  it("categoria sem uso devolve zeros", () => {
    const n = countCategoryReferences(99, {
      lancamentos: [{ categoriaId: 1 }],
      parceladas: [],
      contasPagar: [],
      assinaturas: [],
      recorrentes: [],
      orcamentoPlanos: [],
    });
    expect(n).toEqual({
      lancamentos: 0,
      parceladas: 0,
      contasPagar: 0,
      assinaturas: 0,
      recorrentes: 0,
      orcamentoPlanos: 0,
    });
  });
});
