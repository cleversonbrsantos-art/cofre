export interface ContagemConta {
  lancamentos: number;
  reservaConfig: number;
}

export interface ContagemCartao {
  lancamentos: number;
  parceladas: number;
}

export interface LancamentoReferencia {
  contaId: number | null;
  contaDestinoId: number | null;
  cartaoId?: number | null;
}

export interface ContagemReserva {
  contaId: number | null;
}

export function countAccountReferences(
  accountId: number,
  data: { lancamentos: LancamentoReferencia[]; reservaConfig: ContagemReserva | null },
): ContagemConta {
  const lancamentos = data.lancamentos.filter(
    (l) => l.contaId === accountId || l.contaDestinoId === accountId,
  ).length;
  const reservaConfig =
    data.reservaConfig !== null && data.reservaConfig.contaId === accountId ? 1 : 0;
  return { lancamentos, reservaConfig };
}

export function countCardReferences(
  cardId: number,
  data: {
    lancamentos: { cartaoId: number | null }[];
    parceladas: { cartaoId: number | null }[];
  },
): ContagemCartao {
  return {
    lancamentos: data.lancamentos.filter((l) => l.cartaoId === cardId).length,
    parceladas: data.parceladas.filter((p) => p.cartaoId === cardId).length,
  };
}
