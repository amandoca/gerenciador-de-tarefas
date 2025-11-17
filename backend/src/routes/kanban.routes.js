// src/routes/kanban.routes.js
const express = require('express')
const {
  getKanbanColumns,
  getKanbanUsers,
  getKanbanTasks,
  createKanbanTask,
  updateKanbanTask,
  deleteKanbanTask
} = require('../controllers/kanban.controller')

const kanbanRouter = express.Router()

// Colunas do quadro
kanbanRouter.get('/columns', getKanbanColumns)

// Usuários (para atribuir tarefas)
kanbanRouter.get('/users', getKanbanUsers)

// Tarefas
kanbanRouter.get('/tasks', getKanbanTasks)
kanbanRouter.post('/tasks', createKanbanTask)
kanbanRouter.put('/tasks/:id', updateKanbanTask)
kanbanRouter.delete('/tasks/:id', deleteKanbanTask)

module.exports = kanbanRouter
