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

describe('Permissoes de tarefas por perfil', () => {
  const owner = { id: 1, name: 'Owner', email: 'owner@teste.com' }
  const member = { id: 2, name: 'Membro', email: 'membro@teste.com' }
  const ownerToken = 'token-owner'
  const memberToken = 'token-member'

  it('membro so pode editar os campos permitidos', () => {
    cy.fixture('boards_shared.json').then((boards) => {
      cy.fixture('columns.json').then((columns) => {
        cy.fixture('users.json').then((users) => {
          cy.fixture('tasks_permissions.json').then((tasks) => {
            cy.fixture('preferences.json').then((preferences) => {
              mockKanbanApi({ boards, columns, users, tasks, preferences })

              cy.intercept('PUT', '**/api/kanban/tasks/300', {
                statusCode: 200,
                body: {
                  ...tasks[0],
                  dueDate: '2026-03-12',
                  duration: '02:00',
                  checklist: [
                    { id: 1, text: 'Item existente', completed: false },
                    { id: 2, text: 'Novo item', completed: false }
                  ]
                }
              }).as('updateTask')

              visitWithSession(member, memberToken)

              cy.wait('@getBoards')
              cy.wait('@getPreferences')
              cy.wait('@getColumns')
              cy.wait('@getUsers')
              cy.wait('@getTasks')
              cy.get('[data-cy="task-card-300"]').click()
              cy.get('[data-cy="task-modal"]').should('be.visible')

              cy.get('[data-cy="task-title"]').should('be.disabled')
              cy.get('[data-cy="task-description"]').should('be.disabled')
              cy.get('[data-cy="task-type"]').should('be.disabled')
              cy.get('[data-cy="task-assignee"]').should('be.disabled')
              cy.get('[data-cy="task-delete"]').should('not.exist')

              cy.get('[data-cy="task-due-date"]').clear().type('2026-03-12')
              cy.get('[data-cy="task-duration"]').clear().type('02:00')
              cy.get('[data-cy="checklist-add-input"]').type('Novo item{enter}')

              cy.get('[data-cy="task-save"]').click()

              cy.wait('@updateTask')
                .its('request.body')
                .should((body) => {
                  expect(body.title).to.equal(undefined)
                  expect(body.assignedUser).to.equal(undefined)
                  expect(body.dueDate).to.equal('2026-03-12')
                })
            })
          })
        })
      })
    })
  })

  it('dono pode editar tudo e excluir a tarefa', () => {
    cy.fixture('boards_shared.json').then((boards) => {
      cy.fixture('columns.json').then((columns) => {
        cy.fixture('users.json').then((users) => {
          cy.fixture('tasks_permissions.json').then((tasks) => {
            cy.fixture('preferences.json').then((preferences) => {
              mockKanbanApi({ boards, columns, users, tasks, preferences })

              cy.intercept('PUT', '**/api/kanban/tasks/300', {
                statusCode: 200,
                body: { ...tasks[0], title: 'Atualizada', assignedUser: 2 }
              }).as('updateTask')

              cy.intercept('DELETE', '**/api/kanban/tasks/300', {
                statusCode: 204
              }).as('deleteTask')

              visitWithSession(owner, ownerToken)

              cy.wait('@getBoards')
              cy.wait('@getPreferences')
              cy.wait('@getColumns')
              cy.wait('@getUsers')
              cy.wait('@getTasks')
              cy.get('[data-cy="task-card-300"]').click()
              cy.get('[data-cy="task-modal"]').should('be.visible')

              cy.get('[data-cy="task-title"]').should('not.be.disabled')
              cy.get('[data-cy="task-type"]').should('not.be.disabled')
              cy.get('[data-cy="task-assignee"]').should('not.be.disabled')
              cy.get('[data-cy="task-delete"]').should('be.visible')

              cy.get('[data-cy="task-title"]').clear().type('Atualizada')
              cy.get('[data-cy="task-assignee"]').select('2')
              cy.get('[data-cy="task-save"]').click()

              cy.wait('@updateTask')

              cy.get('[data-cy="task-modal"]').should('not.exist')
              cy.get('[data-cy="task-card-300"]').click()
              cy.get('[data-cy="task-modal"]').should('be.visible')

              cy.get('[data-cy="task-delete"]').click()
              cy.get('[data-cy="task-delete-confirm"]').click()
              cy.wait('@deleteTask')
            })
          })
        })
      })
    })
  })
})
