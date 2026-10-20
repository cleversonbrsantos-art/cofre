import type { Lancamento } from "./models";
import { tipoDoGrupo, type CategoriaGrupo, type CategoriaTipo } from "./types";

export interface CategoriaBasica {
  id: number;
  grupo: CategoriaGrupo;
}

/** Efeito de um lançamento no mês: receita (+), despesa (−), poupança (−, mas guarda) ou transferência (0). */
export function tipoEfeito(lancamento: Lancamento, categorias: Map<number, CategoriaBasica>): CategoriaTipo {
  if (lancamento.categoriaId === null) return "Despesa";
  const cat = categorias.get(lancamento.categoriaId);
  if (!cat) return "Despesa";
  return tipoDoGrupo(cat.grupo);
}

export interface FluxoMensal {
  receitas: number;
  despesas: number;
  poupanca: number;
  transferencias: number;
  saldo: number;
}

/**
 * Soma os efeitos de um conjunto de lançamentos (4.1).
 * Valor com sinal: Receita +valor; Transferência 0; demais −valor.
 * Pendente conta nas visões de fluxo (competência).
 */
export function somarFluxo(lancamentos: Lancamento[], categorias: Map<number, CategoriaBasica>): FluxoMensal {
  let receitas = 0;
  let despesas = 0;
  let poupanca = 0;
  let transferencias = 0;
  for (const l of lancamentos) {
    const tipo = tipoEfeito(l, categorias);
    switch (tipo) {
      case "Receita":
        receitas += l.valor;
        break;
      case "Despesa":
        despesas += l.valor;
        break;
      case "Poupança":
        poupanca += l.valor;
        break;
      case "Transferência":
        transferencias += l.valor;
        break;
    }
  }
  return { receitas, despesas, poupanca, transferencias, saldo: receitas - despesas - poupanca };
}

/** Fluxo por mês-chave (AAAAMM), considerando lançamentos de qualquer status (competência). */
export function fluxoPorMes(
  lancamentos: Lancamento[],
  categorias: Map<number, CategoriaBasica>,
  mesKeyDeData: (data: string) => number,
): Map<number, FluxoMensal> {
  const mapa = new Map<number, FluxoMensal>();
  for (const l of lancamentos) {
    const mk = mesKeyDeData(l.data);
    const atual = mapa.get(mk) ?? {
      receitas: 0,
      despesas: 0,
      poupanca: 0,
      transferencias: 0,
      saldo: 0,
    };
    const tipo = tipoEfeito(l, categorias);
    switch (tipo) {
      case "Receita":
        atual.receitas += l.valor;
        break;
      case "Despesa":
        atual.despesas += l.valor;
        break;
      case "Poupança":
        atual.poupanca += l.valor;
        break;
      case "Transferência":
        atual.transferencias += l.valor;
        break;
    }
    atual.saldo = atual.receitas - atual.despesas - atual.poupanca;
    mapa.set(mk, atual);
  }
  return mapa;
}
