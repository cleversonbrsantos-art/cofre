/** Conversões de dinheiro na borda (formulário e exibição). Nada de float no domínio/banco. */

/** Converte texto "1234,56" ou "1234.56" para centavos inteiros. */
export function textoParaCentavos(texto: string): number | null {
  const limpo = texto.trim().replace(/[R$\s]/g, "");
  if (limpo === "") return null;
  const normalizado = limpo.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(normalizado);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

/** Converte centavos para texto com vírgula decimal. */
export function centavosParaTexto(centavos: number): string {
  const negativo = centavos < 0;
  const abs = Math.abs(centavos);
  const inteiro = Math.floor(abs / 100);
  const resto = abs % 100;
  const milhar = inteiro.toLocaleString("pt-BR");
  return `${negativo ? "-" : ""}${milhar},${String(resto).padStart(2, "0")}`;
}

/** Formata centavos como BRL. */
export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
