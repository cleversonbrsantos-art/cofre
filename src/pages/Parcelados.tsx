import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { mesKeyDaFatura } from "../domain/cartoes";
import { avancarMesKey, formatarData, rotuloMesKey } from "../domain/datas";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";
import type { Cartao, CompraParcelada } from "../domain/models";

export function PaginaParcelados() {
  const { confirmar, dialogo } = useConfirm();

  const excluirCompra = (id: number, descricao: string) => {
    confirmar("Excluir compra parcelada", `Excluir a compra "${descricao}"?`, () => void db.parceladas.delete(id));
  };
  const parceladas = useLiveQuery(async () => await db.parceladas.toArray(), []);
  const cartoes = useLiveQuery(async () => await db.cartoes.toArray(), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);
  const hoje = useToday();

  const [criando, setCriando] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [dataCompra, setDataCompra] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [numeroParcelas, setNumeroParcelas] = useState("2");
  const [erro, setErro] = useState<string | null>(null);

  const mesKeyAtual = useMemo(() => {
    return Number(hoje.slice(0, 4) + hoje.slice(5, 7));
  }, [hoje]);

  if (
    parceladas === undefined ||
    cartoes === undefined ||
    categorias === undefined
  ) {
    return <Carregando />;
  }

  const cartaoFallback: Cartao = { id: 0, nome: "", limite: 0, diaFechamento: 1, diaVencimento: 1 };
  const cartaoDe = (id: number): Cartao => cartoes.find((c) => c.id === id) ?? cartaoFallback;
  const nomeCartao = (id: number) => cartoes.find((c) => c.id === id)?.nome ?? "—";
  const nomeCategoria = (id: number | null) =>
    id === null ? "Sem categoria" : (categorias.find((c) => c.id === id)?.nome ?? "Sem categoria");

  /** Soma das parcelas que caem em um mês-chave. */
  const parcelasNoMes = (mk: number): number => {
    let total = 0;
    for (const p of parceladas) {
      const parcelaBase = Math.floor(p.valorTotal / p.numeroParcelas);
      const diferenca = p.valorTotal - parcelaBase * p.numeroParcelas;
      const primeira = mesKeyDaFatura(p.dataCompra, cartaoDe(p.cartaoId));
      for (let j = 0; j < p.numeroParcelas; j++) {
        if (avancarMesKey(primeira, j) === mk) {
          total += j === 0 ? parcelaBase + diferenca : parcelaBase;
        }
      }
    }
    return total;
  };

  const projecao = Array.from({ length: 12 }, (_, i) => {
    const mk = avancarMesKey(mesKeyAtual, i);
    return { mesKey: mk, mes: rotuloMesKey(mk), total: parcelasNoMes(mk) };
  });

  const salvar = async () => {
    const valor = textoParaCentavos(valorTotal);
    const n = Number(numeroParcelas);
    if (descricao.trim() === "") {
      setErro("Informe a descrição da compra.");
      return;
    }
    if (cartaoId === "") {
      setErro("Escolha o cartão.");
      return;
    }
    if (dataCompra === "") {
      setErro("Informe a data da compra.");
      return;
    }
    if (valor === null || valor <= 0) {
      setErro("Informe um valor total maior que zero.");
      return;
    }
    if (!(n >= 2 && n <= 72)) {
      setErro("O número de parcelas deve estar entre 2 e 72.");
      return;
    }
    await db.parceladas.add({
      descricao: descricao.trim(),
      cartaoId: Number(cartaoId),
      categoriaId: categoriaId === "" ? null : Number(categoriaId),
      dataCompra,
      valorTotal: valor,
      numeroParcelas: n,
    });
    setCriando(false);
    setDescricao("");
    setValorTotal("");
    setNumeroParcelas("2");
    setErro(null);
  };

  const ultimaFatura = (p: CompraParcelada): number =>
    avancarMesKey(mesKeyDaFatura(p.dataCompra, cartaoDe(p.cartaoId)), p.numeroParcelas - 1);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Compras parceladas</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">
            Registre a compra uma única vez — as parcelas entram automaticamente nas faturas
          </p>
        </div>
        <button type="button" className="botao botao-primario" onClick={() => setCriando(true)}>
          Nova compra parcelada
        </button>
      </div>

      <div
        className="cartao p-3 mb-4 text-sm"
        style={{ backgroundColor: "var(--cor-ambar-suave)", color: "var(--cor-ambar)" }}
        role="note"
      >
        Atenção: a compra é registrada apenas aqui, não também em Lançamentos — as parcelas são
        somadas às despesas do mês da fatura automaticamente.
      </div>

      {parceladas.length === 0 ? (
        <EstadoVazio
          mensagem="Nenhuma compra parcelada cadastrada."
          acao={
            <button type="button" className="botao botao-primario" onClick={() => setCriando(true)}>
              Registrar a primeira compra
            </button>
          }
        />
      ) : (
        <div className="cartao overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">Descrição</th>
                <th className="py-2 px-3">Cartão</th>
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3">Compra</th>
                <th className="py-2 px-3 text-right">Total</th>
                <th className="py-2 px-3 text-right">Parcela</th>
                <th className="py-2 px-3">Faturas</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {parceladas.map((p) => {
                const parcelaBase = Math.floor(p.valorTotal / p.numeroParcelas);
                const diferenca = p.valorTotal - parcelaBase * p.numeroParcelas;
                return (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{p.descricao}</td>
                    <td className="py-2 px-3 text-[var(--cor-texto-suave)]">{nomeCartao(p.cartaoId)}</td>
                    <td className="py-2 px-3 text-[var(--cor-texto-suave)]">{nomeCategoria(p.categoriaId)}</td>
                    <td className="py-2 px-3 num whitespace-nowrap">{formatarData(p.dataCompra)}</td>
                    <td className="py-2 px-3 text-right num">{formatarBRL(p.valorTotal)}</td>
                    <td className="py-2 px-3 text-right num">
                      {formatarBRL(parcelaBase)}
                      {diferenca > 0 && (
                        <span className="text-xs text-[var(--cor-texto-suave)]">
                          {" "}(1ª com +{formatarBRL(diferenca)})
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 num text-[var(--cor-texto-suave)] whitespace-nowrap">
                      {p.numeroParcelas}× · {rotuloMesKey(mesKeyDaFatura(p.dataCompra, cartaoDe(p.cartaoId)))} a{" "}
                      {rotuloMesKey(ultimaFatura(p))}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        className="botao botao-secundario text-xs"
                        style={{ color: "var(--cor-rosa)" }}
                        onClick={() => excluirCompra(p.id, p.descricao)}
                        aria-label={`Excluir compra ${p.descricao}`}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {parceladas.length > 0 && (
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">Projeção das parcelas (12 meses)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                  <th className="py-1 px-2">Mês</th>
                  <th className="py-1 px-2 text-right">Parcelas do mês</th>
                </tr>
              </thead>
              <tbody>
                {projecao.map((linha) => (
                  <tr key={linha.mesKey} className="border-b last:border-0">
                    <td className="py-1 px-2">{linha.mes}</td>
                    <td className="py-1 px-2 text-right num">
                      {linha.total > 0 ? formatarBRL(linha.total) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {criando && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={() => setCriando(false)}>
          <div
            className="w-full max-w-md bg-[var(--cor-superficie)] h-full overflow-y-auto p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Nova compra parcelada"
          >
            <h2 className="font-semibold mb-3">Nova compra parcelada</h2>
            {erro && (
              <p className="text-sm mb-2" style={{ color: "var(--cor-rosa)" }} role="alert">
                {erro}
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="rotulo" htmlFor="pcp-desc">Descrição</label>
                <input id="pcp-desc" className="entrada" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div>
                <label className="rotulo" htmlFor="pcp-cartao">Cartão</label>
                <select id="pcp-cartao" className="entrada" value={cartaoId} onChange={(e) => setCartaoId(e.target.value)}>
                  <option value="">—</option>
                  {cartoes.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="rotulo" htmlFor="pcp-cat">Categoria</label>
                <select id="pcp-cat" className="entrada" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.grupo} · {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="rotulo" htmlFor="pcp-data">Data da compra</label>
                <input
                  id="pcp-data"
                  type="date"
                  className="entrada"
                  value={dataCompra === "" ? hoje : dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rotulo" htmlFor="pcp-valor">Valor total</label>
                  <input
                    id="pcp-valor"
                    className="entrada num"
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="rotulo" htmlFor="pcp-n">Nº de parcelas</label>
                  <input
                    id="pcp-n"
                    type="number"
                    min={2}
                    max={72}
                    className="entrada num"
                    value={numeroParcelas}
                    onChange={(e) => setNumeroParcelas(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="botao botao-secundario" onClick={() => setCriando(false)}>
                  Cancelar
                </button>
                <button type="button" className="botao botao-primario" onClick={() => void salvar()}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {dialogo}
    </section>
  );
}
