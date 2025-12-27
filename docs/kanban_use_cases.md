# Casos de Uso do Kanban (Boards, Tarefas, Visibilidade, Preferências)

## UC-01: Acessar o Kanban e carregar dados do board
Objetivo: abrir o Kanban com os dados do board ativo.
Pré-condições: usuário autenticado e com acesso ao board.
Fluxo principal:
1. Entrar no Kanban.
2. O sistema carrega a lista de boards e as preferências do usuário.
3. O sistema carrega colunas, membros e tarefas do board ativo.
Resultado esperado: o board é exibido com colunas, membros e tarefas.
Fluxo alternativo: se o usuário não tem acesso ao board, o sistema retorna 403 e exibe mensagem de permissão.

## UC-02: Gerenciar boards (criar, renomear e excluir)
Objetivo: permitir que o owner administre seus boards.
Pré-condições: usuário autenticado.
Fluxo principal (criar):
1. Abrir o modal de criação.
2. Informar o nome do board.
3. Salvar.
Resultado esperado: o board é criado e aparece na sidebar.
Fluxo principal (renomear):
1. Owner escolhe renomear um board.
2. Informar novo nome e salvar.
Resultado esperado: o board é atualizado.
Fluxo principal (excluir):
1. Owner exclui um board e confirma.
2. O sistema remove o board e ativa outro na sidebar.
Resultado esperado: board removido e outro board ativo.
Regras:
- Nome é obrigatório.
- Apenas o owner pode renomear ou excluir.

## UC-03: Compartilhar board com membro
Objetivo: permitir que o owner convide membros por email.
Pré-condições: usuário autenticado e owner do board.
Fluxo principal:
1. Abrir o convite no modal de tarefa.
2. Informar email do membro.
3. Enviar convite.
Resultado esperado: membro é adicionado à lista do board.
Fluxo alternativo:
- Email ausente: erro 400.
- Usuário não é owner: erro 403.

## UC-04: Alterar visibilidade do board (PRIVATE/SHARED)
Objetivo: permitir que o owner controle a visibilidade do board.
Pré-condições: usuário autenticado e owner do board.
Fluxo principal:
1. Abrir controle de visibilidade.
2. Selecionar PRIVATE ou SHARED.
3. Salvar alteração.
Resultado esperado: a visibilidade do board é atualizada.
Regra: apenas o owner vê o controle de visibilidade.

## UC-05: Visualizar tarefas conforme visibilidade e perfil
Objetivo: garantir privacidade em boards privados e acesso amplo em boards compartilhados.
Pré-condições: usuário autenticado e membro de um board.
Fluxo principal (board SHARED):
1. Abrir o board compartilhado.
2. Ver todas as tarefas do board.
Fluxo alternativo (board PRIVATE):
1. Abrir o board privado.
2. Ver somente tarefas atribuídas ao próprio usuário.
Resultado esperado: owner sempre vê todas as tarefas; member vê apenas as atribuídas no PRIVATE e todas no SHARED.

## UC-06: Criar tarefa
Objetivo: registrar novas tarefas em uma coluna.
Pré-condições: usuário autenticado e com acesso ao board.
Fluxo principal:
1. Abrir modal de nova tarefa em uma coluna.
2. Informar título e campos opcionais (descrição, tipo, responsável, data de vencimento, tempo estimado, checklist).
3. Salvar.
Resultado esperado: tarefa criada e exibida no board, com checklist em formato boolean.
Regras:
- Título é obrigatório.
- Usuário precisa ter acesso à coluna/board.

## UC-07: Editar tarefa com permissões por perfil
Objetivo: aplicar regras de edição por perfil.
Pré-condições: usuário autenticado e com acesso à tarefa.
Fluxo principal:
1. Abrir a tarefa e editar campos.
2. Salvar.
Resultado esperado: alterações são salvas conforme permissões.
Regras:
- Member não edita título, descrição, tipo e responsável.
- Member pode editar data de vencimento, tempo estimado e checklist.
- Criador pode editar título, descrição e tipo na própria task.
- Owner pode editar todos os campos.
- `columnId` deve pertencer ao board, senão erro 400.

## UC-08: Mover tarefa entre colunas
Objetivo: alterar a coluna de uma tarefa.
Pré-condições: usuário autenticado e com acesso à tarefa.
Fluxo principal:
1. Selecionar nova coluna para a tarefa.
2. Salvar movimentação.
Resultado esperado: tarefa aparece na nova coluna.
Regra: `columnId` é obrigatório.

## UC-09: Excluir tarefa
Objetivo: permitir remoção de tarefas.
Pré-condições: usuário autenticado e com acesso à tarefa.
Fluxo principal:
1. Owner ou criador solicita exclusão.
2. Confirmar exclusão.
Resultado esperado: tarefa removida (204).
Regra: member sem ser criador não pode excluir (403).

## UC-10: Gerenciar checklist da tarefa
Objetivo: permitir adicionar, marcar e remover itens da checklist.
Pré-condições: usuário autenticado e com permissão de edição do checklist.
Fluxo principal:
1. Adicionar itens na checklist.
2. Marcar/desmarcar itens concluídos.
3. Remover itens.
Resultado esperado: checklist refletindo o estado atualizado.

## UC-11: Preferências do usuário (background)
Objetivo: manter o wallpaper por usuário.
Pré-condições: usuário autenticado.
Fluxo principal:
1. Abrir o seletor de background.
2. Escolher uma imagem.
3. Atualizar a página.
Resultado esperado: a escolha persiste para o mesmo usuário e não vaza para outros.
