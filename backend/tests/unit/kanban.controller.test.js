jest.mock('../../src/config/database_connection', () => ({
  executeDatabaseQuery: jest.fn()
}))

const { executeDatabaseQuery } = require('../../src/config/database_connection')

const {
  getKanbanColumns,
  getKanbanUsers,
  getKanbanTasks,
  createKanbanTask,
  updateKanbanTask,
  moveKanbanTask,
  deleteKanbanTask,
  addBoardMember,
  getKanbanBoards,
  getKanbanPreferences,
  updateKanbanPreferences,
  createKanbanBoard,
  updateKanbanBoardVisibility,
  renameKanbanBoard,
  deleteKanbanBoard
} = require('../../src/controllers/kanban.controller')

const { createMockResponse } = require('../helpers/mockResponse')
const { createMockRequest, queueDbResponses } = require('../helpers/fixtures')

describe('kanban.controller', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getKanbanColumns', () => {
    it('returns columns for accessible board', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5 }],
        [{ id: 1, name: 'A Fazer', order_index: 1 }]
      ])

      await getKanbanColumns(request, response)

      expect(response.json).toHaveBeenCalledWith([
        { id: 1, name: 'A Fazer', order_index: 1 }
      ])
    })

    it('returns 403 when user has no access to board', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await getKanbanColumns(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You do not have access to this board.'
      })
    })
  })

  describe('getKanbanUsers', () => {
    it('converts isOwner to boolean', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5 }],
        [
          { id: 1, name: 'Ana', email: 'ana@test.com', isOwner: 1 },
          { id: 2, name: 'Bruno', email: 'b@test.com', isOwner: 0 }
        ]
      ])

      await getKanbanUsers(request, response)

      expect(response.json).toHaveBeenCalledWith([
        { id: 1, name: 'Ana', email: 'ana@test.com', isOwner: true },
        { id: 2, name: 'Bruno', email: 'b@test.com', isOwner: false }
      ])
    })

    it('returns 403 when user has no access to board', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await getKanbanUsers(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You do not have access to this board.'
      })
    })
  })

  describe('getKanbanTasks', () => {
    it('returns tasks with boolean checklist values', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5 }],
        [
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
        ],
        [{ id: 100, taskId: 10, text: 'Check', completed: 0 }]
      ])

      await getKanbanTasks(request, response)

      expect(response.json).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 10,
          checklist: [{ id: 100, text: 'Check', completed: false }]
        })
      ])
    })

    it('returns all tasks for owner (including tasks assigned to others)', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5 }],
        [
          {
            id: 10,
            userId: 2,
            boardId: 5,
            title: 'Task A',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 2,
            type: 'tarefa'
          },
          {
            id: 11,
            userId: 3,
            boardId: 5,
            title: 'Task B',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 3,
            assignedUser: 3,
            type: 'bug'
          }
        ],
        []
      ])

      await getKanbanTasks(request, response)

      expect(response.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 10 }),
          expect.objectContaining({ id: 11 })
        ])
      )
    })

    it('returns only assigned tasks for member on PRIVATE board', async () => {
      const request = createMockRequest({
        user: { user_id: 2 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5 }],
        [
          {
            id: 20,
            userId: 1,
            boardId: 5,
            title: 'Task Assigned',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 2,
            type: 'tarefa'
          }
        ],
        []
      ])

      await getKanbanTasks(request, response)

      expect(response.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: 20 })
      ])
    })

    it('returns all tasks for member on SHARED board', async () => {
      const request = createMockRequest({
        user: { user_id: 2 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5 }],
        [
          {
            id: 30,
            userId: 1,
            boardId: 5,
            title: 'Task Owner',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 1,
            type: 'tarefa'
          },
          {
            id: 31,
            userId: 2,
            boardId: 5,
            title: 'Task Member',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 3,
            assignedUser: 2,
            type: 'bug'
          }
        ],
        []
      ])

      await getKanbanTasks(request, response)

      expect(response.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 30 }),
          expect.objectContaining({ id: 31 })
        ])
      )
    })

    it('returns 403 when user has no access to board', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        query: { boardId: 5 }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await getKanbanTasks(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You do not have access to this board.'
      })
    })
  })

  describe('createKanbanTask', () => {
    it('returns 400 when title is missing', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: { columnId: 2 }
      })
      const response = createMockResponse()

      await createKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Title is required.'
      })
    })

    it('returns 403 when user has no access to column/board', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: { title: 'Task', columnId: 2 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [[{ ID: 1 }], []])

      await createKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You do not have access to this column/board.'
      })
    })

    it('creates task with checklist boolean values', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: {
          title: 'Task',
          columnId: 2,
          assignedUser: 3,
          checklist: [
            { text: 'Item 1', completed: true },
            { text: 'Item 2', completed: false }
          ],
          type: 'bug'
        }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 1 }],
        [{ boardId: 9 }],
        [{ ID: 3 }],
        {},
        { insertId: 55 },
        {},
        {},
        [
          {
            id: 55,
            userId: 1,
            boardId: 9,
            title: 'Task',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 3,
            type: 'bug'
          }
        ],
        [
          { id: 1, taskId: 55, text: 'Item 1', completed: 1 },
          { id: 2, taskId: 55, text: 'Item 2', completed: 0 }
        ]
      ])

      await createKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 55,
          checklist: [
            { id: 1, text: 'Item 1', completed: true },
            { id: 2, text: 'Item 2', completed: false }
          ]
        })
      )
    })
  })

  describe('updateKanbanTask', () => {
    it('returns 403 when user has no access to task', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '7' },
        body: { title: 'Task' }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await updateKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You do not have access to this task.'
      })
    })

    it('returns 400 when column does not belong to board', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '7' },
        body: { title: 'Task', columnId: 99 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [
          {
            taskId: 7,
            boardId: 2,
            taskCreatorId: 1,
            boardOwnerId: 1,
            boardVisibility: 'PRIVATE'
          }
        ],
        [
          {
            title: 'Task',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 1,
            type: 'tarefa'
          }
        ],
        []
      ])

      await updateKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Invalid column for this board.'
      })
    })

    it('updates task and returns checklist with boolean values', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '7' },
        body: {
          title: 'Atualizada',
          columnId: 3,
          assignedUser: 4,
          checklist: [{ text: 'Check', completed: true }],
          type: 'bug'
        }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [
          {
            taskId: 7,
            boardId: 2,
            taskCreatorId: 1,
            boardOwnerId: 1,
            boardVisibility: 'PRIVATE'
          }
        ],
        [
          {
            title: 'Task',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 1,
            type: 'tarefa'
          }
        ],
        [{ ID: 3 }],
        [{ ID: 4 }],
        {},
        { affectedRows: 1 },
        {},
        {},
        [
          {
            id: 7,
            userId: 1,
            boardId: 2,
            title: 'Atualizada',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 3,
            assignedUser: 4,
            type: 'bug'
          }
        ],
        [{ id: 1, taskId: 7, text: 'Check', completed: 1 }]
      ])

      await updateKanbanTask(request, response)

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          checklist: [{ id: 1, text: 'Check', completed: true }]
        })
      )
    })

    it('returns 403 when member tries to edit forbidden fields', async () => {
      const request = createMockRequest({
        user: { user_id: 2 },
        params: { id: '7' },
        body: { title: 'Hack', assignedUser: 4 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [
          {
            taskId: 7,
            boardId: 2,
            taskCreatorId: 1,
            boardOwnerId: 1,
            boardVisibility: 'PRIVATE'
          }
        ]
      ])

      await updateKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You cannot edit the following fields: title, assignedUser'
      })
    })

    it('allows member to edit dueDate, duration, and checklist', async () => {
      const request = createMockRequest({
        user: { user_id: 2 },
        params: { id: '7' },
        body: {
          dueDate: '2026-03-03',
          duration: '01:30',
          checklist: [{ text: 'Check', completed: false }]
        }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [
          {
            taskId: 7,
            boardId: 2,
            taskCreatorId: 1,
            boardOwnerId: 1,
            boardVisibility: 'PRIVATE'
          }
        ],
        [
          {
            title: 'Task',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 1,
            type: 'tarefa'
          }
        ],
        { affectedRows: 1 },
        {},
        {},
        [
          {
            id: 7,
            userId: 1,
            boardId: 2,
            title: 'Task',
            description: '',
            dueDate: '2026-03-03',
            duration: '01:30',
            columnId: 2,
            assignedUser: 1,
            type: 'tarefa'
          }
        ],
        [{ id: 1, taskId: 7, text: 'Check', completed: 0 }]
      ])

      await updateKanbanTask(request, response)

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          checklist: [{ id: 1, text: 'Check', completed: false }]
        })
      )
    })

    it('allows creator to edit title, description, and type on own task', async () => {
      const request = createMockRequest({
        user: { user_id: 2 },
        params: { id: '7' },
        body: {
          title: 'Atualizada',
          description: 'Desc',
          type: 'bug'
        }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [
          {
            taskId: 7,
            boardId: 2,
            taskCreatorId: 2,
            boardOwnerId: 1,
            boardVisibility: 'PRIVATE'
          }
        ],
        [
          {
            title: 'Task',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 1,
            type: 'tarefa'
          }
        ],
        { affectedRows: 1 },
        [
          {
            id: 7,
            userId: 2,
            boardId: 2,
            title: 'Atualizada',
            description: 'Desc',
            dueDate: null,
            duration: null,
            columnId: 2,
            assignedUser: 1,
            type: 'bug'
          }
        ],
        []
      ])

      await updateKanbanTask(request, response)

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          title: 'Atualizada',
          description: 'Desc',
          type: 'bug'
        })
      )
    })
  })

  describe('moveKanbanTask', () => {
    it('returns 400 when columnId is missing', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '7' },
        body: {}
      })
      const response = createMockResponse()

      await moveKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'columnId is required.'
      })
    })

    it('moves task and returns updated task', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '7' },
        body: { columnId: 3 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ taskId: 7, boardId: 2 }],
        [{ ID: 3 }],
        { affectedRows: 1 },
        [
          {
            id: 7,
            userId: 1,
            boardId: 2,
            title: 'Task',
            description: '',
            dueDate: null,
            duration: null,
            columnId: 3,
            assignedUser: 1,
            type: 'tarefa'
          }
        ],
        [{ id: 1, taskId: 7, text: 'Check', completed: 0 }]
      ])

      await moveKanbanTask(request, response)

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          checklist: [{ id: 1, text: 'Check', completed: false }]
        })
      )
    })
  })

  describe('deleteKanbanTask', () => {
    it('returns 403 when user has no access to task', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '7' }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await deleteKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You do not have access to this task.'
      })
    })

    it('returns 403 when member is not owner or creator', async () => {
      const request = createMockRequest({
        user: { user_id: 2 },
        params: { id: '7' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [
          {
            taskId: 7,
            boardId: 2,
            taskCreatorId: 3,
            boardOwnerId: 1,
            boardVisibility: 'PRIVATE'
          }
        ]
      ])

      await deleteKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You can only delete tasks you created or boards you own.'
      })
    })

    it('returns 204 when task is deleted', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '7' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [
          {
            taskId: 7,
            boardId: 2,
            taskCreatorId: 1,
            boardOwnerId: 1,
            boardVisibility: 'PRIVATE'
          }
        ],
        {},
        { affectedRows: 1 }
      ])

      await deleteKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(204)
      expect(response.send).toHaveBeenCalled()
    })

    it('returns 204 when creator deletes own task', async () => {
      const request = createMockRequest({
        user: { user_id: 2 },
        params: { id: '7' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [
          {
            taskId: 7,
            boardId: 2,
            taskCreatorId: 2,
            boardOwnerId: 1,
            boardVisibility: 'PRIVATE'
          }
        ],
        {},
        { affectedRows: 1 }
      ])

      await deleteKanbanTask(request, response)

      expect(response.status).toHaveBeenCalledWith(204)
      expect(response.send).toHaveBeenCalled()
    })
  })

  describe('updateKanbanBoardVisibility', () => {
    it('returns 400 when payload is invalid', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '5' },
        body: { visibility: 'PUBLIC' }
      })
      const response = createMockResponse()

      await updateKanbanBoardVisibility(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'visibility must be PRIVATE or SHARED.'
      })
    })

    it('returns 403 when user is not owner', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '5' },
        body: { visibility: 'SHARED' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [[{ ID: 5, OWNER_USER_ID: 2 }]])

      await updateKanbanBoardVisibility(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Only the owner can change board visibility.'
      })
    })

    it('updates visibility when owner', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '5' },
        body: { visibility: 'SHARED' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5, OWNER_USER_ID: 1 }],
        {}
      ])

      await updateKanbanBoardVisibility(request, response)

      expect(response.json).toHaveBeenCalledWith({
        message: 'Board visibility updated.',
        id: 5,
        visibility: 'SHARED'
      })
    })
  })

  describe('addBoardMember', () => {
    it('returns 400 when email is missing', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: { boardId: 5 }
      })
      const response = createMockResponse()

      await addBoardMember(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Email é obrigatório.'
      })
    })

    it('returns 403 when user is not the board owner', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: { email: 'member@test.com', boardId: 5 }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([
        { ID: 5, OWNER_USER_ID: 2 }
      ])

      await addBoardMember(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Apenas o Criador pode convidar pessoas.'
      })
    })

    it('adds member when user is owner', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: { email: 'member@test.com', boardId: 5 }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5, OWNER_USER_ID: 1 }],
        [{ ID: 3, NAME: 'Membro', EMAIL: 'member@test.com' }],
        {}
      ])

      await addBoardMember(request, response)

      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Membro adicionado com sucesso.',
        member: { id: 3, name: 'Membro', email: 'member@test.com' }
      })
    })
  })

  describe('getKanbanBoards', () => {
    it('returns boards list', async () => {
      const request = createMockRequest({ user: { user_id: 1 } })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([
        { id: 1, name: 'Board', ownerUserId: 1 }
      ])

      await getKanbanBoards(request, response)

      expect(response.json).toHaveBeenCalledWith([
        { id: 1, name: 'Board', ownerUserId: 1 }
      ])
    })

    it('returns 500 when database fails', async () => {
      const request = createMockRequest({ user: { user_id: 1 } })
      const response = createMockResponse()

      executeDatabaseQuery.mockRejectedValueOnce(new Error('db failed'))

      await getKanbanBoards(request, response)

      expect(response.status).toHaveBeenCalledWith(500)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Failed to fetch boards.'
      })
    })
  })

  describe('getKanbanPreferences', () => {
    it('returns nulls when no preferences found', async () => {
      const request = createMockRequest({ user: { user_id: 1 } })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await getKanbanPreferences(request, response)

      expect(response.json).toHaveBeenCalledWith({
        lastBoardId: null,
        backgroundId: null
      })
    })

    it('returns 500 when database fails', async () => {
      const request = createMockRequest({ user: { user_id: 1 } })
      const response = createMockResponse()

      executeDatabaseQuery.mockRejectedValueOnce(new Error('db failed'))

      await getKanbanPreferences(request, response)

      expect(response.status).toHaveBeenCalledWith(500)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Failed to fetch preferences.'
      })
    })
  })

  describe('updateKanbanPreferences', () => {
    it('returns 400 when nothing to update', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: {}
      })
      const response = createMockResponse()

      await updateKanbanPreferences(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Nothing to update. Send lastBoardId and/or backgroundId.'
      })
    })

    it('returns 403 when user has no access to board', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: { lastBoardId: 9 }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await updateKanbanPreferences(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'You do not have access to this board.'
      })
    })

    it('updates preferences successfully', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: { lastBoardId: 9, backgroundId: 'bg-1' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [[{ ID: 9 }], {}])

      await updateKanbanPreferences(request, response)

      expect(response.json).toHaveBeenCalledWith({
        message: 'Preferences updated.',
        lastBoardId: 9,
        backgroundId: 'bg-1'
      })
    })
  })

  describe('createKanbanBoard', () => {
    it('returns 400 when board name is missing', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: {}
      })
      const response = createMockResponse()

      await createKanbanBoard(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Board name is required.'
      })
    })

    it('creates board and returns payload', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        body: { name: 'Novo' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        { insertId: 7 },
        {},
        {},
        {},
        [
          {
            id: 7,
            name: 'Novo',
            ownerUserId: 1,
            ownerName: 'Ana',
            createdAt: '2024-01-01'
          }
        ]
      ])

      await createKanbanBoard(request, response)

      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith({
        id: 7,
        name: 'Novo',
        ownerUserId: 1,
        ownerName: 'Ana',
        createdAt: '2024-01-01'
      })
    })
  })

  describe('renameKanbanBoard', () => {
    it('returns 403 when user is not owner', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '5' },
        body: { name: 'Renomeado' }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([
        { ID: 5, OWNER_USER_ID: 2 }
      ])

      await renameKanbanBoard(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Only the owner can rename this board.'
      })
    })

    it('renames board when user is owner', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '5' },
        body: { name: 'Renomeado' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5, OWNER_USER_ID: 1 }],
        {},
        [
          {
            id: 5,
            name: 'Renomeado',
            ownerUserId: 1,
            ownerName: 'Ana',
            createdAt: '2024-01-01'
          }
        ]
      ])

      await renameKanbanBoard(request, response)

      expect(response.json).toHaveBeenCalledWith({
        id: 5,
        name: 'Renomeado',
        ownerUserId: 1,
        ownerName: 'Ana',
        createdAt: '2024-01-01'
      })
    })
  })

  describe('deleteKanbanBoard', () => {
    it('returns 400 when boardId is missing', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: {}
      })
      const response = createMockResponse()

      await deleteKanbanBoard(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'boardId is required.'
      })
    })

    it('returns 403 when user is not owner', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '5' }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([
        { ID: 5, OWNER_USER_ID: 2 }
      ])

      await deleteKanbanBoard(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Only the owner can delete this board.'
      })
    })

    it('deletes board and returns 204', async () => {
      const request = createMockRequest({
        user: { user_id: 1 },
        params: { id: '5' }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5, OWNER_USER_ID: 1 }],
        {},
        {},
        {},
        {},
        {},
        {}
      ])

      await deleteKanbanBoard(request, response)

      expect(response.status).toHaveBeenCalledWith(204)
      expect(response.send).toHaveBeenCalled()
    })
  })
})
