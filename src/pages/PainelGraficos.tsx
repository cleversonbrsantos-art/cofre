import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarBRL } from "../domain/dinheiro";

const CORES_ROSCA = [
  "var(--cor-destaque)",
  "var(--cor-verde)",
  "var(--cor-ambar)",
  "var(--cor-rosa)",
  "#5b8bd0",
  "#9a76b8",
  "#64a8a0",
  "#c2a26a",
  "var(--cor-texto-suave)",
];

const estiloTooltip = {
  background: "var(--cor-superficie)",
  border: "1px solid var(--cor-borda)",
};

interface Props {
  dadosRosca: { nome: string; valor: number }[];
  dados503020: { grupo: string; Real: number; Ideal: number }[];
  dadosOrcamento: { categoria: string; Planejado: number; Realizado: number }[];
  projecoesMetas: { nome: string; progresso: number }[];
  mesesFluxo: { mesKey: number; receitas: number; despesas: number }[];
  dadosDias: { dia: string; Despesas: number }[];
}

/** Os 6 gráficos do Painel (§5: 2, 3, 5, 6 e as versões do fluxo anual e dia a dia). */
export function PainelGraficos({
  dadosRosca,
  dados503020,
  dadosOrcamento,
  projecoesMetas,
  mesesFluxo,
  dadosDias,
}: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-4">
      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Para onde foi o dinheiro no mês</h2>
        {dadosRosca.length === 0 ? (
          <p className="text-sm text-[var(--cor-texto-suave)]">Sem gastos categorizados no mês.</p>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dadosRosca}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {dadosRosca.map((entrada, i) => (
                    <Cell key={entrada.nome} fill={CORES_ROSCA[i % CORES_ROSCA.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(valor) => formatarBRL(Number(valor))} contentStyle={estiloTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Regra 50/30/20: real × ideal</h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={dados503020}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="grupo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                formatter={(valor) => `${Number(valor).toFixed(1)}%`}
                contentStyle={estiloTooltip}
              />
              <Legend />
              <Bar dataKey="Real" fill="var(--cor-destaque)" />
              <Bar dataKey="Ideal" fill="var(--cor-verde)" fillOpacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Orçamento × realizado (maiores gastos)</h2>
        {dadosOrcamento.length === 0 ? (
          <p className="text-sm text-[var(--cor-texto-suave)]">Sem plano ou gasto registrado no mês.</p>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={dadosOrcamento} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 9 }} width={130} />
                <Tooltip
                  formatter={(valor) => formatarBRL(Number(valor) * 100)}
                  contentStyle={estiloTooltip}
                />
                <Legend />
                <Bar dataKey="Planejado" fill="var(--cor-destaque)" fillOpacity={0.5} />
                <Bar dataKey="Realizado" fill="var(--cor-rosa)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Progresso das metas</h2>
        {projecoesMetas.length === 0 ? (
          <p className="text-sm text-[var(--cor-texto-suave)]">Nenhuma meta cadastrada.</p>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={projecoesMetas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  formatter={(valor) => `${Number(valor).toFixed(0)}%`}
                  contentStyle={estiloTooltip}
                />
                <Bar dataKey="progresso" name="Concluído %" fill="var(--cor-verde)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Receitas × despesas no ano</h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart
              data={mesesFluxo.map((m) => ({
                mes: m.mesKey % 100,
                Receitas: m.receitas / 100,
                Despesas: m.despesas / 100,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(valor) => formatarBRL(Number(valor) * 100)}
                contentStyle={estiloTooltip}
              />
              <Legend />
              <Bar dataKey="Receitas" fill="var(--cor-verde)" />
              <Bar dataKey="Despesas" fill="var(--cor-rosa)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Despesas por dia do mês</h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={dadosDias}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="dia" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(valor) => formatarBRL(Number(valor) * 100)}
                contentStyle={estiloTooltip}
              />
              <Bar dataKey="Despesas" fill="var(--cor-destaque)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
