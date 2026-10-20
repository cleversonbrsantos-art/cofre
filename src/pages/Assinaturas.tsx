import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularAssinaturas, proximaRenovacao } from "../domain/contasapagar";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";
import { formatarData } from "../domain/datas";
import type { Assinatura, CicloAssinatura } from "../domain/models";

interface FormularioAssinatura {
  servico: string;
  valor: string;
  ciclo: CicloAssinatura;
  renovacao: string;
}

const FORM_INICIAL: FormularioAssinatura = {
  servico: "",
  valor: "",
  ciclo: "Mensal",
  renovacao: "",
};

export function PaginaAssinaturas() {
  const { confirmar, dialogo } = useConfirm();
  const hoje = useToday();
  const assinaturas = useLiveQuery(async () => await db.assinaturas.toArray(), []);

  const [form, setForm] = useState<FormularioAssinatura>(FORM_INICIAL);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  if (assinaturas === undefined) return <Carregando />;

  const resumo = calcularAssinaturas(assinaturas, hoje);

  const salvar = async () => {
    const valor = textoParaCentavos(form.valor);
    if (form.servico.trim() === "") {
      setErroForm("Informe o nome do serviço.");
      return;
    }
    if (valor === null || valor <= 0) {
      setErroForm("Informe um valor maior que zero.");
      return;
    }
    if (form.renovacao === "") {
      setErroForm("Informe a data da próxima renovação.");
      return;
    }
    await db.assinaturas.add({
      servico: form.servico.trim(),
      valor,
      ciclo: form.ciclo,
      proximaRenovacao: form.renovacao,
      categoriaId: null,
    });
    setForm(FORM_INICIAL);
    setMostrarForm(false);
    setErroForm(null);
  };

  const renovar = async (a: Assinatura) => {
    await db.assinaturas.update(a.id, {
      proximaRenovacao: proximaRenovacao(a.proximaRenovacao, a.ciclo),
    });
  };

  const excluir = (id: number, nome: string) => {
    confirmar("Excluir assinatura", `Excluir a assinatura "${nome}"?`, () => void executarExclusao(id));
  };

  const executarExclusao = async (id: number) => {
    await db.assinaturas.delete(id);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Assinaturas</h1>
          <p className="text-sm text-[var(--cor-texto-suave)] num">
            Equivalente mensal: {formatarBRL(resumo.custoMensalEquivalente)} · Custo anual projetado:{" "}
            {formatarBRL(resumo.custoAnual)}
          </p>
        </div>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => setMostrarForm((aberto) => !aberto)}
          aria-expanded={mostrarForm}
        >
          {mostrarForm ? "Fechar formulário" : "Nova assinatura"}
        </button>
      </div>

      {mostrarForm && (
        <div className="cartao p-4 mb-4" data-testid="formulario-assinatura">
          <h2 className="font-semibold text-sm mb-3">Nova assinatura</h2>
          {erroForm && (
            <p className="text-sm mb-3" style={{ color: "var(--cor-rosa)" }} role="alert">
              {erroForm}
            </p>
          )}
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="rotulo" htmlFor="as-servico">Serviço</label>
              <input id="as-servico" className="entrada" value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} />
            </div>
            <div>
              <label className="rotulo" htmlFor="as-valor">Valor (R$)</label>
              <input id="as-valor" className="entrada num" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label className="rotulo" htmlFor="as-ciclo">Ciclo</label>
              <select id="as-ciclo" className="entrada" value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value as CicloAssinatura })}>
                <option value="Mensal">Mensal</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="as-renov">Próxima renovação</label>
              <input id="as-renov" className="entrada" type="date" value={form.renovacao} onChange={(e) => setForm({ ...form, renovacao: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="botao botao-primario" onClick={() => void salvar()}>Salvar assinatura</button>
            <button type="button" className="botao botao-secundario" onClick={() => { setForm(FORM_INICIAL); setMostrarForm(false); setErroForm(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      {resumo.renovacoesProximas.length > 0 && (
        <div className="cartao p-4 mb-4">
          <h2 className="font-semibold text-sm mb-2">Renovações nos próximos 30 dias</h2>
          <ul className="text-sm">
            {resumo.renovacoesProximas.map((r) => (
              <li key={r.assinatura.id} className="flex justify-between py-1 border-b last:border-0">
                <span>
                  {r.assinatura.servico} — {formatarData(r.assinatura.proximaRenovacao)} ({r.diasRestantes} dias)
                </span>
                <span className="num">{formatarBRL(r.assinatura.valor)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {assinaturas.length === 0 ? (
        <EstadoVazio mensagem="Nenhuma assinatura cadastrada. Registre serviços mensais ou anuais para ver o custo equivalente." />
      ) : (
        <div className="cartao overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">Serviço</th>
                <th className="py-2 px-3">Ciclo</th>
                <th className="py-2 px-3 text-right">Valor</th>
                <th className="py-2 px-3 text-right">Equivalente mensal</th>
                <th className="py-2 px-3">Próxima renovação</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {assinaturas.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-1.5 px-3">{a.servico}</td>
                  <td className="py-1.5 px-3">{a.ciclo}</td>
                  <td className="py-1.5 px-3 text-right num">{formatarBRL(a.valor)}</td>
                  <td className="py-1.5 px-3 text-right num">{formatarBRL(a.ciclo === "Anual" ? Math.round(a.valor / 12) : a.valor)}</td>
                  <td className="py-1.5 px-3">{formatarData(a.proximaRenovacao)}</td>
                  <td className="py-1.5 px-3">
                    <div className="flex gap-1">
                      <button type="button" className="botao botao-secundario text-xs" onClick={() => void renovar(a)}>
                        Renovar
                      </button>
                      <button type="button" className="botao botao-secundario text-xs" onClick={() => excluir(a.id, a.servico)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialogo}
    </section>
  );
}
