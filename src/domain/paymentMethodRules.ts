import { validateCategoryName, type ItemNomeado } from "./categoryRules";

export type { ItemNomeado };

export interface UsoFormaPagamento {
  lancamentos: { formaPagamento: string }[];
  contasPagar: { formaPagamento: string }[];
}

export function validatePaymentMethodName(
  bruto: string,
  existentes: { id: number; name: string }[],
  ignoreId?: number,
) {
  const itens: ItemNomeado[] = existentes.map((forma) => ({
    id: forma.id,
    nome: forma.name,
  }));
  return validateCategoryName(bruto, itens, ignoreId);
}

export function countPaymentMethodUsage(
  name: string,
  dados: UsoFormaPagamento,
): number {
  return (
    dados.lancamentos.filter((l) => l.formaPagamento === name).length +
    dados.contasPagar.filter((c) => c.formaPagamento === name).length
  );
}
