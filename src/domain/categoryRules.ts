export interface ItemNomeado {
  id: number;
  nome: string;
}

export interface ContagensCategoria {
  lancamentos: number;
  parceladas: number;
  contasPagar: number;
  assinaturas: number;
  recorrentes: number;
  orcamentoPlanos: number;
}

export interface ReferenciasCategoria {
  lancamentos: { categoriaId: number | null }[];
  parceladas: { categoriaId: number | null }[];
  contasPagar: { categoriaId: number | null }[];
  assinaturas: { categoriaId: number | null }[];
  recorrentes: { categoriaId: number | null }[];
  orcamentoPlanos: { categoriaId: number }[];
}

export type ResultadoValidacaoNome =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function normalizarTexto(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function validateCategoryName(
  bruto: string,
  existentes: ItemNomeado[],
  ignoreId?: number,
): ResultadoValidacaoNome {
  const nome = bruto.trim();
  if (nome.length < 1) {
    return { ok: false, error: "Informe um nome." };
  }
  if (nome.length > 60) {
    return { ok: false, error: "O nome deve ter no máximo 60 caracteres." };
  }
  const normalizado = normalizarTexto(nome);
  const duplicado = existentes.some(
    (item) =>
      item.id !== ignoreId && normalizarTexto(item.nome) === normalizado,
  );
  if (duplicado) {
    return { ok: false, error: "Já existe um item com esse nome." };
  }
  return { ok: true, name: nome };
}

export function countCategoryReferences(
  categoriaId: number,
  dados: ReferenciasCategoria,
): ContagensCategoria {
  const contar = (itens: { categoriaId: number | null }[]): number =>
    itens.filter((item) => item.categoriaId === categoriaId).length;
  return {
    lancamentos: contar(dados.lancamentos),
    parceladas: contar(dados.parceladas),
    contasPagar: contar(dados.contasPagar),
    assinaturas: contar(dados.assinaturas),
    recorrentes: contar(dados.recorrentes),
    orcamentoPlanos: dados.orcamentoPlanos.filter(
      (plano) => plano.categoriaId === categoriaId,
    ).length,
  };
}
