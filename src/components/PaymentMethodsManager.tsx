import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { countPaymentMethodUsage, validatePaymentMethodName } from "../domain/paymentMethodRules";
import { useConfirm } from "../hooks/useConfirm";

/** Gerência de formas de pagamento (C3): criar, renomear e excluir (bloqueada em uso). */
export function PaymentMethodsManager() {
  const formas = useLiveQuery(async () => await db.paymentMethods.orderBy("name").toArray(), []);
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const contasPagar = useLiveQuery(async () => await db.contasPagar.toArray(), []);
  const { confirmar, dialogo } = useConfirm();
  const [novoNome, setNovoNome] = useState("");
  const [erroNovo, setErroNovo] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdit, setNomeEdit] = useState("");
  const [erroEdit, setErroEdit] = useState<string | null>(null);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  if (formas === undefined || lancamentos === undefined || contasPagar === undefined)
    return <p className="text-sm text-[var(--cor-texto-suave)]">Carregando…</p>;

  const criar = async () => {
    const validacao = validatePaymentMethodName(novoNome, formas);
    if (!validacao.ok) {
      setErroNovo(validacao.error);
      return;
    }
    setErroNovo(null);
    await db.paymentMethods.add({ name: validacao.name });
    setNovoNome("");
  };

  const abrirEdicao = (id: number, name: string) => {
    setEditandoId(id);
    setNomeEdit(name);
    setErroEdit(null);
  };

  const salvarEdicao = async () => {
    if (editandoId === null) return;
    const original = formas.find((f) => f.id === editandoId);
    if (!original) return;
    const validacao = validatePaymentMethodName(nomeEdit, formas, editandoId);
    if (!validacao.ok) {
      setErroEdit(validacao.error);
      return;
    }
    const nomeAntigo = original.name;
    const nomeNovo = validacao.name;
    await db.transaction("rw", [db.paymentMethods, db.lancamentos, db.contasPagar], async () => {
      await db.paymentMethods.update(editandoId, { name: nomeNovo });
      await db.lancamentos
        .filter((l) => l.formaPagamento === nomeAntigo)
        .modify({ formaPagamento: nomeNovo });
      await db.contasPagar
        .filter((c) => c.formaPagamento === nomeAntigo)
        .modify({ formaPagamento: nomeNovo });
    });
    setEditandoId(null);
  };

  const excluir = (id: number, name: string) => {
    const emUso = countPaymentMethodUsage(name, { lancamentos, contasPagar });
    if (emUso > 0) {
      setErroExcluir(`Em uso por ${emUso} ${emUso === 1 ? "registro" : "registros"}: "${name}". Exclusão bloqueada.`);
      return;
    }
    confirmar("Excluir forma de pagamento", `Excluir a forma "${name}"?`, () => void executarExclusao(id));
  };

  const executarExclusao = async (id: number) => {
    setErroExcluir(null);
    await db.paymentMethods.delete(id);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-end mb-3">
        <div>
          <label className="rotulo" htmlFor="forma-nova">
            Nova forma de pagamento
          </label>
          <input
            id="forma-nova"
            className="entrada"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
          />
        </div>
        <button type="button" className="botao text-sm" onClick={() => void criar()}>
          Adicionar
        </button>
      </div>
      {erroNovo && <p className="text-sm text-[var(--cor-rosa)] mb-2">{erroNovo}</p>}
      {erroExcluir && <p className="text-sm text-[var(--cor-ambar)] mb-2">{erroExcluir}</p>}

      {formas.length > 0 ? (
        <ul className="text-sm divide-y">
          {formas.map((f) => (
            <li key={f.id} className="py-1.5 flex items-center gap-3 flex-wrap">
              {editandoId === f.id ? (
                <>
                  <input
                    aria-label="Nome"
                    className="entrada"
                    value={nomeEdit}
                    onChange={(e) => setNomeEdit(e.target.value)}
                  />
                  <button type="button" className="botao text-xs" onClick={() => void salvarEdicao()}>
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="botao botao-secundario text-xs"
                    onClick={() => setEditandoId(null)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-40">{f.name}</span>
                  <button
                    type="button"
                    className="botao botao-secundario text-xs"
                    onClick={() => abrirEdicao(f.id, f.name)}
                  >
                    Renomear {f.name}
                  </button>
                  <button
                    type="button"
                    className="botao botao-secundario text-xs"
                    onClick={() => excluir(f.id, f.name)}
                  >
                    Excluir {f.name}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--cor-texto-suave)]">Nenhuma forma de pagamento cadastrada.</p>
      )}
      {erroEdit && <p className="text-sm text-[var(--cor-rosa)] mt-2">{erroEdit}</p>}
      {dialogo}
    </div>
  );
}
