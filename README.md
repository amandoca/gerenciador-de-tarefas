# 📑 Documentação Técnica — Kanban Tarefando

Bem-vindo à documentação oficial do **Kanban Tarefando**!

Este documento cobre a arquitetura, as principais funcionalidades, fluxos, decisões técnicas e pontos de integração do projeto, para referência de desenvolvedores, equipe de QA e avaliadores do desafio técnico.

---

## 📚 Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura & Tecnologias](#arquitetura-e-tecnologias)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Estrutura de Pastas](#estrutura-de-pastas)
5. [Fluxos da Aplicação](#fluxos-da-aplicação)
6. [Persistência de Dados](#persistência-de-dados)
7. [Boas Práticas e Convenções](#boas-práticas-e-convenções)
8. [Deploy e Execução Local](#deploy-e-execução-local)

---

## 1. 🎯 Visão Geral

O **Kanban Tarefando** é uma SPA (Single Page Application) para gerenciamento de tarefas baseada no método Kanban, com interface moderna, foco em usabilidade e uso de recursos modernos de front-end. É ideal para equipes pequenas e profissionais autônomos.

A nova versão utiliza **back-end real**, com API Node.js + MySQL, garantindo persistência no banco de dados, autenticação JWT e isolamento das tarefas por usuário.

---

## 2. 🏗️ Arquitetura e Tecnologias

### **Front-end**

* Vue.js 3
* Vite
* Vue Draggable
* Axios
* CSS3 (mobile-first)

### **Back-end (NOVO)**

* Node.js + Express
* MySQL
* JWT (autenticação)
* bcryptjs
* dotenv
* mysql2 (promise)
* CORS

### **Integrações**

* Google Auth (opcional)
* API REST própria
* Notificações nativas

---

## 3. ⚙️ Funcionalidades Principais

### 🔒 Autenticação

* Login com email e senha
* JWT armazenado no navegador
* Rotas protegidas no back-end
* Cada usuário só vê suas próprias tarefas

### 📋 Gerenciamento de Tarefas

* Criar, editar e excluir tarefas
* Arrastar (drag & drop) entre colunas
* Adicionar descrição, prazo e checklist
* Atribuir responsáveis (opcional)

### 🔍 Busca & Filtros

* Filtro por usuário
* Busca em tempo real por título/descrição

### 🚨 Notificações

* Toast para eventos importantes

---

## 4. 📁 Estrutura de Pastas

```
📦 src/
 ┣ 📂assets/          # Imagens e recursos visuais
 ┣ 📂components/      # Componentes Vue (Sidebar, Header, TaskModal...)
 ┣ 📂views/           # Páginas principais (Login, Kanban, etc)
 ┣ 📂services/        # API, auth, tasks
 ┣ 📜 App.vue         # Raiz da aplicação
 ┣ 📜 main.js         # Bootstrap do projeto
```

---

## 5. 🔄 Fluxos da Aplicação

### Login

* Usuário acessa a tela de login
* Envia email/senha para a API
* Se válido → recebe token JWT
* Token é enviado automaticamente pelo Axios

### Tarefas

* Botão “+ Adicionar Tarefa” abre modal
* Dados são enviados para `/api/kanban/tasks`
* Sistema salva no banco e retorna a task
* Tarefa aparece instantaneamente no quadro

### Drag & Drop

* Trocar de coluna envia PUT `/api/kanban/tasks/:id`

### Busca/Filtro

* Filtro e busca são aplicados apenas no front

---

## 6. 💾 Persistência de Dados

### 🌐 **Agora persistência é REAL via API + MySQL.**

O localStorage ficou restrito a:

* Token JWT
* Usuário logado
* Preferências visuais (ex.: background)

### 🗄️ Estrutura do Banco de Dados (MySQL)

**USERS**

* ID, NAME, EMAIL, PASSWORD_HASH

**KANBAN_COLUMNS**

* ID, NAME, ORDER_INDEX

**KANBAN_TASKS**

* ID, USER_ID, TITLE, DESCRIPTION, DUE_DATE, COLUMN_ID, ASSIGNED_USER_ID

**KANBAN_TASK_CHECKLIST_ITEMS**

* ID, TASK_ID, TEXT, COMPLETED

### 🔐 Importante

Cada tarefa está vinculada ao usuário autenticado através de `USER_ID` do token JWT.

---

## 7. 🧹 Boas Práticas e Convenções

* Componentização e reuso de lógica
* Controllers enxutos
* Queries parametrizadas (evita SQL Injection)
* Nomenclatura clara e padronizada
* Commits organizados
* Uso de .env e variáveis seguras
* Hash seguro de senhas

---

## 8. 🚀 Deploy e Execução Local

### 📦 **Back-end**

```bash
cd backend
npm install
npm run dev
```

API iniciará em: **[http://localhost:4000](http://localhost:4000)**

### 💻 **Front-end**

```bash
cd frontend
npm install
npm run serve
```

Acesse em: **[http://localhost:8080](http://localhost:8080)**

### ⚙️ Build de Produção (front-end)

```bash
npm run build
```

Gera pastas otimizadas em `/dist`.

---

**Desenvolvido para desafio técnico — versão com banco de dados MySQL e API real.**
