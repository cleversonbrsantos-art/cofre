import { describe, it, expect } from "vitest";
import { validateCustomShortcut } from "./shortcutRules";

describe("validateCustomShortcut (C3)", () => {
  it("{50,30,20} ok", () => {
    expect(validateCustomShortcut({ necessidades: 50, desejos: 30, poupanca: 20 })).toEqual({ ok: true });
  });

  it("{50,30,25} erro (soma 105)", () => {
    const r = validateCustomShortcut({ necessidades: 50, desejos: 30, poupanca: 25 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeTruthy();
  });

  it("{-10,60,50} erro (valor negativo)", () => {
    expect(validateCustomShortcut({ necessidades: -10, desejos: 60, poupanca: 50 }).ok).toBe(false);
  });

  it("{101,0,0} erro (valor acima de 100)", () => {
    expect(validateCustomShortcut({ necessidades: 101, desejos: 0, poupanca: 0 }).ok).toBe(false);
  });

  it("{33.5,33.5,33} ok (soma 100 com decimais)", () => {
    expect(validateCustomShortcut({ necessidades: 33.5, desejos: 33.5, poupanca: 33 })).toEqual({ ok: true });
  });
});
