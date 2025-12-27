# Testes BACK-END

## Feature: Visibilidade do Board + Permissões de edição
Esta feature adiciona:
- `VISIBILITY` no board (`PRIVATE` | `SHARED`).
- Regras de visibilidade de tasks para membros.
- Permissões de edição por perfil (owner, membro limitado, criador).

Como essas regras são críticas de segurança/negócio, os testes garantem:
- Restrições corretas de acesso.
- Respostas 400/403/401 consistentes.
- Comportamento estável sem dependência de DB real.

## Como rodar
- `npm test`
- Rodar um arquivo específico:
  - `npx jest tests/unit/kanban.controller.test.js`
  - `npx jest tests/integration/kanban.routes.test.js`
- Rodar por nome de teste:
  - `npx jest -t "updateKanbanBoardVisibility"`

## Arquivos adicionados/ajustados
- `tests/unit/kanban.controller.test.js`
  - Novos cenários de visibilidade e permissões.
- `tests/integration/kanban.routes.test.js`
  - Novo endpoint `/api/kanban/boards/:id/visibility` com 401 e 200.
- `tests/helpers/fixtures.js`
  - Utilitário `queueDbResponses` para mocks em sequência.

## Cenários cobertos
- `GET /api/kanban/tasks`
  - Owner vê todas as tasks.
  - Membro com board PRIVATE vê somente atribuídas.
  - Membro com board SHARED vê todas.
  - 403 sem acesso ao board.
- `PUT /api/kanban/tasks/:id`
  - Membro não pode editar `title/description/type/assignedUser` (403).
  - Membro pode editar `dueDate/duration/checklist` (200).
  - Criador pode editar `title/description/type` na própria task (200).
- `DELETE /api/kanban/tasks/:id`
  - Membro não autorizado (403).
  - Owner (e criador) pode deletar (204).
- `PUT /api/kanban/boards/:id/visibility`
  - Owner troca PRIVATE/SHARED (200).
  - Não-owner (403).
  - Payload inválido (400).
- Integração:
  - 401 sem token.
  - 200 com token válido em rotas críticas.

## Tokens JWT de teste
Para integrações com `auth_middleware`:
1. Defina `process.env.JWT_SECRET = 'test-secret'`.
2. Gere token com `jwt.sign({ user_id: 1 }, process.env.JWT_SECRET)`.
3. Envie no header:
   - `Authorization: Bearer <token>`

## Como os mocks funcionam
- Unit tests mockam `executeDatabaseQuery` para isolar a regra de negócio.
- Use `queueDbResponses(executeDatabaseQuery, [...])` para simular a sequência de queries.
- Integração usa `createTestApp` (Express sem `listen`) e mocks do DB.

## Boas práticas do projeto
- Unit tests não devem acessar DB real.
- Não usar rede, email ou Google em unit tests (mockar).
- Validar sempre `status` e `body`.
- Nomes de testes descritivos (sem variáveis de 1 letra).
- Sem flakiness: evite timers e efeitos colaterais.
