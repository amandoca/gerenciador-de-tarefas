function getBoardIdFromRequest(request) {
  const url = new URL(request.url)
  return Number(url.searchParams.get('boardId'))
}

describe('Quadros e menu lateral', () => {
  const user = { id: 1, name: 'Owner', email: 'owner@teste.com' }
  const token = 'token-owner'

  let boards = []
  let columnsByBoard = {}
  let tasksByBoard = {}
  let usersByBoard = {}
  let preferences = {}
  let nextBoardId = 2

  function seedState() {
    boards = [
      { id: 1, name: 'Meu Kanban', ownerUserId: user.id, ownerName: user.name },
      { id: 2, name: 'Board Extra', ownerUserId: user.id, ownerName: user.name }
    ]

    columnsByBoard = {
      1: [
        { id: 11, name: 'A Fazer', order_index: 1 },
        { id: 12, name: 'Em Progresso', order_index: 2 },
        { id: 13, name: 'Concluído', order_index: 3 }
      ],
      2: [
        { id: 21, name: 'A Fazer', order_index: 1 },
        { id: 22, name: 'Em Progresso', order_index: 2 },
        { id: 23, name: 'Concluído', order_index: 3 }
      ]
    }

    tasksByBoard = {
      1: [{ id: 101, title: 'Task Board 1', columnId: 11 }],
      2: [{ id: 201, title: 'Task Board 2', columnId: 21 }]
    }

    usersByBoard = {
      1: [{ id: user.id, name: user.name, email: user.email, isOwner: 1 }],
      2: [{ id: user.id, name: user.name, email: user.email, isOwner: 1 }]
    }

    preferences = { lastBoardId: 1, backgroundId: 'mario' }
    nextBoardId = 3
  }

  function mockKanbanApi() {
    cy.intercept('GET', '**/api/kanban/boards*', (request) => {
      request.reply(boards)
    }).as('getBoards')

    cy.intercept('POST', '**/api/kanban/boards', (request) => {
      const board = {
        id: nextBoardId,
        name: request.body.name,
        ownerUserId: user.id,
        ownerName: user.name
      }
      nextBoardId += 1
      boards = [...boards, board]
      columnsByBoard[board.id] = [
        { id: board.id * 100 + 1, name: 'A Fazer', order_index: 1 },
        { id: board.id * 100 + 2, name: 'Em Progresso', order_index: 2 },
        { id: board.id * 100 + 3, name: 'Concluído', order_index: 3 }
      ]
      tasksByBoard[board.id] = []
      usersByBoard[board.id] = [
        { id: user.id, name: user.name, email: user.email, isOwner: 1 }
      ]
      request.reply(board)
    }).as('createBoardRequest')

    cy.intercept('PUT', '**/api/kanban/boards/*', (request) => {
      const boardId = Number(request.url.split('/').pop())
      boards = boards.map((board) =>
        board.id === boardId ? { ...board, name: request.body.name } : board
      )
      const updated = boards.find((board) => board.id === boardId)
      request.reply(updated)
    }).as('renameBoardRequest')

    cy.intercept('DELETE', '**/api/kanban/boards/*', (request) => {
      const boardId = Number(request.url.split('/').pop())
      boards = boards.filter((board) => board.id !== boardId)
      delete columnsByBoard[boardId]
      delete tasksByBoard[boardId]
      delete usersByBoard[boardId]
      request.reply({ statusCode: 204 })
    }).as('deleteBoardRequest')

    cy.intercept('GET', '**/api/kanban/preferences', (request) => {
      request.reply(preferences)
    }).as('getPreferences')

    cy.intercept('PUT', '**/api/kanban/preferences', (request) => {
      preferences = { ...preferences, ...request.body }
      request.reply({ message: 'Preferences updated.', ...preferences })
    }).as('savePreferences')

    cy.intercept('GET', '**/api/kanban/columns*', (request) => {
      const boardId = getBoardIdFromRequest(request)
      request.reply(columnsByBoard[boardId] || [])
    }).as('getColumns')

    cy.intercept('GET', '**/api/kanban/users*', (request) => {
      const boardId = getBoardIdFromRequest(request)
      request.reply(usersByBoard[boardId] || [])
    }).as('getUsers')

    cy.intercept('GET', '**/api/kanban/tasks*', (request) => {
      const boardId = getBoardIdFromRequest(request)
      request.reply(tasksByBoard[boardId] || [])
    }).as('getTasks')
  }

  beforeEach(() => {
    seedState()
    mockKanbanApi()
    cy.sessionAsAuthenticated(user, token)
    cy.visit('/kanban')
    cy.wait('@getBoards')
    cy.wait('@getPreferences')
    cy.wait('@getColumns')
    cy.wait('@getUsers')
    cy.wait('@getTasks')
    cy.get('[data-cy="board-item-1"]').should('be.visible')
  })

  it('deve criar um novo quadro', () => {
    cy.createBoard('Board Criado')

    cy.wait('@createBoardRequest').its('response.body.id').as('newBoardId')
    cy.wait('@getBoards')

    cy.get('@newBoardId').then((newBoardId) => {
      cy.get(`[data-cy="board-item-${newBoardId}"]`).should(
        'contain',
        'Board Criado'
      )
    })
  })

  it('deve renomear um quadro do dono', () => {
    cy.get('[data-cy="board-item-1"]').should('be.visible')
    cy.get('[data-cy="board-rename-1"]').click()

    cy.get('[data-cy="board-name-input"]').clear().type('Board Renomeado')
    cy.get('[data-cy="board-modal-save"]').click()

    cy.wait('@renameBoardRequest')
    cy.wait('@getBoards')

    cy.get('[data-cy="board-item-1"]').should('contain', 'Board Renomeado')
  })

  it('deve excluir um quadro e trocar o ativo', () => {
    cy.get('[data-cy="board-item-1"]').should('be.visible')
    cy.get('[data-cy="board-delete-1"]').click()

    cy.get('[data-cy="board-delete-confirm"]').click()

    cy.wait('@deleteBoardRequest')
    cy.wait('@getBoards')

    cy.get('[data-cy="board-item-1"]').should('not.exist')
    cy.get('[data-cy="board-item-2"]').should('have.class', 'active')
  })

  it('deve selecionar outro quadro e recarregar colunas e tarefas', () => {
    cy.get('[data-cy="board-item-2"]').should('be.visible')
    cy.get('[data-cy="board-item-2"]').click()

    cy.wait('@getColumns')
    cy.wait('@getTasks')

    cy.get('[data-cy="task-card-201"]').should('be.visible')
  })
})

