import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { validateCategoryName } from "../domain/categoryRules";
import type { Categoria, CategoriaGrupo } from "../domain/models";
import { useConfirm } from "../hooks/useConfirm";

const GRUPOS: CategoriaGrupo[] = ["Receita", "Necessidade", "Desejo", "Poupança", "Transferência"];

/** Gerência de categorias (C3): criar, renomear, mudar grupo e excluir com confirmação. */
export function CategoriesManager() {
  const categorias = useLiveQuery(async () => await db.categorias.orderBy("nome").toArray(), []);
  const { confirmar, dialogo } = useConfirm();
  const [novoNome, setNovoNome] = useState("");
  const [novoGrupo, setNovoGrupo] = useState<CategoriaGrupo>("Necessidade");
  const [erroNovo, setErroNovo] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdit, setNomeEdit] = useState("");
  const [grupoEdit, setGrupoEdit] = useState<CategoriaGrupo>("Necessidade");
  const [erroEdit, setErroEdit] = useState<string | null>(null);

  if (categorias === undefined) return <p className="text-sm text-[var(--cor-texto-suave)]">Carregando…</p>;

  const criar = async () => {
    const validacao = validateCategoryName(novoNome, categorias);
    if (!validacao.ok) {
      setErroNovo(validacao.error);
      return;
    }
    setErroNovo(null);
    await db.categorias.add({ nome: validacao.name, grupo: novoGrupo });
    setNovoNome("");
  };

  const abrirEdicao = (cat: Categoria) => {
    setEditandoId(cat.id);
    setNomeEdit(cat.nome);
    setGrupoEdit(cat.grupo);
    setErroEdit(null);
  };

  const salvarEdicao = async () => {
    if (editandoId === null) return;
    const original = categorias.find((c) => c.id === editandoId);
    if (!original) return;
    const validacao = validateCategoryName(nomeEdit, categorias, editandoId);
    if (!validacao.ok) {
      setErroEdit(validacao.error);
      return;
    }
    const grupoMudou = grupoEdit !== original.grupo;
    const aplicar = async () => {
      await db.categorias.update(editandoId, { nome: validacao.name, grupo: grupoEdit });
      setEditandoId(null);
    };
    if (grupoMudou) {
      confirmar(
        "Mudar grupo",
        `A categoria "${original.nome}" vai mudar do grupo "${original.grupo}" para "${grupoEdit}". Confirmar?`,
        () => void aplicar(),
        "Confirmar",
      );
    } else {
      await aplicar();
    }
  };

  const excluir = (cat: Categoria) => {
    confirmar("Excluir categoria", `Excluir a categoria "${cat.nome}"?`, () => void executarExclusao(cat));
  };

  const executarExclusao = async (cat: Categoria) => {
    await db.transaction(
      "rw",
      [
        db.categorias,
        db.lancamentos,
        db.parceladas,
        db.contasPagar,
        db.assinaturas,
        db.recorrentes,
        db.orcamentoPlanos,
      ],
      async () => {
        await db.lancamentos.where("categoriaId").equals(cat.id).modify({ categoriaId: null });
        await db.parceladas.filter((p) => p.categoriaId === cat.id).modify({ categoriaId: null });
        await db.contasPagar.filter((c) => c.categoriaId === cat.id).modify({ categoriaId: null });
        await db.assinaturas.filter((a) => a.categoriaId === cat.id).modify({ categoriaId: null });
        await db.recorrentes.filter((r) => r.categoriaId === cat.id).modify({ categoriaId: null });
        await db.orcamentoPlanos.where("categoriaId").equals(cat.id).delete();
        await db.categorias.delete(cat.id);
      },
    );
    if (editandoId === cat.id) setEditandoId(null);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-end mb-3">
        <div>
          <label className="rotulo" htmlFor="cat-nova">
            Nova categoria
          </label>
          <input
            id="cat-nova"
            className="entrada"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
          />
        </div>
        <div>
          <label className="rotulo" htmlFor="cat-nova-grupo">
            Grupo da nova categoria
          </label>
          <select
            id="cat-nova-grupo"
            className="entrada"
            value={novoGrupo}
            onChange={(e) => setNovoGrupo(e.target.value as CategoriaGrupo)}
          >
            {GRUPOS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="botao text-sm" onClick={() => void criar()}>
          Adicionar
        </button>
      </div>
      {erroNovo && <p className="text-sm text-[var(--cor-rosa)] mb-2">{erroNovo}</p>}

      {categorias.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--cor-texto-suave)]">
                <th className="py-1 pr-3">Nome</th>
                <th className="py-1 pr-3">Grupo</th>
                <th className="py-1">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-1 pr-3">
                    {editandoId === c.id ? (
                      <input
                        aria-label="Nome"
                        className="entrada"
                        value={nomeEdit}
                        onChange={(e) => setNomeEdit(e.target.value)}
                      />
                    ) : (
                      c.nome
                    )}
                  </td>
                  <td className="py-1 pr-3">
                    {editandoId === c.id ? (
                      <select
                        aria-label="Grupo"
                        className="entrada"
                        value={grupoEdit}
                        onChange={(e) => setGrupoEdit(e.target.value as CategoriaGrupo)}
                      >
                        {GRUPOS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    ) : (
                      c.grupo
                    )}
                  </td>
                  <td className="py-1">
                    {editandoId === c.id ? (
                      <span className="flex gap-2">
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
                      </span>
                    ) : (
                      <span className="flex gap-2">
                        <button
                          type="button"
                          className="botao botao-secundario text-xs"
                          onClick={() => abrirEdicao(c)}
                        >
                          Renomear {c.nome}
                        </button>
                        <button
                          type="button"
                          className="botao botao-secundario text-xs"
                          onClick={() => excluir(c)}
                        >
                          Excluir {c.nome}
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[var(--cor-texto-suave)]">Nenhuma categoria cadastrada.</p>
      )}
      {erroEdit && <p className="text-sm text-[var(--cor-rosa)] mt-2">{erroEdit}</p>}
      {dialogo}
    </div>
  );
}
