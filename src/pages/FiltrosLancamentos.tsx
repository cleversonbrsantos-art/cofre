import { mesKeyDe } from "../domain/datas";
import type { Cartao, Categoria, Conta } from "../domain/models";

interface Props {
  busca: string;
  setBusca: (v: string) => void;
  filtroMes: string;
  setFiltroMes: (v: string) => void;
  filtroCategoria: string;
  setFiltroCategoria: (v: string) => void;
  filtroConta: string;
  setFiltroConta: (v: string) => void;
  filtroCartao: string;
  setFiltroCartao: (v: string) => void;
  filtroStatus: string;
  setFiltroStatus: (v: string) => void;
  filtroTipo: string;
  setFiltroTipo: (v: string) => void;
  categorias: Categoria[];
  contas: Conta[];
  cartoes: Cartao[];
}

/** Barra de filtros da tela Lançamentos (busca, mês, categoria, conta, cartão, status, tipo). */
export function FiltrosLancamentos({
  busca,
  setBusca,
  filtroMes,
  setFiltroMes,
  filtroCategoria,
  setFiltroCategoria,
  filtroConta,
  setFiltroConta,
  filtroCartao,
  setFiltroCartao,
  filtroStatus,
  setFiltroStatus,
  filtroTipo,
  setFiltroTipo,
  categorias,
  contas,
  cartoes,
}: Props) {
  return (
    <div className="cartao p-3 mb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
      <input
        className="entrada"
        placeholder="Buscar descrição…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        aria-label="Buscar por descrição"
      />
      <input
        className="entrada"
        type="month"
        value={filtroMes === "" ? "" : `${String(Math.floor(Number(filtroMes) / 100))}-${String(Number(filtroMes) % 100).padStart(2, "0")}`}
        onChange={(e) => setFiltroMes(e.target.value === "" ? "" : String(mesKeyDe(e.target.value + "-01")))}
        aria-label="Filtrar por mês"
      />
      <select
        className="entrada"
        value={filtroCategoria}
        onChange={(e) => setFiltroCategoria(e.target.value)}
        aria-label="Filtrar por categoria"
      >
        <option value="">Todas categorias</option>
        <option value="null">Sem categoria</option>
        {categorias.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.nome}
          </option>
        ))}
      </select>
      <select
        className="entrada"
        value={filtroConta}
        onChange={(e) => setFiltroConta(e.target.value)}
        aria-label="Filtrar por conta"
      >
        <option value="">Todas contas</option>
        {contas.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.nome}
          </option>
        ))}
      </select>
      <select
        className="entrada"
        value={filtroCartao}
        onChange={(e) => setFiltroCartao(e.target.value)}
        aria-label="Filtrar por cartão"
      >
        <option value="">Todos cartões</option>
        {cartoes.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.nome}
          </option>
        ))}
      </select>
      <select
        className="entrada"
        value={filtroStatus}
        onChange={(e) => setFiltroStatus(e.target.value)}
        aria-label="Filtrar por status"
      >
        <option value="">Todos status</option>
        <option value="Pago">Pago</option>
        <option value="Pendente">Pendente</option>
      </select>
      <select
        className="entrada"
        value={filtroTipo}
        onChange={(e) => setFiltroTipo(e.target.value)}
        aria-label="Filtrar por tipo"
      >
        <option value="">Todos tipos</option>
        <option value="Receita">Receita</option>
        <option value="Despesa">Despesa</option>
        <option value="Poupança">Poupança</option>
        <option value="Transferência">Transferência</option>
      </select>
    </div>
  );
}
