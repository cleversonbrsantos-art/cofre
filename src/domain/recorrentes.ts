import type { Categoria, Recorrente } from "./models";
import { tipoDoGrupo } from "./types";
import { avancarMesKey, diasNoMes } from "./datas";

export interface PrevisaoMes {
  mesKey: number;
  receitasRecorrentes: number;
  despesasRecorrentes: number;
  parcelasCartoes: number;
  aportes: number;
  saldoMes: number;
  caixaProjetado: number;
}

export interface ResultadoPrevisao {
  meses: PrevisaoMes[];
}

/**
 * Previsão de 12 meses com recorrentes e parcelas (4.8).
 * @param saldoCaixaAtual parte do saldo atual das contas do dia a dia (Corrente, Carteira, Dinheiro)
 */
export function calcularPrevisao(
  mesKeyInicial: number,
  recorrentes: Recorrente[],
  categorias: Map<number, Categoria>,
  parcelasPorMes: Map<number, number>,
  saldoCaixaAtual: number,
): ResultadoPrevisao {
  const meses: PrevisaoMes[] = [];
  let caixa = saldoCaixaAtual;
  for (let i = 0; i < 12; i++) {
    const mk = avancarMesKey(mesKeyInicial, i);
    const ano = Math.floor(mk / 100);
    const mes = mk % 100;
    const ultimoDia = diasNoMes(ano, mes);

    let receitas = 0;
    let despesas = 0;
    let aportes = 0;
    for (const r of recorrentes) {
      if (r.diaMes > ultimoDia) continue;
      if (r.inicio !== null) {
        const mkInicio = Number(r.inicio.slice(0, 4) + r.inicio.slice(5, 7));
        if (mk < mkInicio) continue;
      }
      if (r.fim !== null) {
        const mkFim = Number(r.fim.slice(0, 4) + r.fim.slice(5, 7));
        if (mk > mkFim) continue;
      }
      const cat = r.categoriaId === null ? undefined : categorias.get(r.categoriaId);
      const tipo = cat ? tipoDoGrupo(cat.grupo) : "Despesa";
      if (tipo === "Receita") receitas += r.valorMensal;
      else if (tipo === "Poupança") aportes += r.valorMensal;
      else if (tipo === "Despesa") despesas += r.valorMensal;
    }

    const parcelas = parcelasPorMes.get(mk) ?? 0;
    const saldoMes = receitas - despesas - parcelas - aportes;
    caixa += saldoMes;
    meses.push({
      mesKey: mk,
      receitasRecorrentes: receitas,
      despesasRecorrentes: despesas,
      parcelasCartoes: parcelas,
      aportes,
      saldoMes,
      caixaProjetado: caixa,
    });
  }
  return { meses };
}
