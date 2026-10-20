import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularSaldos, resumirContas } from "../domain/contas";
import { countAccountReferences } from "../domain/referentialIntegrity";
import { formatarBRL, textoParaCentavos, centavosParaTexto } from "../domain/dinheiro";
import type { Conta, TipoConta } from "../domain/models";

const TIPOS: TipoConta[] = ["Corrente", "Poupança", "Carteira", "Investimentos", "Dinheiro", "Outro"];

export function PaginaContas() {
  const { confirmar, dialogo } = useConfirm();
  const contas = useLiveQuery(async () => await db.contas.toArray(), []);
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);
  const reserva = useLiveQuery(async () => (await db.reservaConfig.toArray())[0] ?? null, []);
  const [editando, setEditando] = useState<Conta | null>(null);
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoConta>("Corrente");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [saldoExtrato, setSaldoExtrato] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const mapaCategorias = useMemo(
    () => new Map((categorias ?? []).map((c) => [c.id, c])),
    [categorias],
  );

  if (contas === undefined || lancamentos === undefined || categorias === undefined || reserva === undefined) {
    return <Carregando />;
  }

  const saldos = calcularSaldos(contas, lancamentos, mapaCategorias);
  const resumo = resumirContas(saldos);

  const abrirNova = () => {
    setEditando(null);
    setCriando(true);
    setNome("");
    setTipo("Corrente");
    setSaldoInicial("");
    setSaldoExtrato("");
    setErro(null);
  };

  const abrirEdicao = (conta: Conta) => {
    setCriando(false);
    setEditando(conta);
    setNome(conta.nome);
    setTipo(conta.tipo);
    setSaldoInicial(centavosParaTexto(conta.saldoInicial));
    setSaldoExtrato(conta.saldoExtrato === null ? "" : centavosParaTexto(conta.saldoExtrato));
    setErro(null);
  };

  const salvar = async () => {
    const inicial = textoParaCentavos(saldoInicial) ?? 0;
    const extrato = saldoExtrato.trim() === "" ? null : textoParaCentavos(saldoExtrato);
    if (nome.trim() === "") {
      setErro("Informe o nome da conta.");
      return;
    }
    if (editando) {
      await db.contas.put({ ...editando, nome: nome.trim(), tipo, saldoInicial: inicial, saldoExtrato: extrato });
    } else {
      await db.contas.add({ nome: nome.trim(), tipo, saldoInicial: inicial, saldoExtrato: extrato });
    }
    setCriando(false);
    setEditando(null);
  };

  const excluir = (conta: Conta) => {
    const refs = countAccountReferences(conta.id, { lancamentos, reservaConfig: reserva });
    const partes: string[] = [];
    if (refs.lancamentos > 0)
      partes.push(`${refs.lancamentos} ${refs.lancamentos === 1 ? "lançamento" : "lançamentos"}`);
    if (refs.reservaConfig > 0)
      partes.push(`${refs.reservaConfig} ${refs.reservaConfig === 1 ? "reserva de emergência" : "reservas de emergência"}`);
    if (partes.length > 0) {
      let msg = `Em uso por ${partes[0]}`;
      for (const parte of partes.slice(1)) msg += ` (e ${parte})`;
      setErro(msg + ".");
      return;
    }
    confirmar("Excluir conta", `Excluir a conta "${conta.nome}"?`, () => void executarExclusao(conta.id));
  };

  const executarExclusao = async (id: number) => {
    await db.contas.delete(id);
    setEditando(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Contas</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">Saldos atuais e resumo</p>
        </div>
        <button type="button" className="botao botao-primario" onClick={abrirNova}>
          Nova conta
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Saldo total</p>
          <p className="num font-semibold">{formatarBRL(resumo.saldoTotal)}</p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Disponível (corrente/carteira/dinheiro)</p>
          <p className="num font-semibold">{formatarBRL(resumo.disponivel)}</p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Poupança e reservas</p>
          <p className="num font-semibold">{formatarBRL(resumo.poupancaReservas)}</p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Investimentos</p>
          <p className="num font-semibold">{formatarBRL(resumo.investimentos)}</p>
        </div>
      </div>

      {saldos.length === 0 ? (
        <EstadoVazio
          mensagem="Nenhuma conta cadastrada."
          acao={
            <button type="button" className="botao botao-primario" onClick={abrirNova}>
              Criar a primeira conta
            </button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {saldos.map((s) => {
            const percentual =
              resumo.saldoTotal !== 0 ? (s.saldoAtual / resumo.saldoTotal) * 100 : 0;
            return (
              <button
                key={s.conta.id}
                type="button"
                className="cartao p-4 text-left hover:shadow-md transition-shadow"
                onClick={() => abrirEdicao(s.conta)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{s.conta.nome}</p>
                    <p className="text-xs text-[var(--cor-texto-suave)]">{s.conta.tipo}</p>
                  </div>
                  <span className="etiqueta etiqueta-verde num">{percentual.toFixed(1)}%</span>
                </div>
                <p className="num text-lg font-semibold mt-2">{formatarBRL(s.saldoAtual)}</p>
                {s.diferencaExtrato !== null && (
                  <p
                    className="text-xs num mt-1"
                    style={{
                      color: s.diferencaExtrato === 0 ? "var(--cor-verde)" : "var(--cor-ambar)",
                    }}
                  >
                    vs. extrato: {s.diferencaExtrato >= 0 ? "+" : ""}
                    {formatarBRL(s.diferencaExtrato)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Painel de criação/edição */}
      {(criando || editando !== null) && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={() => { setCriando(false); setEditando(null); }}>
          <div
            className="w-full max-w-md bg-[var(--cor-superficie)] h-full overflow-y-auto p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={editando ? "Editar conta" : "Nova conta"}
          >
            <h2 className="font-semibold mb-3">{editando ? "Editar conta" : "Nova conta"}</h2>
            {erro && (
              <p className="text-sm mb-2" style={{ color: "var(--cor-rosa)" }} role="alert">
                {erro}
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="rotulo" htmlFor="cta-nome">
                  Nome
                </label>
                <input id="cta-nome" className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <label className="rotulo" htmlFor="cta-tipo">
                  Tipo
                </label>
                <select id="cta-tipo" className="entrada" value={tipo} onChange={(e) => setTipo(e.target.value as TipoConta)}>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="rotulo" htmlFor="cta-inicial">
                  Saldo inicial
                </label>
                <input
                  id="cta-inicial"
                  className="entrada num"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="rotulo" htmlFor="cta-extrato">
                  Saldo no extrato (opcional)
                </label>
                <input
                  id="cta-extrato"
                  className="entrada num"
                  value={saldoExtrato}
                  onChange={(e) => setSaldoExtrato(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="botao botao-secundario" onClick={() => { setCriando(false); setEditando(null); }}>
                  Cancelar
                </button>
                <button type="button" className="botao botao-primario" onClick={() => void salvar()}>
                  Salvar
                </button>
              </div>
              {editando && (
                <button
                  type="button"
                  className="botao botao-secundario w-full"
                  style={{ color: "var(--cor-rosa)" }}
                  onClick={() => excluir(editando)}
                >
                  Excluir conta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {dialogo}
    </section>
  );
}
