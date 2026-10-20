import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PaginaPainel } from "./Painel";
import { db, inicializarBanco } from "../db/db";

/** Bug 1 da SPEC 3: com banco recém-criado (sem dados de exemplo), a linha única
 * de reservaConfig não existia e o Painel ficava eternamente em "Carregando...". */
describe("Painel com banco recém-criado (usuário novo, sem dados de exemplo)", () => {
  beforeEach(async () => {
    cleanup();
    await db.delete();
    await db.open();
    await inicializarBanco();
  });

  it("não fica preso em Carregando: mostra o estado vazio", async () => {
    render(<PaginaPainel />);

    expect(await screen.findByText(/Sem dados ainda/)).toBeTruthy();
  });
});
