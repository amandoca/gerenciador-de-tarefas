// src/services/tasks.service.js
import api from './api'

export async function getTasks() {
  const response = await api.get('/tasks')
  return response.data // espera um array de tasks
}

export async function updateTaskColumn(id, newStatus) {
  const response = await api.put(`/tasks/${id}`, { status: newStatus })
  return response.data
}
