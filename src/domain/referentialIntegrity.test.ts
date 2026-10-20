import { describe, it, expect } from "vitest";
import { countAccountReferences, countCardReferences } from "./referentialIntegrity";

describe("countAccountReferences (C4)", () => {
  it("conta referenciada só como contaDestinoId é contada", () => {
    const r = countAccountReferences(2, {
      lancamentos: [
        { contaId: 1, contaDestinoId: 2 },
        { contaId: 3, contaDestinoId: null },
      ],
      reservaConfig: null,
    });
    expect(r).toEqual({ lancamentos: 1, reservaConfig: 0 });
  });

  it("conta na configuração da reserva é contada", () => {
    const r = countAccountReferences(5, {
      lancamentos: [{ contaId: null, contaDestinoId: null }],
      reservaConfig: { contaId: 5 },
    });
    expect(r).toEqual({ lancamentos: 0, reservaConfig: 1 });
  });

  it("conta com lançamentos por contaId e destino e reserva soma tudo", () => {
    const r = countAccountReferences(1, {
      lancamentos: [
        { contaId: 1, contaDestinoId: null },
        { contaId: 1, contaDestinoId: null },
        { contaId: 9, contaDestinoId: 1 },
      ],
      reservaConfig: { contaId: 1 },
    });
    expect(r).toEqual({ lancamentos: 3, reservaConfig: 1 });
  });

  it("conta sem uso devolve zeros", () => {
    const r = countAccountReferences(42, {
      lancamentos: [{ contaId: 1, contaDestinoId: 2 }],
      reservaConfig: { contaId: 3 },
    });
    expect(r).toEqual({ lancamentos: 0, reservaConfig: 0 });
  });

  it("reservaConfig nula ou com contaId nula devolve zero", () => {
    expect(
      countAccountReferences(1, { lancamentos: [], reservaConfig: null }).reservaConfig,
    ).toBe(0);
    expect(
      countAccountReferences(1, { lancamentos: [], reservaConfig: { contaId: null } })
        .reservaConfig,
    ).toBe(0);
  });
});

describe("countCardReferences (C4)", () => {
  it("conta lançamentos e parceladas do cartão", () => {
    const r = countCardReferences(4, {
      lancamentos: [{ cartaoId: 4 }, { cartaoId: null }, { cartaoId: 5 }, { cartaoId: 4 }],
      parceladas: [{ cartaoId: 4 }, { cartaoId: 6 }],
    });
    expect(r).toEqual({ lancamentos: 2, parceladas: 1 });
  });

  it("cartão sem uso devolve zeros", () => {
    const r = countCardReferences(99, {
      lancamentos: [{ cartaoId: 1 }],
      parceladas: [],
    });
    expect(r).toEqual({ lancamentos: 0, parceladas: 0 });
  });
});
