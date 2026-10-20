import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
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
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import {
  calcularDividas,
  NOMES_METODOS,
  type MetodoDividas,
} from "../domain/dividas";
import { avancarMesKey, formatarData, rotuloMesKey } from "../domain/datas";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";

interface FormularioDivida {
  nome: string;
  saldo: string;
  juros: string;
  parcela: string;
}

const FORM_INICIAL: FormularioDivida = { nome: "", saldo: "", juros: "", parcela: "" };

const CORES_METODOS: Record<MetodoDividas, string> = {
  minimo: "var(--cor-texto-suave)",
  neve: "var(--cor-destaque)",
  avalanche: "var(--cor-verde)",
};

export function PaginaDividas() {
  const { confirmar, dialogo } = useConfirm();
  const hoje = useToday();
  const dividas = useLiveQuery(async () => await db.dividas.toArray(), []);

  const [form, setForm] = useState<FormularioDivida>(FORM_INICIAL);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [extra, setExtra] = useState("0,00");

  if (dividas === undefined) return <Carregando />;

  const extraCentavos = textoParaCentavos(extra) ?? 0;
  const mesKeyAtual = Number(hoje.slice(0, 4) + hoje.slice(5, 7));
  const resultado = calcularDividas(dividas, extraCentavos, mesKeyAtual);

  const salvar = async () => {
    const saldo = textoParaCentavos(form.saldo);
    const parcela = textoParaCentavos(form.parcela);
    const juros = Number(form.juros.replace(",", "."));
    if (form.nome.trim() === "") {
      setErroForm("Informe o nome da dívida.");
      return;
    }
    if (saldo === null || saldo <= 0) {
      setErroForm("Informe o saldo devedor maior que zero.");
      return;
    }
    if (!Number.isFinite(juros) || juros < 0 || juros > 100) {
      setErroForm("Informe juros entre 0 e 100 % ao mês.");
      return;
    }
    if (parcela === null || parcela <= 0) {
      setErroForm("Informe a parcela mínima maior que zero.");
      return;
    }
    await db.dividas.add({
      nome: form.nome.trim(),
      saldoDevedor: saldo,
      jurosMes: juros,
      parcelaMinima: parcela,
    });
    setForm(FORM_INICIAL);
    setMostrarForm(false);
    setErroForm(null);
  };

  const excluir = (id: number, nome: string) => {
    confirmar("Excluir dívida", `Excluir a dívida "${nome}"?`, () => void executarExclusao(id));
  };

  const executarExclusao = async (id: number) => {
    await db.dividas.delete(id);
  };

  // gráfico 10: saldo devedor total por método
  const maxMeses = Math.max(
    ...(["minimo", "neve", "avalanche"] as const).map((m) => resultado.porMetodo[m].serie.length),
    1,
  );
  const dadosGrafico = Array.from({ length: maxMeses }, (_, i) => {
    const linha: Record<string, string | number> = { mes: `M${i + 1}` };
    for (const m of ["minimo", "neve", "avalanche"] as const) {
      const ponto = resultado.porMetodo[m].serie[i];
      linha[NOMES_METODOS[m]] = ponto ? ponto.saldoTotal / 100 : 0;
    }
    return linha;
  });

  const ativas = dividas.filter((d) => d.saldoDevedor > 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Dívidas</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">
            Motor de 60 meses: só o mínimo, bola de neve (menor saldo) e avalanche (maior juros).
          </p>
        </div>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => setMostrarForm((aberto) => !aberto)}
          aria-expanded={mostrarForm}
        >
          {mostrarForm ? "Fechar formulário" : "Nova dívida"}
        </button>
      </div>

      {resultado.alertas.length > 0 && (
        <div className="cartao p-4 mb-4" style={{ borderColor: "var(--cor-rosa)" }}>
          <h2 className="font-semibold text-sm mb-2" style={{ color: "var(--cor-rosa)" }}>Alertas</h2>
          <ul className="text-sm">
            {resultado.alertas.map((a) => (
              <li key={`a${a.id}`}>
                <strong>{a.nome}</strong>: {a.mensagem}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mostrarForm && (
        <div className="cartao p-4 mb-4" data-testid="formulario-divida">
          <h2 className="font-semibold text-sm mb-3">Nova dívida</h2>
          {erroForm && (
            <p className="text-sm mb-3" style={{ color: "var(--cor-rosa)" }} role="alert">
              {erroForm}
            </p>
          )}
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="rotulo" htmlFor="dv-nome">Nome</label>
              <input id="dv-nome" className="entrada" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="rotulo" htmlFor="dv-saldo">Saldo devedor (R$)</label>
              <input id="dv-saldo" className="entrada num" inputMode="decimal" value={form.saldo} onChange={(e) => setForm({ ...form, saldo: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label className="rotulo" htmlFor="dv-juros">Juros % ao mês</label>
              <input id="dv-juros" className="entrada num" inputMode="decimal" value={form.juros} onChange={(e) => setForm({ ...form, juros: e.target.value })} placeholder="2,0" />
            </div>
            <div>
              <label className="rotulo" htmlFor="dv-parcela">Parcela mínima (R$)</label>
              <input id="dv-parcela" className="entrada num" inputMode="decimal" value={form.parcela} onChange={(e) => setForm({ ...form, parcela: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="botao botao-primario" onClick={() => void salvar()}>Salvar dívida</button>
            <button type="button" className="botao botao-secundario" onClick={() => { setForm(FORM_INICIAL); setMostrarForm(false); setErroForm(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      {dividas.length === 0 ? (
        <EstadoVazio mensagem="Nenhuma dívida cadastrada. Cadastre o saldo, os juros ao mês e a parcela mínima para comparar os métodos de quitação." />
      ) : (
        <>
          <div className="cartao p-4 mb-4">
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="rotulo" htmlFor="dv-extra">Valor extra por mês (R$)</label>
                <input
                  id="dv-extra"
                  className="entrada num"
                  inputMode="decimal"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  style={{ width: 120 }}
                />
              </div>
              <p className="text-xs text-[var(--cor-texto-suave)] num">
                Juros estimados do 1º mês: {formatarBRL(resultado.jurosPrimeiroMes)}
              </p>
            </div>
          </div>

          {/* Comparativo dos 3 métodos */}
          <div className="cartao overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                  <th className="py-2 px-3">Método</th>
                  <th className="py-2 px-3 text-right">Meses p/ quitar</th>
                  <th className="py-2 px-3">Data de quitação</th>
                  <th className="py-2 px-3 text-right">Total pago</th>
                  <th className="py-2 px-3 text-right">Juros totais</th>
                  <th className="py-2 px-3 text-right">Juros economizados vs. mínimo</th>
                </tr>
              </thead>
              <tbody>
                {(["minimo", "neve", "avalanche"] as const).map((m) => {
                  const r = resultado.porMetodo[m];
                  const jurosEconomizados = resultado.jurosMinimo - r.jurosTotais;
                  const mesesEconomizados =
                    resultado.mesesMinimo !== null && r.meses !== null ? resultado.mesesMinimo - r.meses : null;
                  return (
                    <tr key={m} className="border-b last:border-0">
                      <td className="py-1.5 px-3" style={{ color: CORES_METODOS[m], fontWeight: 600 }}>{NOMES_METODOS[m]}</td>
                      <td className="py-1.5 px-3 text-right num">
                        {r.rotuloMeses}
                        {mesesEconomizados !== null && mesesEconomizados > 0 && m !== "minimo" ? ` (−${mesesEconomizados})` : ""}
                      </td>
                      <td className="py-1.5 px-3">{r.dataQuitacao === null ? "—" : formatarData(r.dataQuitacao)}</td>
                      <td className="py-1.5 px-3 text-right num">{formatarBRL(r.totalPago)}</td>
                      <td className="py-1.5 px-3 text-right num">{formatarBRL(r.jurosTotais)}</td>
                      <td
                        className="py-1.5 px-3 text-right num"
                        style={{ color: jurosEconomizados > 0 ? "var(--cor-verde)" : undefined }}
                      >
                        {m === "minimo" ? "—" : formatarBRL(jurosEconomizados)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Gráfico 10: saldo devedor nos 3 métodos */}
          <div className="cartao p-4 mb-4">
            <h2 className="font-semibold text-sm mb-3">Saldo devedor ao longo do tempo (3 métodos)</h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(valor) => formatarBRL(Number(valor) * 100)}
                    contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey={NOMES_METODOS.minimo} stroke={CORES_METODOS.minimo} dot={false} />
                  <Line type="monotone" dataKey={NOMES_METODOS.neve} stroke={CORES_METODOS.neve} dot={false} />
                  <Line type="monotone" dataKey={NOMES_METODOS.avalanche} stroke={CORES_METODOS.avalanche} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-[var(--cor-texto-suave)] mt-2">
              Projeção a partir de {rotuloMesKey(mesKeyAtual)} (até {rotuloMesKey(avancarMesKey(mesKeyAtual, maxMeses - 1))}).
            </p>
          </div>

          {/* Lista de dívidas */}
          {ativas.length > 0 && (
            <div className="cartao overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                    <th className="py-2 px-3">Dívida</th>
                    <th className="py-2 px-3 text-right">Saldo devedor</th>
                    <th className="py-2 px-3 text-right">Juros % a.m.</th>
                    <th className="py-2 px-3 text-right">Parcela mínima</th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {dividas.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-1.5 px-3">{d.nome}</td>
                      <td className="py-1.5 px-3 text-right num">{formatarBRL(d.saldoDevedor)}</td>
                      <td className="py-1.5 px-3 text-right num">{d.jurosMes.toFixed(2).replace(".", ",")}%</td>
                      <td className="py-1.5 px-3 text-right num">{formatarBRL(d.parcelaMinima)}</td>
                      <td className="py-1.5 px-3">
                        <button type="button" className="botao botao-secundario text-xs" onClick={() => excluir(d.id, d.nome)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {dialogo}
    </section>
  );
}
