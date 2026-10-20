import type {
  AlvoAlocacao,
  AtivoInvestimento,
  BemPassivo,
  Conta,
  Divida,
  HistoricoPatrimonio,
  Lancamento,
} from "./models";
import { calcularSaldos } from "./contas";

export interface RentabilidadeAtivo {
  ativo: AtivoInvestimento;
  rentabilidadeReais: number; // atual − aportado
  rentabilidadePercentual: number | null; // R$ ÷ aportado (null se aportado 0)
  percentualCarteira: number | null; // % da carteira (null se total 0)
}

export interface AlocacaoClasse {
  classe: string;
  valorAtual: number;
  percentualAtual: number | null;
  percentualAlvo: number;
  diferencaPp: number | null; // atual − alvo em pontos percentuais
  ajuste: number | null; // alvo% × total − valor atual (positivo = aportar, negativo = resgatar)
  situacao: "Dentro" | "Acima" | "Abaixo";
}

export interface ResultadoAlocacao {
  porClasse: AlocacaoClasse[];
  somaAlvos: number;
  alvosOk: boolean; // soma == 100
  totalCarteira: number;
}

export interface ResultadoPatrimonio {
  ativos: number;
  passivos: number;
  patrimonioLiquido: number;
}

/** Rentabilidade por ativo (4.12). */
export function calcularRentabilidade(ativos: AtivoInvestimento[]): RentabilidadeAtivo[] {
  const totalCarteira = ativos.reduce((s, a) => s + a.valorAtual, 0);
  return ativos.map((a) => ({
    ativo: a,
    rentabilidadeReais: a.valorAtual - a.totalAportado,
    rentabilidadePercentual: a.totalAportado > 0 ? ((a.valorAtual - a.totalAportado) / a.totalAportado) * 100 : null,
    percentualCarteira: totalCarteira > 0 ? (a.valorAtual / totalCarteira) * 100 : null,
  }));
}

/** Alocação por classe × alvo (4.12). */
export function calcularAlocacao(ativos: AtivoInvestimento[], alvos: AlvoAlocacao[]): ResultadoAlocacao {
  const totalCarteira = ativos.reduce((s, a) => s + a.valorAtual, 0);
  const valorPorClasse = new Map<string, number>();
  for (const a of ativos) {
    valorPorClasse.set(a.classe, (valorPorClasse.get(a.classe) ?? 0) + a.valorAtual);
  }
  const classes = new Set<string>([...valorPorClasse.keys(), ...alvos.map((x) => x.classe)]);
  const alvoPorClasse = new Map<string, number>(alvos.map((x) => [x.classe, x.percentual]));
  const porClasse: AlocacaoClasse[] = [...classes].map((classe) => {
    const valorAtual = valorPorClasse.get(classe) ?? 0;
    const percentualAlvo = alvoPorClasse.get(classe) ?? 0;
    const percentualAtual = totalCarteira > 0 ? (valorAtual / totalCarteira) * 100 : null;
    const diferenca = percentualAtual === null ? null : percentualAtual - percentualAlvo;
    const ajuste = totalCarteira > 0 ? (percentualAlvo / 100) * totalCarteira - valorAtual : null;
    const situacao: AlocacaoClasse["situacao"] =
      diferenca === null || Math.abs(diferenca) < 0.05 ? "Dentro" : diferenca > 0 ? "Acima" : "Abaixo";
    return {
      classe,
      valorAtual,
      percentualAtual,
      percentualAlvo,
      diferencaPp: diferenca,
      ajuste,
      situacao,
    };
  });
  porClasse.sort((a, b) => b.valorAtual - a.valorAtual || a.classe.localeCompare(b.classe));
  const somaAlvos = alvos.reduce((s, x) => s + x.percentual, 0);
  return {
    porClasse,
    somaAlvos,
    alvosOk: somaAlvos === 100,
    totalCarteira,
  };
}

/** Patrimônio líquido (4.12): ativos (contas sem Investimentos + bens) − passivos (dívidas + bens negativos). */
export function calcularPatrimonio(
  contas: Conta[],
  lancamentos: Lancamento[],
  bens: BemPassivo[],
  dividas: Divida[],
): ResultadoPatrimonio {
  const mapaCats = new Map<number, { id: number; grupo: import("./types").CategoriaGrupo }>();
  const saldos = calcularSaldos(
    contas.filter((c) => c.tipo !== "Investimentos"),
    lancamentos,
    mapaCats,
  );
  const ativos = saldos.reduce((s, x) => s + x.saldoAtual, 0);
  const bensPositivos = bens.filter((b) => b.valor > 0).reduce((s, b) => s + b.valor, 0);
  const outrosPassivos = bens.filter((b) => b.valor < 0).reduce((s, b) => s + Math.abs(b.valor), 0);
  const dividasTotal = dividas.reduce((s, d) => s + d.saldoDevedor, 0);
  const passivos = dividasTotal + outrosPassivos;
  return {
    ativos: ativos + bensPositivos,
    passivos,
    patrimonioLiquido: ativos + bensPositivos - passivos,
  };
}

/** Série do patrimônio a partir do histórico mensal (gráfico 12). */
export function seriePatrimonio(historico: HistoricoPatrimonio[]): { mesKey: number; patrimonio: number }[] {
  return [...historico]
    .sort((a, b) => a.mesKey - b.mesKey)
    .map((h) => ({ mesKey: h.mesKey, patrimonio: h.ativos - h.passivos }));
}
