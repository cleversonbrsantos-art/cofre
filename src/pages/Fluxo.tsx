import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "../db/db";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularFluxoAnual } from "../domain/fluxo";
import { mesKeyDaFatura } from "../domain/cartoes";
import { nomeMes } from "../domain/datas";
import { formatarBRL } from "../domain/dinheiro";
import type { CompraParcelada, Cartao } from "../domain/models";

export function PaginaFluxo() {
  const hoje = useToday();
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const parceladas = useLiveQuery(async () => await db.parceladas.toArray(), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);
  const cartoes = useLiveQuery(async () => await db.cartoes.toArray(), []);

  const ano = useMemo(() => {
    return Number(hoje.slice(0, 4));
  }, [hoje]);

  if (
    lancamentos === undefined ||
    parceladas === undefined ||
    categorias === undefined ||
    cartoes === undefined
  ) {
    return <Carregando />;
  }

  const cartaoDe = (id: number): Cartao =>
    cartoes.find((c) => c.id === id) ?? { id: 0, nome: "", limite: 0, diaFechamento: 1, diaVencimento: 1 };
  const mesFaturaDe = (p: CompraParcelada) => mesKeyDaFatura(p.dataCompra, cartaoDe(p.cartaoId));

  const fluxo = calcularFluxoAnual(ano, lancamentos, parceladas, categorias, mesFaturaDe);

  const dadosBarras = fluxo.meses.map((m) => ({
    mes: nomeMes(m.mesKey % 100).slice(0, 3),
    Receitas: m.receitas / 100,
    Despesas: m.despesas / 100,
  }));
  const dadosLinha = fluxo.meses
    .filter((m) => m.receitas > 0 || m.despesas > 0)
    .map((m) => ({
      mes: nomeMes(m.mesKey % 100).slice(0, 3),
      "Saldo acumulado": m.saldoAcumulado / 100,
    }));

  const maxCalor = Math.max(1, ...fluxo.calor.flatMap((c) => [...c.valores.values()]));

  const corCalor = (valor: number): string => {
    if (valor === 0) return "var(--cor-superficie-alt)";
    const intensidade = valor / maxCalor;
    if (intensidade < 0.25) return "var(--cor-destaque-suave)";
    if (intensidade < 0.5) return "var(--cor-destaque)";
    if (intensidade < 0.75) return "var(--cor-destaque-forte)";
    return "var(--cor-rosa)";
  };

  return (
    <section>
      <h1 className="text-xl font-semibold">Fluxo anual</h1>
      <p className="text-sm text-[var(--cor-texto-suave)] mb-4">Ano {ano}</p>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Total do ano — receitas</p>
          <p className="num font-semibold" style={{ color: "var(--cor-verde)" }}>
            {formatarBRL(fluxo.totalAno.receitas)}
          </p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Total do ano — despesas</p>
          <p className="num font-semibold" style={{ color: "var(--cor-rosa)" }}>
            {formatarBRL(fluxo.totalAno.despesas)}
          </p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Média mensal (saldo)</p>
          <p className="num font-semibold">{formatarBRL(fluxo.mediaMensal.saldo)}</p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Melhor mês</p>
          <p className="num font-semibold" style={{ color: "var(--cor-verde)" }}>
            {fluxo.melhorMes ? `${nomeMes(fluxo.melhorMes.mesKey % 100).slice(0, 3)} · ${formatarBRL(fluxo.melhorMes.saldo)}` : "—"}
          </p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Pior mês</p>
          <p className="num font-semibold" style={{ color: "var(--cor-rosa)" }}>
            {fluxo.piorMes ? `${nomeMes(fluxo.piorMes.mesKey % 100).slice(0, 3)} · ${formatarBRL(fluxo.piorMes.saldo)}` : "—"}
          </p>
        </div>
      </div>

      {/* Gráfico 1: receitas × despesas */}
      <div className="cartao p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Receitas × despesas por mês</h2>
        {fluxo.totalAno.receitas === 0 && fluxo.totalAno.despesas === 0 ? (
          <EstadoVazio mensagem="Sem lançamentos neste ano." />
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={dadosBarras}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}`} />
                <Tooltip
                  formatter={(valor) => formatarBRL(Number(valor) * 100)}
                  contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
                />
                <Legend />
                <Bar dataKey="Receitas" fill="var(--cor-destaque)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="var(--cor-rosa)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gráfico 4: saldo acumulado */}
      <div className="cartao p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Saldo acumulado no ano</h2>
        {dadosLinha.length === 0 ? (
          <EstadoVazio mensagem="Sem movimento para acumular." />
        ) : (
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={dadosLinha}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(valor) => formatarBRL(Number(valor) * 100)}
                  contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
                />
                <Line type="monotone" dataKey="Saldo acumulado" stroke="var(--cor-destaque)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabela mensal */}
      <div className="cartao overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
              <th className="py-2 px-3">Mês</th>
              <th className="py-2 px-3 text-right">Receitas</th>
              <th className="py-2 px-3 text-right">Despesas (c/ parcelas)</th>
              <th className="py-2 px-3 text-right">Saldo</th>
              <th className="py-2 px-3 text-right">Taxa de poupança</th>
              <th className="py-2 px-3 text-right">Acumulado</th>
              <th className="py-2 px-3 text-right">Necessidades</th>
              <th className="py-2 px-3 text-right">Desejos</th>
              <th className="py-2 px-3 text-right">Guardado</th>
              <th className="py-2 px-3 text-right">Sem categoria</th>
            </tr>
          </thead>
          <tbody>
            {fluxo.meses.map((m) => {
              const mov = m.receitas > 0 || m.despesas > 0 || m.guardadoInvestido > 0;
              return (
                <tr key={m.mesKey} className="border-b last:border-0" style={{ opacity: mov ? 1 : 0.5 }}>
                  <td className="py-1.5 px-3">{nomeMes(m.mesKey % 100)}</td>
                  <td className="py-1.5 px-3 text-right num">{mov ? formatarBRL(m.receitas) : "—"}</td>
                  <td className="py-1.5 px-3 text-right num">{mov ? formatarBRL(m.despesas) : "—"}</td>
                  <td className="py-1.5 px-3 text-right num" style={{ color: m.saldo >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}>
                    {mov ? formatarBRL(m.saldo) : "—"}
                  </td>
                  <td className="py-1.5 px-3 text-right num">{m.taxaPoupanca === null ? "—" : `${m.taxaPoupanca.toFixed(0)}%`}</td>
                  <td className="py-1.5 px-3 text-right num">{mov ? formatarBRL(m.saldoAcumulado) : "—"}</td>
                  <td className="py-1.5 px-3 text-right num">{m.necessidades > 0 ? formatarBRL(m.necessidades) : "—"}</td>
                  <td className="py-1.5 px-3 text-right num">{m.desejos > 0 ? formatarBRL(m.desejos) : "—"}</td>
                  <td className="py-1.5 px-3 text-right num">{m.guardadoInvestido > 0 ? formatarBRL(m.guardadoInvestido) : "—"}</td>
                  <td className="py-1.5 px-3 text-right num">{m.semCategoria > 0 ? formatarBRL(m.semCategoria) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mapa de calor */}
      {fluxo.calor.length > 0 && (
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">Mapa de calor — categoria × mês (despesas)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="py-1 px-2 text-left">Categoria</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="py-1 px-1">{nomeMes(i + 1).slice(0, 1)}</th>
                  ))}
                  <th className="py-1 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {fluxo.calor.map((linha) => (
                  <tr key={linha.categoriaId}>
                    <td className="py-1 px-2 whitespace-nowrap">{linha.nome}</td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const valor = linha.valores.get(i + 1) ?? 0;
                      return (
                        <td
                          key={i}
                          className="py-1 px-1 text-center"
                          style={{ backgroundColor: corCalor(valor) }}
                          title={`${linha.nome} — ${nomeMes(i + 1)}: ${formatarBRL(valor)}`}
                        />
                      );
                    })}
                    <td className="py-1 px-2 text-right num">{formatarBRL(linha.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--cor-texto-suave)] mt-2">
            Escala: mais escuro/forte = gasto maior no mês (máx. {formatarBRL(maxCalor)}).
          </p>
        </div>
      )}
    </section>
  );
}
