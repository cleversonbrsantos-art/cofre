# SPEC 3.1 — Correção do Bug de Lançamentos (id: 0 e Falso Sucesso)

## Objetivo
Corrigir o erro na criação de novos lançamentos, onde o formulário diz que salvou, mas o registro é gravado com `id: 0` e não aparece na lista.

## Contexto
Na SPEC 3 anterior, o Bug 2 ficou pendente porque o arquivo estava incompleto. O problema está no arquivo `src/pages/Lancamentos.tsx`, na função `salvar`.

## Ação Exigida
1. Abra `src/pages/Lancamentos.tsx`.
2. Localize a função `salvar`.
3. Para novos registros (quando não está editando), o código está criando um objeto com `id: 0`.
4. Remova a propriedade `id: 0` do objeto de criação. O Dexie deve gerar o ID automaticamente.
   *Dica:* Como o TypeScript exige o `id` na interface `Lancamento`, crie o objeto sem o ID e passe para a função `db.lancamentos.add()` usando o tipo `Omit<Lancamento, "id">` ou um cast seguro.
5. Garanta que a UI só feche o painel (`setCriando(false)`) e mostre o sucesso **DEPOIS** que o `await db.lancamentos.add(...)` for concluído com sucesso.
6. Se o Dexie der erro, exiba a mensagem usando o componente `<Erro mensagem={...} />` que já existe na tela.

## Critérios de Aceite
1. `npm run build` e `npm run lint` sem erros.
2. Ao criar um lançamento, ele é salvo com ID 1, 2, 3... e aparece na lista imediatamente.
3. Se tentar salvar algo inválido, a UI mostra a mensagem de erro e não fecha o painel.