describe('Compartilhamento de quadro', () => {
  const ownerUser = { id: 1, name: 'Owner', email: 'owner@teste.com' }
  const memberUser = { id: 2, name: 'Membro', email: 'membro@teste.com' }
  const ownerToken = 'token-owner'
  const memberToken = 'token-member'

  const sharedBoard = {
    id: 10,
    name: 'Board Compartilhado',
    ownerUserId: ownerUser.id,
    ownerName: ownerUser.name
  }

  let usersByBoard = {}
  let tasksByBoard = {}
  let activeUserId = ownerUser.id

  const columnsByBoard = {
    10: [
      { id: 101, name: 'A Fazer', order_index: 1 },
      { id: 102, name: 'Em Progresso', order_index: 2 },
      { id: 103, name: 'Concluído', order_index: 3 }
    ]
  }

  function seedSharingState() {
    usersByBoard = {
      10: [
        {
          id: ownerUser.id,
          name: ownerUser.name,
          email: ownerUser.email,
          isOwner: 1
        }
      ]
    }

    tasksByBoard = {
      10: [
        {
          id: 301,
          title: 'Task do owner',
          description: '',
          dueDate: null,
          duration: null,
          columnId: 101,
          assignedUser: ownerUser.id,
          checklist: [],
          type: 'tarefa'
        },
        {
          id: 302,
          title: 'Task do membro',
          description: '',
          dueDate: null,
          duration: null,
          columnId: 101,
          assignedUser: memberUser.id,
          checklist: [],
          type: 'tarefa'
        }
      ]
    }
  }

  function mockSharingApi() {
    cy.intercept('GET', '**/api/kanban/boards*', (request) => {
      request.reply([sharedBoard])
    }).as('getBoards')

    cy.intercept('GET', '**/api/kanban/preferences', (request) => {
      request.reply({
        lastBoardId: sharedBoard.id,
        backgroundId: 'mario',
        userId: activeUserId
      })
    }).as('getPreferences')

    cy.intercept('PUT', '**/api/kanban/preferences', (request) => {
      request.reply({ message: 'Preferences updated.', ...request.body })
    }).as('savePreferences')

    cy.intercept('GET', '**/api/kanban/columns*', (request) => {
      const boardId = getBoardIdFromRequest(request)
      request.reply(columnsByBoard[boardId] || [])
    }).as('getColumns')

    cy.intercept('GET', '**/api/kanban/users*', (request) => {
      const boardId = getBoardIdFromRequest(request)
      request.reply(usersByBoard[boardId] || [])
    }).as('getUsers')

    cy.intercept('GET', '**/api/kanban/tasks*', (request) => {
      const boardId = getBoardIdFromRequest(request)
      const allTasks = tasksByBoard[boardId] || []
      const isMember = activeUserId === memberUser.id
      const visibleTasks = isMember
        ? allTasks.filter(
            (task) => Number(task.assignedUser) === Number(activeUserId)
          )
        : allTasks
      request.reply(visibleTasks)
    }).as('getTasks')

    cy.intercept('POST', '**/api/kanban/members', (request) => {
      const newMember = {
        id: memberUser.id,
        name: memberUser.name,
        email: request.body.email,
        isOwner: 0
      }
      const boardId = Number(request.body.boardId)
      usersByBoard[boardId] = [...(usersByBoard[boardId] || []), newMember]
      request.reply({
        message: 'Membro adicionado com sucesso.',
        member: newMember
      })
    }).as('addMemberRequest')
  }

  beforeEach(() => {
    seedSharingState()
    mockSharingApi()
    activeUserId = ownerUser.id
    cy.sessionAsAuthenticated(ownerUser, ownerToken)
    cy.visit('/kanban')
    cy.wait('@getBoards')
    cy.wait('@getPreferences')
    cy.wait('@getColumns')
    cy.wait('@getUsers')
    cy.wait('@getTasks')
  })

  it('deve compartilhar um quadro com outro usuario', () => {
    cy.get('[data-cy="add-task-101"]').should('be.visible').click()

    cy.get('[data-cy="invite-toggle"]').click()
    cy.get('[data-cy="invite-email"]').type(memberUser.email)
    cy.get('[data-cy="invite-submit"]').click()

    cy.wait('@addMemberRequest')
    cy.wait('@getUsers')
    cy.wait('@getTasks')

    cy.get('[data-cy="invite-feedback"]').should('contain', 'Pessoa adicionada')
    cy.get('[data-cy="task-assignee"]').should('contain', memberUser.name)

    cy.get('[data-cy="task-cancel"]').click()
    cy.get('[data-cy="task-modal"]').should('not.exist')

    activeUserId = memberUser.id
    cy.sessionAsAuthenticated(memberUser, memberToken)
    cy.visit('/kanban')
    cy.wait('@getBoards')
    cy.wait('@getPreferences')
    cy.wait('@getColumns')
    cy.wait('@getTasks')

    cy.get(`[data-cy="board-item-${sharedBoard.id}"]`)
      .should('contain', sharedBoard.name)
      .and('contain', ownerUser.name)
      .and('have.class', 'shared')

    cy.get('[data-cy="task-card-302"]').should('be.visible')
    cy.get('[data-cy="task-card-301"]').should('not.exist')
  })
})
