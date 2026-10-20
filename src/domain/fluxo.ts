import type { Categoria, CompraParcelada, Lancamento } from "./models";
import { tipoDoGrupo } from "./types";
import { avancarMesKey, anoDeMesKey, mesDeMesKey } from "./datas";

export interface MesFluxo {
  mesKey: number;
  receitas: number;
  despesas: number; // inclui parcelas dos cartões
  saldo: number;
  taxaPoupanca: number | null; // %
  saldoAcumulado: number;
  necessidades: number;
  desejos: number;
  guardadoInvestido: number;
  semCategoria: number;
}

export interface ResultadoFluxo {
  meses: MesFluxo[];
  totalAno: { receitas: number; despesas: number; saldo: number };
  mediaMensal: { receitas: number; despesas: number; saldo: number };
  melhorMes: MesFluxo | null;
  piorMes: MesFluxo | null;
  calor: { categoriaId: number; nome: string; valores: Map<number, number>; total: number }[];
}

/** Mapa de despesas por mês de competência (parcelas de cartões são somadas à parte, em calcularFluxoAnual). */
function despesasPorMes(
  lancamentos: Lancamento[],
  categorias: Map<number, Categoria>,
): Map<number, { total: number; porCategoria: Map<number, number>; semCategoria: number; porGrupo: Map<string, number> }> {
  const mapa = new Map<
    number,
    { total: number; porCategoria: Map<number, number>; semCategoria: number; porGrupo: Map<string, number>; parcelas: number }
  >();
  const garantir = (mk: number) => {
    let m = mapa.get(mk);
    if (!m) {
      m = { total: 0, porCategoria: new Map(), semCategoria: 0, porGrupo: new Map(), parcelas: 0 };
      mapa.set(mk, m);
    }
    return m;
  };
  for (const l of lancamentos) {
    const cat = l.categoriaId === null ? undefined : categorias.get(l.categoriaId);
    const tipo = cat ? tipoDoGrupo(cat.grupo) : "Despesa";
    if (tipo !== "Despesa") continue;
    const mk = Number(l.data.slice(0, 4) + l.data.slice(5, 7));
    const m = garantir(mk);
    m.total += l.valor;
    if (l.categoriaId === null || !cat) {
      m.semCategoria += l.valor;
    } else {
      m.porCategoria.set(l.categoriaId, (m.porCategoria.get(l.categoriaId) ?? 0) + l.valor);
    }
    const grupo = cat?.grupo ?? "Sem categoria";
    m.porGrupo.set(grupo, (m.porGrupo.get(grupo) ?? 0) + l.valor);
  }
  return mapa;
}

/**
 * Fluxo anual (4.6). A fatura dos cartões exige o cartão real; para simplificar a
 * assinatura, o chamador fornece uma função que devolve o mês da fatura de cada parcelada.
 */
