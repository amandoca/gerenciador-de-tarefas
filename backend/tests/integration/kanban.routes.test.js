jest.mock('../../src/config/database_connection', () => ({
  executeDatabaseQuery: jest.fn()
}))

const request = require('supertest')
const jwt = require('jsonwebtoken')
const { createTestApp } = require('../helpers/testApp')
const kanbanRouter = require('../../src/routes/kanban.routes')
const { executeDatabaseQuery } = require('../../src/config/database_connection')

describe('Kanban API routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret'
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('all kanban routes require authentication', async () => {
    const app = createTestApp()

    const cases = [
      { method: 'get', path: '/api/kanban/columns' },
      { method: 'get', path: '/api/kanban/boards' },
      { method: 'get', path: '/api/kanban/preferences' },
      { method: 'put', path: '/api/kanban/preferences', body: {} },
      { method: 'get', path: '/api/kanban/users' },
      { method: 'get', path: '/api/kanban/tasks' },
      { method: 'post', path: '/api/kanban/tasks', body: {} },
      { method: 'post', path: '/api/kanban/members', body: {} },
      { method: 'put', path: '/api/kanban/tasks/1', body: {} },
      { method: 'put', path: '/api/kanban/tasks/1/move', body: {} },
      { method: 'delete', path: '/api/kanban/tasks/1' },
      { method: 'post', path: '/api/kanban/boards', body: {} },
      { method: 'put', path: '/api/kanban/boards/1', body: {} },
      { method: 'put', path: '/api/kanban/boards/1/visibility', body: {} },
      { method: 'delete', path: '/api/kanban/boards/1' }
    ]

    for (const testCase of cases) {
      const httpCall = request(app)[testCase.method](testCase.path)
      const response = testCase.body
        ? await httpCall.send(testCase.body)
        : await httpCall

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ message: 'Missing token' })
    }
  })

  it('does not register duplicate /boards or /boards/:id handlers', () => {
    const stack = kanbanRouter.stack.filter((layer) => layer.route)

    const countRoute = (method, path) =>
      stack.filter(
        (layer) =>
          layer.route.path === path && layer.route.methods[method] === true
      ).length

    expect(countRoute('post', '/boards')).toBe(1)
    expect(countRoute('put', '/boards/:id')).toBe(1)
  })

  it('PUT /api/kanban/boards/:id/visibility returns 200 with token', async () => {
    const app = createTestApp()
    const token = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET)

    executeDatabaseQuery.mockResolvedValueOnce([{ ID: 1, OWNER_USER_ID: 1 }])
    executeDatabaseQuery.mockResolvedValueOnce({})

    const response = await request(app)
      .put('/api/kanban/boards/1/visibility')
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'SHARED' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Board visibility updated.',
      id: 1,
      visibility: 'SHARED'
    })
  })

  it('GET /api/kanban/tasks returns 200 with token', async () => {
    const app = createTestApp()
    const token = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET)

    executeDatabaseQuery.mockResolvedValueOnce([{ ID: 5 }])
    executeDatabaseQuery.mockResolvedValueOnce([
      {
        id: 10,
        userId: 1,
        boardId: 5,
        title: 'Task',
        description: '',
        dueDate: null,
        duration: null,
        columnId: 2,
        assignedUser: 1,
        type: 'tarefa'
      }
    ])
    executeDatabaseQuery.mockResolvedValueOnce([
      { id: 100, taskId: 10, text: 'Check', completed: 0 }
    ])

    const response = await request(app)
      .get('/api/kanban/tasks?boardId=5')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      expect.objectContaining({
        id: 10,
        checklist: [{ id: 100, text: 'Check', completed: false }]
      })
    ])
  })
})
