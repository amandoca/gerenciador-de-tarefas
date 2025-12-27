jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}))

const jwt = require('jsonwebtoken')
const authenticateUser = require('../../src/middlewares/auth_middleware')
const { createMockResponse } = require('../helpers/mockResponse')
const { createMockRequest } = require('../helpers/fixtures')

describe('auth_middleware', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns 401 when token is missing', () => {
    const request = createMockRequest({ headers: {} })
    const response = createMockResponse()
    const next = jest.fn()

    authenticateUser(request, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({ message: 'Missing token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is invalid', () => {
    const request = createMockRequest({
      headers: { authorization: 'Bearer invalid-token' }
    })
    const response = createMockResponse()
    const next = jest.fn()

    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token')
    })

    authenticateUser(request, response, next)

    expect(jwt.verify).toHaveBeenCalledWith(
      'invalid-token',
      process.env.JWT_SECRET
    )
    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({ message: 'Invalid token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('sets request.user and calls next when token is valid', () => {
    const decoded = {
      user_id: 123,
      user_name: 'Ana',
      user_email: 'ana@example.com'
    }
    const request = createMockRequest({
      headers: { authorization: 'Bearer valid-token' }
    })
    const response = createMockResponse()
    const next = jest.fn()

    jwt.verify.mockReturnValue(decoded)

    authenticateUser(request, response, next)

    expect(request.user).toEqual(decoded)
    expect(next).toHaveBeenCalledTimes(1)
    expect(response.status).not.toHaveBeenCalled()
  })
})
