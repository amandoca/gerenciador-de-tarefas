// src/routes/auth_routes.js
const express = require('express')
const {
  registerUserController,
  loginUserController,
  googleLoginController,
  forgotPasswordController,
  resetPasswordController
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

/**
 * Route: POST /api/auth/google
 * Purpose: authenticate with Google, create user if not exists, return JWT token.
 */
authenticationRouter.post('/google', googleLoginController)

/**
 * Route: POST /api/auth/forgot-password
 * Purpose: send reset password link by email (LOCAL accounts only).
 */
authenticationRouter.post('/forgot-password', forgotPasswordController)

/**
 * Route: POST /api/auth/reset-password
 * Purpose: reset password using token (LOCAL accounts only).
 */
authenticationRouter.post('/reset-password', resetPasswordController)

module.exports = authenticationRouter
