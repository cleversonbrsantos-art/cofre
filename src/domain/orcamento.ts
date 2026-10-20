import type { Categoria, Lancamento, OrcamentoPlano } from "./models";
import { tipoDoGrupo } from "./types";
import type { AtalhoOrcamentoPercentuais } from "./tiposOrcamento";

export { tipoDoGrupo };
export type { AtalhoOrcamentoPercentuais };
export interface OrcamentoCategoria {
  categoriaId: number;
  nome: string;
  grupo: string;
  planejado: number; // centavos
  realizado: number; // centavos
  variacao: number; // planejado − realizado
  variacaoPercentual: number | null; // % sobre planejado
  usoMeta: number | null; // realizado ÷ planejado (%)
  situacao: "Dentro do plano" | "Estourou" | "Sem plano";
  variacaoMesAnterior: number | null;
}

export interface OrcamentoGrupo {
  grupo: string;
  planejado: number;
  realizado: number;
  diferenca: number;
  situacao: "Dentro do plano" | "Estourou" | "Sem plano";
}

export interface ResultadoOrcamento {
  rendaReferencia: number;
  linhas: OrcamentoCategoria[];
  grupos: OrcamentoGrupo[];
  sobraAlocar: number; // renda − plano do mês
  usoOrcamento: number | null; // despesas realizadas ÷ planejadas (%)
  poupancaDoGrupo: number; // sobra (receitas − despesas)
}

/** Meta por grupo = % do atalho × renda de referência (4.5). */
export function metaPorGrupo(
  atalho: AtalhoOrcamentoPercentuais,
  rendaReferencia: number,
): { necessidades: number; desejos: number; poupanca: number } {
  return {
    necessidades: Math.round((atalho.necessidades / 100) * rendaReferencia),
    desejos: Math.round((atalho.desejos / 100) * rendaReferencia),
    poupanca: Math.round((atalho.poupanca / 100) * rendaReferencia),
  };
}

/** Renda de referência padrão = média das receitas dos 3 últimos meses com movimento (4.5). */
export function rendaReferenciaPadrao(
  lancamentos: Lancamento[],
  categorias: Map<number, Categoria>,
  mesKeyDeData: (data: string) => number,
): number {
  const receitasPorMes = new Map<number, number>();
  for (const l of lancamentos) {
    const cat = l.categoriaId === null ? undefined : categorias.get(l.categoriaId);
    if (!cat || tipoDoGrupo(cat.grupo) !== "Receita") continue;
    const mk = mesKeyDeData(l.data);
    receitasPorMes.set(mk, (receitasPorMes.get(mk) ?? 0) + l.valor);
  }
  const meses = [...receitasPorMes.keys()].sort((a, b) => b - a).slice(0, 3);
  if (meses.length === 0) return 0;
  const soma = meses.reduce((s, mk) => s + (receitasPorMes.get(mk) ?? 0), 0);
  return Math.round(soma / meses.length);
}

/** Reparte a meta do grupo entre categorias proporcionalmente ao histórico de gastos (4.5). */
export function sugerirPlanos(
  metas: { necessidades: number; desejos: number; poupanca: number },
  categorias: Categoria[],
  lancamentos: Lancamento[],
  mesKeyAlvo: number,
): { categoriaId: number; valor: number }[] {
  const mapaCats = new Map(categorias.map((c) => [c.id, c]));
  const gastoHistorico = new Map<number, number>();
  for (const l of lancamentos) {
    if (l.categoriaId === null) continue;
    const cat = mapaCats.get(l.categoriaId);
    if (!cat) continue;
    const tipo = tipoDoGrupo(cat.grupo);
    if (tipo !== "Despesa" && tipo !== "Poupança") continue;
    // histórico: mesmo mês nos 12 meses anteriores (base simples de histórico)
    gastoHistorico.set(l.categoriaId, (gastoHistorico.get(l.categoriaId) ?? 0) + l.valor);
  }
  const saida: { categoriaId: number; valor: number }[] = [];
  for (const cat of categorias) {
    const tipo = tipoDoGrupo(cat.grupo);
    if (tipo !== "Despesa" && tipo !== "Poupança") continue;
    const grupo = cat.grupo === "Necessidade" ? "necessidades" : cat.grupo === "Desejo" ? "desejos" : "poupanca";
    const meta = metas[grupo];
    const totalGrupo = categorias
      .filter((c) => c.grupo === cat.grupo)
      .reduce((s, c) => s + (gastoHistorico.get(c.id) ?? 0), 0);
    const gasto = gastoHistorico.get(cat.id) ?? 0;
    const valor =
      totalGrupo > 0 ? Math.round((gasto / totalGrupo) * meta) : Math.round(meta / Math.max(1, categorias.filter((c) => c.grupo === cat.grupo).length));
    if (valor > 0) saida.push({ categoriaId: cat.id, valor });
  }
  void mesKeyAlvo;
  return saida;
}

