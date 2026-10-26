# SPEC 5.1 — Correção de Máscara de Valores e Ações de Ativo

## Objetivo
Corrigir o bug em que a quantidade de ativos é salva como fração equivocada (ex: 0.042 em vez de 100) e o Preço Médio é exibido com valores astronômicos. Adicionar botões de Editar e Excluir na linha de cada ativo.

## 1. Correção de Parsing e Cálculo (`FormularioAtivo.tsx` e `Investimentos.tsx`)
- **Quantidade:** O input deve aceitar números inteiros ou decimais (para cripto). Certifique-se de que a string digitada (ex: "100" ou "100,5") seja convertida corretamente para número (`parseFloat` ou `Number`). Não multiplique nem divida por 100.
- **Preço Pago:** O usuário digita em Reais (ex: "30,50"). Na hora de salvar, converta para centavos (3050). Certifique-se de que a conversão de string com vírgula para float está correta.
- **Preço Médio na Tabela:** O valor de `precoMedio` retornado pelo domínio deve ser exibido dividindo por 100 (se estiver em centavos). Verifique a lógica de `Investimentos.tsx` onde o preço médio é calculado.
- **Total Aportado:** A soma de `totalAportado` (Preço Pago × Quantidade) deve resultar no valor correto em centavos.

## 2. Ações na Tabela (`AssetGroup.tsx` e `Investimentos.tsx`)
No final de cada linha da tabela de ativos, substitua o botão atual (placeholder) por um grupo de dois botões:
1.  **Editar (ícone de lápis):** Abre o `FormularioAtivo` no modo de edição, preenchido com os dados do ativo (quantidade, preço pago, etc.). Ao salvar, atualiza o registro no Dexie em vez de criar um novo.
2.  **Excluir (ícone de lixeira):** Abre o `ConfirmDialog` (já criado na SPEC 3) perguntando se o usuário deseja excluir o ativo. Se confirmar, apaga o ativo do Dexie.

*(Nota: A mecânica de "Lançamentos" adicionais fica para o futuro. Por agora, a gestão direta do ativo resolve).*

## Critérios de Aceite
1. `npm run build` e `lint` passam.
2. Ao cadastrar um ativo com Preço R$ 30,00 e Qtd 100, o Saldo e o Preço Médio são exibidos corretamente.
3. O botão de Editar abre o formulário preenchido e salva as alterações (ex: mudar a quantidade para 200).
4. O botão de Excluir remove o ativo da tabela após confirmação.