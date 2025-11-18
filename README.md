# 📑 Documentação Técnica — Kanban Tarefando

Bem-vindo à documentação oficial do **Kanban Tarefando**!

Este documento descreve a arquitetura, as principais funcionalidades, fluxos, decisões técnicas e pontos de integração do projeto, para referência de desenvolvedores e avaliadores do desafio técnico.

---

## 📚 Sumário

1. [Visão Geral](#1--visão-geral)
2. [Arquitetura & Tecnologias](#2--arquitetura-e-tecnologias)
3. [Funcionalidades Principais](#3--funcionalidades-principais)
4. [Estrutura de Pastas](#4--estrutura-de-pastas)
5. [Fluxos da Aplicação](#5--fluxos-da-aplicação)
6. [Persistência de Dados](#6--persistência-de-dados)
7. [Boas Práticas e Convenções](#7--boas-práticas-e-convenções)
8. [Como rodar a stack com Docker](#8--🚀-como-rodar-a-stack-com-docker-banco--api--front-end)
9. [Comandos úteis (alias opcionais)](#9--🛠-comandos-úteis-alias-opcionais)

---

## 1. 🎯 Visão Geral

O **Kanban Tarefando** é uma SPA (Single Page Application) para gerenciamento de tarefas baseada no método Kanban, com interface moderna, foco em usabilidade e uso de recursos atuais de front-end. É ideal para equipes pequenas e profissionais autônomos.

A versão atual utiliza **back-end real**, com API Node.js + MySQL, garantindo persistência no banco de dados, autenticação JWT e isolamento das tarefas por usuário.

---

## 2. 🏗️ Arquitetura e Tecnologias

### **Front-end**

- Vue.js 3
- Vite
- Vue Draggable
- Axios
- CSS3

### **Back-end**

- Node.js + Express
- MySQL
- JWT (autenticação)
- bcryptjs
- dotenv
- mysql2 (promise)
- CORS

### **Integrações**

- Google Auth
- API REST própria
- Notificações nativas

---

## 3. ⚙️ Funcionalidades Principais

### 🔒 Autenticação

- Login com email e senha
- JWT armazenado no navegador
- Rotas protegidas no back-end
- Cada usuário só visualiza suas próprias tarefas

### 📋 Gerenciamento de Tarefas

- Criar, editar e excluir tarefas
- Arrastar (drag & drop) entre colunas
- Adicionar descrição, prazo e checklist
- Atribuir responsáveis

### 🔍 Busca & Filtros

- Filtro por usuário
- Busca em tempo real por título e descrição

### 🚨 Notificações

- Toast para eventos importantes (feedback rápido para o usuário)

---

## 4. 📁 Estrutura de Pastas

```bash
📦 src/
 ┣ 📂assets/          # Imagens e recursos visuais
 ┣ 📂components/      # Componentes Vue (Sidebar, Header, TaskModal...)
 ┣ 📂views/           # Páginas principais (Login, Kanban, etc.)
 ┣ 📂services/        # API, auth, tasks
 ┣ 📜 App.vue         # Raiz da aplicação
 ┣ 📜 main.js         # Bootstrap do projeto
```

---

## 5. 🔄 Fluxos da Aplicação

### Login

- Usuário acessa a tela de login
- Envia email e senha para a API
- Se válido → recebe token JWT
- O token é enviado automaticamente pelo Axios nas próximas requisições

### Tarefas

- Botão **“+ Adicionar Tarefa”** abre um modal
- Dados são enviados para `/api/kanban/tasks`
- O sistema salva no banco e retorna a task criada
- A tarefa aparece imediatamente no quadro Kanban

### Drag & Drop

- A mudança de coluna dispara um `PUT` em `/api/kanban/tasks/:id`

### Busca/Filtro

- Filtro e busca são aplicados apenas no front-end (sem recarga de página)

---

## 6. 💾 Persistência de Dados

### 🌐 API + MySQL

A persistência é feita via API com banco de dados **MySQL**.

O `localStorage` fica restrito a:

- Token JWT
- Dados do usuário logado
- Preferências visuais (ex.: background)

### 🗄️ Estrutura do Banco de Dados (MySQL)

**USERS**

- ID, NAME, EMAIL, PASSWORD_HASH

**KANBAN_COLUMNS**

- ID, NAME, ORDER_INDEX

**KANBAN_TASKS**

- ID, USER_ID, TITLE, DESCRIPTION, DUE_DATE, COLUMN_ID, ASSIGNED_USER_ID

**KANBAN_TASK_CHECKLIST_ITEMS**

- ID, TASK_ID, TEXT, COMPLETED

### 🔐 Importante

Cada tarefa está vinculada ao usuário autenticado por meio do `USER_ID` presente no token JWT.

---

## 7. 🧹 Boas Práticas e Convenções

- Componentização e reuso de lógica
- Controllers enxutos
- Queries parametrizadas (evita SQL Injection)
- Nomenclatura clara e padronizada
- Commits organizados
- Uso de `.env` e variáveis seguras
- Hash seguro de senhas

---

## 8. 🚀 Como rodar a stack com Docker (Banco + API + Front-end)

A stack completa do **Kanban Tarefando** roda via **Docker Compose**, englobando:

- Banco **MariaDB**
- API **Node.js**
- Front-end **Vue**

Tudo isolado em containers, mas funcionando em conjunto.

### 🔧 8.1. Pré-requisitos

Instale em seu sistema:

- **Docker** → [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- **Docker Compose** → já incluído nas versões mais recentes do Docker Desktop

Para conferir se está tudo instalado:

```bash
docker -v
docker compose version
```

### 📦 8.2. Subir a stack (modo padrão)

Na raiz do projeto, execute:

```bash
docker-compose up -d --build
```

Este comando irá:

- Criar o volume do banco (se ainda não existir)
- Subir o container `tarefando-mariadb`
- Subir o container `tarefando-api`
- Subir o container `tarefando-frontend`

Para verificar se está tudo rodando:

```bash
docker ps
```

Você deverá ver algo como:

```bash
tarefando-mariadb   # MySQL rodando
tarefando-api       # API Node rodando na porta 4000
tarefando-frontend  # Vue rodando na porta 8080
```

### 🌐 8.3. Acessando a aplicação

**Front-end:**

```bash
http://localhost:8080
```

**Back-end (health check):**

```bash
http://localhost:4000/health
```

Se o endpoint retornar:

```json
{ "status": "ok" }
```

significa que a API está funcionando corretamente.

### 🛑 8.4. Parando a stack

Para derrubar todos os containers relacionados ao projeto:

```bash
docker-compose down
```

### 🔁 8.5. Reiniciando a stack

Para reiniciar toda a stack sem precisar recriar tudo manualmente:

```bash
docker-compose restart
```

Ou apenas a API:

```bash
docker-compose restart api
```

### 🧹 8.6. Reset completo (APAGA o banco!)

Se precisar limpar tudo, incluindo o volume do banco:

```bash
docker-compose down -v
```

> ⚠️ **Atenção:** este comando remove volumes associados aos containers. Use com cuidado, pois os dados do banco serão apagados.

### 🗄️ 8.7. Acessar o banco manualmente

Para acessar o banco via terminal dentro do container:

```bash
docker exec -it tarefando-mariadb mysql -u root -p
```

---

## 9. 🛠 Comandos úteis (alias opcionais)

Esta seção é **opcional** e voltada para facilitar o dia a dia de quem estiver desenvolvendo ou avaliando o projeto.

Os comandos abaixo são apenas **atalhos (alias)** para os comandos Docker da seção 8.

### 🚀 9.1. Alias recomendados

Você pode adicionar os seguintes alias no seu terminal para encurtar os comandos do Docker Compose:

```bash
alias subir_kanban="docker-compose up -d --build"
alias parar_kanban="docker-compose down"
alias reiniciar_kanban="docker-compose restart"
alias logs_kanban="docker-compose logs -f"
```

#### 📌 O que cada comando faz

- **subir_kanban** → Equivalente a `docker-compose up -d --build` (sobe toda a stack)
- **parar_kanban** → Equivalente a `docker-compose down` (derruba os containers)
- **reiniciar_kanban** → Equivalente a `docker-compose restart` (reinicia a stack)
- **logs_kanban** → Equivalente a `docker-compose logs -f` (mostra os logs em tempo real)

### 📥 9.2. Como habilitar os alias

1. Descubra qual shell está sendo utilizado:

   ```bash
   echo $SHELL
   ```

2. Edite o arquivo de configuração correspondente:

   - **Bash:**

     ```bash
     nano ~/.bashrc
     ```

   - **ZSH:**

     ```bash
     nano ~/.zshrc
     ```

3. Cole os alias no **final** do arquivo.

4. Salve com **Ctrl + O**, pressione **Enter** e saia com **Ctrl + X**.

5. Atualize o terminal para carregar os alias:

   ```bash
   source ~/.bashrc
   ```

   ou

   ```bash
   source ~/.zshrc
   ```

A partir disso, você poderá controlar o ambiente do projeto com comandos mais curtos e descritivos.

---

**Desenvolvido para desafio técnico — versão com banco de dados MySQL e API real.**
