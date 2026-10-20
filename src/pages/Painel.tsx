import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularNotaSaude } from "../domain/saude";
import { calcularFluxoAnual } from "../domain/fluxo";
import { calcularOrcamento } from "../domain/orcamento";
import { calcularReserva } from "../domain/reserva";
import { calcularDiaADia } from "../domain/diaadia";
import { calcularPatrimonio } from "../domain/investimentos";
import { calcularContasAPagar } from "../domain/contasapagar";
import { mesKeyDaFatura } from "../domain/cartoes";
import { calcularSaldos } from "../domain/contas";
import { PERFIS_RESERVA_PADRAO } from "../config/padroes";
import {
  avancarMesKey,
  formatarData,
  mesKeyDe,
  rotuloMesKey,
} from "../domain/datas";
import { formatarBRL } from "../domain/dinheiro";
import type { Cartao, Categoria } from "../domain/models";
import { PainelGraficos } from "./PainelGraficos";
import { PainelListas } from "./PainelListas";
import { Indicador } from "./Indicador";

const COR_SITUACAO_REGRA: Record<string, string> = {
  "Ótimo": "var(--cor-verde)",
  "Bom": "var(--cor-verde)",
  "Atenção": "var(--cor-ambar)",
  "Crítico": "var(--cor-rosa)",
  "Sem dados": "var(--cor-texto-suave)",
};

