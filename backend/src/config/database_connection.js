// src/config/database_connection.js
const mysql = require('mysql2/promise')
require('dotenv').config()

/**
 * Database connection pool.
 * Central place to manage database connections.
 */
const databaseConnectionPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

/**
 * Helper function to execute SQL queries in a clean way.
 */
async function executeDatabaseQuery(query_text, query_parameters = []) {
  const [rows] = await databaseConnectionPool.execute(
    query_text,
    query_parameters
  )
  return rows
}

module.exports = {
  databaseConnectionPool,
  executeDatabaseQuery
}
