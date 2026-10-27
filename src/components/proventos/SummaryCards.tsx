import { formatarBRL } from "../../domain/dinheiro";

interface SummaryCardProps {
  titulo: string;
  valor: number;
  cor?: "verde" | "amarelo" | "azul";
}

export function SummaryCard({ titulo, valor, cor = "azul" }: SummaryCardProps) {
  const corStyle = {
    verde: { color: "var(--cor-verde)" },
    amarelo: { color: "var(--cor-ambar)" },
    azul: { color: "var(--cor-destaque)" },
  }[cor];

  return (
    <div className="cartao p-4">
      <p className="text-xs text-[var(--cor-texto-suave)] mb-1">{titulo}</p>
      <p className="text-lg font-semibold num" style={corStyle}>
        {formatarBRL(valor)}
      </p>
    </div>
  );
}

interface ProventosSummaryCardsProps {
  totalRecebido12Meses: number;
  totalAReceber: number;
  mediaMensal: number;
}

export function ProventosSummaryCards({
  totalRecebido12Meses,
  totalAReceber,
  mediaMensal,
}: ProventosSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <SummaryCard titulo="Total Recebido (12 meses)" valor={totalRecebido12Meses} cor="verde" />
      <SummaryCard titulo="Total a Receber" valor={totalAReceber} cor="amarelo" />
      <SummaryCard titulo="Média Mensal" valor={mediaMensal} cor="azul" />
    </div>
  );
}