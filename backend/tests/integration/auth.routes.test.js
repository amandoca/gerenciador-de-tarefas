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

const request = require('supertest')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { executeDatabaseQuery } = require('../../src/config/database_connection')
const { sendPasswordResetEmail } = require('../../src/services/email_service')
const { createTestApp } = require('../helpers/testApp')

const { queueDbResponses } = require('../helpers/fixtures')

describe('Auth API integration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret'
    process.env.GOOGLE_CLIENT_ID = 'google-client'
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('POST /api/auth/register returns 201', async () => {
    const app = createTestApp()

    bcrypt.hash.mockResolvedValueOnce('hash')

    queueDbResponses(executeDatabaseQuery, [
      [],
      { insertId: 10 },
      { insertId: 20 },
      {},
      {}
    ])

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ana', email: 'ana@test.com', password: '123456' })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      message: 'Usuario criado com sucesso.',
      user: { id: 10, name: 'Ana', email: 'ana@test.com' }
    })
  })

  it('POST /api/auth/login returns 200 with token', async () => {
    const app = createTestApp()

    executeDatabaseQuery.mockResolvedValueOnce([
      {
        ID: 1,
        NAME: 'Ana',
        EMAIL: 'ana@test.com',
        PASSWORD_HASH: 'hash',
        PROVIDER: 'LOCAL'
      }
    ])
    bcrypt.compare.mockResolvedValueOnce(true)
    jwt.sign.mockReturnValueOnce('jwt-token')

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@test.com', password: '123456' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Login realizado com sucesso.',
      token: 'jwt-token',
      user: { id: 1, name: 'Ana', email: 'ana@test.com' }
    })
  })

  it('POST /api/auth/google returns 200 for new user', async () => {
    const app = createTestApp()

    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: 'new@test.com', given_name: 'Nova' })
    })

    bcrypt.hash.mockResolvedValueOnce('hash')
    jwt.sign.mockReturnValueOnce('google-jwt')

    queueDbResponses(executeDatabaseQuery, [
      [],
      { insertId: 9 },
      { insertId: 11 },
      {},
      {}
    ])

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'token' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Login com Google realizado com sucesso.',
      token: 'google-jwt',
      user: { id: 9, name: 'Nova', email: 'new@test.com' }
    })
  })

  it('POST /api/auth/forgot-password returns 200 for local account', async () => {
    const app = createTestApp()

    queueDbResponses(executeDatabaseQuery, [
      [{ ID: 5, EMAIL: 'ana@test.com', PROVIDER: 'LOCAL' }],
      {}
    ])

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ana@test.com' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message:
        'Se este email existir, enviaremos um link para redefinir a senha.',
      hint: 'EMAIL_PASSWORD_ACCOUNT'
    })
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1)
  })

  it('POST /api/auth/reset-password returns 200 when token is valid', async () => {
    const app = createTestApp()

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

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'ana@test.com',
        token: 'token',
        newPassword: 'NovaSenha1!'
      })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ message: 'Senha atualizada com sucesso.' })
  })
})
