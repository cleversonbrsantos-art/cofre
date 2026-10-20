import { useEffect, useState } from "react";
import type { Categoria, Conta, Cartao, FormaPagamento } from "../domain/models";
import { FORMAS_PAGAMENTO_PADRAO } from "../config/padroes";
import { textoParaCentavos, centavosParaTexto } from "../domain/dinheiro";
import type { ValoresFormulario } from "./valoresFormulario";

interface Props {
  valorInicial: ValoresFormulario;
  categorias: Categoria[];
  contas: Conta[];
  cartoes: Cartao[];
  formas?: FormaPagamento[];
  onSubmit: (valores: ValoresFormulario) => void;
  onCancel: () => void;
  rotuloSubmit: string;
}

/** Formulário de lançamento (criar/editar). Dinheiro convertido na borda (R17). */
export function FormularioLancamento({
  valorInicial,
  categorias,
  contas,
  cartoes,
  formas = FORMAS_PAGAMENTO_PADRAO,
  onSubmit,
  onCancel,
  rotuloSubmit,
}: Props) {
  const [valores, setValores] = useState<ValoresFormulario>(valorInicial);
  const [textoValor, setTextoValor] = useState(
    valorInicial.valorCentavos === null ? "" : centavosParaTexto(valorInicial.valorCentavos),
  );
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setValores(valorInicial);
    setTextoValor(
      valorInicial.valorCentavos === null ? "" : centavosParaTexto(valorInicial.valorCentavos),
    );
  }, [valorInicial]);

  const grupoCategoria = categorias.find((c) => c.id === valores.categoriaId)?.grupo;
  const precisaContaDestino = grupoCategoria === "Poupança" || grupoCategoria === "Transferência";

  const definir = <K extends keyof ValoresFormulario>(chave: K, valor: ValoresFormulario[K]) =>
    setValores((v) => ({ ...v, [chave]: valor }));

  const submeter = () => {
    const valor = textoParaCentavos(textoValor);
    if (valor === null || valor === 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (valores.descricao.trim() === "") {
      setErro("Informe uma descrição.");
      return;
    }
    if (valores.cartaoId === null && valores.contaId === null) {
      setErro("Escolha uma conta ou um cartão.");
      return;
    }
    setErro(null);
    onSubmit({
      ...valores,
      descricao: valores.descricao.trim(),
      valorCentavos: valor,
      contaId: valores.cartaoId !== null ? null : valores.contaId,
    });
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        submeter();
      }}
      data-testid="formulario-lancamento"
    >
      {erro && (
        <p className="text-sm" style={{ color: "var(--cor-rosa)" }} role="alert">
          {erro}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="rotulo" htmlFor="lct-data">
            Data
          </label>
          <input
            id="lct-data"
            type="date"
            className="entrada"
            value={valores.data}
            onChange={(e) => definir("data", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="rotulo" htmlFor="lct-valor">
            Valor
          </label>
          <input
            id="lct-valor"
            className="entrada num"
            value={textoValor}
            onChange={(e) => setTextoValor(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
          />
        </div>
      </div>
      <div>
        <label className="rotulo" htmlFor="lct-descricao">
          Descrição
        </label>
        <input
          id="lct-descricao"
          className="entrada"
          value={valores.descricao}
          onChange={(e) => definir("descricao", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="rotulo" htmlFor="lct-categoria">
            Categoria
          </label>
          <select
            id="lct-categoria"
            className="entrada"
            value={valores.categoriaId ?? ""}
            onChange={(e) =>
              definir("categoriaId", e.target.value === "" ? null : Number(e.target.value))
            }
          >
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.grupo} · {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="lct-forma">
            Forma de pagamento
          </label>
          <select
            id="lct-forma"
            className="entrada"
            value={valores.formaPagamento}
            onChange={(e) => definir("formaPagamento", e.target.value)}
          >
            {formas.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="rotulo" htmlFor="lct-conta">
            Conta
          </label>
          <select
            id="lct-conta"
            className="entrada"
            value={valores.contaId ?? ""}
            onChange={(e) =>
              definir("contaId", e.target.value === "" ? null : Number(e.target.value))
            }
          >
            <option value="">—</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="lct-cartao">
            Cartão
          </label>
          <select
            id="lct-cartao"
            className="entrada"
            value={valores.cartaoId ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              setValores((atual) => ({
                ...atual,
                cartaoId: v,
                contaId: v !== null ? null : atual.contaId,
                formaPagamento: v !== null ? "Crédito" : atual.formaPagamento,
              }));
            }}
          >
            <option value="">—</option>
            {cartoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      {precisaContaDestino && (
        <div>
          <label className="rotulo" htmlFor="lct-destino">
            Conta destino
          </label>
          <select
            id="lct-destino"
            className="entrada"
            value={valores.contaDestinoId ?? ""}
            onChange={(e) =>
              definir("contaDestinoId", e.target.value === "" ? null : Number(e.target.value))
            }
          >
            <option value="">—</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="rotulo" htmlFor="lct-status">
            Status
          </label>
          <select
            id="lct-status"
            className="entrada"
            value={valores.status}
            onChange={(e) => definir("status", e.target.value as "Pago" | "Pendente")}
          >
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="lct-parcela">
            Parcela (informativo)
          </label>
          <input
            id="lct-parcela"
            className="entrada"
            value={valores.parcela ?? ""}
            onChange={(e) => definir("parcela", e.target.value === "" ? null : e.target.value)}
            placeholder="1/10"
          />
        </div>
      </div>
      <div>
        <label className="rotulo" htmlFor="lct-obs">
          Observação
        </label>
        <input
          id="lct-obs"
          className="entrada"
          value={valores.observacao}
          onChange={(e) => definir("observacao", e.target.value)}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" className="botao botao-secundario" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="botao botao-primario">
          {rotuloSubmit}
        </button>
      </div>
    </form>
  );
}
