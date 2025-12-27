function mockBasicKanban(user) {
  const board = {
    id: 1,
    name: 'Meu Kanban',
    ownerUserId: user.id,
    ownerName: user.name
  }

  const columns = [
    { id: 11, name: 'A Fazer', order_index: 1 },
    { id: 12, name: 'Em Progresso', order_index: 2 },
    { id: 13, name: 'Concluído', order_index: 3 }
  ]

  const users = [
    {
      id: user.id,
      name: user.name,
      email: user.email,
      isOwner: 1
    }
  ]

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
  cy.intercept('GET', '**/api/kanban/columns*', columns).as('getColumns')
  cy.intercept('GET', '**/api/kanban/users*', users).as('getUsers')
  cy.intercept('GET', '**/api/kanban/tasks*', []).as('getTasks')
}

describe('Acesso', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('deve criar uma conta com sucesso', () => {
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'Usuario criado com sucesso.',
        user: { id: 10, name: 'Nova Pessoa', email: 'nova@teste.com' }
      }
    }).as('registerRequest')

    cy.visit('/register')

    cy.on('window:alert', () => true)

    cy.get('[data-cy="register-name"]').type('Nova Pessoa')
    cy.get('[data-cy="register-email"]').type('nova@teste.com')
    cy.get('[data-cy="register-password"]').type('Teste@1234')
    cy.get('[data-cy="register-submit"]').click()

    cy.wait('@registerRequest')
    cy.url().should('include', '/login')
  })

  it('deve entrar com sucesso', () => {
    const user = { id: 20, name: 'Usuário', email: 'user@teste.com' }
    const token = 'token-auth-success'

    mockBasicKanban(user)

    cy.loginLocal({ user, token, password: 'Teste@1234' })

    cy.wait('@getBoards')

    cy.url().should('include', '/kanban')
  })

  it('deve mostrar erro ao tentar entrar com senha errada', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Email ou senha invalidos.' }
    }).as('loginRequest')

    cy.visit('/login')

    cy.get('[data-cy="login-email"]').type('invalido@teste.com')
    cy.get('[data-cy="login-password"]').type('SenhaErrada')
    cy.get('[data-cy="login-submit"]').click()

    cy.wait('@loginRequest')

    cy.get('[data-cy="login-error"]').should(
      'contain',
      'Email ou senha invalidos.'
    )
  })

  it('deve bloquear novo envio por alguns segundos no esqueci minha senha', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', {
      statusCode: 200,
      body: {
        message: 'Se este email existir, enviaremos um link para redefinir a senha.',
        hint: 'EMAIL_PASSWORD_ACCOUNT'
      }
    }).as('forgotRequest')

    cy.visit('/forgot-password')

    cy.get('[data-cy="forgot-email"]').type('user@teste.com')
    cy.get('[data-cy="forgot-submit"]').click()

    cy.wait('@forgotRequest')

    cy.get('[data-cy="forgot-info"]').should(
      'contain',
      'Se este email existir'
    )
    cy.get('[data-cy="forgot-submit"]').should('be.disabled')
  })

  it('deve ocultar o botao quando a conta for do Google', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', {
      statusCode: 200,
      body: {
        message: 'Se este email existir, enviaremos um link para redefinir a senha.',
        hint: 'GOOGLE_ACCOUNT'
      }
    }).as('forgotGoogleRequest')

    cy.visit('/forgot-password')

    cy.get('[data-cy="forgot-email"]').type('google@teste.com')
    cy.get('[data-cy="forgot-submit"]').click()

    cy.wait('@forgotGoogleRequest')

    cy.get('[data-cy="forgot-submit"]').should('not.exist')
    cy.get('[data-cy="forgot-info"]').should('contain', 'Google')
  })

  it('deve validar regras e liberar nova senha', () => {
    cy.visit('/reset-password?email=user@teste.com&token=token')

    cy.get('[data-cy="reset-submit"]').should('be.disabled')

    cy.get('[data-cy="reset-password"]').type('Teste@1234')
    cy.get('[data-cy="reset-confirm"]').type('Teste@1234')

    cy.get('[data-cy="rule-min-length"]').should('have.class', 'ok')
    cy.get('[data-cy="rule-uppercase"]').should('have.class', 'ok')
    cy.get('[data-cy="rule-lowercase"]').should('have.class', 'ok')
    cy.get('[data-cy="rule-number"]').should('have.class', 'ok')
    cy.get('[data-cy="rule-special"]').should('have.class', 'ok')

    cy.get('[data-cy="reset-submit"]').should('not.be.disabled')
  })
})
