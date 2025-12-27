# Tarefando - Gerenciador de Tarefas Kanban

Aplicação web full stack para gerenciamento de tarefas com método Kanban, colaboração entre usuários e autenticação.

## Sobre o projeto

O Tarefando permite organizar tarefas em colunas, mover cards por drag and drop, acompanhar prazos, usar checklists e compartilhar boards com outros usuários.

## Funcionalidades

- Criar, editar e excluir tarefas
- Arrastar e soltar cards entre colunas
- Criar checklists dentro das tarefas
- Definir prazos e duração
- Buscar e filtrar tarefas
- Autenticação com JWT
- Personalizar background por usuário
- Convidar usuários para boards
- Atribuir tarefas a membros
- Reset de senha por e-mail com SMTP opcional

## Tecnologias

Front-end:

- Vue.js 3
- Vite
- Vue Draggable
- Axios
- Cypress

Back-end:

- Node.js
- Express
- MySQL ou MariaDB
- JWT
- Jest
- Docker

## Estrutura

```text
backend/   API, banco de dados e testes do backend
frontend/  Aplicação Vue.js e testes E2E
docs/      Documentação do projeto
```

Mais detalhes estão em:

```text
docs/ESTRUTURA.md
```

## Pré-requisitos

- Docker
- Docker Compose

## Executando com Docker

```bash
docker-compose up -d --build
```

Acessos locais:

```text
Web: http://localhost:8080
API: http://localhost:4000
```

Para parar:

```bash
docker-compose down
```

## Variáveis de ambiente

Arquivos `.env` reais não devem ser enviados ao GitHub.

Backend:

```bash
cp backend/.env.docker.example backend/.env.docker
cp backend/.env.local.example backend/.env.local
```

Frontend:

```bash
cp frontend/.env.example frontend/.env
```

## Testes

Backend:

```bash
cd backend
npm test
```

Frontend E2E:

```bash
cd frontend
npm run e2e:open
```

## Consultas SQL

Consultas úteis para debug e análise estão em:

```text
backend/database/consultas_uteis.sql
```
