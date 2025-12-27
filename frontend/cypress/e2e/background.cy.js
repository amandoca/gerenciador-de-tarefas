function getBoardIdFromRequest(request) {
  const url = new URL(request.url)
  return Number(url.searchParams.get('boardId'))
}

describe('Plano de fundo', () => {
  const user = { id: 8, name: 'Owner', email: 'owner@teste.com' }
  const token = 'token-owner'
  const board = {
    id: 30,
    name: 'Board Principal',
    ownerUserId: user.id,
    ownerName: user.name
  }

  const columns = [
    { id: 301, name: 'A Fazer', order_index: 1 },
    { id: 302, name: 'Em Progresso', order_index: 2 },
    { id: 303, name: 'Concluído', order_index: 3 }
  ]

  const users = [
    { id: user.id, name: user.name, email: user.email, isOwner: 1 }
  ]

  let preferences = { lastBoardId: board.id, backgroundId: 'mario' }

  beforeEach(() => {
    preferences = { lastBoardId: board.id, backgroundId: 'mario' }
    cy.intercept('GET', '**/api/kanban/boards*', [board]).as('getBoards')
    cy.intercept('GET', '**/api/kanban/preferences', (request) => {
      request.reply(preferences)
    }).as('getPreferences')
    cy.intercept('PUT', '**/api/kanban/preferences', (request) => {
      preferences = { ...preferences, ...request.body }
      request.reply({ message: 'Preferences updated.', ...preferences })
    }).as('savePreferences')

    cy.intercept('GET', '**/api/kanban/columns*', (request) => {
      request.reply(columns)
    }).as('getColumns')

    cy.intercept('GET', '**/api/kanban/users*', (request) => {
      request.reply(users)
    }).as('getUsers')

    cy.intercept('GET', '**/api/kanban/tasks*', (request) => {
      const boardId = getBoardIdFromRequest(request)
      if (boardId === board.id) {
        request.reply([])
        return
      }
      request.reply([])
    }).as('getTasks')

    cy.sessionAsAuthenticated(user, token)
    cy.visit('/kanban')
    cy.wait('@getBoards')
    cy.wait('@getPreferences')
  })

  it('deve selecionar um plano de fundo e manter apos recarregar', () => {
    cy.get('[data-cy="background-open"]').click()
    cy.get('[data-cy="bg-option-galaxy"]').click()

    cy.wait('@savePreferences')

    cy.reload()

    cy.wait('@getPreferences')

    cy.get('[data-cy="background-open"]').click()
    cy.get('[data-cy="bg-option-galaxy"]').should('have.class', 'selected')
  })
})
