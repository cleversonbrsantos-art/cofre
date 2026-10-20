import { useState } from "react";
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
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import {
  calcularAlocacao,
  calcularPatrimonio,
  calcularRentabilidade,
  seriePatrimonio,
} from "../domain/investimentos";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";
import { rotuloMesKey } from "../domain/datas";
import type { ClasseInvestimento } from "../domain/models";
import { InvestimentosBens } from "./InvestimentosBens";

const CLASSES: ClasseInvestimento[] = ["Renda fixa", "Ações", "FIIs", "Cripto", "Exterior", "Outros"];

interface FormularioAtivo {
  nome: string;
  classe: ClasseInvestimento;
  aportado: string;
  atual: string;
}

const FORM_INICIAL: FormularioAtivo = { nome: "", classe: "Renda fixa", aportado: "", atual: "" };

export function PaginaInvestimentos() {
  const { confirmar, dialogo } = useConfirm();
  const hoje = useToday();
  const ativos = useLiveQuery(async () => await db.ativos.toArray(), []);
  const alvos = useLiveQuery(async () => await db.alvos.toArray(), []);
  const bens = useLiveQuery(async () => await db.bensPassivos.toArray(), []);
  const dividas = useLiveQuery(async () => await db.dividas.toArray(), []);
  const contas = useLiveQuery(async () => await db.contas.toArray(), []);
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const historico = useLiveQuery(async () => await db.patrimonioHistorico.toArray(), []);

  const [form, setForm] = useState<FormularioAtivo>(FORM_INICIAL);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [novoBem, setNovoBem] = useState({ nome: "", valor: "" });

  if (
    ativos === undefined ||
    alvos === undefined ||
    bens === undefined ||
    dividas === undefined ||
    contas === undefined ||
    lancamentos === undefined ||
    historico === undefined
  ) {
    return <Carregando />;
  }

  const rentabilidades = calcularRentabilidade(ativos);
  const alocacao = calcularAlocacao(ativos, alvos);
  const patrimonio = calcularPatrimonio(contas, lancamentos, bens, dividas);
  const serie = seriePatrimonio(historico);

  const salvarAtivo = async () => {
    const aportado = textoParaCentavos(form.aportado);
    const atual = textoParaCentavos(form.atual);
    if (form.nome.trim() === "") {
      setErroForm("Informe o nome do ativo.");
      return;
    }
    if (aportado === null || aportado < 0 || atual === null || atual < 0) {
      setErroForm("Informe valores válidos (não negativos).");
      return;
    }
    await db.ativos.add({
      nome: form.nome.trim(),
      classe: form.classe,
      totalAportado: aportado,
      valorAtual: atual,
    });
    setForm(FORM_INICIAL);
    setMostrarForm(false);
    setErroForm(null);
  };

  const excluirAtivo = (id: number, nome: string) => {
    confirmar("Excluir ativo", `Excluir o ativo "${nome}"?`, () => void db.ativos.delete(id));
  };

  const salvarAlvo = async (classe: string, percentual: number) => {
    const existente = alvos.find((a) => a.classe === classe);
    if (existente) {
      await db.alvos.update(existente.id, { percentual });
    } else {
      await db.alvos.add({ classe: classe as ClasseInvestimento, percentual });
    }
  };

  const registrarBem = async () => {
    const valor = textoParaCentavos(novoBem.valor);
    if (novoBem.nome.trim() === "") return;
    if (valor === null || valor === 0) return;
    await db.bensPassivos.add({ nome: novoBem.nome.trim(), valor });
    setNovoBem({ nome: "", valor: "" });
  };

  const excluirBem = (id: number) => {
    confirmar("Excluir bem ou passivo", "Excluir este registro?", () => void db.bensPassivos.delete(id));
  };

  const registrarMesHistorico = async () => {
    await db.patrimonioHistorico.add({
      mesKey: Number(hoje.slice(0, 4) + hoje.slice(5, 7)),
      ativos: patrimonio.ativos,
      passivos: patrimonio.passivos,
    });
  };

  const excluirHistorico = (id: number) => {
    confirmar("Excluir registro do histórico", "Excluir este registro do histórico de patrimônio?", () => void db.patrimonioHistorico.delete(id));
  };

  // gráfico 11: alocação atual × alvo
  const dadosAlocacao = alocacao.porClasse.map((c) => ({
    classe: c.classe,
    "Atual %": c.percentualAtual === null ? 0 : Math.round(c.percentualAtual * 10) / 10,
    "Alvo %": c.percentualAlvo,
  }));

  // gráfico 12: evolução do patrimônio
  const dadosPatrimonio = serie.map((p) => ({
    mes: rotuloMesKey(p.mesKey).replace(" de ", "/"),
    "Patrimônio líquido": p.patrimonio / 100,
  }));

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Investimentos e patrimônio</h1>
          <p className="text-sm text-[var(--cor-texto-suave)] num">
            Carteira: {formatarBRL(alocacao.totalCarteira)} · PL: {formatarBRL(patrimonio.patrimonioLiquido)} (ativos{" "}
            {formatarBRL(patrimonio.ativos)} − passivos {formatarBRL(patrimonio.passivos)})
          </p>
        </div>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => setMostrarForm((aberto) => !aberto)}
          aria-expanded={mostrarForm}
        >
          {mostrarForm ? "Fechar formulário" : "Novo ativo"}
        </button>
      </div>

      {!alocacao.alvosOk && alvos.length > 0 && (
        <div className="cartao p-4 mb-4" style={{ borderColor: "var(--cor-ambar)" }}>
          <p className="text-sm" style={{ color: "var(--cor-ambar)" }}>
            Atenção: os alvos somam {alocacao.somaAlvos}%, não 100%. Ajuste para a alocação fazer sentido.
          </p>
        </div>
      )}

      {mostrarForm && (
        <div className="cartao p-4 mb-4" data-testid="formulario-ativo">
          <h2 className="font-semibold text-sm mb-3">Novo ativo</h2>
          {erroForm && (
            <p className="text-sm mb-3" style={{ color: "var(--cor-rosa)" }} role="alert">
              {erroForm}
            </p>
          )}
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="rotulo" htmlFor="in-nome">Nome</label>
              <input id="in-nome" className="entrada" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="rotulo" htmlFor="in-classe">Classe</label>
              <select id="in-classe" className="entrada" value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value as ClasseInvestimento })}>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="in-aportado">Total aportado (R$)</label>
              <input id="in-aportado" className="entrada num" inputMode="decimal" value={form.aportado} onChange={(e) => setForm({ ...form, aportado: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label className="rotulo" htmlFor="in-atual">Valor atual (R$)</label>
              <input id="in-atual" className="entrada num" inputMode="decimal" value={form.atual} onChange={(e) => setForm({ ...form, atual: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="botao botao-primario" onClick={() => void salvarAtivo()}>Salvar ativo</button>
            <button type="button" className="botao botao-secundario" onClick={() => { setForm(FORM_INICIAL); setMostrarForm(false); setErroForm(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      {ativos.length === 0 && alvos.length === 0 && (
        <EstadoVazio mensagem="Nenhum ativo cadastrado. Registre a carteira e defina alvos por classe para acompanhar a alocação e o patrimônio." />
      )}

      {ativos.length > 0 && (
        <div className="cartao overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">Ativo</th>
                <th className="py-2 px-3">Classe</th>
                <th className="py-2 px-3 text-right">Aportado</th>
                <th className="py-2 px-3 text-right">Valor atual</th>
                <th className="py-2 px-3 text-right">Rentabilidade R$</th>
                <th className="py-2 px-3 text-right">Rentabilidade %</th>
                <th className="py-2 px-3 text-right">% da carteira</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {rentabilidades.map((r) => (
                <tr key={r.ativo.id} className="border-b last:border-0">
                  <td className="py-1.5 px-3">{r.ativo.nome}</td>
                  <td className="py-1.5 px-3">{r.ativo.classe}</td>
                  <td className="py-1.5 px-3 text-right num">{formatarBRL(r.ativo.totalAportado)}</td>
                  <td className="py-1.5 px-3 text-right num">{formatarBRL(r.ativo.valorAtual)}</td>
                  <td className="py-1.5 px-3 text-right num" style={{ color: r.rentabilidadeReais >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}>
                    {formatarBRL(r.rentabilidadeReais)}
                  </td>
                  <td className="py-1.5 px-3 text-right num">
                    {r.rentabilidadePercentual === null ? "—" : `${r.rentabilidadePercentual.toFixed(1).replace(".", ",")}%`}
                  </td>
                  <td className="py-1.5 px-3 text-right num">
                    {r.percentualCarteira === null ? "—" : `${r.percentualCarteira.toFixed(1).replace(".", ",")}%`}
                  </td>
                  <td className="py-1.5 px-3">
                    <button type="button" className="botao botao-secundario text-xs" onClick={() => excluirAtivo(r.ativo.id, r.ativo.nome)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {alocacao.porClasse.length > 0 && (
        <>
          <div className="cartao p-4 mb-4">
            <h2 className="font-semibold text-sm mb-3">Alvos por classe</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {CLASSES.map((classe) => {
                const alvo = alvos.find((a) => a.classe === classe);
                return (
                  <div key={classe}>
                    <label className="rotulo" htmlFor={`alvo-${classe}`}>{classe} (%)</label>
                    <input
                      id={`alvo-${classe}`}
                      className="entrada num"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={alvo?.percentual ?? 0}
                      onBlur={(e) => void salvarAlvo(classe, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cartao overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                  <th className="py-2 px-3">Classe</th>
                  <th className="py-2 px-3 text-right">Valor atual</th>
                  <th className="py-2 px-3 text-right">% atual</th>
                  <th className="py-2 px-3 text-right">% alvo</th>
                  <th className="py-2 px-3 text-right">Diferença (p.p.)</th>
                  <th className="py-2 px-3 text-right">Ajuste p/ alvo</th>
                  <th className="py-2 px-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {alocacao.porClasse.map((c) => (
                  <tr key={c.classe} className="border-b last:border-0">
                    <td className="py-1.5 px-3">{c.classe}</td>
                    <td className="py-1.5 px-3 text-right num">{formatarBRL(c.valorAtual)}</td>
                    <td className="py-1.5 px-3 text-right num">{c.percentualAtual === null ? "—" : `${c.percentualAtual.toFixed(1).replace(".", ",")}%`}</td>
                    <td className="py-1.5 px-3 text-right num">{c.percentualAlvo}%</td>
                    <td className="py-1.5 px-3 text-right num">{c.diferencaPp === null ? "—" : `${c.diferencaPp.toFixed(1).replace(".", ",")} p.p.`}</td>
                    <td className="py-1.5 px-3 text-right num" style={{ color: c.ajuste === null ? undefined : c.ajuste > 0 ? "var(--cor-verde)" : "var(--cor-rosa)" }}>
                      {c.ajuste === null ? "—" : formatarBRL(c.ajuste)}
                    </td>
                    <td className="py-1.5 px-3">{c.situacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Gráficos 11 e 12 */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">Alocação atual × alvo</h2>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={dadosAlocacao}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                <XAxis dataKey="classe" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(valor) => `${Number(valor).toFixed(1)}%`}
                  contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
                />
                <Legend />
                <Bar dataKey="Atual %" fill="var(--cor-destaque)" />
                <Bar dataKey="Alvo %" fill="var(--cor-verde)" fillOpacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">Evolução do patrimônio</h2>
          {dadosPatrimonio.length === 0 ? (
            <p className="text-sm text-[var(--cor-texto-suave)]">
              Sem histórico. Registre o mês atual no histórico abaixo para começar a série.
            </p>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={dadosPatrimonio}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(valor) => formatarBRL(Number(valor) * 100)}
                    contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
                  />
                  <Line type="monotone" dataKey="Patrimônio líquido" stroke="var(--cor-destaque)" dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <InvestimentosBens
        bens={bens}
        novoBem={novoBem}
        setNovoBem={setNovoBem}
        registrarBem={() => void registrarBem()}
        excluirBem={(id) => excluirBem(id)}
        historico={historico}
        serie={serie}
        registrarMesHistorico={() => void registrarMesHistorico()}
        excluirHistorico={(id) => excluirHistorico(id)}
      />
      {dialogo}
    </section>
  );
}
