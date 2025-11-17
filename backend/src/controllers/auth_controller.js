// src/controllers/auth_controller.js
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { executeDatabaseQuery } = require('../config/database_connection')

/**
 * Helper: generate JWT token for authenticated user.
 */
function generateAuthenticationToken(userRecord) {
  const tokenPayload = {
    user_id: userRecord.ID,
    user_name: userRecord.NAME,
    user_email: userRecord.EMAIL
  }

  const tokenOptions = {
    expiresIn: '8h'
  }

  const authenticationToken = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    tokenOptions
  )

  return authenticationToken
}

/**
 * Controller: register new user.
 * Route: POST /api/auth/register
 */
async function registerUserController(request, response) {
  try {
    const { name, email, password } = request.body

    // Basic validation
    if (!name || !email || !password) {
      return response.status(400).json({
        message: 'Name, email and password are required.'
      })
    }

    if (password.length < 6) {
      return response.status(400).json({
        message: 'Password must have at least 6 characters.'
      })
    }

    // Check if email already exists
    const existingUsers = await executeDatabaseQuery(
      'SELECT ID FROM USERS WHERE EMAIL = ? LIMIT 1;',
      [email]
    )

    const userAlreadyExists = existingUsers.length > 0

    if (userAlreadyExists) {
      return response.status(409).json({
        message: 'E-mail is already registered.'
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert user
    const insertResult = await executeDatabaseQuery(
      `
      INSERT INTO USERS (NAME, EMAIL, PASSWORD_HASH)
      VALUES (?, ?, ?);
      `,
      [name, email, passwordHash]
    )

    const createdUserId = insertResult.insertId

    return response.status(201).json({
      message: 'User created successfully.',
      user: {
        id: createdUserId,
        name,
        email
      }
    })
  } catch (controllerError) {
    console.error('Error while registering user:', controllerError)

    return response.status(500).json({
      message: 'Unexpected error during user registration.'
    })
  }
}

/**
 * Controller: login existing user.
 * Route: POST /api/auth/login
 */
async function loginUserController(request, response) {
  try {
    const { email, password } = request.body

    if (!email || !password) {
      return response.status(400).json({
        message: 'E-mail and password are required.'
      })
    }

    // Find user by email
    const usersFound = await executeDatabaseQuery(
      `
      SELECT ID, NAME, EMAIL, PASSWORD_HASH
      FROM USERS
      WHERE EMAIL = ?
      LIMIT 1;
      `,
      [email]
    )

    const userRecord = usersFound[0]

    if (!userRecord) {
      return response.status(401).json({
        message: 'Invalid e-mail or password.'
      })
    }

    // Compare password
    const passwordIsValid = await bcrypt.compare(
      password,
      userRecord.PASSWORD_HASH
    )

    if (!passwordIsValid) {
      return response.status(401).json({
        message: 'Invalid e-mail or password.'
      })
    }

    // Generate JWT
    const authenticationToken = generateAuthenticationToken(userRecord)

    return response.json({
      message: 'Login successful.',
      token: authenticationToken,
      user: {
        id: userRecord.ID,
        name: userRecord.NAME,
        email: userRecord.EMAIL
      }
    })
  } catch (controllerError) {
    console.error('Error while logging in user:', controllerError)

    return response.status(500).json({
      message: 'Unexpected error during login.'
    })
  }
}

module.exports = {
  registerUserController,
  loginUserController
}
