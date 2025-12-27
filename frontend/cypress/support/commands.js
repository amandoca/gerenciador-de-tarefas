function visitAsAuthenticated(path, authenticationToken, userData) {
  cy.visit(path, {
    onBeforeLoad(window) {
      window.localStorage.setItem('token', authenticationToken)
      window.localStorage.setItem('loggedUser', JSON.stringify(userData))
    }
  })
}

Cypress.Commands.add('visitAsAuthenticated', visitAsAuthenticated)

function sessionAsAuthenticated(userData, authenticationToken) {
  cy.session([userData.id, authenticationToken], () => {
    cy.visit('/login', {
      onBeforeLoad(window) {
        window.localStorage.setItem('token', authenticationToken)
        window.localStorage.setItem('loggedUser', JSON.stringify(userData))
      }
    })
  })
}

function loginLocal(options = {}) {
  const user = options.user || {
    id: 1,
    name: 'E2E User',
    email: 'e2e@tarefando.local'
  }
  const token = options.token || 'e2e-token'
  const email = options.email || user.email
  const password = options.password || 'Teste@1234'

  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: { message: 'Login realizado com sucesso.', token, user }
  }).as('loginRequest')

  cy.visit('/login')

  cy.get('[data-cy=\"login-email\"]').clear().type(email)
  cy.get('[data-cy=\"login-password\"]').clear().type(password)
  cy.get('[data-cy=\"login-submit\"]').click()

  cy.wait('@loginRequest')

}

function createBoard(boardName) {
  cy.get('[data-cy=\"board-create\"]').click()
  cy.get('[data-cy=\"board-name-input\"]').clear().type(boardName)
  cy.get('[data-cy=\"board-modal-save\"]').click()
}

function openTaskModal(columnId) {
  cy.get(`[data-cy=\"add-task-${columnId}\"]`).click()
  cy.get('[data-cy=\"task-modal\"]').should('be.visible')
}

Cypress.Commands.add('loginLocal', loginLocal)
Cypress.Commands.add('sessionAsAuthenticated', sessionAsAuthenticated)
Cypress.Commands.add('createBoard', createBoard)
Cypress.Commands.add('openTaskModal', openTaskModal)
