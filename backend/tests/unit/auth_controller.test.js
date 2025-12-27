const mockVerifyIdToken = jest.fn()

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken
  }))
}))

jest.mock('../../src/config/database_connection', () => ({
  executeDatabaseQuery: jest.fn()
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}))

jest.mock('../../src/services/email_service', () => ({
  sendPasswordResetEmail: jest.fn()
}))

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { executeDatabaseQuery } = require('../../src/config/database_connection')
const { sendPasswordResetEmail } = require('../../src/services/email_service')

const {
  registerUserController,
  loginUserController,
  googleLoginController,
  forgotPasswordController,
  resetPasswordController
} = require('../../src/controllers/auth_controller')

const { createMockResponse } = require('../helpers/mockResponse')
const { createMockRequest, queueDbResponses } = require('../helpers/fixtures')

describe('auth_controller', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret'
    process.env.GOOGLE_CLIENT_ID = 'google-client'
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('registerUserController', () => {
    it('returns 400 when required fields are missing', async () => {
      const request = createMockRequest({ body: { name: 'Ana' } })
      const response = createMockResponse()

      await registerUserController(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Nome, email e senha sao obrigatorios.'
      })
    })

    it('returns 409 when email already exists', async () => {
      const request = createMockRequest({
        body: { name: 'Ana', email: 'ana@example.com', password: '123456' }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([{ ID: 1 }])

      await registerUserController(request, response)

      expect(response.status).toHaveBeenCalledWith(409)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Este email ja esta cadastrado.'
      })
    })

    it('creates default board "Meu Kanban" on register', async () => {
      const request = createMockRequest({
        body: { name: 'Ana', email: 'ana@example.com', password: '123456' }
      })
      const response = createMockResponse()

      bcrypt.hash.mockResolvedValueOnce('hashed-password')

      queueDbResponses(executeDatabaseQuery, [
        [],
        { insertId: 10 },
        { insertId: 20 },
        {},
        {}
      ])

      await registerUserController(request, response)

      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Usuario criado com sucesso.',
        user: { id: 10, name: 'Ana', email: 'ana@example.com' }
      })

      const boardInsertCall = executeDatabaseQuery.mock.calls.find((call) =>
        String(call[0]).includes('KANBAN_BOARDS')
      )

      expect(boardInsertCall).toBeTruthy()
      expect(String(boardInsertCall[0])).toContain('Meu Kanban')
    })
  })

  describe('loginUserController', () => {
    it('returns 400 when email or password is missing', async () => {
      const request = createMockRequest({ body: { email: 'ana@example.com' } })
      const response = createMockResponse()

      await loginUserController(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Email e senha sao obrigatorios.'
      })
    })

    it('returns 401 when password is invalid', async () => {
      const request = createMockRequest({
        body: { email: 'ana@example.com', password: 'wrong' }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([
        {
          ID: 1,
          NAME: 'Ana',
          EMAIL: 'ana@example.com',
          PASSWORD_HASH: 'hash',
          PROVIDER: 'LOCAL'
        }
      ])
      bcrypt.compare.mockResolvedValueOnce(false)

      await loginUserController(request, response)

      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Email ou senha invalidos.'
      })
    })

    it('returns token on successful login', async () => {
      const request = createMockRequest({
        body: { email: 'ana@example.com', password: '123456' }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([
        {
          ID: 1,
          NAME: 'Ana',
          EMAIL: 'ana@example.com',
          PASSWORD_HASH: 'hash',
          PROVIDER: 'LOCAL'
        }
      ])
      bcrypt.compare.mockResolvedValueOnce(true)
      jwt.sign.mockReturnValueOnce('jwt-token')

      await loginUserController(request, response)

      expect(response.json).toHaveBeenCalledWith({
        message: 'Login realizado com sucesso.',
        token: 'jwt-token',
        user: {
          id: 1,
          name: 'Ana',
          email: 'ana@example.com'
        }
      })
    })
  })

  describe('googleLoginController', () => {
    it('returns 400 when credential is missing', async () => {
      const request = createMockRequest({ body: {} })
      const response = createMockResponse()

      await googleLoginController(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Credencial do Google e obrigatoria.'
      })
    })

    it('returns 403 when local account already exists', async () => {
      const request = createMockRequest({ body: { credential: 'token' } })
      const response = createMockResponse()

      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({ email: 'ana@example.com', given_name: 'Ana' })
      })

      executeDatabaseQuery.mockResolvedValueOnce([
        {
          ID: 1,
          NAME: 'Ana',
          EMAIL: 'ana@example.com',
          PROVIDER: 'LOCAL'
        }
      ])

      await googleLoginController(request, response)

      expect(response.status).toHaveBeenCalledWith(403)
      expect(response.json).toHaveBeenCalledWith({
        message:
          'Este email ja esta cadastrado com login local. Entre com email e senha.'
      })
    })

    it('creates default board for new Google user', async () => {
      const request = createMockRequest({ body: { credential: 'token' } })
      const response = createMockResponse()

      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({ email: 'new@example.com', given_name: 'Nova' })
      })

      bcrypt.hash.mockResolvedValueOnce('google-hash')
      jwt.sign.mockReturnValueOnce('google-jwt')

      queueDbResponses(executeDatabaseQuery, [
        [],
        { insertId: 9 },
        { insertId: 11 },
        {},
        {}
      ])

      await googleLoginController(request, response)

      expect(response.json).toHaveBeenCalledWith({
        message: 'Login com Google realizado com sucesso.',
        token: 'google-jwt',
        user: {
          id: 9,
          name: 'Nova',
          email: 'new@example.com'
        }
      })

      const boardInsertCall = executeDatabaseQuery.mock.calls.find((call) =>
        String(call[0]).includes('KANBAN_BOARDS')
      )

      expect(boardInsertCall).toBeTruthy()
      expect(String(boardInsertCall[0])).toContain('Meu Kanban')
    })
  })

  describe('forgotPasswordController', () => {
    it('returns 400 when email is missing', async () => {
      const request = createMockRequest({ body: {} })
      const response = createMockResponse()

      await forgotPasswordController(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Email e obrigatorio.'
      })
    })

    it('returns neutral response when user does not exist', async () => {
      const request = createMockRequest({ body: { email: 'missing@test.com' } })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await forgotPasswordController(request, response)

      expect(response.json).toHaveBeenCalledWith({
        message:
          'Se este email existir, enviaremos um link para redefinir a senha.',
        hint: 'UNKNOWN'
      })
    })

    it('returns hint when google account', async () => {
      const request = createMockRequest({ body: { email: 'google@test.com' } })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([
        { ID: 2, EMAIL: 'google@test.com', PROVIDER: 'GOOGLE' }
      ])

      await forgotPasswordController(request, response)

      expect(response.json).toHaveBeenCalledWith({
        message:
          'Se este email existir, enviaremos um link para redefinir a senha.',
        hint: 'GOOGLE_ACCOUNT'
      })
    })

    it('sends reset email for local account', async () => {
      const request = createMockRequest({ body: { email: 'ana@test.com' } })
      const response = createMockResponse()

      const randomSpy = jest
        .spyOn(crypto, 'randomBytes')
        .mockReturnValue(Buffer.from('token'))
      bcrypt.hash.mockResolvedValueOnce('hashed-token')

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 5, EMAIL: 'ana@test.com', PROVIDER: 'LOCAL' }],
        {}
      ])

      await forgotPasswordController(request, response)

      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1)
      const emailCall = sendPasswordResetEmail.mock.calls[0]
      expect(emailCall[0]).toBe('ana@test.com')
      expect(String(emailCall[1])).toContain('reset-password?token=')

      expect(response.json).toHaveBeenCalledWith({
        message:
          'Se este email existir, enviaremos um link para redefinir a senha.',
        hint: 'EMAIL_PASSWORD_ACCOUNT'
      })

      randomSpy.mockRestore()
    })
  })

  describe('resetPasswordController', () => {
    it('returns 400 when fields are missing', async () => {
      const request = createMockRequest({ body: { email: 'ana@test.com' } })
      const response = createMockResponse()

      await resetPasswordController(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Email, token e nova senha sao obrigatorios.'
      })
    })

    it('returns 400 when password policy fails', async () => {
      const request = createMockRequest({
        body: {
          email: 'ana@test.com',
          token: 'token',
          newPassword: 'short'
        }
      })
      const response = createMockResponse()

      await resetPasswordController(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'A senha deve ter no minimo 8 caracteres e conter: letra maiuscula, letra minuscula, numero e caractere especial.'
        })
      )
    })

    it('returns 400 when reset request is invalid', async () => {
      const request = createMockRequest({
        body: {
          email: 'missing@test.com',
          token: 'token',
          newPassword: 'NovaSenha1!'
        }
      })
      const response = createMockResponse()

      executeDatabaseQuery.mockResolvedValueOnce([])

      await resetPasswordController(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Solicitacao de redefinicao invalida.'
      })
    })

    it('returns 400 when token already used', async () => {
      const request = createMockRequest({
        body: {
          email: 'ana@test.com',
          token: 'token',
          newPassword: 'NovaSenha1!'
        }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 1, PROVIDER: 'LOCAL' }],
        [
          {
            ID: 10,
            TOKEN_HASH: 'hash',
            EXPIRES_AT: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            USED_AT: new Date().toISOString()
          }
        ]
      ])

      await resetPasswordController(request, response)

      expect(response.status).toHaveBeenCalledWith(400)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Token invalido ou expirado.'
      })
    })

    it('resets password when token is valid', async () => {
      const request = createMockRequest({
        body: {
          email: 'ana@test.com',
          token: 'token',
          newPassword: 'NovaSenha1!'
        }
      })
      const response = createMockResponse()

      queueDbResponses(executeDatabaseQuery, [
        [{ ID: 1, PROVIDER: 'LOCAL' }],
        [
          {
            ID: 10,
            TOKEN_HASH: 'hash',
            EXPIRES_AT: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            USED_AT: null
          }
        ],
        {},
        {}
      ])

      bcrypt.compare.mockResolvedValueOnce(true)
      bcrypt.hash.mockResolvedValueOnce('new-hash')

      await resetPasswordController(request, response)

      expect(response.json).toHaveBeenCalledWith({
        message: 'Senha atualizada com sucesso.'
      })
    })
  })
})
