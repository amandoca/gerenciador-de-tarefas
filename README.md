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

---

## 2. 🏗️ Arquitetura e Tecnologias

- **Framework:** Vue.js 3
- **Build Tool:** Vite
- **Drag & Drop:** Vue Draggable
- **Notificações:** Vue Toastification
- **Armazenamento Local:** localStorage
- **Estilização:** CSS3 com abordagem mobile-first e componentes reutilizáveis
- **Integrações:** Google Auth, API REST, Push Notifications

---

## 3. ⚙️ Funcionalidades Principais

### 🔒 Autenticação

- Login local (mock/real) com email e senha
- Login Google com OAuth

### 📋 Gerenciamento de Tarefas

- Criar, editar, excluir tarefas
- Organizar tarefas em quadros e colunas (Kanban)
- Atribuir tarefas a usuários
- Adicionar descrição, prazo, checklist e tipo (tarefa, história, bug)
- Checklist com barra de progresso visual
- Drag & drop entre colunas

### 🔍 Busca & Filtros

- Busca em tempo real por título/descrição
- Filtro de tarefas por responsável

### 🚨 Notificações

- Notificação toast para eventos importantes (conclusão, exclusão, etc)

---

## 4. 📁 Estrutura de Pastas

```
📦 src/
 ┣ 📂assets/          # Imagens e recursos visuais
 ┣ 📂components/      # Componentes Vue (Sidebar, Header, TaskModal...)
 ┣ 📂views/           # Páginas principais (Login, Kanban, etc)
 ┣ 📜 App.vue         # Raiz da aplicação
 ┣ 📜 main.js         # Bootstrap do projeto
```

---

## 5. 🔄 Fluxos da Aplicação

### Login

- Usuário acessa a tela de login
- Validação local (mock) ou integração com Google
- Usuário autenticado acessa o Kanban

### Tarefas

- Botão “+ Adicionar Tarefa” abre modal de criação
- Modal permite cadastrar todos os campos relevantes
- Tarefa é salva no localStorage e aparece instantaneamente
- Edição/exclusão também via modal

### Drag & Drop

- Usuário pode arrastar tarefas entre colunas

### Busca/Filtro

- Barra de busca filtra tarefas em tempo real
- Filtros de usuário destacam cards atribuídos

---

## 6. 💾 Persistência de Dados

- **localStorage:** Todas as tarefas e preferências (background, usuário logado, etc.) são persistidas localmente no navegador.
- **Mock API:** Pode ser facilmente acoplada a uma API REST real, seguindo contrato de dados do frontend.
- **Estrutura dos dados de tarefa:**

```js
{
  id: Number,
  title: String,
  description: String,
  dueDate: String (YYYY-MM-DD),
  assignedUser: String (userId),
  columnId: String,
  type: 'tarefa' | 'historia' | 'bug',
  checklist: [
    { text: String, completed: Boolean }
  ]
}
```

---

## 7. 🧹 Boas Práticas e Convenções

- Componentização e reuso de lógica
- Código documentado, nomeação clara
- Separação de responsabilidades (views, components, utils, services)
- Validações client-side para inputs do usuário
- Padrão de commit e branch para PRs

---

## 8. 🚀 Deploy e Execução Local

### Instalação e Execução

1. Clone o repositório: `git clone ...`
2. Instale dependências: `npm install`
3. Rode localmente: `npm run dev`
4. Acesse em: [http://localhost:8080](http://localhost:8080)

### Build para produção

- `npm run build` gera versão otimizada em `/dist`

---

**Desenvolvido para desafio técnico**
