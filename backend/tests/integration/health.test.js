jest.mock('../../src/config/database_connection', () => ({
  executeDatabaseQuery: jest.fn()
}))

const request = require('supertest')
const { executeDatabaseQuery } = require('../../src/config/database_connection')
const { createTestApp } = require('../helpers/testApp')

describe('GET /health', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns 200 when database is reachable', async () => {
    executeDatabaseQuery.mockResolvedValueOnce([{ health_check_value: 1 }])

    const app = createTestApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      message: 'Tarefando API is running and the database is reachable.',
      database_result: [{ health_check_value: 1 }]
    })
  })

  it('returns 500 when database fails', async () => {
    executeDatabaseQuery.mockRejectedValueOnce(new Error('db down'))

    const app = createTestApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      status: 'error',
      message: 'API is running, but the database connection failed.'
    })
  })
})
