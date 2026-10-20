import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useConfirm } from "../hooks/useConfirm";
import { useToday } from "../hooks/useToday";
import { RecorrentesPrevisao } from "./RecorrentesPrevisao";
import { Carregando, EstadoVazio } from "../components/PaginaVazia";
import { calcularPrevisao } from "../domain/recorrentes";
import { calcularSaldos } from "../domain/contas";
import { mesKeyDaFatura } from "../domain/cartoes";
import { avancarMesKey, rotuloMesKey } from "../domain/datas";
import { formatarBRL, textoParaCentavos } from "../domain/dinheiro";
import type { Categoria, Cartao, Recorrente } from "../domain/models";
import { tipoDoGrupo } from "../domain/types";

interface FormularioRecorrente {
  descricao: string;
  categoriaId: string;
  valor: string;
  diaMes: string;
  inicio: string;
  fim: string;
  editandoId: number | null;
}

const FORM_INICIAL: FormularioRecorrente = {
  descricao: "",
  categoriaId: "",
  valor: "",
  diaMes: "1",
  inicio: "",
  fim: "",
  editandoId: null,
};

export function PaginaRecorrentes() {
  const { confirmar, dialogo } = useConfirm();
  const hoje = useToday();
  const recorrentes = useLiveQuery(async () => await db.recorrentes.toArray(), []);
  const categorias = useLiveQuery(async () => await db.categorias.toArray(), []);
  const parceladas = useLiveQuery(async () => await db.parceladas.toArray(), []);
  const contas = useLiveQuery(async () => await db.contas.toArray(), []);
  const lancamentos = useLiveQuery(async () => await db.lancamentos.toArray(), []);
  const cartoes = useLiveQuery(async () => await db.cartoes.toArray(), []);

  const mesKeyAtual = useMemo(() => {
    return Number(hoje.slice(0, 4) + hoje.slice(5, 7));
  }, [hoje]);

  const [form, setForm] = useState<FormularioRecorrente>(FORM_INICIAL);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  if (
    recorrentes === undefined ||
    categorias === undefined ||
    parceladas === undefined ||
    contas === undefined ||
    lancamentos === undefined ||
    cartoes === undefined
  ) {
    return <Carregando />;
  }

  const mapaCat = new Map<number, Categoria>(categorias.map((c) => [c.id, c]));
  const resumo = calcularSaldos(contas, lancamentos, mapaCat);
  const caixaAtual = resumo
    .filter((s) => s.conta.tipo === "Corrente" || s.conta.tipo === "Carteira" || s.conta.tipo === "Dinheiro")
    .reduce((total, s) => total + s.saldoAtual, 0);

  const parcelasPorMes = new Map<number, number>();
  const cartaoDe = (id: number): Cartao | undefined => cartoes.find((c) => c.id === id);
  for (const p of parceladas) {
    const cartao = cartaoDe(p.cartaoId);
    const primeira = cartao
      ? mesKeyDaFatura(p.dataCompra, cartao)
      : Number(p.dataCompra.slice(0, 4) + p.dataCompra.slice(5, 7));
    const base = Math.floor(p.valorTotal / p.numeroParcelas);
    const diferenca = p.valorTotal - base * p.numeroParcelas;
    for (let j = 0; j < p.numeroParcelas; j++) {
      const mk = avancarMesKey(primeira, j);
      parcelasPorMes.set(mk, (parcelasPorMes.get(mk) ?? 0) + (j === 0 ? base + diferenca : base));
    }
  }

  const previsao = calcularPrevisao(mesKeyAtual, recorrentes, mapaCat, parcelasPorMes, caixaAtual);

  const salvar = async () => {
    const valor = textoParaCentavos(form.valor);
    const dia = Number(form.diaMes);
    if (form.descricao.trim() === "") {
      setErroForm("Informe a descrição.");
      return;
    }
    if (valor === null || valor <= 0) {
      setErroForm("Informe um valor maior que zero.");
      return;
    }
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      setErroForm("Dia do mês deve estar entre 1 e 31.");
      return;
    }
    if (form.editandoId !== null) {
      await db.recorrentes.update(form.editandoId, {
        descricao: form.descricao.trim(),
        categoriaId: form.categoriaId === "" ? null : Number(form.categoriaId),
        valorMensal: valor,
        diaMes: dia,
        inicio: form.inicio === "" ? null : form.inicio,
        fim: form.fim === "" ? null : form.fim,
      });
    } else {
      await db.recorrentes.add({
        descricao: form.descricao.trim(),
        categoriaId: form.categoriaId === "" ? null : Number(form.categoriaId),
        valorMensal: valor,
        diaMes: dia,
        inicio: form.inicio === "" ? null : form.inicio,
        fim: form.fim === "" ? null : form.fim,
      });
    }
    setForm(FORM_INICIAL);
    setMostrarForm(false);
    setErroForm(null);
  };

  const editar = (r: Recorrente) => {
    setForm({
      descricao: r.descricao,
      categoriaId: r.categoriaId === null ? "" : String(r.categoriaId),
      valor: (r.valorMensal / 100).toFixed(2).replace(".", ","),
      diaMes: String(r.diaMes),
      inicio: r.inicio ?? "",
      fim: r.fim ?? "",
      editandoId: r.id,
    });
    setMostrarForm(true);
    setErroForm(null);
  };

  const excluir = (id: number, nome: string) => {
    confirmar("Excluir recorrente", `Excluir a recorrência "${nome}"?`, () => void executarExclusao(id));
  };

  const executarExclusao = async (id: number) => {
    await db.recorrentes.delete(id);
  };

  const dadosGrafico = previsao.meses.map((m) => ({
    mes: rotuloMesKey(m.mesKey).replace(" de ", "/"),
    "Saldo do mês": m.saldoMes / 100,
    "Caixa projetado": m.caixaProjetado / 100,
  }));

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Recorrentes</h1>
          <p className="text-sm text-[var(--cor-texto-suave)]">
            Previsão de 12 meses a partir de {rotuloMesKey(mesKeyAtual)} · Caixa disponível hoje:{" "}
            <span className="num">{formatarBRL(caixaAtual)}</span>
          </p>
        </div>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => setMostrarForm((aberto) => !aberto)}
          aria-expanded={mostrarForm}
        >
          {mostrarForm ? "Fechar formulário" : "Nova recorrente"}
        </button>
      </div>

      {mostrarForm && (
        <div className="cartao p-4 mb-4" data-testid="formulario-recorrente">
          <h2 className="font-semibold text-sm mb-3">
            {form.editandoId === null ? "Nova recorrente" : "Editar recorrente"}
          </h2>
          {erroForm && (
            <p className="text-sm mb-3" style={{ color: "var(--cor-rosa)" }} role="alert">
              {erroForm}
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="rotulo" htmlFor="rec-descricao">Descrição</label>
              <input
                id="rec-descricao"
                className="entrada"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div>
              <label className="rotulo" htmlFor="rec-valor">Valor mensal (R$)</label>
              <input
                id="rec-valor"
                className="entrada num"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="rotulo" htmlFor="rec-categoria">Categoria</label>
              <select
                id="rec-categoria"
                className="entrada"
                value={form.categoriaId}
                onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
              >
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nome} ({tipoDoGrupo(c.grupo)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="rec-dia">Dia do mês (1–31)</label>
              <input
                id="rec-dia"
                className="entrada num"
                type="number"
                min={1}
                max={31}
                value={form.diaMes}
                onChange={(e) => setForm({ ...form, diaMes: e.target.value })}
              />
            </div>
            <div>
              <label className="rotulo" htmlFor="rec-inicio">Início (opcional)</label>
              <input
                id="rec-inicio"
                className="entrada"
                type="date"
                value={form.inicio}
                onChange={(e) => setForm({ ...form, inicio: e.target.value })}
              />
            </div>
            <div>
              <label className="rotulo" htmlFor="rec-fim">Fim (opcional)</label>
              <input
                id="rec-fim"
                className="entrada"
                type="date"
                value={form.fim}
                onChange={(e) => setForm({ ...form, fim: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="botao botao-primario" onClick={() => void salvar()}>
              Salvar recorrente
            </button>
            <button
              type="button"
              className="botao botao-secundario"
              onClick={() => {
                setForm(FORM_INICIAL);
                setMostrarForm(false);
                setErroForm(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {recorrentes.length === 0 && (
        <EstadoVazio
          mensagem="Nenhuma recorrente cadastrada. Cadastre salário, aluguel, assinaturas e outros valores que se repetem todo mês."
        />
      )}

      <RecorrentesPrevisao dadosGrafico={dadosGrafico} previsao={previsao} />

      {/* Lista de recorrentes */}
      {recorrentes.length > 0 && (
        <div className="cartao p-4">
          <h2 className="font-semibold text-sm mb-3">Recorrentes cadastradas</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--cor-texto-suave)] border-b">
                <th className="py-2 px-3">Descrição</th>
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3 text-right">Valor mensal</th>
                <th className="py-2 px-3">Dia do mês</th>
                <th className="py-2 px-3">Vigência</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {recorrentes.map((r) => {
                const cat = r.categoriaId === null ? undefined : mapaCat.get(r.categoriaId);
                const tipo = cat ? tipoDoGrupo(cat.grupo) : "Despesa";
                const vigencia = r.inicio || r.fim
                  ? `${r.inicio ?? "—"} até ${r.fim ?? "—"}`
                  : "Sem prazo";
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-1.5 px-3">{r.descricao}</td>
                    <td className="py-1.5 px-3">{cat ? `${cat.nome} (${tipo})` : "Sem categoria"}</td>
                    <td className="py-1.5 px-3 text-right num">{formatarBRL(r.valorMensal)}</td>
                    <td className="py-1.5 px-3">{r.diaMes}</td>
                    <td className="py-1.5 px-3">{vigencia}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="botao botao-secundario text-xs"
                          onClick={() => editar(r)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="botao botao-secundario text-xs"
                          onClick={() => excluir(r.id, r.descricao)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {dialogo}
    </section>
  );
}
