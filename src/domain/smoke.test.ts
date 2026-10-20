import { describe, it, expect } from "vitest";
import { tipoDoGrupo } from "./types";

describe("tipoDoGrupo", () => {
  it("deriva o tipo do grupo da categoria", () => {
    expect(tipoDoGrupo("Receita")).toBe("Receita");
    expect(tipoDoGrupo("Necessidade")).toBe("Despesa");
    expect(tipoDoGrupo("Desejo")).toBe("Despesa");
    expect(tipoDoGrupo("Poupança")).toBe("Poupança");
    expect(tipoDoGrupo("Transferência")).toBe("Transferência");
  });
});
