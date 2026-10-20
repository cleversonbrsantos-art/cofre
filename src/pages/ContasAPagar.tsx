import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularContasAPagar, diasEntre } from "../domain/contasapagar";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";
import { formatarData } from "../domain/datas";
import { FORMAS_PAGAMENTO_PADRAO } from "../config/padroes";
import type { ContaPagar } from "../domain/models";

interface FormularioConta {
  descricao: string;
  valor: string;
  vencimento: string;
  formaPagamento: string;
}

const FORM_INICIAL: FormularioConta = {
  descricao: "",
  valor: "",
  vencimento: "",
  formaPagamento: "Boleto",
};

export function PaginaContasAPagar() {
  const { confirmar, dialogo } = useConfirm();
  const hoje = useToday();
  const contas = useLiveQuery(async () => await db.contasPagar.toArray(), []);
  const formas = useLiveQuery(async () => (await db.paymentMethods.toArray()).map((f) => f.name), []);

  const [form, setForm] = useState<FormularioConta>(FORM_INICIAL);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  if (contas === undefined) return <Carregando />;

  const resumo = calcularContasAPagar(contas, hoje);

  const salvar = async () => {
    const valor = textoParaCentavos(form.valor);
    if (form.descricao.trim() === "") {
      setErroForm("Informe a descrição.");
      return;
    }
    if (valor === null || valor <= 0) {
      setErroForm("Informe um valor maior que zero.");
      return;
    }
    if (form.vencimento === "") {
      setErroForm("Informe o vencimento.");
      return;
    }
    await db.contasPagar.add({
      descricao: form.descricao.trim(),
      vencimento: form.vencimento,
      valor,
      categoriaId: null,
      status: "",
      formaPagamento: form.formaPagamento,
    });
    setForm(FORM_INICIAL);
    setMostrarForm(false);
    setErroForm(null);
  };

  const marcarPaga = async (c: ContaPagar) => {
    await db.contasPagar.update(c.id, { status: c.status === "Paga" ? "" : "Paga" });
  };

  const excluir = (id: number, nome: string) => {
    confirmar("Excluir conta a pagar", `Excluir a conta a pagar "${nome}"?`, () => void executarExclusao(id));
  };

  const executarExclusao = async (id: number) => {
    await db.contasPagar.delete(id);
  };

  const situacaoDe = (c: ContaPagar): { rotulo: string; cor: string } => {
    if (c.status === "Paga") return { rotulo: "Paga", cor: "var(--cor-verde)" };
    const dias = diasEntre(hoje, c.vencimento);
    if (dias < 0) return { rotulo: "Atrasada", cor: "var(--cor-rosa)" };
    if (dias <= 7) return { rotulo: "Vence em breve", cor: "var(--cor-ambar)" };
    return { rotulo: "No prazo", cor: "var(--cor-destaque)" };
  };

  const linhaDe = (c: ContaPagar, chave: string) => {
    const s = situacaoDe(c);
    return (
      <tr key={chave} className="border-b last:border-0">
        <td className="py-1.5 px-3">{c.descricao}</td>
        <td className="py-1.5 px-3">{formatarData(c.vencimento)}</td>
        <td className="py-1.5 px-3 text-right num">{formatarBRL(c.valor)}</td>
        <td className="py-1.5 px-3">{c.formaPagamento}</td>
        <td className="py-1.5 px-3">
          <span className="etiqueta" style={{ color: s.cor }}>{s.rotulo}</span>
        </td>
        <td className="py-1.5 px-3">
          <div className="flex gap-1">
            <button type="button" className="botao botao-secundario text-xs" onClick={() => void marcarPaga(c)}>
              {c.status === "Paga" ? "Reabrir" : "Marcar paga"}
            </button>
            <button type="button" className="botao botao-secundario text-xs" onClick={() => excluir(c.id, c.descricao)}>
              Excluir
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Contas a pagar</h1>
          <p className="text-sm text-[var(--cor-texto-suave)] num">
            Em aberto: {formatarBRL(resumo.totalAberto)} · Vencem neste mês: {formatarBRL(resumo.totalMes)} · Pagas no mês:{" "}
            {formatarBRL(resumo.pagasMes)}
          </p>
        </div>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => setMostrarForm((aberto) => !aberto)}
          aria-expanded={mostrarForm}
        >
          {mostrarForm ? "Fechar formulário" : "Nova conta"}
        </button>
      </div>

      {mostrarForm && (
        <div className="cartao p-4 mb-4" data-testid="formulario-conta-pagar">
          <h2 className="font-semibold text-sm mb-3">Nova conta a pagar</h2>
          {erroForm && (
            <p className="text-sm mb-3" style={{ color: "var(--cor-rosa)" }} role="alert">
              {erroForm}
            </p>
          )}
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="rotulo" htmlFor="cp-descricao">Descrição</label>
              <input id="cp-descricao" className="entrada" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <label className="rotulo" htmlFor="cp-valor">Valor (R$)</label>
              <input id="cp-valor" className="entrada num" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label className="rotulo" htmlFor="cp-venc">Vencimento</label>
              <input id="cp-venc" className="entrada" type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
            </div>
            <div>
              <label className="rotulo" htmlFor="cp-forma">Forma</label>
              <select id="cp-forma" className="entrada" value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}>
                {(formas ?? FORMAS_PAGAMENTO_PADRAO).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="botao botao-primario" onClick={() => void salvar()}>Salvar conta</button>
            <button type="button" className="botao botao-secundario" onClick={() => { setForm(FORM_INICIAL); setMostrarForm(false); setErroForm(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      {resumo.vencidas.length > 0 && (
        <div className="cartao p-4 mb-4" style={{ borderColor: "var(--cor-rosa)" }}>
          <h2 className="font-semibold text-sm mb-2" style={{ color: "var(--cor-rosa)" }}>
            Vencidas ({resumo.vencidas.length})
          </h2>
          <table className="w-full text-sm">
            <tbody>{resumo.vencidas.map((v) => linhaDe(v.conta, `v${v.conta.id}`))}</tbody>
          </table>
        </div>
      )}

      {resumo.vencemEmBreve.length > 0 && (
        <div className="cartao p-4 mb-4">
          <h2 className="font-semibold text-sm mb-2">Vencem em até 7 dias</h2>
          <table className="w-full text-sm">
            <tbody>{resumo.vencemEmBreve.map((c) => linhaDe(c, `b${c.id}`))}</tbody>
          </table>
        </div>
      )}

      {contas.length === 0 ? (
        <EstadoVazio mensagem="Nenhuma conta a pagar cadastrada." />
      ) : (
        <div className="cartao overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">Descrição</th>
                <th className="py-2 px-3">Vencimento</th>
                <th className="py-2 px-3 text-right">Valor</th>
                <th className="py-2 px-3">Forma</th>
                <th className="py-2 px-3">Situação</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>{contas.map((c) => linhaDe(c, `t${c.id}`))}</tbody>
          </table>
        </div>
      )}
      {dialogo}
    </section>
  );
}
