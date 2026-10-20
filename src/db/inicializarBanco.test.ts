import { describe, it, expect, beforeEach } from "vitest";
import { db, inicializarBanco } from "./db";

/** Bug 1 da SPEC 3: linha única de reservaConfig ausente em banco recém-criado
 * deixa Painel e Reserva presos em "Carregando..." (get(1) resolve undefined). */
describe("inicializarBanco — linha padrão de reservaConfig", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("cria a linha padrão da reserva em um banco vazio", async () => {
    await inicializarBanco();

    const linha = await db.reservaConfig.get(1);
    expect(linha).toEqual({
      id: 1,
      perfil: "CLT",
      mesesAjustados: null,
      contaId: null,
      gastoEssencialManual: null,
      aporteMensal: 0,
    });
  });

  it("não sobrescreve a linha da reserva já existente", async () => {
    await db.open();
    await db.reservaConfig.put({
      id: 1,
      perfil: "Autônomo/MEI/PJ",
      mesesAjustados: 9,
      contaId: 2,
      gastoEssencialManual: null,
      aporteMensal: 50000,
    });

    await inicializarBanco();

    const linha = await db.reservaConfig.get(1);
    expect(linha?.perfil).toBe("Autônomo/MEI/PJ");
    expect(linha?.mesesAjustados).toBe(9);
    expect(linha?.contaId).toBe(2);
    expect(linha?.aporteMensal).toBe(50000);
  });
});