export function calcularFluxoAnual(
  ano: number,
  lancamentos: Lancamento[],
  parceladas: CompraParcelada[],
  categorias: Categoria[],
  mesFaturaDe: (parcelada: CompraParcelada) => number,
): ResultadoFluxo {
  const cats = new Map(categorias.map((c) => [c.id, c]));
  const despesas = despesasPorMes(lancamentos, cats);
  const receitasPorMes = new Map<number, number>();
  const poupancaPorMes = new Map<number, number>();
  const transferenciasSemEfeito = new Set<number>();

  for (const l of lancamentos) {
    const cat = l.categoriaId === null ? undefined : cats.get(l.categoriaId);
    const tipo = cat ? tipoDoGrupo(cat.grupo) : "Despesa";
    const mk = Number(l.data.slice(0, 4) + l.data.slice(5, 7));
    if (tipo === "Receita") {
      receitasPorMes.set(mk, (receitasPorMes.get(mk) ?? 0) + l.valor);
    } else if (tipo === "Poupança") {
      poupancaPorMes.set(mk, (poupancaPorMes.get(mk) ?? 0) + l.valor);
    } else if (tipo === "Transferência") {
      transferenciasSemEfeito.add(mk);
    }
  }

  // parcelas comprometidas por mês
  const parcelasPorMes = new Map<number, number>();
  for (const p of parceladas) {
    const primeira = mesFaturaDe(p);
    const base = Math.floor(p.valorTotal / p.numeroParcelas);
    const diferenca = p.valorTotal - base * p.numeroParcelas;
    for (let j = 0; j < p.numeroParcelas; j++) {
      const mk = avancarMesKey(primeira, j);
      parcelasPorMes.set(mk, (parcelasPorMes.get(mk) ?? 0) + (j === 0 ? base + diferenca : base));
    }
  }

  const meses: MesFluxo[] = [];
  let acumulado = 0;
  for (let mes = 1; mes <= 12; mes++) {
    const mk = ano * 100 + mes;
    const d = despesas.get(mk);
    const parcelas = parcelasPorMes.get(mk) ?? 0;
    const despesasMes = (d?.total ?? 0) + parcelas;
    const receitas = receitasPorMes.get(mk) ?? 0;
    const guardado = poupancaPorMes.get(mk) ?? 0;
    const saldo = receitas - despesasMes - guardado;
    const comMovimento = receitas > 0 || despesasMes > 0 || guardado > 0;
    if (comMovimento) acumulado += saldo;
    meses.push({
      mesKey: mk,
      receitas,
      despesas: despesasMes,
      saldo,
      taxaPoupanca: receitas > 0 ? (saldo / receitas) * 100 : null,
      saldoAcumulado: comMovimento ? acumulado : 0,
      necessidades: d?.porGrupo.get("Necessidade") ?? 0,
      desejos: d?.porGrupo.get("Desejo") ?? 0,
      guardadoInvestido: guardado,
      semCategoria: d?.semCategoria ?? 0,
    });
  }

  const comMovimento = meses.filter(
    (m) => m.receitas > 0 || m.despesas > 0 || m.guardadoInvestido > 0,
  );
  const totalReceitas = meses.reduce((s, m) => s + m.receitas, 0);
  const totalDespesas = meses.reduce((s, m) => s + m.despesas, 0);
  const totalSaldo = meses.reduce((s, m) => s + m.saldo, 0);
  const melhor = comMovimento.length > 0
    ? comMovimento.reduce((a, b) => (b.saldo > a.saldo ? b : a))
    : null;
  const pior = comMovimento.length > 0 ? comMovimento.reduce((a, b) => (b.saldo < a.saldo ? b : a)) : null;

  // mapa de calor categoria × mês
  const calorMap = new Map<number, { nome: string; valores: Map<number, number>; total: number }>();
  for (const cat of categorias) {
    if (tipoDoGrupo(cat.grupo) !== "Despesa") continue;
    calorMap.set(cat.id, { nome: cat.nome, valores: new Map(), total: 0 });
  }
  for (const [mk, d] of despesas) {
    if (anoDeMesKey(mk) !== ano) continue;
    for (const [catId, valor] of d.porCategoria) {
      const linha = calorMap.get(catId);
      if (linha) {
        linha.valores.set(mesDeMesKey(mk), valor);
        linha.total += valor;
      }
    }
  }
  const calor = [...calorMap.entries()]
    .map(([categoriaId, v]) => ({ categoriaId, nome: v.nome, valores: v.valores, total: v.total }))
    .filter((l) => l.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    meses,
    totalAno: { receitas: totalReceitas, despesas: totalDespesas, saldo: totalSaldo },
    mediaMensal: {
      receitas: Math.round(totalReceitas / 12),
      despesas: Math.round(totalDespesas / 12),
      saldo: Math.round(totalSaldo / 12),
    },
    melhorMes: melhor,
    piorMes: pior,
    calor,
  };
}
