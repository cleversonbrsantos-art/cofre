export interface AtalhoPersonalizado {
  necessidades: number;
  desejos: number;
  poupanca: number;
}

export type ResultadoAtalho = { ok: true } | { ok: false; error: string };

export function validateCustomShortcut(atalho: AtalhoPersonalizado): ResultadoAtalho {
  const valores = [atalho.necessidades, atalho.desejos, atalho.poupanca];
  if (valores.some((v) => v < 0 || v > 100)) {
    return { ok: false, error: "Cada valor deve estar entre 0 e 100." };
  }
  const soma = valores[0] + valores[1] + valores[2];
  if (Math.abs(soma - 100) > 1e-9) {
    return { ok: false, error: "A soma dos três valores deve ser 100." };
  }
  return { ok: true };
}
