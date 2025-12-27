const express = require('express')
const cors = require('cors')

const { executeDatabaseQuery } = require('../../src/config/database_connection')
const authenticationRouter = require('../../src/routes/auth_routes')
const kanbanRoutes = require('../../src/routes/kanban.routes')
const authenticateUser = require('../../src/middlewares/auth_middleware')

function createTestApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', async (_request, response) => {
    try {
      const healthCheckResult = await executeDatabaseQuery(
        'SELECT 1 AS health_check_value;'
      )

      return response.json({
        status: 'ok',
        message: 'Tarefando API is running and the database is reachable.',
        database_result: healthCheckResult
      })
    } catch (databaseError) {
      console.error('Database connection test failed:', databaseError)

      return response.status(500).json({
        status: 'error',
        message: 'API is running, but the database connection failed.'
      })
    }
  })

  app.use('/api/auth', authenticationRouter)
  app.use('/api/kanban', authenticateUser, kanbanRoutes)

  return app
}

module.exports = { createTestApp }
