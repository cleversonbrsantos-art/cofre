import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog (C4)", () => {
  it("abre com foco no botão Cancelar", () => {
    render(<ConfirmDialog titulo="Excluir" mensagem="Tem certeza?" onConfirmar={() => {}} onFechar={() => {}} />);
    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    expect(cancelar).toHaveFocus();
  });

  it("Esc cancela", () => {
    const onFechar = vi.fn();
    render(<ConfirmDialog titulo="Excluir" mensagem="Tem certeza?" onConfirmar={() => {}} onFechar={onFechar} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it('"Excluir" confirma', () => {
    const onConfirmar = vi.fn();
    render(<ConfirmDialog titulo="Excluir" mensagem="Tem certeza?" onConfirmar={onConfirmar} onFechar={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("tem role alertdialog", () => {
    render(<ConfirmDialog titulo="Excluir" mensagem="Tem certeza?" onConfirmar={() => {}} onFechar={() => {}} />);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });
});
