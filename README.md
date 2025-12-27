# 📋 Tarefando - Gerenciador de Tarefas Kanban

Aplicação web para gerenciamento de tarefas usando o método Kanban, com interface moderna, intuitiva e colaborativa.

---

## 🎯 Sobre o Projeto

O **Tarefando** é um gerenciador de tarefas visual que permite organizar atividades em colunas (A Fazer, Em Progresso, Concluído), arrastar cards entre elas e acompanhar o progresso das tarefas de forma individual ou em equipe.

A aplicação suporta **colaboração entre usuários**, permitindo compartilhar boards e atribuir tarefas para outras pessoas.

---

## ✨ Funcionalidades

- Criar, editar e excluir tarefas
- Drag & drop (arrastar e soltar) entre colunas
- Checklist dentro das tarefas
- Definir prazos e duração
- Busca e filtros em tempo real
- Autenticação com JWT
- Personalização de background por usuário
- Reset de senha via e-mail (opcional / Mailtrap)

### 👥 Colaboração e Compartilhamento

- Convidar usuários para o board pelo e-mail
- Usuários convidados viram **membros do board**
- Atribuir tarefas a outros usuários
- Board compartilhado aparece com indicação **“compartilhado por …”**
- **Privacidade:** membro vê apenas tarefas atribuídas a ele (owner vê tudo)

---

## 🛠️ Tecnologias

**Front-end**
- Vue.js 3
- Vite
- Vue Draggable
- Axios

**Back-end**
- Node.js
- Express
- MySQL (MariaDB)
- JWT (autenticação)
- Docker

---

## ✅ Pré-requisitos

- Docker e Docker Compose instalados

---

## 🚀 Primeira execução

### 1) Clonar e subir o projeto

```bash
git clone <url-do-repositorio>
cd tarefando
docker-compose up -d --build
```

### 2) Acessar

- **Web:** http://localhost:8080
- **API:** http://localhost:4000

### 3) Parar

```bash
docker-compose down
```

---

## 🔐 Variáveis de ambiente

### Por que não sobe `.env` no GitHub?

Arquivos `.env` podem conter **segredos** (JWT secret, SMTP, senhas).
No repositório, mantemos apenas arquivos de exemplo sem segredos.

### Backend

Criar o `.env.docker` local (recomendado):

```bash
cp backend/.env.docker.example backend/.env.docker
```

> Sem SMTP, o projeto continua funcionando.
> Apenas o reset de senha por e-mail pode não enviar mensagem.

### Frontend

O front pode funcionar sem Google Login, mas se você quiser testar o botão de login com Google, precisa configurar o `.env` do frontend.

Criar o `.env` local (recomendado):

```bash
cp frontend/.env.example frontend/.env
```

Exemplo de variável usada:

```env
VUE_APP_GOOGLE_CLIENT_ID=742993712843-7m7uat9lp2g5cbhg1qohoft102q826sj.apps.googleusercontent.com
```

> Observação: o Google Client ID não é uma senha, mas recomenda-se manter o arquivo `.env` fora do Git e subir apenas o `.env.example`.

---

## 🔐 Arquivos recomendados no repositório

### 1) `backend/.env.docker.example`

Crie este arquivo no repositório (sem segredos):

```env
DB_HOST=db
DB_PORT=3306
DB_USER=tarefando_user
DB_PASSWORD=CHANGE_ME
DB_NAME=tarefando_kanban_db

API_PORT=4000
JWT_SECRET=CHANGE_ME_SUPER_SECRET

APP_URL=http://localhost:8080

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=CHANGE_ME
SMTP_PASS=CHANGE_ME
```

### 2) `frontend/.env.example`

Crie este arquivo no repositório (sem segredos):

```env
VUE_APP_GOOGLE_CLIENT_ID=CHANGE_ME
```

---

## 🧭 Primeiro uso

### Criar usuário e primeiro board

1. Abra http://localhost:8080
2. Cadastre um usuário
3. Faça login
4. Após criar a conta, já existe um board padrão chamado “Meu Kanban” para você começar
5. Colunas padrão: A Fazer, Em Progresso, Concluído

### Testar colaboração (com 2 usuários)

1. Crie dois usuários
2. Usuário A é o owner do board
3. Usuário B é o convidado
4. Logue como Usuário A, abra o board e convide o Usuário B pelo e-mail
5. Faça logout e login como Usuário B
6. O board compartilhado deve aparecer na sidebar com subtítulo “compartilhado por {owner}”

### Regra de privacidade (importante)

- **Owner** vê todas as tarefas do board
- **Membro** vê apenas tarefas atribuídas a ele

**Exemplo do que pode acontecer:**
- Se o Usuário B criar uma tarefa no board do Usuário A e atribuir para outra pessoa, a tarefa pode “sumir” para o Usuário B.
- Isso é esperado: membro não vê tarefas que não estão atribuídas a ele.

### Testar o background (wallpaper)

- O background é salvo no backend por usuário (preferences).
- Ao logar em outro PC, o wallpaper deve permanecer.

### Reset de senha (opcional / Mailtrap)

Para testar envio de e-mails:
1. Crie uma conta no Mailtrap (SMTP Sandbox)
2. Preencha no `backend/.env.docker`:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

> Sem Mailtrap, login/cadastro/kanban seguem funcionando normalmente.

---

## ✅ Testes

### Testes unitários (backend)

```bash
cd backend
npx jest tests/unit
```

### Testes E2E (frontend)

```bash
cd frontend
npm run e2e:open
```

---

## 🧾 Consultas úteis (SQL)

Para facilitar debug e análises no banco, existe um arquivo com consultas prontas:

- `backend/database/consultas_uteis.sql`

Ele traz exemplos como:
- Boards com visibilidade e total de membros
- Trocar visibilidade do board
- Tasks atrasadas e próximos prazos
- Visibilidade PRIVATE/SHARED por usuário
- Progresso de checklist

---

## 📁 Estrutura

```
├── frontend/          # Vue.js (porta 8080)
├── backend/           # Node.js API (porta 4000)
├── docker-compose.yml # Orquestração dos containers
└── README.md
```

---

## 📝 Licença

Este projeto foi desenvolvido para fins de estudo e demonstração.
