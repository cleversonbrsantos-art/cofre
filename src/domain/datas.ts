/** Datas ISO YYYY-MM-DD sem fuso; mês-chave AAAAMM numérico. "Hoje" entra por parâmetro. */

export function mesKeyDe(dataISO: string): number {
  return Number(dataISO.slice(0, 4) + dataISO.slice(5, 7));
}

export function anoDeMesKey(mesKey: number): number {
  return Math.floor(mesKey / 100);
}

export function mesDeMesKey(mesKey: number): number {
  return mesKey % 100;
}

export function mesKey(ano: number, mes: number): number {
  return ano * 100 + mes;
}

export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

/** Avança (ou recua, com n negativo) n meses a partir de um mesKey. */
export function avancarMesKey(mesKeyInicial: number, n: number): number {
  const ano = anoDeMesKey(mesKeyInicial);
  const mes = mesDeMesKey(mesKeyInicial);
  const total = ano * 12 + (mes - 1) + n;
  return Math.floor(total / 12) * 100 + (total % 12) + 1;
}

export function dataISO(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function diaDe(dataISOStr: string): number {
  return Number(dataISOStr.slice(8, 10));
}

/** Diferença de meses (b-a) usando o dia 1 como referência. */
export function diferencaMeses(a: number, b: number): number {
  return (anoDeMesKey(a) * 12 + mesDeMesKey(a)) - (anoDeMesKey(b) * 12 + mesDeMesKey(b));
}

export function minMesKey(a: number, b: number): number {
  return Math.min(a, b);
}

export function maxMesKey(a: number, b: number): number {
  return Math.max(a, b);
}

/** Formata ISO para dd/mm/aaaa. */
export function formatarData(dataISOStr: string): string {
  if (dataISOStr.length < 10) return dataISOStr;
  return `${dataISOStr.slice(8, 10)}/${dataISOStr.slice(5, 7)}/${dataISOStr.slice(0, 4)}`;
}

/** Nome do mês em pt-BR. */
export function nomeMes(mes: number): string {
  const nomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return nomes[mes - 1] ?? "";
}

export function rotuloMesKey(mesKeyNum: number): string {
  return `${nomeMes(mesDeMesKey(mesKeyNum))}/${anoDeMesKey(mesKeyNum)}`;
}
