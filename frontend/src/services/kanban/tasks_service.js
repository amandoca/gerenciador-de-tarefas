import api from '@/services/api'

export async function fetchTasks(boardId) {
  const response = await api.get(`/kanban/tasks?boardId=${boardId}`)
  return Array.isArray(response.data) ? response.data : []
}

export async function createTask(task) {
  const response = await api.post('/kanban/tasks', task)
  return response.data
}

export async function updateTask(taskId, data) {
  const response = await api.put(`/kanban/tasks/${taskId}`, data)
  return response.data
}

export async function deleteTask(taskId) {
  await api.delete(`/kanban/tasks/${taskId}`)
}

export async function moveTask(taskId, columnId) {
  const response = await api.put(`/kanban/tasks/${taskId}/move`, { columnId })
  return response.data
}
