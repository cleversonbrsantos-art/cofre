# SPEC 5.2 — Correção da Matemática de Preço Médio e Formulário de Ativos

## Objetivo
Corrigir o cálculo de Preço Médio na tabela de ativos e garantir que o formulário de cadastro tenha campos claros de "Preço Pago (unitário)" e "Quantidade", calculando o Total corretamente.

## 1. O Formulário (`FormularioAtivo.tsx`)
O formulário atual está gerando confusão nos valores. Substitua a lógica de inputs para:
1.  **Preço Pago (Unitário):** Um input visível em Reais (R$). Ex: se o usuário pagou R$ 20,00 por cota, ele digita `20,00`.
2.  **Quantidade:** Um input visível. Ex: `100` cotas.
3.  **Total Investido (Read-only):** Um input desabilitado que mostra o cálculo `Preço Pago × Quantidade` (ex: R$ 2.000,00).
4.  **Conversão no Save (R17):** 
    *   O `PrecoPago` (em reais) deve ser convertido para centavos inteiros (`Math.round(preco * 100)`).
    *   O `totalAportado` deve ser salvo no Dexie em centavos inteiros (`Math.round(PrecoPagoCentavos * quantidade)`).
    *   O `quantidade` deve ser salvo como float (para aceitar frações de cripto).

## 2. Os Cálculos da Tabela (`Investimentos.tsx` e `AssetGroup.tsx`)
A tabela estava exibindo o Total Investido no lugar do Preço Médio. Altere a lógica de renderização:
1.  **Preço Médio:** Deve ser calculado como `Total Aportado (em centavos) / Quantidade`. Exiba em Reais.
2.  **Saldo:** Deve ser calculado como `Preço Atual (em centavos) * Quantidade`. Exiba em Reais.
3.  **Rentabilidade:** Deve ser calculada como `((Preço Atual - Preço Médio) / Preço Médio) * 100`. Exiba a porcentagem com duas casas decimais (ex: `+14,50%` ou `-10,20%`).
4.  Garanta que a divisão por zero seja tratada (se a quantidade for 0, preço médio e rentabilidade são `—`).

## Critérios de Aceite
1. `npm run build` e `lint` passam.
2. O usuário cadastra: Preço Pago R$ 20,00, Qtd 100. O Total Investido aparece R$ 2.000,00.
3. Na tabela, o Preço Médio aparece R$ 20,00. O Preço Atual aparece o valor da API (ex: R$ 41,65). A Rentabilidade aparece em ~108%. O Saldo aparece R$ 4.165,00.
4. O botão de Editar abre o formulário com Preço Pago R$ 20,00 e Qtd 100 (não com o valor total embaralhado).