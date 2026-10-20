import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "../db/db";
import { Carregando } from "../components/PaginaVazia";
import {
  custoDoHabito,
  independenciaFinanceira,
  simularJurosCompostos,
} from "../domain/simuladores";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";
import { useLiveQuery } from "dexie-react-hooks";

interface FormJuros {
  inicial: string;
  aporte: string;
  taxa: string;
  anos: string;
  inflacao: string;
}

interface FormIndependencia {
  renda: string;
  aporte: string;
  patrimonio: string;
  rendimento: string;
  inflacao: string;
  prazo: string;
}

interface FormHabito {
  valor: string;
  vezes: string;
  taxa: string;
  anos: string;
}

const FORM_JUROS_INICIAL: FormJuros = {
  inicial: "10000,00",
  aporte: "500,00",
  taxa: "10,5",
  anos: "10",
  inflacao: "4,5",
};

const FORM_IND_INICIAL: FormIndependencia = {
  renda: "8000,00",
  aporte: "1500,00",
  patrimonio: "0,00",
  rendimento: "10,5",
  inflacao: "4,5",
  prazo: "20",
};

const FORM_HABITO_INICIAL: FormHabito = {
  valor: "30,00",
  vezes: "25",
  taxa: "10,5",
  anos: "10",
};

export function PaginaSimuladores() {
  const config = useLiveQuery(async () => await db.configuracao.get(1), []);

  const [juros, setJuros] = useState<FormJuros>(FORM_JUROS_INICIAL);
  const [ind, setInd] = useState<FormIndependencia>(FORM_IND_INICIAL);
  const [habito, setHabito] = useState<FormHabito>(FORM_HABITO_INICIAL);

  const resultadoJuros = useMemo(() => {
    if (!config) return null;
    const inicial = textoParaCentavos(juros.inicial);
    const aporte = textoParaCentavos(juros.aporte);
    const taxa = Number(juros.taxa.replace(",", "."));
    const anos = Number(juros.anos);
    const inflacao = Number(juros.inflacao.replace(",", "."));
    if (inicial === null || aporte === null || !Number.isFinite(taxa) || !Number.isFinite(anos) || !Number.isFinite(inflacao) || anos < 1 || anos > 50) {
      return null;
    }
    return simularJurosCompostos(inicial, aporte, taxa, anos, inflacao);
  }, [config, juros]);

  const resultadoInd = useMemo(() => {
    if (!config) return null;
    const renda = textoParaCentavos(ind.renda);
    const aporte = textoParaCentavos(ind.aporte);
    const patrimonio = textoParaCentavos(ind.patrimonio);
    const rendimento = Number(ind.rendimento.replace(",", "."));
    const inflacao = Number(ind.inflacao.replace(",", "."));
    const prazo = Number(ind.prazo);
    if (
      renda === null || renda <= 0 || aporte === null || patrimonio === null ||
      !Number.isFinite(rendimento) || !Number.isFinite(inflacao) ||
      !Number.isFinite(prazo) || prazo < 1 || prazo > 60
    ) {
      return null;
    }
    return independenciaFinanceira(renda, aporte, patrimonio, rendimento, inflacao, prazo);
  }, [config, ind]);

  const resultadoHabito = useMemo(() => {
    const valor = textoParaCentavos(habito.valor);
    const vezes = Number(habito.vezes);
    const taxa = Number(habito.taxa.replace(",", "."));
    const anos = Number(habito.anos);
    if (valor === null || valor <= 0 || !Number.isInteger(vezes) || vezes < 1 || vezes > 31 || !Number.isFinite(taxa) || !Number.isFinite(anos) || anos < 1 || anos > 50) {
      return null;
    }
    return custoDoHabito(valor, vezes, taxa, anos);
  }, [habito]);

  if (config === undefined) return <Carregando />;

  const dadosJuros =
    resultadoJuros === null
      ? []
      : resultadoJuros.pontos.map((p) => ({
          ano: `Ano ${p.ano}`,
          Aportado: p.aportes / 100,
          "Com juros": p.montante / 100,
        }));

  return (
    <section>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Simuladores</h1>
        <p className="text-sm text-[var(--cor-texto-suave)]">
          Juros compostos, independência financeira e custo do hábito — cálculos com os percentuais das Configurações como padrão.
        </p>
      </div>

      {/* 4.14.1 — Juros compostos */}
      <div className="cartao p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Juros compostos</h2>
        <div className="grid md:grid-cols-5 gap-3">
          <div>
            <label className="rotulo" htmlFor="sj-inicial">Valor inicial (R$)</label>
            <input id="sj-inicial" className="entrada num" inputMode="decimal" value={juros.inicial} onChange={(e) => setJuros({ ...juros, inicial: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="sj-aporte">Aporte mensal (R$)</label>
            <input id="sj-aporte" className="entrada num" inputMode="decimal" value={juros.aporte} onChange={(e) => setJuros({ ...juros, aporte: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="sj-taxa">Taxa % a.a.</label>
            <input id="sj-taxa" className="entrada num" inputMode="decimal" value={juros.taxa} onChange={(e) => setJuros({ ...juros, taxa: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="sj-anos">Anos</label>
            <input id="sj-anos" className="entrada num" type="number" min={1} max={50} value={juros.anos} onChange={(e) => setJuros({ ...juros, anos: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="sj-infl">Inflação % a.a.</label>
            <input id="sj-infl" className="entrada num" inputMode="decimal" value={juros.inflacao} onChange={(e) => setJuros({ ...juros, inflacao: e.target.value })} />
          </div>
        </div>

        {resultadoJuros === null ? (
          <p className="text-sm mt-3" style={{ color: "var(--cor-ambar)" }} role="alert">
            Preencha todos os campos com valores válidos (anos de 1 a 50) para simular.
          </p>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-3 mt-4">
              <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
                <p className="text-xs text-[var(--cor-texto-suave)]">Montante final</p>
                <p className="num text-lg font-semibold">{formatarBRL(resultadoJuros.montanteFinal)}</p>
              </div>
              <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
                <p className="text-xs text-[var(--cor-texto-suave)]">Total aportado</p>
                <p className="num text-lg font-semibold">{formatarBRL(resultadoJuros.totalAportado)}</p>
              </div>
              <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
                <p className="text-xs text-[var(--cor-texto-suave)]">Juros ganhos</p>
                <p className="num text-lg font-semibold" style={{ color: "var(--cor-verde)" }}>{formatarBRL(resultadoJuros.jurosTotal)}</p>
              </div>
              <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
                <p className="text-xs text-[var(--cor-texto-suave)]">Poder de compra de hoje</p>
                <p className="num text-lg font-semibold">{formatarBRL(resultadoJuros.valorFuturoHoje)}</p>
              </div>
            </div>
            <div className="mt-4" style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={dadosJuros}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                  <XAxis dataKey="ano" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(valor) => formatarBRL(Number(valor) * 100)}
                    contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Aportado" stroke="var(--cor-destaque)" fill="var(--cor-destaque)" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Com juros" stroke="var(--cor-verde)" fill="var(--cor-verde)" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* 4.14.2 — Independência financeira */}
      <div className="cartao p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Independência financeira (regra dos 25× e 4%)</h2>
        <div className="grid md:grid-cols-6 gap-3">
          <div>
            <label className="rotulo" htmlFor="si-renda">Renda desejada/mês (R$)</label>
            <input id="si-renda" className="entrada num" inputMode="decimal" value={ind.renda} onChange={(e) => setInd({ ...ind, renda: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="si-aporte">Aporte mensal (R$)</label>
            <input id="si-aporte" className="entrada num" inputMode="decimal" value={ind.aporte} onChange={(e) => setInd({ ...ind, aporte: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="si-patrim">Patrimônio atual (R$)</label>
            <input id="si-patrim" className="entrada num" inputMode="decimal" value={ind.patrimonio} onChange={(e) => setInd({ ...ind, patrimonio: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="si-rend">Rendimento % a.a.</label>
            <input id="si-rend" className="entrada num" inputMode="decimal" value={ind.rendimento} onChange={(e) => setInd({ ...ind, rendimento: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="si-infl">Inflação % a.a.</label>
            <input id="si-infl" className="entrada num" inputMode="decimal" value={ind.inflacao} onChange={(e) => setInd({ ...ind, inflacao: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="si-prazo">Prazo (anos)</label>
            <input id="si-prazo" className="entrada num" type="number" min={1} max={60} value={ind.prazo} onChange={(e) => setInd({ ...ind, prazo: e.target.value })} />
          </div>
        </div>

        {resultadoInd === null ? (
          <p className="text-sm mt-3" style={{ color: "var(--cor-ambar)" }} role="alert">
            Preencha os campos com valores válidos (renda maior que zero; prazo de 1 a 60 anos).
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
              <p className="text-xs text-[var(--cor-texto-suave)]">Patrimônio necessário (25×)</p>
              <p className="num text-lg font-semibold">{formatarBRL(resultadoInd.patrimonioNecessario)}</p>
              <p className="text-xs num text-[var(--cor-texto-suave)]">
                {resultadoInd.percentualPercorrido === null
                  ? "—"
                  : `${resultadoInd.percentualPercorrido.toFixed(1)}% percorrido · falta ${formatarBRL(resultadoInd.falta)}`}
              </p>
            </div>
            <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
              <p className="text-xs text-[var(--cor-texto-suave)]">Renda passiva de hoje</p>
              <p className="num text-lg font-semibold">{formatarBRL(resultadoInd.rendaPassivaHoje)}/mês</p>
              <p className="text-xs text-[var(--cor-texto-suave)]">Patrimônio atual × 4% ÷ 12</p>
            </div>
            <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
              <p className="text-xs text-[var(--cor-texto-suave)]">Com o aporte atual</p>
              <p className="text-lg font-semibold">
                {resultadoInd.anosParaChegar === null ? "Sem aporte" : resultadoInd.anosParaChegar === 0 ? "Já alcançado" : `${resultadoInd.anosParaChegar} anos`}
              </p>
              <p className="text-xs num text-[var(--cor-texto-suave)]">
                {resultadoInd.aporteNecessario === null
                  ? "—"
                  : `No prazo de ${ind.prazo} anos: aporte de ${formatarBRL(resultadoInd.aporteNecessario)}/mês`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4.14.3 — Custo do hábito */}
      <div className="cartao p-4">
        <h2 className="font-semibold text-sm mb-3">Custo do hábito</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="rotulo" htmlFor="sh-valor">Valor por vez (R$)</label>
            <input id="sh-valor" className="entrada num" inputMode="decimal" value={habito.valor} onChange={(e) => setHabito({ ...habito, valor: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="sh-vezes">Vezes por mês</label>
            <input id="sh-vezes" className="entrada num" type="number" min={1} max={31} value={habito.vezes} onChange={(e) => setHabito({ ...habito, vezes: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="sh-taxa">Taxa % a.a.</label>
            <input id="sh-taxa" className="entrada num" inputMode="decimal" value={habito.taxa} onChange={(e) => setHabito({ ...habito, taxa: e.target.value })} />
          </div>
          <div>
            <label className="rotulo" htmlFor="sh-anos">Anos</label>
            <input id="sh-anos" className="entrada num" type="number" min={1} max={50} value={habito.anos} onChange={(e) => setHabito({ ...habito, anos: e.target.value })} />
          </div>
        </div>

        {resultadoHabito === null ? (
          <p className="text-sm mt-3" style={{ color: "var(--cor-ambar)" }} role="alert">
            Preencha os campos com valores válidos (valor maior que zero; vezes por mês de 1 a 31).
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
              <p className="text-xs text-[var(--cor-texto-suave)]">Gasto no período ({resultadoHabito.meses} meses)</p>
              <p className="num text-lg font-semibold" style={{ color: "var(--cor-rosa)" }}>{formatarBRL(resultadoHabito.gastoTotal)}</p>
            </div>
            <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
              <p className="text-xs text-[var(--cor-texto-suave)]">Se investido todo mês</p>
              <p className="num text-lg font-semibold" style={{ color: "var(--cor-verde)" }}>{formatarBRL(resultadoHabito.investidoTotal)}</p>
            </div>
            <div className="cartao p-3" style={{ background: "var(--cor-superficie-alt)" }}>
              <p className="text-xs text-[var(--cor-texto-suave)]">Diferença</p>
              <p className="num text-lg font-semibold">{formatarBRL(resultadoHabito.diferenca)}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
