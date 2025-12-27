import api from '@/services/api'

export async function fetchBoards() {
  const response = await api.get('/kanban/boards')
  return Array.isArray(response.data) ? response.data : []
}

export async function createBoard(name) {
  const response = await api.post('/kanban/boards', { name })
  return response.data
}

export async function renameBoard(boardId, name) {
  const response = await api.put(`/kanban/boards/${boardId}`, { name })
  return response.data
}

export async function deleteBoard(boardId) {
  await api.delete(`/kanban/boards/${boardId}`)
}

export async function updateBoardVisibility(boardId, visibility) {
  const response = await api.put(`/kanban/boards/${boardId}/visibility`, {
    visibility
  })
  return response.data
}

export async function fetchBoardColumns(boardId) {
  const response = await api.get(`/kanban/columns?boardId=${boardId}`)
  return Array.isArray(response.data) ? response.data : []
}
