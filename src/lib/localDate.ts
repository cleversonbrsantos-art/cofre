/** Datas locais em ISO YYYY-MM-DD, sem fuso (R18). A data "hoje" nunca é derivada de toISOString. */

export function toLocalISODate(date: Date): string {
  const ano = date.getFullYear();
  const mes = date.getMonth() + 1;
  const dia = date.getDate();
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function todayLocalISO(now: Date = new Date()): string {
  return toLocalISODate(now);
}
