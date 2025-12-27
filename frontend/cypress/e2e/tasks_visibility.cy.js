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

describe('Visibilidade das tarefas por tipo de quadro', () => {
  const member = { id: 2, name: 'Membro', email: 'membro@teste.com' }
  const memberToken = 'token-member'

  it('quadro privado mostra apenas as tarefas do membro', () => {
    cy.fixture('boards_private.json').then((boards) => {
      cy.fixture('columns.json').then((columns) => {
        cy.fixture('users.json').then((users) => {
          cy.fixture('tasks_private.json').then((tasks) => {
            cy.fixture('preferences.json').then((preferences) => {
              mockKanbanApi({ boards, columns, users, tasks, preferences })

              visitWithSession(member, memberToken)

              cy.wait('@getBoards')
              cy.wait('@getPreferences')
              cy.wait('@getColumns')
              cy.wait('@getUsers')
              cy.wait('@getTasks')
              cy.get('[data-cy="task-card-100"]').should('be.visible')
              cy.get('[data-cy="task-card-200"]').should('not.exist')
            })
          })
        })
      })
    })
  })

  it('quadro compartilhado mostra todas as tarefas', () => {
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
              cy.get('[data-cy="task-card-200"]').should('be.visible')
              cy.get('[data-cy="task-card-201"]').should('be.visible')
            })
          })
        })
      })
    })
  })
})
