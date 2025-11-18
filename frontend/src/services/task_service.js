// src/services/task_service.js
import api from './api'

export async function fetchTasks() {
  const response = await api.get('/kanban/tasks')
  return response.data
}

export async function createTask(task) {
  const response = await api.post('/kanban/tasks', task)
  return response.data
}

export async function updateTask(id, data) {
  const response = await api.put(`/kanban/tasks/${id}`, data)
  return response.data
}

export async function deleteTask(id) {
  await api.delete(`/kanban/tasks/${id}`)
}

export async function moveTask(id, columnId) {
  const response = await api.put(`/kanban/tasks/${id}/move`, { columnId })
  return response.data
}
