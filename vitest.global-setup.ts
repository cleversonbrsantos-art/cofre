/** Fixa o fuso dos testes para que expectativas de data local sejam determinísticas. */
export default function globalSetup(): void {
  process.env.TZ = "America/Cuiaba";
}
