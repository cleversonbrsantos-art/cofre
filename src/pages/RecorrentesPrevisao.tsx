import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatarBRL } from "../domain/dinheiro";
import { rotuloMesKey } from "../domain/datas";

interface LinhaPrevisao {
  mesKey: number;
  receitasRecorrentes: number;
  despesasRecorrentes: number;
  parcelasCartoes: number;
  aportes: number;
  saldoMes: number;
  caixaProjetado: number;
}

interface Props {
  dadosGrafico: Record<string, number | string>[];
  previsao: { meses: LinhaPrevisao[] };
}

/** Gráfico 9 (saldo do mês e caixa projetado) e tabela de previsão, da tela Recorrentes. */
export function RecorrentesPrevisao({ dadosGrafico, previsao }: Props) {
  return (
    <>
      {/* Gráfico 9: saldo do mês e caixa projetado */}
      <div className="cartao p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Saldo do mês e caixa projetado</h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(valor) => formatarBRL(Number(valor) * 100)}
                contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Caixa projetado"
                stroke="var(--cor-verde)"
                fill="var(--cor-verde)"
                fillOpacity={0.15}
              />
              <Area
                type="monotone"
                dataKey="Saldo do mês"
                stroke="var(--cor-destaque)"
                fill="var(--cor-destaque)"
                fillOpacity={0.25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de previsão */}
      <div className="cartao overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
              <th className="py-2 px-3">Mês</th>
              <th className="py-2 px-3 text-right">Receitas rec.</th>
              <th className="py-2 px-3 text-right">Despesas rec.</th>
              <th className="py-2 px-3 text-right">Parcelas cartão</th>
              <th className="py-2 px-3 text-right">Aportes</th>
              <th className="py-2 px-3 text-right">Saldo do mês</th>
              <th className="py-2 px-3 text-right">Caixa projetado</th>
            </tr>
          </thead>
          <tbody>
            {previsao.meses.map((m) => (
              <tr key={m.mesKey} className="border-b last:border-0">
                <td className="py-1.5 px-3">{rotuloMesKey(m.mesKey)}</td>
                <td className="py-1.5 px-3 text-right num">{formatarBRL(m.receitasRecorrentes)}</td>
                <td className="py-1.5 px-3 text-right num">{formatarBRL(m.despesasRecorrentes)}</td>
                <td className="py-1.5 px-3 text-right num">{formatarBRL(m.parcelasCartoes)}</td>
                <td className="py-1.5 px-3 text-right num">{formatarBRL(m.aportes)}</td>
                <td
                  className="py-1.5 px-3 text-right num"
                  style={{ color: m.saldoMes >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}
                >
                  {formatarBRL(m.saldoMes)}
                </td>
                <td
                  className="py-1.5 px-3 text-right num"
                  style={{ color: m.caixaProjetado < 0 ? "var(--cor-rosa)" : undefined }}
                >
                  {formatarBRL(m.caixaProjetado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {previsao.meses.some((m) => m.caixaProjetado < 0) && (
          <p className="text-xs px-3 py-2" style={{ color: "var(--cor-rosa)" }}>
            Atenção: o caixa projetado fica negativo em algum mês. Reveja despesas, parcelas ou aportes.
          </p>
        )}
      </div>
    </>
  );
}
