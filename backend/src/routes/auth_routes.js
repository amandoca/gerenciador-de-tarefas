// src/routes/auth_routes.js
const express = require('express')
const {
  registerUserController,
  loginUserController
} = require('../controllers/auth_controller')

const authenticationRouter = express.Router()

/**
 * Route: POST /api/auth/register
 * Purpose: create a new user in the database.
 */
authenticationRouter.post('/register', registerUserController)

/**
 * Route: POST /api/auth/login
 * Purpose: authenticate user and return a JWT token.
 */
authenticationRouter.post('/login', loginUserController)

module.exports = authenticationRouter
