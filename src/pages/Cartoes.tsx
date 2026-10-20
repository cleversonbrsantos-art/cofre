import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularFatura, projetarParcelas } from "../domain/cartoes";
import { countCardReferences } from "../domain/referentialIntegrity";
import { rotuloMesKey } from "../domain/datas";
import { formatarBRL, textoParaCentavos, centavosParaTexto } from "../domain/dinheiro";
import type { Cartao } from "../domain/models";

export function PaginaCartoes() {
  const { confirmar, dialogo } = useConfirm();
  const hoje = useToday();
  const cartoes = useLiveQuery(async () => await db.cartoes.toArray(), []);
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const parceladas = useLiveQuery(async () => await db.parceladas.toArray(), []);

  const [editando, setEditando] = useState<Cartao | null>(null);
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState("");
  const [fechamento, setFechamento] = useState("1");
  const [vencimento, setVencimento] = useState("10");
  const [erro, setErro] = useState<string | null>(null);

  const mesKeyAtual = useMemo(() => {
    return Number(hoje.slice(0, 4) + hoje.slice(5, 7));
  }, [hoje]);

  if (
    cartoes === undefined ||
    lancamentos === undefined ||
    parceladas === undefined
  ) {
    return <Carregando />;
  }

  const faturas = cartoes.map((c) => calcularFatura(c, mesKeyAtual, lancamentos, parceladas));

  const dadosGrafico = cartoes.length > 0
    ? (() => {
        const projetoes = cartoes.map((c) => projetarParcelas(c, mesKeyAtual, parceladas));
        return projetoes[0].map((_, i) => {
          const linha: Record<string, string | number> = {
            mes: rotuloMesKey(projetoes[0][i].mesKey),
          };
          cartoes.forEach((c, ci) => {
            linha[c.nome] = projetoes[ci][i].valor / 100;
          });
          return linha;
        });
      })()
    : [];

  const abrirNova = () => {
    setEditando(null);
    setCriando(true);
    setNome("");
    setLimite("");
    setFechamento("1");
    setVencimento("10");
    setErro(null);
  };

  const abrirEdicao = (cartao: Cartao) => {
    setCriando(false);
    setEditando(cartao);
    setNome(cartao.nome);
    setLimite(centavosParaTexto(cartao.limite));
    setFechamento(String(cartao.diaFechamento));
    setVencimento(String(cartao.diaVencimento));
    setErro(null);
  };

  const excluirCartao = (cartao: Cartao) => {
    const refs = countCardReferences(cartao.id, { lancamentos, parceladas });
    const partes: string[] = [];
    if (refs.lancamentos > 0)
      partes.push(`${refs.lancamentos} ${refs.lancamentos === 1 ? "lançamento" : "lançamentos"}`);
    if (refs.parceladas > 0)
      partes.push(`${refs.parceladas} ${refs.parceladas === 1 ? "parcelada" : "parceladas"}`);
    if (partes.length > 0) {
      let msg = `Em uso por ${partes[0]}`;
      for (const parte of partes.slice(1)) msg += ` (e ${parte})`;
      setErro(msg + ".");
      return;
    }
    confirmar("Excluir cartão", `Excluir o cartão "${cartao.nome}"?`, () => void executarExclusao(cartao.id));
  };

  const executarExclusao = async (id: number) => {
    await db.cartoes.delete(id);
    setEditando(null);
  };

  const salvar = async () => {
    const limiteCentavos = textoParaCentavos(limite) ?? 0;
    const diaF = Number(fechamento);
    const diaV = Number(vencimento);
    if (nome.trim() === "") {
      setErro("Informe o nome do cartão.");
      return;
    }
    if (!(diaF >= 1 && diaF <= 28 && diaV >= 1 && diaV <= 28)) {
      setErro("Fechamento e vencimento devem ser dias de 1 a 28.");
      return;
    }
    if (editando) {
      await db.cartoes.put({ ...editando, nome: nome.trim(), limite: limiteCentavos, diaFechamento: diaF, diaVencimento: diaV });
    } else {
      await db.cartoes.add({ nome: nome.trim(), limite: limiteCentavos, diaFechamento: diaF, diaVencimento: diaV });
    }
    setCriando(false);
    setEditando(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Cartões</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">
            Faturas do mês de referência e projeção de parcelas
          </p>
        </div>
        <button type="button" className="botao botao-primario" onClick={abrirNova}>
          Novo cartão
        </button>
      </div>

      {cartoes.length === 0 ? (
        <EstadoVazio
          mensagem="Nenhum cartão cadastrado."
          acao={
            <button type="button" className="botao botao-primario" onClick={abrirNova}>
              Criar o primeiro cartão
            </button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          {faturas.map((f) => (
            <button
              key={f.cartao.id}
              type="button"
              className="cartao p-4 text-left hover:shadow-md transition-shadow"
              onClick={() => abrirEdicao(f.cartao)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{f.cartao.nome}</p>
                  <p className="text-xs text-[var(--cor-texto-suave)] num">
                    Fecha dia {f.cartao.diaFechamento} · vence dia {f.cartao.diaVencimento}
                  </p>
                </div>
                <span
                  className={`etiqueta num ${
                    f.percentualLimite > 80 ? "etiqueta-rosa" : f.percentualLimite > 50 ? "etiqueta-ambar" : "etiqueta-verde"
                  }`}
                >
                  {f.percentualLimite.toFixed(0)}% do limite
                </span>
              </div>
              <p className="num text-lg font-semibold mt-2">{formatarBRL(f.fatura)}</p>
              <div className="text-xs text-[var(--cor-texto-suave)] num mt-1 space-y-0.5">
                <p>
                  Ciclo {f.ciclo.inicio.slice(8)}/{f.ciclo.inicio.slice(5, 7)} a{" "}
                  {f.ciclo.fim.slice(8)}/{f.ciclo.fim.slice(5, 7)} · vence {f.ciclo.vencimento.slice(8)}/{f.ciclo.vencimento.slice(5, 7)}
                </p>
                <p>Compras do ciclo: {formatarBRL(f.comprasDoCiclo)}</p>
                <p>Parcelas do mês: {formatarBRL(f.parcelasDoMes)}</p>
                <p>Parcelas futuras: {formatarBRL(f.parcelasFuturas)}</p>
                <p>Limite livre estimado: {formatarBRL(f.limiteLivre)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Gráfico de parcelas comprometidas (gráfico 7) */}
      {cartoes.length > 0 && (
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">Parcelas comprometidas por mês (12 meses)</h2>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$ ${v}`} />
                <Tooltip
                  formatter={(valor) => formatarBRL(Number(valor) * 100)}
                  contentStyle={{ background: "var(--cor-superficie)", border: "1px solid var(--cor-borda)" }}
                />
                {cartoes.map((c, i) => (
                  <Bar
                    key={c.id}
                    dataKey={c.nome}
                    fill={i === 0 ? "var(--cor-destaque)" : "var(--cor-ambar)"}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Painel de criação/edição */}
      {(criando || editando !== null) && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={() => { setCriando(false); setEditando(null); }}>
          <div
            className="w-full max-w-md bg-[var(--cor-superficie)] h-full overflow-y-auto p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={editando ? "Editar cartão" : "Novo cartão"}
          >
            <h2 className="font-semibold mb-3">{editando ? "Editar cartão" : "Novo cartão"}</h2>
            {erro && (
              <p className="text-sm mb-2" style={{ color: "var(--cor-rosa)" }} role="alert">
                {erro}
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="rotulo" htmlFor="crd-nome">Nome</label>
                <input id="crd-nome" className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <label className="rotulo" htmlFor="crd-limite">Limite</label>
                <input
                  id="crd-limite"
                  className="entrada num"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rotulo" htmlFor="crd-fech">Dia de fechamento</label>
                  <input
                    id="crd-fech"
                    type="number"
                    min={1}
                    max={28}
                    className="entrada num"
                    value={fechamento}
                    onChange={(e) => setFechamento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="rotulo" htmlFor="crd-venc">Dia de vencimento</label>
                  <input
                    id="crd-venc"
                    type="number"
                    min={1}
                    max={28}
                    className="entrada num"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                  />
                </div>
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
                  onClick={() => excluirCartao(editando)}
                >
                  Excluir cartão
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
