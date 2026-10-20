import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "../db/db";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularDiaADia } from "../domain/diaadia";
import { avancarMesKey, nomeMes, rotuloMesKey, anoDeMesKey, mesDeMesKey } from "../domain/datas";
import { formatarBRL } from "../domain/dinheiro";
import type { Categoria } from "../domain/models";

export function PaginaDiaADia() {
  const hoje = useToday();
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);

  const mesKeyAtual = useMemo(() => {
    return Number(hoje.slice(0, 4) + hoje.slice(5, 7));
  }, [hoje]);

  const [mesKey, setMesKey] = useState<number | null>(null);

  if (lancamentos === undefined || categorias === undefined) {
    return <Carregando />;
  }

  const mkAlvo = mesKey ?? mesKeyAtual;
  const mkAnterior = avancarMesKey(mkAlvo, -1);
  const mkSeguinte = avancarMesKey(mkAlvo, 1);
  const mapaCat = new Map<number, Categoria>(categorias.map((c) => [c.id, c]));
  const resultado = calcularDiaADia(mkAlvo, lancamentos, mapaCat, hoje);

  const mesAnteriorDe = (mk: number) => {
    const d = new Date(anoDeMesKey(mk), mesDeMesKey(mk) - 2, 1).getDay();
    return d;
  };
  const deslocamentoInicial = mesAnteriorDe(mkAlvo);

  const receitasMes = resultado.dias.reduce((s, d) => s + d.receitas, 0);
  const despesasMes = resultado.dias.reduce((s, d) => s + d.despesas, 0);

  const dadosBarras = resultado.dias.map((d) => ({
    dia: String(d.dia),
    Despesas: d.despesas / 100,
  }));

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Dia a dia</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">{rotuloMesKey(mkAlvo)}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="botao botao-secundario"
            onClick={() => setMesKey(mkAnterior)}
          >
            ← {nomeMes(mesDeMesKey(mkAnterior))}
          </button>
          <button
            type="button"
            className="botao botao-secundario"
            disabled={mkAlvo >= mesKeyAtual}
            onClick={() => setMesKey(mkSeguinte)}
          >
            {nomeMes(mesDeMesKey(mkSeguinte))} →
          </button>
        </div>
      </div>

      {receitasMes === 0 && despesasMes === 0 && (
        <EstadoVazio mensagem={`Nenhum lançamento em ${rotuloMesKey(mkAlvo)}.`} />
      )}

      {/* Pode gastar por dia */}
      <div className="cartao p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--cor-texto-suave)]">Pode gastar por dia (sobra do mês ÷ dias restantes)</p>
          <p
            className="num text-2xl font-semibold"
            style={{ color: resultado.podeGastarPorDia > 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}
          >
            {formatarBRL(resultado.podeGastarPorDia)}
          </p>
        </div>
        <div className="text-sm num text-[var(--cor-texto-suave)]">
          Receitas do mês: {formatarBRL(receitasMes)} · Despesas do mês: {formatarBRL(despesasMes)}
        </div>
      </div>

      {/* Calendário */}
      <div className="cartao p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Calendário do mês</h2>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((d) => (
            <p key={d} className="text-center text-[var(--cor-texto-suave)] py-1">
              {d}
            </p>
          ))}
          {Array.from({ length: deslocamentoInicial }, (_, i) => <span key={`vazio-${i}`} />)}
          {resultado.dias.map((d) => {
            const prefixo = `${anoDeMesKey(mkAlvo)}-${String(mesDeMesKey(mkAlvo)).padStart(2, "0")}-`;
            const hojeDia = hoje.startsWith(prefixo) && Number(hoje.slice(8, 10)) === d.dia;
            return (
              <div
                key={d.dia}
                className="p-1.5 rounded border min-h-14"
                style={{
                  borderColor: hojeDia ? "var(--cor-destaque)" : "var(--cor-borda)",
                  background:
                    d.saldoDia > 0
                      ? "var(--cor-verde-suave)"
                      : d.saldoDia < 0
                        ? "var(--cor-rosa-suave)"
                        : "var(--cor-superficie-alt)",
                  fontWeight: hojeDia ? 600 : undefined,
                }}
                title={`Dia ${d.dia}: receitas ${formatarBRL(d.receitas)}, despesas ${formatarBRL(d.despesas)}`}
              >
                <p className="font-medium">{d.dia}</p>
                {d.despesas > 0 && (
                  <p className="num text-[10px]" style={{ color: "var(--cor-rosa)" }}>
                    −{formatarBRL(d.despesas)}
                  </p>
                )}
                {d.receitas > 0 && (
                  <p className="num text-[10px]" style={{ color: "var(--cor-verde)" }}>
                    +{formatarBRL(d.receitas)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico 8: despesas por dia */}
      <div className="cartao p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Despesas por dia</h2>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={dadosBarras}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="dia" tick={{ fontSize: 9 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(valor) => formatarBRL(Number(valor) * 100)}
                labelFormatter={(label) => `Dia ${label}`}
                contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
              />
              <Bar dataKey="Despesas" fill="var(--cor-rosa)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 10 maiores gastos */}
      {resultado.maioresGastos.length > 0 && (
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">10 maiores gastos do mês</h2>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Descrição</th>
                <th className="py-2 px-3">Data</th>
                <th className="py-2 px-3 text-right">Valor</th>
                <th className="py-2 px-3 text-right">% das despesas</th>
              </tr>
            </thead>
            <tbody>
              {resultado.maioresGastos.map((g, i) => (
                <tr key={g.lancamento.id} className="border-b last:border-0">
                  <td className="py-1.5 px-3">{i + 1}</td>
                  <td className="py-1.5 px-3">{g.lancamento.descricao}</td>
                  <td className="py-1.5 px-3">
                    {g.lancamento.data.slice(8, 10)}/{g.lancamento.data.slice(5, 7)}
                  </td>
                  <td className="py-1.5 px-3 text-right num">{formatarBRL(g.lancamento.valor)}</td>
                  <td className="py-1.5 px-3 text-right num">{g.percentualDespesas.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </section>
  );
}
