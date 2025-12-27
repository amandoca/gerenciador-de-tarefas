import api from '@/services/api'

export async function fetchBoardUsers(boardId) {
  const response = await api.get(`/kanban/users?boardId=${boardId}`)
  return Array.isArray(response.data) ? response.data : []
}

export async function addBoardMember(email, boardId) {
  const response = await api.post('/kanban/members', { email, boardId })
  return response.data
}
