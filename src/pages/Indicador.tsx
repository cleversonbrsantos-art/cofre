export function Indicador({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="cartao p-4">
      <p className="text-xs text-[var(--cor-texto-suave)]">{rotulo}</p>
      <p className="num text-lg font-semibold" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  );
}
