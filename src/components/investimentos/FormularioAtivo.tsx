import { useState, useRef, useEffect, useCallback } from "react";
import { fetchAndCacheQuote } from "../../services/quotes";
import { formatarBRL, textoParaCentavos, centavosParaTexto } from "../../domain/dinheiro";
import type { AtivoPopular } from "../../lib/ativosPopulares";
import type { ClasseInvestimento } from "../../domain/models";
import { filtrarAtivos } from "../../lib/ativosPopulares";
import type { AtivoInvestimento } from "../../domain/models";

interface FormularioAtivoProps {
  onSalvar: (ativo: Omit<AtivoInvestimento, "id">) => Promise<void>;
  onCancelar: () => void;
  erro?: string | null;
  ativoEditando?: AtivoInvestimento | null;
}

const CLASSES: ClasseInvestimento[] = ["Ações", "FIIs", "Cripto", "ETFs", "BDRs", "Renda fixa", "Outros"];

export function FormularioAtivo({ onSalvar, onCancelar, erro, ativoEditando }: FormularioAtivoProps) {
  const isEditando = ativoEditando !== null;

  // Estados do formulário
  const [ticker, setTicker] = useState("");
  const [classe, setClasse] = useState<ClasseInvestimento>("Ações");
  const [precoAtual, setPrecoAtual] = useState<number | null>(null); // centavos
  const [precoCompra, setPrecoCompra] = useState<string>(""); // string formatada pelo usuário
  const [quantidade, setQuantidade] = useState<string>("");
  const [buscandoPreco, setBuscandoPreco] = useState(false);
  const [erroPreco, setErroPreco] = useState<string | null>(null);

  // Estados do autocomplete
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const [sugestoesFiltradas, setSugestoesFiltradas] = useState<AtivoPopular[]>([]);
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inicializar formulário com dados do ativo sendo editado
  useEffect(() => {
    if (ativoEditando) {
      setTicker(ativoEditando.nome);
      setClasse(ativoEditando.classe);
      // precoCompra = totalAportado / quantidade (em Reais com vírgula)
      const precoMedioCentavos = ativoEditando.quantidade > 0
        ? Math.round(ativoEditando.totalAportado / ativoEditando.quantidade)
        : 0;
      setPrecoCompra(centavosParaTexto(precoMedioCentavos));
      setQuantidade(ativoEditando.quantidade.toString().replace(".", ","));
      setPrecoAtual(ativoEditando.valorAtual);
    } else {
      // Reset para novo ativo
      setTicker("");
      setClasse("Ações");
      setPrecoAtual(null);
      setPrecoCompra("");
      setQuantidade("");
      setErroPreco(null);
    }
  }, [ativoEditando]);

  // Total investido calculado (read-only)
  const totalInvestido = useCallback((): number => {
    const preco = textoParaCentavos(precoCompra);
    const qtd = parseFloat(quantidade.replace(",", "."));
    if (preco === null || isNaN(qtd) || qtd <= 0) return 0;
    return Math.round(preco * qtd);
  }, [precoCompra, quantidade]);

  // Filtrar sugestões ao digitar
  useEffect(() => {
    if (ticker.length >= 2) {
      const filtrados = filtrarAtivos(ticker);
      setSugestoesFiltradas(filtrados);
      setSugestoesAbertas(filtrados.length > 0);
      setIndiceSelecionado(0);
    } else {
      setSugestoesFiltradas([]);
      setSugestoesAbertas(false);
      setIndiceSelecionado(-1);
    }
  }, [ticker]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSugestoesAbertas(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // Buscar preço quando ticker é selecionado
  const buscarPreco = useCallback(async (tickerSelecionado: string, classeSelecionada: ClasseInvestimento) => {
    setBuscandoPreco(true);
    setErroPreco(null);
    try {
      const quote = await fetchAndCacheQuote(tickerSelecionado, classeSelecionada);
      if (quote) {
        setPrecoAtual(quote.price);
        // Preencher preço de compra automaticamente
        setPrecoCompra((quote.price / 100).toFixed(2).replace(".", ","));
      } else {
        setErroPreco("Preço não disponível — digite manualmente");
      }
    } catch {
      setErroPreco("Erro ao buscar preço — digite manualmente");
    } finally {
      setBuscandoPreco(false);
    }
  }, []);

  // Selecionar ativo do dropdown
  const selecionarAtivo = (ativo: AtivoPopular) => {
    setTicker(ativo.ticker);
    setClasse(ativo.classe);
    setSugestoesAbertas(false);
    void buscarPreco(ativo.ticker, ativo.classe);
  };

  // Navegação por teclado no dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!sugestoesAbertas || sugestoesFiltradas.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIndiceSelecionado((i) => (i < sugestoesFiltradas.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setIndiceSelecionado((i) => (i > 0 ? i - 1 : sugestoesFiltradas.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (indiceSelecionado >= 0) {
          selecionarAtivo(sugestoesFiltradas[indiceSelecionado]);
        }
        break;
      case "Escape":
        setSugestoesAbertas(false);
        break;
    }
  };

  // Formatar quantidade (permite decimal com vírgula ou ponto)
  const handleQuantidadeChange = (valor: string) => {
    // Permite apenas números, vírgula, ponto
    const filtrado = valor.replace(/[^0-9.,]/g, "");
    setQuantidade(filtrado);
  };

  const handlePrecoCompraChange = (valor: string) => {
    // Permite apenas números, vírgula, ponto
    const filtrado = valor.replace(/[^0-9.,]/g, "");
    setPrecoCompra(filtrado);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const precoCompraCentavos = textoParaCentavos(precoCompra);
    const qtd = parseFloat(quantidade.replace(",", "."));

    if (!ticker.trim()) {
      alert("Informe o ticker do ativo.");
      return;
    }
    if (precoCompraCentavos === null || precoCompraCentavos < 0) {
      alert("Informe o preço de compra válido.");
      return;
    }
    if (isNaN(qtd) || qtd <= 0) {
      alert("Informe a quantidade válida (maior que zero).");
      return;
    }

    const totalAportado = Math.round(precoCompraCentavos * qtd);

    await onSalvar({
      nome: ticker.trim().toUpperCase(),
      classe,
      totalAportado,
      valorAtual: precoAtual ?? totalAportado,
      quantidade: qtd,
    });
  };

  const totalFormatado = formatarBRL(totalInvestido());

  return (
    <div className="cartao p-4 mb-4" data-testid="formulario-ativo">
      <h2 className="font-semibold text-sm mb-3">{isEditando ? "Editar ativo" : "Novo ativo"}</h2>

      {erro && (
        <p className="text-sm mb-3" style={{ color: "var(--cor-rosa)" }} role="alert">
          {erro}
        </p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="grid md:grid-cols-4 gap-3 mb-3">
          {/* Busca do Ticker com Autocomplete */}
          <div className="relative">
            <label className="rotulo" htmlFor="in-ticker">Ticker (busca)</label>
            <div className="relative">
              <input
                ref={inputRef}
                id="in-ticker"
                type="text"
                className="entrada pr-10"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onFocus={() => ticker.length >= 2 && setSugestoesAbertas(true)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: PETR4"
                aria-autocomplete="list"
                aria-controls="ticker-sugestoes"
                aria-expanded={sugestoesAbertas}
                disabled={isEditando} // No modo edição, ticker não muda
              />
              {buscandoPreco && (
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-5 w-5 text-[var(--cor-destaque)]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
            </div>

            {/* Dropdown de sugestões */}
            {sugestoesAbertas && sugestoesFiltradas.length > 0 && !isEditando && (
              <div
                ref={dropdownRef}
                id="ticker-sugestoes"
                className="absolute z-20 w-full mt-1 cartao shadow-lg overflow-hidden"
                role="listbox"
              >
                {sugestoesFiltradas.map((ativo, idx) => (
                  <button
                    key={ativo.ticker}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm border-b last:border-0 ${
                      idx === indiceSelecionado ? "bg-[var(--cor-destaque)] text-white" : "hover:bg-[var(--cor-fundo-hover)]"
                    }`}
                    role="option"
                    aria-selected={idx === indiceSelecionado}
                    onClick={() => selecionarAtivo(ativo)}
                    onMouseEnter={() => setIndiceSelecionado(idx)}
                  >
                    <span className="font-medium">{ativo.ticker}</span>
                    <span className="ml-2 text-[var(--cor-texto-suave)]">{ativo.nome}</span>
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-[var(--cor-borda)]">{ativo.classe}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Classe (preenchida automaticamente, mas editável) */}
          <div>
            <label className="rotulo" htmlFor="in-classe">Classe</label>
            <select
              id="in-classe"
              className="entrada"
              value={classe}
              onChange={(e) => setClasse(e.target.value as ClasseInvestimento)}
              disabled={isEditando}
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Preço Pago Unitário (editável) */}
          <div className="relative">
            <label className="rotulo" htmlFor="in-preco-compra">Preço Pago (Unitário)</label>
            <input
              id="in-preco-compra"
              type="text"
              className="entrada num"
              inputMode="decimal"
              value={precoCompra}
              onChange={(e) => handlePrecoCompraChange(e.target.value)}
              placeholder="0,00"
              aria-describedby={erroPreco ? "erro-preco" : undefined}
            />
            {erroPreco && (
              <p id="erro-preco" className="text-xs mt-1" style={{ color: "var(--cor-rosa)" }}>
                {erroPreco}
              </p>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="rotulo" htmlFor="in-quantidade">Quantidade</label>
            <input
              id="in-quantidade"
              type="text"
              className="entrada num"
              inputMode="decimal"
              value={quantidade}
              onChange={(e) => handleQuantidadeChange(e.target.value)}
              placeholder="Ex: 100 ou 0,5"
            />
          </div>
        </div>

        {/* Total Investido (read-only) */}
        <div className="mb-4">
          <label className="rotulo" htmlFor="in-total">Total Investido (R$)</label>
          <input
            id="in-total"
            type="text"
            className="entrada num bg-[var(--cor-fundo-desabilitado)]"
            value={totalFormatado}
            readOnly
            aria-label={`Total investido: ${totalFormatado}`}
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="botao botao-primario">
            {isEditando ? "Salvar alterações" : "Salvar ativo"}
          </button>
          <button type="button" className="botao botao-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}