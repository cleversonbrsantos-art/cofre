import type { Categoria, Lancamento } from "./models";
import { tipoDoGrupo } from "./types";
import { diasNoMes } from "./datas";

export interface DiaFluxo {
  dia: number;
  receitas: number;
  despesas: number;
  saldoDia: number;
  saldoAcumulado: number;
}

export interface ResultadoDiaADia {
  dias: DiaFluxo[];
  podeGastarPorDia: number; // centavos
  maioresGastos: { lancamento: Lancamento; percentualDespesas: number }[];
}

/** Dia a dia do mês (4.7). */
export function calcularDiaADia(
  mesKeyAlvo: number,
  lancamentos: Lancamento[],
  categorias: Map<number, Categoria>,
  hoje: string,
): ResultadoDiaADia {
  const ano = Math.floor(mesKeyAlvo / 100);
  const mes = mesKeyAlvo % 100;
  const totalDias = diasNoMes(ano, mes);

  const porDia = new Map<number, { receitas: number; despesas: number }>();
  for (const l of lancamentos) {
    if (Number(l.data.slice(0, 4) + l.data.slice(5, 7)) !== mesKeyAlvo) continue;
    const cat = l.categoriaId === null ? undefined : categorias.get(l.categoriaId);
    const tipo = cat ? tipoDoGrupo(cat.grupo) : "Despesa";
    const dia = Number(l.data.slice(8, 10));
    const atual = porDia.get(dia) ?? { receitas: 0, despesas: 0 };
    if (tipo === "Receita") atual.receitas += l.valor;
    else if (tipo === "Despesa") atual.despesas += l.valor;
    else if (tipo === "Poupança") atual.despesas += l.valor;
    porDia.set(dia, atual);
  }

  const dias: DiaFluxo[] = [];
  let acumulado = 0;
  for (let d = 1; d <= totalDias; d++) {
    const mov = porDia.get(d) ?? { receitas: 0, despesas: 0 };
    const saldoDia = mov.receitas - mov.despesas;
    acumulado += saldoDia;
    dias.push({ dia: d, receitas: mov.receitas, despesas: mov.despesas, saldoDia, saldoAcumulado: acumulado });
  }

  // pode gastar por dia = max(0, sobra do mês ÷ dias restantes) (4.7)
  const hojeDia = hoje.startsWith(`${ano}-${String(mes).padStart(2, "0")}-`)
    ? Number(hoje.slice(8, 10))
    : null;
  const receitasMes = dias.reduce((s, d) => s + d.receitas, 0);
  const despesasMes = dias.reduce((s, d) => s + d.despesas, 0);
  const sobra = receitasMes - despesasMes;
  const diasRestantes =
    hojeDia !== null && hojeDia >= 1 && hojeDia <= totalDias
      ? Math.max(1, totalDias - hojeDia + 1)
      : totalDias;
  const podeGastarPorDia = Math.max(0, Math.floor(sobra / diasRestantes));

  // 10 maiores gastos
  const gastosDoMes = lancamentos
    .filter((l) => {
      if (Number(l.data.slice(0, 4) + l.data.slice(5, 7)) !== mesKeyAlvo) return false;
      const cat = l.categoriaId === null ? undefined : categorias.get(l.categoriaId);
      const tipo = cat ? tipoDoGrupo(cat.grupo) : "Despesa";
      return tipo === "Despesa";
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
  const maioresGastos = gastosDoMes.map((l) => ({
    lancamento: l,
    percentualDespesas: despesasMes > 0 ? (l.valor / despesasMes) * 100 : 0,
  }));

  return { dias, podeGastarPorDia, maioresGastos };
}
