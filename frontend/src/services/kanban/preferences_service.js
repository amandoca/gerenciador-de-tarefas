import api from '@/services/api'

export async function fetchPreferences() {
  const response = await api.get('/kanban/preferences')
  return response.data || {}
}

export async function updatePreferences(preferences) {
  const payload = {}

  if (
    preferences &&
    Object.prototype.hasOwnProperty.call(preferences, 'lastBoardId')
  ) {
    payload.lastBoardId = preferences.lastBoardId
  }

  if (
    preferences &&
    Object.prototype.hasOwnProperty.call(preferences, 'backgroundId')
  ) {
    payload.backgroundId = preferences.backgroundId
  }

  if (!Object.keys(payload).length) {
    return null
  }

  const response = await api.put('/kanban/preferences', payload)
  return response.data
}

export function resolveBoardSelection(boards, preferences, loggedUserId) {
  const safeBoards = Array.isArray(boards) ? boards : []

  if (!safeBoards.length) {
    return {
      nextBoardId: null,
      shouldPersist: false
    }
  }

  const lastBoardIdRaw = preferences?.lastBoardId
  const lastBoardId = lastBoardIdRaw ? Number(lastBoardIdRaw) : null

  const hasLastBoard =
    lastBoardId &&
    safeBoards.some((board) => Number(board.id) === Number(lastBoardId))

  const lastBoard = hasLastBoard
    ? safeBoards.find((board) => Number(board.id) === Number(lastBoardId))
    : null

  const isLastBoardOwner =
    lastBoard &&
    Number(lastBoard.ownerUserId) === Number(loggedUserId)

  const ownerBoard = safeBoards.find(
    (board) => Number(board.ownerUserId) === Number(loggedUserId)
  )

  const fallbackId = ownerBoard?.id || safeBoards[0].id
  const nextBoardId =
    hasLastBoard && isLastBoardOwner ? lastBoardId : Number(fallbackId)

  return {
    nextBoardId: nextBoardId ? Number(nextBoardId) : null,
    shouldPersist: (!hasLastBoard || !isLastBoardOwner) && !!nextBoardId
  }
}
