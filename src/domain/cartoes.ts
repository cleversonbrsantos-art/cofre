import type { Cartao, CompraParcelada, Lancamento } from "./models";
import { anoDeMesKey, avancarMesKey, diasNoMes, mesDeMesKey } from "./datas";

export interface CicloCartao {
  inicio: string; // ISO
  fim: string; // ISO (dia do fechamento)
  vencimento: string; // ISO
}

/** Último dia do mês M-1 limitado a F: dia de corte do ciclo anterior. */
export function calcularCiclo(cartao: Cartao, mesKeyAlvo: number): CicloCartao {
  const ano = anoDeMesKey(mesKeyAlvo);
  const mes = mesDeMesKey(mesKeyAlvo);
  const F = cartao.diaFechamento;

  // Início: min(F, último dia do mês M-1) + 1, no mês anterior.
  const diasMesAnterior = diasNoMes(mes === 1 ? ano - 1 : ano, mes === 1 ? 12 : mes - 1);
  const diaInicioNoMesAnterior = Math.min(F, diasMesAnterior) + 1;
  const mesAnteriorKey = avancarMesKey(mesKeyAlvo, -1);
  const inicio = iso(
    anoDeMesKey(mesAnteriorKey),
    mesDeMesKey(mesAnteriorKey),
    diaInicioNoMesAnterior,
  );

  // Fim: min(F, dias do mês M), no mês M.
  const fimDia = Math.min(F, diasNoMes(ano, mes));
  const fim = iso(ano, mes, fimDia);

  // Vencimento: se V > F, no mês M; senão, no mês seguinte — sempre limitado ao último dia.
  let vencimentoAno = ano;
  let vencimentoMes = mes;
  if (cartao.diaVencimento <= F) {
    const proximo = avancarMesKey(mesKeyAlvo, 1);
    vencimentoAno = anoDeMesKey(proximo);
    vencimentoMes = mesDeMesKey(proximo);
  }
  const vencimento = iso(
    vencimentoAno,
    vencimentoMes,
    Math.min(cartao.diaVencimento, diasNoMes(vencimentoAno, vencimentoMes)),
  );

  return { inicio, fim, vencimento };
}

function iso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Mês-chave da fatura em que a data da compra cai (4.3/4.4). */
export function mesKeyDaFatura(dataCompra: string, cartao: Cartao): number {
  const ano = Number(dataCompra.slice(0, 4));
  const mes = Number(dataCompra.slice(5, 7));
  const dia = Number(dataCompra.slice(8, 10));
  // Compra até o dia do fechamento → fatura do próprio mês; depois → mês seguinte.
  if (dia <= cartao.diaFechamento) return ano * 100 + mes;
  return avancarMesKey(ano * 100 + mes, 1);
}

export interface FaturaCartao {
  cartao: Cartao;
  ciclo: CicloCartao;
  comprasDoCiclo: number; // centavos
  parcelasDoMes: number; // centavos
  fatura: number; // compras + parcelas
  percentualLimite: number; // 0-100
  parcelasFuturas: number; // centavos
  limiteLivre: number; // centavos
}

/**
 * Fatura do cartão para o mês M (4.3).
 * @param lancamentos todos os lançamentos (despesas com o cartão)
 * @param parceladas todas as compras parceladas do cartão
 */
export function calcularFatura(
  cartao: Cartao,
  mesKeyAlvo: number,
  lancamentos: Lancamento[],
  parceladas: CompraParcelada[],
): FaturaCartao {
  const ciclo = calcularCiclo(cartao, mesKeyAlvo);
  let comprasDoCiclo = 0;
  for (const l of lancamentos) {
    if (l.cartaoId !== cartao.id) continue;
    if (l.data >= ciclo.inicio && l.data <= ciclo.fim) {
      comprasDoCiclo += l.valor;
    }
  }
  let parcelasDoMes = 0;
  let parcelasFuturas = 0;
  for (const p of parceladas) {
    if (p.cartaoId !== cartao.id) continue;
    const parcela = Math.floor(p.valorTotal / p.numeroParcelas);
    const diferenca = p.valorTotal - parcela * p.numeroParcelas; // vai na 1ª
    const primeira = mesKeyDaFatura(p.dataCompra, cartao);
    for (let i = 0; i < p.numeroParcelas; i++) {
      const mk = avancarMesKey(primeira, i);
      const valor = i === 0 ? parcela + diferenca : parcela;
      if (mk === mesKeyAlvo) parcelasDoMes += valor;
      else if (mk > mesKeyAlvo) parcelasFuturas += valor;
    }
  }
  const fatura = comprasDoCiclo + parcelasDoMes;
  return {
    cartao,
    ciclo,
    comprasDoCiclo,
    parcelasDoMes,
    fatura,
    percentualLimite: cartao.limite > 0 ? (fatura / cartao.limite) * 100 : 0,
    parcelasFuturas,
    limiteLivre: cartao.limite - fatura - parcelasFuturas,
  };
}

/** Projeção de 12 meses a partir de M (inclusive) de parcelas comprometidas, por cartão (4.3). */
export function projetarParcelas(
  cartao: Cartao,
  mesKeyAlvo: number,
  parceladas: CompraParcelada[],
): { mesKey: number; valor: number }[] {
  const saida: { mesKey: number; valor: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const mk = avancarMesKey(mesKeyAlvo, i);
    let valor = 0;
    for (const p of parceladas) {
      if (p.cartaoId !== cartao.id) continue;
      const parcela = Math.floor(p.valorTotal / p.numeroParcelas);
      const diferenca = p.valorTotal - parcela * p.numeroParcelas;
      const primeira = mesKeyDaFatura(p.dataCompra, cartao);
      for (let j = 0; j < p.numeroParcelas; j++) {
        if (avancarMesKey(primeira, j) === mk) {
          valor += j === 0 ? parcela + diferenca : parcela;
        }
      }
    }
    saida.push({ mesKey: mk, valor });
  }
  return saida;
}
