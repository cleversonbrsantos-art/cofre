import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, Erro, EstadoVazio } from "../components/PaginaVazia";
import { FiltrosLancamentos } from "./FiltrosLancamentos";
import {
  FormularioLancamento,
} from "../components/FormularioLancamento";
import {
  valoresIniciais,
  type ValoresFormulario,
} from "../components/valoresFormulario";
import type { Lancamento } from "../domain/models";
import { formatarBRL } from "../domain/dinheiro";
import { formatarData, mesKeyDe } from "../domain/datas";
import { somarFluxo, tipoEfeito } from "../domain/lancamentos";

type ColunaOrdem = "data" | "descricao" | "valor";
type Direcao = "asc" | "desc";

export function PaginaLancamentos() {
  const { confirmar, dialogo } = useConfirm();
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);
  const contas = useLiveQuery(async () => await db.contas.toArray(), []);
  const cartoes = useLiveQuery(async () => await db.cartoes.toArray(), []);
  const formas = useLiveQuery(async () => (await db.paymentMethods.toArray()).map((f) => f.name), []);
  const hoje = useToday();
  const config = useLiveQuery(async () => await db.configuracao.get(1), []);

  const [busca, setBusca] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroConta, setFiltroConta] = useState("");
  const [filtroCartao, setFiltroCartao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [ordem, setOrdem] = useState<ColunaOrdem>("data");
  const [direcao, setDirecao] = useState<Direcao>("desc");
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [criando, setCriando] = useState(false);
  const [erros, setErros] = useState<string | null>(null);

  const mapaCategorias = useMemo(
    () => new Map((categorias ?? []).map((c) => [c.id, c])),
    [categorias],
  );

  if (
    lancamentos === undefined ||
    categorias === undefined ||
    contas === undefined ||
    cartoes === undefined ||
    config === undefined
  ) {
    return <Carregando />;
  }

  const limiteDestaque = config.limiteDestaque;

  const filtrados = lancamentos
    .filter((l) => {
      if (busca !== "" && !l.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroMes !== "" && mesKeyDe(l.data) !== Number(filtroMes)) return false;
      if (filtroCategoria !== "") {
        const valor = filtroCategoria === "null" ? null : Number(filtroCategoria);
        if (l.categoriaId !== valor) return false;
      }
      if (filtroConta !== "") {
        const valor = filtroConta === "null" ? null : Number(filtroConta);
        if (l.contaId !== valor) return false;
      }
      if (filtroCartao !== "") {
        const valor = filtroCartao === "null" ? null : Number(filtroCartao);
        if (l.cartaoId !== valor) return false;
      }
      if (filtroStatus !== "" && l.status !== filtroStatus) return false;
      if (filtroTipo !== "") {
        const tipo = tipoEfeito(l, mapaCategorias);
        if (filtroTipo === "Receita" && tipo !== "Receita") return false;
        if (filtroTipo === "Despesa" && tipo !== "Despesa") return false;
        if (filtroTipo === "Poupança" && tipo !== "Poupança") return false;
        if (filtroTipo === "Transferência" && tipo !== "Transferência") return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (ordem === "data") cmp = a.data.localeCompare(b.data);
      else if (ordem === "descricao") cmp = a.descricao.localeCompare(b.descricao);
      else cmp = a.valor - b.valor;
      return direcao === "asc" ? cmp : -cmp;
    });

  const fluxo = somarFluxo(filtrados, mapaCategorias);
  const pendente = filtrados
    .filter((l) => l.status === "Pendente")
    .reduce((s, l) => s + (tipoEfeito(l, mapaCategorias) === "Receita" ? l.valor : 0), 0);
  const pendenteDespesas = filtrados
    .filter((l) => l.status === "Pendente" && tipoEfeito(l, mapaCategorias) !== "Receita")
    .reduce((s, l) => s + l.valor, 0);
  const pendenteLiquido = pendente - pendenteDespesas;

  const nomeCategoria = (id: number | null) =>
    id === null ? "Sem categoria" : (mapaCategorias.get(id)?.nome ?? "Sem categoria");
  const nomeConta = (id: number | null) => contas.find((c) => c.id === id)?.nome ?? "—";
  const nomeCartao = (id: number | null) => cartoes.find((c) => c.id === id)?.nome ?? "—";

  const ordenar = (coluna: ColunaOrdem) => {
    if (ordem === coluna) setDirecao(direcao === "asc" ? "desc" : "asc");
    else {
      setOrdem(coluna);
      setDirecao("desc");
    }
  };

  const salvar = async (valores: ValoresFormulario) => {
    try {
      if (valores.valorCentavos === null) return;
      if (editando) {
        await db.lancamentos.put({ ...editando, ...valores, valor: valores.valorCentavos });
      } else {
        const registro: Omit<Lancamento, "id"> = { ...valores, valor: valores.valorCentavos };
        await db.lancamentos.add(registro);
      }
      setEditando(null);
      setCriando(false);
      setErros(null);
    } catch (e) {
      setErros(e instanceof Error ? e.message : "Erro ao salvar lançamento.");
    }
  };

  const excluir = (id: number, descricao: string) => {
    confirmar("Excluir lançamento", `Excluir o lançamento "${descricao}"?`, () => void executarExclusao(id));
  };

  const executarExclusao = async (id: number) => {
    await db.lancamentos.delete(id);
    setEditando(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Lançamentos</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">
            {filtrados.length} de {lancamentos.length} lançamentos
          </p>
        </div>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => {
            setCriando(true);
            setEditando(null);
          }}
        >
          Novo lançamento
        </button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Receitas</p>
          <p className="num font-semibold" style={{ color: "var(--cor-verde)" }}>
            {formatarBRL(fluxo.receitas)}
          </p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Despesas</p>
          <p className="num font-semibold" style={{ color: "var(--cor-rosa)" }}>
            {formatarBRL(fluxo.despesas + fluxo.poupanca)}
          </p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Poupança e investimentos</p>
          <p className="num font-semibold">{formatarBRL(fluxo.poupanca)}</p>
        </div>
        <div className="cartao p-3">
          <p className="text-xs text-[var(--cor-texto-suave)]">Pendente</p>
          <p className="num font-semibold" style={{ color: "var(--cor-ambar)" }}>
            {formatarBRL(pendenteLiquido)}
          </p>
        </div>
      </div>

      <FiltrosLancamentos
        busca={busca} setBusca={setBusca}
        filtroMes={filtroMes} setFiltroMes={setFiltroMes}
        filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria}
        filtroConta={filtroConta} setFiltroConta={setFiltroConta}
        filtroCartao={filtroCartao} setFiltroCartao={setFiltroCartao}
        filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
        filtroTipo={filtroTipo} setFiltroTipo={setFiltroTipo}
        categorias={categorias} contas={contas} cartoes={cartoes}
      />

      {erros && (
        <Erro mensagem={erros} />
      )}

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <EstadoVazio
          mensagem="Nenhum lançamento encontrado com esses filtros."
          acao={
            <button type="button" className="botao botao-primario" onClick={() => setCriando(true)}>
              Criar o primeiro lançamento
            </button>
          }
        />
      ) : (
        <div className="cartao overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3 cursor-pointer" onClick={() => ordenar("data")}>
                  Data {ordem === "data" && (direcao === "asc" ? "↑" : "↓")}
                </th>
                <th className="py-2 px-3 cursor-pointer" onClick={() => ordenar("descricao")}>
                  Descrição {ordem === "descricao" && (direcao === "asc" ? "↑" : "↓")}
                </th>
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3">Conta/Cartão</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right cursor-pointer" onClick={() => ordenar("valor")}>
                  Valor {ordem === "valor" && (direcao === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => {
                const tipo = tipoEfeito(l, mapaCategorias);
                const cor =
                  tipo === "Receita"
                    ? "var(--cor-verde)"
                    : tipo === "Transferência"
                      ? "var(--cor-texto-suave)"
                      : "var(--cor-texto)";
                const destacado = l.valor > limiteDestaque && tipo !== "Receita";
                return (
                  <tr
                    key={l.id}
                    className="border-b last:border-0 hover:bg-[var(--cor-superficie-alt)] cursor-pointer transition-colors"
                    onClick={() => {
                      setEditando(l);
                      setCriando(false);
                    }}
                  >
                    <td className="py-2 px-3 num whitespace-nowrap">{formatarData(l.data)}</td>
                    <td className="py-2 px-3">
                      {l.descricao}
                      {l.parcela && (
                        <span className="text-xs text-[var(--cor-texto-suave)] ml-1">{l.parcela}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[var(--cor-texto-suave)]">{nomeCategoria(l.categoriaId)}</td>
                    <td className="py-2 px-3 text-[var(--cor-texto-suave)]">
                      {l.cartaoId !== null ? nomeCartao(l.cartaoId) : nomeConta(l.contaId)}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`etiqueta ${l.status === "Pendente" ? "etiqueta-ambar" : "etiqueta-verde"}`}>
                        {l.status}
                      </span>
                    </td>
                    <td
                      className={`py-2 px-3 text-right num ${destacado ? "font-bold" : ""}`}
                      style={{ color: cor }}
                      title={destacado ? "Valor acima do limite de destaque" : undefined}
                    >
                      {tipo === "Receita" ? "+" : tipo === "Transferência" ? "" : "−"}
                      {formatarBRL(l.valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Painel lateral de criação/edição */}
      {(criando || editando !== null) && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={() => { setCriando(false); setEditando(null); }}>
          <div
            className="w-full max-w-md bg-[var(--cor-superficie)] h-full overflow-y-auto p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={editando ? "Editar lançamento" : "Novo lançamento"}
          >
            <h2 className="font-semibold mb-3">
              {editando ? "Editar lançamento" : "Novo lançamento"}
            </h2>
            <FormularioLancamento
              formas={formas ?? undefined}
              valorInicial={
                editando
                  ? {
                      data: editando.data,
                      descricao: editando.descricao,
                      categoriaId: editando.categoriaId,
                      valorCentavos: editando.valor,
                      contaId: editando.contaId,
                      formaPagamento: editando.formaPagamento,
                      cartaoId: editando.cartaoId,
                      parcela: editando.parcela,
                      status: editando.status,
                      contaDestinoId: editando.contaDestinoId,
                      observacao: editando.observacao,
                    }
                  : valoresIniciais(hoje)
              }
              categorias={categorias}
              contas={contas}
              cartoes={cartoes}
              onSubmit={(v) => void salvar(v)}
              onCancel={() => {
                setCriando(false);
                setEditando(null);
              }}
              rotuloSubmit="Salvar"
            />
            {editando && (
              <button
                type="button"
                className="botao botao-secundario w-full mt-3"
                style={{ color: "var(--cor-rosa)" }}
                onClick={() => excluir(editando.id, editando.descricao)}
              >
                Excluir lançamento
              </button>
            )}
          </div>
        </div>
      )}
      {dialogo}
    </section>
  );
}