/** Tabela do mês do orçamento (4.5). */
export function calcularOrcamento(
  mesKeyAlvo: number,
  mesKeyAnterior: number,
  planos: OrcamentoPlano[],
  lancamentos: Lancamento[],
  categorias: Categoria[],
  rendaRef: number,
): ResultadoOrcamento {
  const noMes = lancamentos.filter((l) => mesKeyDeDataLocal(l.data) === mesKeyAlvo);
  const noMesAnterior = lancamentos.filter((l) => mesKeyDeDataLocal(l.data) === mesKeyAnterior);

  const linhas: OrcamentoCategoria[] = [];
  for (const cat of categorias) {
    const tipo = tipoDoGrupo(cat.grupo);
    if (tipo === "Receita") continue;
    const plano = planos.find((p) => p.categoriaId === cat.id && p.mesKey === mesKeyAlvo);
    const planejado = plano?.valor ?? 0;
    const realizado = noMes
      .filter((l) => l.categoriaId === cat.id)
      .reduce((s, l) => s + l.valor, 0);
    const anterior = noMesAnterior
      .filter((l) => l.categoriaId === cat.id)
      .reduce((s, l) => s + l.valor, 0);
    linhas.push({
      categoriaId: cat.id,
      nome: cat.nome,
      grupo: cat.grupo,
      planejado,
      realizado,
      variacao: planejado - realizado,
      variacaoPercentual: planejado > 0 ? ((planejado - realizado) / planejado) * 100 : null,
      usoMeta: planejado > 0 ? (realizado / planejado) * 100 : null,
      situacao: planejado === 0 ? (realizado > 0 ? "Estourou" : "Sem plano") : realizado > planejado ? "Estourou" : "Dentro do plano",
      variacaoMesAnterior: anterior > 0 || realizado > 0 ? realizado - anterior : null,
    });
  }

  const grupos: OrcamentoGrupo[] = ["Necessidade", "Desejo", "Poupança"].map((grupo) => {
    const doGrupo = linhas.filter((l) => l.grupo === grupo);
    const planejado = doGrupo.reduce((s, l) => s + l.planejado, 0);
    const realizado = doGrupo.reduce((s, l) => s + l.realizado, 0);
    return {
      grupo,
      planejado,
      realizado,
      diferenca: planejado - realizado,
      situacao:
        planejado === 0 ? (realizado > 0 ? "Estourou" : "Sem plano") : realizado > planejado ? "Estourou" : "Dentro do plano",
    };
  });

  const mapaCats = new Map(categorias.map((c) => [c.id, c]));
  const receitas = noMes
    .filter((l) => {
      const cat = l.categoriaId === null ? undefined : mapaCats.get(l.categoriaId);
      return cat ? tipoDoGrupo(cat.grupo) === "Receita" : false;
    })
    .reduce((s, l) => s + l.valor, 0);
  const despesas = noMes
    .filter((l) => {
      const cat = l.categoriaId === null ? undefined : mapaCats.get(l.categoriaId);
      return cat ? tipoDoGrupo(cat.grupo) === "Despesa" : false;
    })
    .reduce((s, l) => s + l.valor, 0);
  const planoTotal = planos
    .filter((p) => p.mesKey === mesKeyAlvo)
    .reduce((s, p) => s + p.valor, 0);

  return {
    rendaReferencia: rendaRef,
    linhas,
    grupos,
    sobraAlocar: receitas - planoTotal,
    usoOrcamento: planoTotal > 0 ? (despesas / planoTotal) * 100 : null,
    poupancaDoGrupo: receitas - despesas,
  };
}

function mesKeyDeDataLocal(data: string): number {
  return Number(data.slice(0, 4) + data.slice(5, 7));
}
