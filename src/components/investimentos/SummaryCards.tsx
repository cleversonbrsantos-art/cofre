import { formatarBRL } from "../../domain/dinheiro";
import type { AtivoInvestimento, BemPassivo, Quote } from "../../domain/models";

interface SummaryCardsProps {
  ativos: AtivoInvestimento[];
  bens: BemPassivo[];
  quotes: Map<string, Quote | null>;
  proventos12m: number;
}

export function SummaryCards({ ativos, bens, quotes, proventos12m }: SummaryCardsProps) {
  // Calcular valor total da carteira (ativos + bens/passivos)
  let valorTotalCarteira = 0;
  let totalAportado = 0;

  for (const ativo of ativos) {
    const quote = quotes.get(ativo.nome.toUpperCase());
    const precoAtual = quote?.price ?? ativo.valorAtual;
    const valorAtivo = precoAtual;
    valorTotalCarteira += valorAtivo;
    totalAportado += ativo.totalAportado;
  }

  // Adicionar bens/passivos ao patrimônio total
  const valorBens = bens.reduce((s, b) => s + b.valor, 0);
  const patrimonioTotal = valorTotalCarteira + valorBens;

  // Lucro total
  const lucroTotal = valorTotalCarteira - totalAportado;
  const lucroPercentual = totalAportado > 0 ? (lucroTotal / totalAportado) * 100 : 0;

  // Recalcular variação do dia ponderada corretamente
  let variacaoDiaPonderada = 0;
  if (valorTotalCarteira > 0) {
    for (const ativo of ativos) {
      const quote = quotes.get(ativo.nome.toUpperCase());
      const precoAtual = quote?.price ?? ativo.valorAtual;
      if (quote) {
        variacaoDiaPonderada += quote.changePercent * (precoAtual / valorTotalCarteira);
      }
    }
  }

  const cards = [
    {
      titulo: "Patrimônio Total",
      valor: formatarBRL(patrimonioTotal),
      cor: "var(--cor-texto)",
    },
    {
      titulo: "Lucro Total",
      valor: `${formatarBRL(lucroTotal)} (${lucroPercentual >= 0 ? "+" : ""}${lucroPercentual.toFixed(2).replace(".", ",")}%)`,
      cor: lucroTotal >= 0 ? "var(--cor-verde)" : "var(--cor-rosa)",
    },
    {
      titulo: "Proventos (12M)",
      valor: formatarBRL(proventos12m),
      cor: "var(--cor-ambar)",
    },
    {
      titulo: "Rentabilidade",
      valor: `Total: ${lucroPercentual >= 0 ? "+" : ""}${lucroPercentual.toFixed(2).replace(".", ",")}% · Dia: ${variacaoDiaPonderada >= 0 ? "+" : ""}${variacaoDiaPonderada.toFixed(2).replace(".", ",")}%`,
      cor: "var(--cor-texto)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {cards.map((card, i) => (
        <div key={i} className="cartao p-4">
          <p className="text-xs text-[var(--cor-texto-suave)] mb-1">{card.titulo}</p>
          <p className="text-lg font-semibold num" style={{ color: card.cor }}>{card.valor}</p>
        </div>
      ))}
    </div>
  );
}