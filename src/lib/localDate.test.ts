import { describe, it, expect } from "vitest";
import { toLocalISODate, todayLocalISO } from "./localDate";

describe("localDate — fuso fixado em America/Cuiaba (UTC-4)", () => {
  it("sanidade do fuso: 21:30 locais estão 240 minutos atrás do UTC", () => {
    expect(new Date(2026, 9, 18, 21, 30).getTimezoneOffset()).toBe(240);
  });

  it("toLocalISODate usa a data local, não a UTC", () => {
    expect(toLocalISODate(new Date(2026, 9, 18, 21, 30))).toBe("2026-10-18");
  });

  it("toLocalISODate completa o mês e o dia com dois dígitos", () => {
    expect(toLocalISODate(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
    expect(toLocalISODate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });

  it("todayLocalISO devolve a data local de agora", () => {
    expect(todayLocalISO(new Date(2026, 9, 18, 21, 30))).toBe("2026-10-18");
    expect(todayLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
