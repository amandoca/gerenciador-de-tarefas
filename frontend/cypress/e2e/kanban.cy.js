function getBoardIdFromRequest(request) {
  const url = new URL(request.url)
  return Number(url.searchParams.get('boardId'))
}

describe('Quadro e tarefas', () => {
  const user = { id: 5, name: 'Owner', email: 'owner@teste.com' }
  const token = 'token-owner'
  const board = {
    id: 10,
    name: 'Board Principal',
    ownerUserId: user.id,
    ownerName: user.name
  }

  const columns = [
    { id: 101, name: 'A Fazer', order_index: 1 },
    { id: 102, name: 'Em Progresso', order_index: 2 },
    { id: 103, name: 'Concluído', order_index: 3 }
  ]

  let users = [
    { id: user.id, name: user.name, email: user.email, isOwner: 1 }
  ]

  let tasksByBoard = {}
  let nextTaskId = 200

  function seedTasks() {
    tasksByBoard = {
      [board.id]: [
        {
          id: 150,
          title: 'Task Inicial',
          description: '',
          dueDate: null,
          duration: null,
          columnId: 101,
          assignedUser: user.id,
          checklist: [],
          type: 'tarefa'
        }
      ]
    }
    nextTaskId = 200
    users = [
      { id: user.id, name: user.name, email: user.email, isOwner: 1 }
    ]
  }

  function mockKanbanApi() {
    cy.intercept('GET', '**/api/kanban/boards*', [board]).as('getBoards')
    cy.intercept('GET', '**/api/kanban/preferences', {
      lastBoardId: board.id,
      backgroundId: 'mario'
    }).as('getPreferences')
    cy.intercept('PUT', '**/api/kanban/preferences', {
      message: 'Preferences updated.',
      lastBoardId: board.id,
      backgroundId: 'mario'
    }).as('savePreferences')

    cy.intercept('GET', '**/api/kanban/columns*', (request) => {
      request.reply(columns)
    }).as('getColumns')

    cy.intercept('GET', '**/api/kanban/users*', (request) => {
      request.reply(users)
    }).as('getUsers')

    cy.intercept('GET', '**/api/kanban/tasks*', (request) => {
      const boardId = getBoardIdFromRequest(request)
      request.reply(tasksByBoard[boardId] || [])
    }).as('getTasks')

    cy.intercept('POST', '**/api/kanban/tasks', (request) => {
      const newTask = {
        id: nextTaskId,
        title: request.body.title,
        description: request.body.description || '',
        dueDate: request.body.dueDate || null,
        duration: request.body.duration || null,
        columnId: Number(request.body.columnId),
        assignedUser: request.body.assignedUser || user.id,
        checklist: Array.isArray(request.body.checklist)
          ? request.body.checklist
          : [],
        type: request.body.type || 'tarefa'
      }
      nextTaskId += 1
      tasksByBoard[board.id] = [...tasksByBoard[board.id], newTask]
      request.reply(newTask)
    }).as('createTaskRequest')

    cy.intercept('PUT', '**/api/kanban/tasks/*', (request) => {
      const taskId = Number(request.url.split('/').pop())
      const updatedTask = {
        ...request.body,
        id: taskId,
        checklist: Array.isArray(request.body.checklist)
          ? request.body.checklist
          : []
      }
      tasksByBoard[board.id] = tasksByBoard[board.id].map((task) =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      )
      request.reply(updatedTask)
    }).as('updateTaskRequest')

    cy.intercept('PUT', '**/api/kanban/tasks/*/move', (request) => {
      const taskId = Number(request.url.split('/').slice(-2)[0])
      const newColumnId = Number(request.body.columnId)
      tasksByBoard[board.id] = tasksByBoard[board.id].map((task) =>
        task.id === taskId ? { ...task, columnId: newColumnId } : task
      )
      const movedTask = tasksByBoard[board.id].find(
        (task) => task.id === taskId
      )
      request.reply(movedTask)
    }).as('moveTaskRequest')

    cy.intercept('DELETE', '**/api/kanban/tasks/*', (request) => {
      const taskId = Number(request.url.split('/').pop())
      tasksByBoard[board.id] = tasksByBoard[board.id].filter(
        (task) => task.id !== taskId
      )
      request.reply({ statusCode: 204 })
    }).as('deleteTaskRequest')

    cy.intercept('POST', '**/api/kanban/members', (request) => {
      const newUser = {
        id: 99,
        name: 'Novo Membro',
        email: request.body.email,
        isOwner: 0
      }
      users = [...users, newUser]
      request.reply({ message: 'Membro adicionado com sucesso.', member: newUser })
    }).as('addMemberRequest')
  }

  beforeEach(() => {
    seedTasks()
    mockKanbanApi()
    cy.sessionAsAuthenticated(user, token)
    cy.visit('/kanban')
    cy.wait('@getBoards')
    cy.wait('@getPreferences')
    cy.wait('@getColumns')
    cy.wait('@getUsers')
    cy.wait('@getTasks')
  })

  it('deve criar uma tarefa em uma coluna', () => {
    cy.openTaskModal(101)

    cy.get('[data-cy="task-title"]').type('Nova tarefa')
    cy.get('[data-cy="task-save"]').click()

    cy.wait('@createTaskRequest')
      .its('response.body.id')
      .as('newTaskId')
    cy.wait('@getTasks')

    cy.get('@newTaskId').then((newTaskId) => {
      cy.get(`[data-cy="task-card-${newTaskId}"]`).should('be.visible')
    })
  })

  it('deve editar uma tarefa existente', () => {
    cy.get('[data-cy="task-card-150"]').click()

    cy.get('[data-cy="task-title"]').clear().type('Task Editada')
    cy.get('[data-cy="task-save"]').click()

    cy.wait('@updateTaskRequest')
    cy.wait('@getTasks')

    cy.get('[data-cy="task-card-150"]').should('contain', 'Task Editada')
  })

  it('deve adicionar, marcar e remover itens da checklist', () => {
    cy.get('[data-cy="task-card-150"]').click()

    cy.get('[data-cy="checklist-add-input"]').type('Item 1{enter}')
    cy.get('[data-cy^="checklist-item-"]').should('have.length', 1)

    cy.get('[data-cy^="checklist-toggle-"]').check()

    cy.get('[data-cy="checklist-delete"]').click()
    cy.get('[data-cy="checklist-delete-confirm"]').click()

    cy.get('[data-cy^="checklist-item-"]').should('not.exist')
  })

  it('deve convidar uma pessoa por email', () => {
    cy.get('[data-cy="task-card-150"]').click()

    cy.get('[data-cy="invite-toggle"]').click()
    cy.get('[data-cy="invite-email"]').type('novo@teste.com')
    cy.get('[data-cy="invite-submit"]').click()

    cy.wait('@addMemberRequest')
    cy.wait('@getUsers')

    cy.get('[data-cy="invite-feedback"]').should(
      'contain',
      'Pessoa adicionada'
    )
    cy.get('[data-cy="task-assignee"]').should('contain', 'Novo Membro')
  })
})
