function createMockRequest(overrides = {}) {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    user: null,
    ...overrides
  }
}

function queueDbResponses(mockFn, responses) {
  responses.forEach((response) => mockFn.mockResolvedValueOnce(response))
}

const fixtures = {
  user: {
    id: 1,
    name: 'Ana',
    email: 'ana@test.com'
  },
  board: {
    id: 5,
    name: 'Board',
    ownerUserId: 1
  },
  task: {
    id: 10,
    boardId: 5,
    columnId: 2,
    title: 'Task'
  }
}

module.exports = {
  createMockRequest,
  queueDbResponses,
  fixtures
}
