# Testes FRONT-END (Cypress E2E)

## Objetivo
Validar os fluxos principais do Tarefando no navegador, com foco em:
- Autenticação.
- Kanban (tarefas, checklist, membros).
- Boards e sidebar.
- Preferências (background).
- Visibilidade do board e permissões por perfil.

Os testes são **estáveis e isolados**, usando `cy.intercept` para mockar API e evitar dependência de banco real.

## Como rodar
- `npx cypress open`
- `npx cypress run`
- Rodar um spec específico:
  - `npx cypress run --spec "cypress/e2e/boards.cy.js"`
  - `npx cypress run --spec "cypress/e2e/task_permissions.cy.js"`

## Estrutura principal
- Specs: `cypress/e2e/*.cy.js`
- Fixtures: `cypress/fixtures/*.json`
- Commands: `cypress/support/commands.js`
- Config: `cypress.config.js`

## Specs e cobertura
- `auth.cy.js`
  - Criar conta, login, erro de login.
  - Fluxos de esqueci a senha e reset.
- `boards.cy.js`
  - Criar, renomear e excluir boards.
  - Trocar board ativo e recarregar dados.
  - Compartilhar board com membro.
- `kanban.cy.js`
  - Criar/editar tarefa.
  - Checklist (adicionar, marcar e excluir).
  - Convidar membro via email.
- `background.cy.js`
  - Selecionar background e persistir após reload.
- `board_visibility.cy.js`
  - Owner troca visibilidade do board.
  - Membro não vê o controle de visibilidade.
- `tasks_visibility.cy.js`
  - PRIVATE: membro vê apenas tasks atribuídas.
  - SHARED: membro vê todas as tasks.
- `task_permissions.cy.js`
  - Membro: campos bloqueados e edição permitida.
  - Owner: edição completa e delete.

## Fixtures usadas
Fixtures ficam em `cypress/fixtures/` e padronizam o estado dos testes:
- `boards_private.json`, `boards_shared.json`
- `columns.json`
- `users.json`
- `preferences.json`
- `tasks_private.json`, `tasks_shared.json`, `tasks_permissions.json`

## Padrões adotados
- **Seletores:** usar apenas `[data-cy="..."]`.
- **Anti-flake:** sem `cy.wait(ms)` fixo.
- **Intercept:** todas as chamadas `/api/kanban/*` e `/api/auth/*` são mockadas.
- **Isolamento:** cada teste deve rodar sozinho; usar `cy.sessionAsAuthenticated`.

## Login e sessão
Usar helper:
```js
cy.sessionAsAuthenticated(user, token)
cy.visit('/kanban')
```

Isso grava `token` e `loggedUser` no `localStorage` e evita relogar a cada teste.

## Boas práticas do projeto
- Não depender de DB real.
- Não usar waits fixos.
- Sempre validar estado visual com asserts (`should('be.visible')`, etc).
- Manter specs curtos e legíveis, extraindo helpers quando necessário.