export function PaginaPainel() {
  const hoje = useToday();
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);
  const parceladas = useLiveQuery(async () => await db.parceladas.toArray(), []);
  const cartoes = useLiveQuery(async () => await db.cartoes.toArray(), []);
  const contas = useLiveQuery(async () => await db.contas.toArray(), []);
  const planos = useLiveQuery(async () => await db.orcamentoPlanos.toArray(), []);
  const reservaConfig = useLiveQuery(async () => await db.reservaConfig.get(1), []);
  const metas = useLiveQuery(async () => await db.metas.toArray(), []);
  const dividas = useLiveQuery(async () => await db.dividas.toArray(), []);
  const bens = useLiveQuery(async () => await db.bensPassivos.toArray(), []);
  const contasPagar = useLiveQuery(async () => await db.contasPagar.toArray(), []);

  const [mesManual, setMesManual] = useState<string>("");

  const mesKeyAuto = useMemo(() => {
    if (lancamentos === undefined) return 202601;
    if (lancamentos.length === 0) return mesKeyDe(hoje);
    const ultimo = [...lancamentos].sort((a, b) => b.data.localeCompare(a.data))[0];
    return mesKeyDe(ultimo.data);
  }, [hoje, lancamentos]);

  const mesKeyAlvo = mesManual === "" ? mesKeyAuto : Number(mesManual);

  if (
    lancamentos === undefined ||
    categorias === undefined ||
    parceladas === undefined ||
    cartoes === undefined ||
    contas === undefined ||
    planos === undefined ||
    reservaConfig === undefined ||
    metas === undefined ||
    dividas === undefined ||
    bens === undefined ||
    contasPagar === undefined
  ) {
    return <Carregando />;
  }

  const ano = Math.floor(mesKeyAlvo / 100);
  const mes = mesKeyAlvo % 100;
  const mapaCat = new Map<number, Categoria>(categorias.map((c) => [c.id, c]));

  const cartaoDe = (id: number): Cartao | undefined => cartoes.find((c) => c.id === id);
  const mesFaturaDe = (p: { dataCompra: string; cartaoId: number }): number => {
    const cartao = cartaoDe(p.cartaoId);
    return cartao ? mesKeyDaFatura(p.dataCompra, cartao) : Number(p.dataCompra.slice(0, 4) + p.dataCompra.slice(5, 7));
  };

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

  const fluxo = calcularFluxoAnual(ano, lancamentos, parceladas, categorias, mesFaturaDe);
  const mesDoFluxo = fluxo.meses[mes - 1];

  const receitasMes = mesDoFluxo.receitas;
  const despesasMes = mesDoFluxo.despesas;
  const saldoMes = mesDoFluxo.saldo;
  const taxaPoupanca = mesDoFluxo.taxaPoupanca;

  const saldos = calcularSaldos(contas, lancamentos, mapaCat);
  const patrimonio = calcularPatrimonio(contas, lancamentos, bens, dividas);

  // reserva
  const mesesPerfil = PERFIS_RESERVA_PADRAO.find((p) => p.perfil === reservaConfig.perfil)?.meses ?? 6;
  const contaReserva =
    reservaConfig.contaId === null
      ? saldos.filter((s) => s.conta.tipo === "Poupança").reduce((s, x) => s + x.saldoAtual, 0)
      : (saldos.find((s) => s.conta.id === reservaConfig.contaId)?.saldoAtual ?? 0);
  const reserva = calcularReserva(reservaConfig, mesesPerfil, lancamentos, mapaCat, parcelasPorMes, contaReserva);

  // orçamento do mês
  const mesAnterior = avancarMesKey(mesKeyAlvo, -1);
  const rendaRef = Math.max(1, receitasMes);
  const orcamento = calcularOrcamento(mesKeyAlvo, mesAnterior, planos, lancamentos, categorias, rendaRef);
  const usoOrcamento = orcamento.usoOrcamento;

  // dia a dia
  const diaADia = calcularDiaADia(mesKeyAlvo, lancamentos, mapaCat, hoje);

  // dívidas: parcelas mínimas ÷ receitas
  const totalParcelasMinimas = dividas.reduce((s, d) => s + d.parcelaMinima, 0);
  const parcelasSobreReceitas = receitasMes > 0 ? totalParcelasMinimas / receitasMes : null;

  // necessidades ÷ receitas
  const necessidadesSobreReceitas =
    receitasMes > 0 && mesDoFluxo.necessidades > 0 ? mesDoFluxo.necessidades / receitasMes : null;

  // nota de saúde
  const saude = calcularNotaSaude({
    taxaPoupanca: taxaPoupanca === null ? null : taxaPoupanca / 100,
    coberturaMeses: reserva.coberturaMeses,
    mesesAlvoReserva: reserva.mesesAlvo,
    parcelasMinimasSobreReceitas: parcelasSobreReceitas,
    necessidadesSobreReceitas,
    usoOrcamento,
  });

  // destaques do mês (3)
  const gastosPorCategoria = new Map<number, number>();
  for (const l of lancamentos) {
    if (mesKeyDe(l.data) !== mesKeyAlvo) continue;
    const cat = l.categoriaId === null ? undefined : mapaCat.get(l.categoriaId);
    const tipo = cat ? (cat.grupo === "Necessidade" || cat.grupo === "Desejo" ? "Despesa" : "Outro") : "Despesa";
    if (tipo !== "Despesa") continue;
    if (l.categoriaId !== null) {
      gastosPorCategoria.set(l.categoriaId, (gastosPorCategoria.get(l.categoriaId) ?? 0) + l.valor);
    }
  }
  const maiorCategoria = [...gastosPorCategoria.entries()].sort((a, b) => b[1] - a[1])[0];
  const maiorCategoriaAumento = orcamento.linhas
    .filter((l) => l.variacaoMesAnterior !== null && l.variacaoMesAnterior > 0)
    .sort((a, b) => (b.variacaoMesAnterior ?? 0) - (a.variacaoMesAnterior ?? 0))[0];
  const maiorGastoIndividual = [...lancamentos]
    .filter((l) => {
      if (mesKeyDe(l.data) !== mesKeyAlvo) return false;
      const cat = l.categoriaId === null ? undefined : mapaCat.get(l.categoriaId);
      return cat ? cat.grupo === "Necessidade" || cat.grupo === "Desejo" : true;
    })
    .sort((a, b) => b.valor - a.valor)[0];

  const vencimentos = calcularContasAPagar(contasPagar, hoje);

  // metas (gráfico 6)
  const projecoesMetas = metas.map((m) => ({
    nome: m.nome,
    progresso: m.valorAlvo > 0 ? Math.min(100, (m.jaGuardado / m.valorAlvo) * 100) : 0,
  }));

  // gráfico 2: para onde foi o dinheiro (8 maiores + Outras)
  const entradasRosca = [...gastosPorCategoria.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([catId, valor]) => ({ nome: mapaCat.get(catId)?.nome ?? "—", valor }));
  const top8 = entradasRosca.slice(0, 8);
  const outras = entradasRosca.slice(8).reduce((s, x) => s + x.valor, 0);
  const dadosRosca =
    outras > 0 ? [...top8, { nome: "Outras categorias", valor: outras }] : top8;

  // gráfico 3: 50/30/20 real × ideal
  const ideal = { Necessidade: 50, Desejo: 30, Poupança: 20 };
  const realNec = receitasMes > 0 ? (mesDoFluxo.necessidades / receitasMes) * 100 : 0;
  const realDes = receitasMes > 0 ? (mesDoFluxo.desejos / receitasMes) * 100 : 0;
  const realPoup = taxaPoupanca ?? 0;
  const dados503020 = [
    { grupo: "Necessidades", Real: Math.round(realNec * 10) / 10, Ideal: ideal.Necessidade },
    { grupo: "Desejos", Real: Math.round(realDes * 10) / 10, Ideal: ideal.Desejo },
    { grupo: "Guardado", Real: Math.round(realPoup * 10) / 10, Ideal: ideal.Poupança },
  ];

  // gráfico 5: orçamento × realizado (maiores categorias do mês)
  const dadosOrcamento = [...orcamento.linhas]
    .filter((l) => l.planejado > 0 || l.realizado > 0)
    .sort((a, b) => b.realizado - a.realizado)
    .slice(0, 8)
    .map((l) => ({
      categoria: l.nome.length > 18 ? `${l.nome.slice(0, 17)}…` : l.nome,
      Planejado: l.planejado / 100,
      Realizado: l.realizado / 100,
    }));

  // gráfico 8 (despesas por dia, versão painel)
  const dadosDias = diaADia.dias.map((d) => ({ dia: String(d.dia), Despesas: d.despesas / 100 }));

  const temDados = lancamentos.length > 0 || contasPagar.length > 0 || metas.length > 0;

  const COR_NOTA =
    saude.nota === null
      ? "var(--cor-texto-suave)"
      : saude.nota >= 80
        ? "var(--cor-verde)"
        : saude.nota >= 50
          ? "var(--cor-ambar)"
          : "var(--cor-rosa)";

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Painel</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">
            Período: {rotuloMesKey(mesKeyAlvo)} (automático: mês do último lançamento)
          </p>
        </div>
        <div>
          <label className="rotulo" htmlFor="painel-mes">Escolher mês</label>
          <input
            id="painel-mes"
            className="entrada"
            type="month"
            value={mesManual === "" ? `${ano}-${String(mes).padStart(2, "0")}` : mesManual}
            onChange={(e) => {
              setMesManual(e.target.value);
            }}
          />
        </div>
      </div>

      {!temDados ? (
        <EstadoVazio mensagem="Sem dados ainda. Cadastre lançamentos ou carregue os dados de exemplo em Configurações para ver o painel completo." />
      ) : (
        <>
          {/* 8 indicadores */}
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <Indicador rotulo="Receitas do mês" valor={formatarBRL(receitasMes)} />
            <Indicador rotulo="Despesas do mês" valor={formatarBRL(despesasMes)} />
            <Indicador
              rotulo="Saldo do mês"
              valor={formatarBRL(saldoMes)}
              cor={saldoMes >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)"}
            />
            <Indicador
              rotulo="Taxa de poupança (meta 20%)"
              valor={taxaPoupanca === null ? "—" : `${taxaPoupanca.toFixed(1).replace(".", ",")}%`}
            />
            <Indicador rotulo="Patrimônio líquido" valor={formatarBRL(patrimonio.patrimonioLiquido)} />
            <Indicador
              rotulo="Reserva (cobertura)"
              valor={
                reserva.coberturaMeses === null
                  ? "—"
                  : `${reserva.coberturaMeses.toFixed(1).replace(".", ",")} meses`
              }
            />
            <Indicador
              rotulo="Orçamento usado"
              valor={usoOrcamento === null ? "—" : `${usoOrcamento.toFixed(0)}%`}
            />
            <Indicador rotulo="Pode gastar por dia" valor={formatarBRL(diaADia.podeGastarPorDia)} />
          </div>

          {/* Nota de saúde: medidor circular + regras */}
          <div className="cartao p-4 mb-4">
            <h2 className="font-semibold text-sm mb-3">Saúde financeira</h2>
            <div className="flex gap-6 flex-wrap items-start">
              <div
                className="medidor-circular"
                role="img"
                aria-label={`Nota de saúde ${saude.nota === null ? "sem dados" : saude.nota.toFixed(0)} de 100`}
                style={{
                  background: `conic-gradient(${COR_NOTA} ${saude.nota === null ? 0 : (saude.nota / 100) * 360}deg, var(--cor-superficie-alt) 0deg)`,
                }}
              >
                <div className="medidor-centro">
                  <span className="num text-2xl font-semibold" style={{ color: COR_NOTA }}>
                    {saude.nota === null ? "—" : saude.nota.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto" style={{ flex: 1 }}>
              <table className="w-full text-sm" style={{ minWidth: 320 }}>
                <thead>
                  <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                    <th className="py-1.5 px-2">Regra</th>
                    <th className="py-1.5 px-2 text-right">Valor</th>
                    <th className="py-1.5 px-2">Meta</th>
                    <th className="py-1.5 px-2 text-right">Pontos</th>
                    <th className="py-1.5 px-2">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {saude.regras.map((r) => (
                    <tr key={r.chave} className="border-b last:border-0">
                      <td className="py-1.5 px-2">{r.rotulo}</td>
                      <td className="py-1.5 px-2 text-right num">
                        {r.chave === "reserva"
                          ? r.valor === null
                            ? "—"
                            : `${r.valor.toFixed(1).replace(".", ",")} meses`
                          : r.chave === "orcamento"
                            ? r.valor === null
                              ? "—"
                              : `${r.valor.toFixed(0)}%`
                            : r.valor === null
                              ? "—"
                              : `${(r.valor * 100).toFixed(1).replace(".", ",")}%`}
                      </td>
                      <td className="py-1.5 px-2 text-xs">{r.metaRotulo}</td>
                      <td className="py-1.5 px-2 text-right num">{r.pontos === null ? "—" : r.pontos.toFixed(0)}</td>
                      <td className="py-1.5 px-2">
                        <span style={{ color: COR_SITUACAO_REGRA[r.situacao], fontWeight: 600 }}>{r.situacao}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <p className="text-xs text-[var(--cor-texto-suave)] mt-2">
              {saude.regrasComDados} de 5 regras com dados · {saude.pontosObtidos.toFixed(0)} de{" "}
              {saude.pontosPossiveis} pontos possíveis
            </p>
          </div>

          {/* Destaques do mês */}
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div className="cartao p-4">
              <p className="text-xs text-[var(--cor-texto-suave)]">Maior categoria de gasto</p>
              {maiorCategoria ? (
                <>
                  <p className="font-semibold">{mapaCat.get(maiorCategoria[0])?.nome ?? "—"}</p>
                  <p className="num text-sm">{formatarBRL(maiorCategoria[1])}</p>
                </>
              ) : (
                <p className="text-sm text-[var(--cor-texto-suave)]">Sem gastos no mês</p>
              )}
            </div>
            <div className="cartao p-4">
              <p className="text-xs text-[var(--cor-texto-suave)]">Maior aumento vs. mês anterior</p>
              {maiorCategoriaAumento ? (
                <>
                  <p className="font-semibold">{maiorCategoriaAumento.nome}</p>
                  <p className="num text-sm" style={{ color: "var(--cor-rosa)" }}>
                    +{formatarBRL(maiorCategoriaAumento.variacaoMesAnterior ?? 0)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--cor-texto-suave)]">Nenhum aumento</p>
              )}
            </div>
            <div className="cartao p-4">
              <p className="text-xs text-[var(--cor-texto-suave)]">Maior gasto individual</p>
              {maiorGastoIndividual ? (
                <>
                  <p className="font-semibold">{maiorGastoIndividual.descricao}</p>
                  <p className="num text-sm">
                    {formatarBRL(maiorGastoIndividual.valor)} · {formatarData(maiorGastoIndividual.data)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--cor-texto-suave)]">Sem gastos no mês</p>
              )}
            </div>
          </div>

          <PainelGraficos
            dadosRosca={dadosRosca}
            dados503020={dados503020}
            dadosOrcamento={dadosOrcamento}
            projecoesMetas={projecoesMetas}
            mesesFluxo={fluxo.meses}
            dadosDias={dadosDias}
          />

          <PainelListas
            proximosVencimentos={vencimentos.proximosVencimentos}
            maioresGastos={diaADia.maioresGastos}
          />
        </>
      )}
    </section>
  );
}

