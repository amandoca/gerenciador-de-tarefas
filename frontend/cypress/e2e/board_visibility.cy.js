function mockKanbanApi({ boards, columns, users, tasks, preferences }) {
  cy.intercept('GET', '**/api/kanban/boards*', boards).as('getBoards')
  cy.intercept('GET', '**/api/kanban/preferences', preferences).as('getPreferences')
  cy.intercept('PUT', '**/api/kanban/preferences', {
    message: 'Preferences updated.',
    ...preferences
  }).as('savePreferences')
  cy.intercept('GET', '**/api/kanban/columns*', columns).as('getColumns')
  cy.intercept('GET', '**/api/kanban/users*', users).as('getUsers')
  cy.intercept('GET', '**/api/kanban/tasks*', tasks).as('getTasks')
}

function visitWithSession(user, token) {
  cy.sessionAsAuthenticated(user, token)
  cy.visit('/kanban')
}

describe('Visibilidade do quadro', () => {
  const owner = { id: 1, name: 'Owner', email: 'owner@teste.com' }
  const member = { id: 2, name: 'Membro', email: 'membro@teste.com' }
  const ownerToken = 'token-owner'
  const memberToken = 'token-member'

  it('dono consegue mudar a visibilidade para compartilhado', () => {
    cy.fixture('boards_private.json').then((boards) => {
      cy.fixture('columns.json').then((columns) => {
        cy.fixture('users.json').then((users) => {
          cy.fixture('tasks_private.json').then((tasks) => {
            cy.fixture('preferences.json').then((preferences) => {
              mockKanbanApi({ boards, columns, users, tasks, preferences })

              cy.intercept('PUT', '**/api/kanban/boards/1/visibility', {
                statusCode: 200,
                body: {
                  message: 'Board visibility updated.',
                  id: 1,
                  visibility: 'SHARED'
                }
              }).as('updateVisibility')

              visitWithSession(owner, ownerToken)

              cy.wait('@getBoards')
              cy.wait('@getPreferences')
              cy.wait('@getColumns')
              cy.wait('@getUsers')
              cy.wait('@getTasks')
              cy.get('[data-cy="board-visibility"]').should('be.visible')
              cy.get('[data-cy="visibility-shared"]').click()

              cy.wait('@updateVisibility')
                .its('request.body')
                .should('deep.equal', { visibility: 'SHARED' })

              cy.get('[data-cy="visibility-shared"]').should(
                'have.class',
                'active'
              )
            })
          })
        })
      })
    })
  })

  it('membro nao ve o controle e enxerga tarefas de todos no compartilhado', () => {
    cy.fixture('boards_shared.json').then((boards) => {
      cy.fixture('columns.json').then((columns) => {
        cy.fixture('users.json').then((users) => {
          cy.fixture('tasks_shared.json').then((tasks) => {
            cy.fixture('preferences.json').then((preferences) => {
              mockKanbanApi({ boards, columns, users, tasks, preferences })

              visitWithSession(member, memberToken)

              cy.wait('@getBoards')
              cy.wait('@getPreferences')
              cy.wait('@getColumns')
              cy.wait('@getUsers')
              cy.wait('@getTasks')
              cy.get('[data-cy="board-visibility"]').should('not.exist')
              cy.get('[data-cy="task-card-200"]').should('be.visible')
              cy.get('[data-cy="task-card-201"]').should('be.visible')
            })
          })
        })
      })
    })
  })
})
