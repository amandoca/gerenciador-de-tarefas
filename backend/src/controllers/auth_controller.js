// src/controllers/auth_controller.js
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const { executeDatabaseQuery } = require('../config/database_connection')
const crypto = require('crypto')
const { sendPasswordResetEmail } = require('../services/email_service')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

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
 * Helper: build reset link safely (avoid undefined APP_URL).
 */
function buildPasswordResetLink(email, rawToken) {
  const appUrl = process.env.APP_URL || 'http://localhost:8080'
  const encodedEmail = encodeURIComponent(email)
  return `${appUrl}/reset-password?token=${rawToken}&email=${encodedEmail}`
}

/**
 * Helper: password policy validation.
 * Rules: 8+ chars, uppercase, lowercase, number, special.
 */
function validatePasswordPolicy(password) {
  const hasMinLength = typeof password === 'string' && password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const isValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial

  return {
    isValid,
    rules: {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial
    }
  }
}

/**
 * Controller: register new user.
 * Route: POST /api/auth/register
 */
 async function registerUserController(request, response) {
  try {
    const { name, email, password } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({
        message: 'Nome, email e senha sao obrigatorios.'
      })
    }

    if (password.length < 6) {
      return response.status(400).json({
        message: 'A senha deve ter no minimo 6 caracteres.'
      })
    }

    const existingUsers = await executeDatabaseQuery(
      'SELECT ID FROM USERS WHERE EMAIL = ? LIMIT 1;',
      [email]
    )

    if (existingUsers.length > 0) {
      return response.status(409).json({
        message: 'Este email ja esta cadastrado.'
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // 1) Cria usuário
    const insertUserResult = await executeDatabaseQuery(
      `
      INSERT INTO USERS (NAME, EMAIL, PASSWORD_HASH, PROVIDER)
      VALUES (?, ?, ?, 'LOCAL');
      `,
      [name, email, passwordHash]
    )

    const createdUserId = insertUserResult.insertId

    // 2) Cria board padrão
    const insertBoardResult = await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_BOARDS (NAME, OWNER_USER_ID, VISIBILITY)
      VALUES ('Meu Kanban', ?, 'PRIVATE');
      `,
      [createdUserId]
    )

    const createdBoardId = insertBoardResult.insertId

    // 3) Dono vira membro do board
    await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_BOARD_MEMBERS (BOARD_ID, USER_ID, ROLE)
      VALUES (?, ?, 'EDITOR');
      `,
      [createdBoardId, createdUserId]
    )

    // 4) Cria colunas padrão do board
    await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_COLUMNS (BOARD_ID, NAME, ORDER_INDEX)
      VALUES
        (?, 'A Fazer', 1),
        (?, 'Em Progresso', 2),
        (?, 'Concluído', 3);
      `,
      [createdBoardId, createdBoardId, createdBoardId]
    )

    return response.status(201).json({
      message: 'Usuario criado com sucesso.',
      user: {
        id: createdUserId,
        name,
        email
      }
    })
  } catch (controllerError) {
    console.error('Erro ao cadastrar usuario:', controllerError)

    return response.status(500).json({
      message: 'Erro inesperado ao cadastrar usuario.'
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
        message: 'Email e senha sao obrigatorios.'
      })
    }

    const usersFound = await executeDatabaseQuery(
      `
      SELECT ID, NAME, EMAIL, PASSWORD_HASH, PROVIDER
      FROM USERS
      WHERE EMAIL = ?
      LIMIT 1;
      `,
      [email]
    )

    const userRecord = usersFound[0]

    if (!userRecord) {
      return response.status(401).json({
        message: 'Email ou senha invalidos.'
      })
    }

    if (userRecord.PROVIDER === 'GOOGLE') {
      return response.status(403).json({
        message: 'Esta conta usa login com Google. Entre com o Google.'
      })
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      userRecord.PASSWORD_HASH
    )

    if (!passwordIsValid) {
      return response.status(401).json({
        message: 'Email ou senha invalidos.'
      })
    }

    const authenticationToken = generateAuthenticationToken(userRecord)

    return response.json({
      message: 'Login realizado com sucesso.',
      token: authenticationToken,
      user: {
        id: userRecord.ID,
        name: userRecord.NAME,
        email: userRecord.EMAIL
      }
    })
  } catch (controllerError) {
    console.error('Erro ao fazer login:', controllerError)

    return response.status(500).json({
      message: 'Erro inesperado ao fazer login.'
    })
  }
}

/**
 * Controller: login via Google (create user if not exists).
 * Route: POST /api/auth/google
 */
 async function googleLoginController(request, response) {
  try {
    const { credential } = request.body

    if (!credential) {
      return response.status(400).json({
        message: 'Credencial do Google e obrigatoria.'
      })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const email = payload?.email
    const name = payload?.given_name || payload?.name || 'Usuario'

    if (!email) {
      return response.status(401).json({
        message: 'Token do Google invalido (sem email).'
      })
    }

    const existingUsers = await executeDatabaseQuery(
      'SELECT ID, NAME, EMAIL, PROVIDER FROM USERS WHERE EMAIL = ? LIMIT 1;',
      [email]
    )

    let userRecord = existingUsers[0]
    let userWasCreatedNow = false

    if (userRecord && userRecord.PROVIDER === 'LOCAL') {
      return response.status(403).json({
        message:
          'Este email ja esta cadastrado com login local. Entre com email e senha.'
      })
    }

    if (!userRecord) {
      const passwordHashPlaceholder = await bcrypt.hash(
        `google_${email}_${Date.now()}`,
        10
      )

      const insertResult = await executeDatabaseQuery(
        `
        INSERT INTO USERS (NAME, EMAIL, PASSWORD_HASH, PROVIDER)
        VALUES (?, ?, ?, 'GOOGLE');
        `,
        [name, email, passwordHashPlaceholder]
      )

      userRecord = {
        ID: insertResult.insertId,
        NAME: name,
        EMAIL: email,
        PROVIDER: 'GOOGLE'
      }

      userWasCreatedNow = true
    }

    // ✅ Se é usuário novo (Google), cria board padrão + membro + colunas
    if (userWasCreatedNow) {
      const insertBoardResult = await executeDatabaseQuery(
        `
        INSERT INTO KANBAN_BOARDS (NAME, OWNER_USER_ID, VISIBILITY)
        VALUES ('Meu Kanban', ?, 'PRIVATE');
        `,
        [userRecord.ID]
      )

      const createdBoardId = insertBoardResult.insertId

      await executeDatabaseQuery(
        `
        INSERT INTO KANBAN_BOARD_MEMBERS (BOARD_ID, USER_ID, ROLE)
        VALUES (?, ?, 'EDITOR');
        `,
        [createdBoardId, userRecord.ID]
      )

      await executeDatabaseQuery(
        `
        INSERT INTO KANBAN_COLUMNS (BOARD_ID, NAME, ORDER_INDEX)
        VALUES
          (?, 'A Fazer', 1),
          (?, 'Em Progresso', 2),
          (?, 'Concluído', 3);
        `,
        [createdBoardId, createdBoardId, createdBoardId]
      )
    }

    const authenticationToken = generateAuthenticationToken(userRecord)

    return response.json({
      message: 'Login com Google realizado com sucesso.',
      token: authenticationToken,
      user: {
        id: userRecord.ID,
        name: userRecord.NAME,
        email: userRecord.EMAIL
      }
    })
  } catch (controllerError) {
    console.error('Erro no login com Google:', controllerError)

    return response.status(401).json({
      message: 'Falha no login com Google.'
    })
  }
}


/**
 * Controller: forgot password (send reset link by email).
 * Route: POST /api/auth/forgot-password
 */
async function forgotPasswordController(request, response) {
  try {
    const { email } = request.body

    if (!email) {
      return response.status(400).json({ message: 'Email e obrigatorio.' })
    }

    const usersFound = await executeDatabaseQuery(
      'SELECT ID, EMAIL, PROVIDER FROM USERS WHERE EMAIL = ? LIMIT 1;',
      [email]
    )

    const userRecord = usersFound[0]

    // Resposta neutra (seguranca): nao revelar se existe ou nao
    if (!userRecord) {
      return response.json({
        message: 'Se este email existir, enviaremos um link para redefinir a senha.',
        hint: 'UNKNOWN'
      })
    }

    // Conta Google: nao envia reset, mas manda hint para o front orientar o usuario
    if (userRecord.PROVIDER === 'GOOGLE') {
      return response.json({
        message: 'Se este email existir, enviaremos um link para redefinir a senha.',
        hint: 'GOOGLE_ACCOUNT'
      })
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = await bcrypt.hash(rawToken, 10)

    await executeDatabaseQuery(
      `
      INSERT INTO PASSWORD_RESET_TOKENS (USER_ID, TOKEN_HASH, EXPIRES_AT)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE));
      `,
      [userRecord.ID, tokenHash]
    )

    const resetLink = buildPasswordResetLink(email, rawToken)

    await sendPasswordResetEmail(email, resetLink)

    return response.json({
      message: 'Se este email existir, enviaremos um link para redefinir a senha.',
      hint: 'EMAIL_PASSWORD_ACCOUNT'
    })
  } catch (controllerError) {
    console.error('Erro no forgot password:', controllerError)
    return response.status(500).json({ message: 'Erro inesperado.' })
  }
}

/**
 * Controller: reset password using token.
 * Route: POST /api/auth/reset-password
 */
async function resetPasswordController(request, response) {
  try {
    const { email, token, newPassword } = request.body

    if (!email || !token || !newPassword) {
      return response.status(400).json({
        message: 'Email, token e nova senha sao obrigatorios.'
      })
    }

    const passwordValidation = validatePasswordPolicy(newPassword)

    if (!passwordValidation.isValid) {
      return response.status(400).json({
        message:
          'A senha deve ter no minimo 8 caracteres e conter: letra maiuscula, letra minuscula, numero e caractere especial.',
        rules: passwordValidation.rules
      })
    }

    const usersFound = await executeDatabaseQuery(
      'SELECT ID, PROVIDER FROM USERS WHERE EMAIL = ? LIMIT 1;',
      [email]
    )

    const userRecord = usersFound[0]

    if (!userRecord || userRecord.PROVIDER === 'GOOGLE') {
      return response
        .status(400)
        .json({ message: 'Solicitacao de redefinicao invalida.' })
    }

    const tokensFound = await executeDatabaseQuery(
      `
      SELECT ID, TOKEN_HASH, EXPIRES_AT, USED_AT
      FROM PASSWORD_RESET_TOKENS
      WHERE USER_ID = ?
      ORDER BY ID DESC
      LIMIT 1;
      `,
      [userRecord.ID]
    )

    const tokenRecord = tokensFound[0]

    if (!tokenRecord) {
      return response.status(400).json({ message: 'Token invalido ou expirado.' })
    }

    const tokenAlreadyUsed = tokenRecord.USED_AT !== null
    const tokenExpired = new Date(tokenRecord.EXPIRES_AT).getTime() < Date.now()

    if (tokenAlreadyUsed || tokenExpired) {
      return response.status(400).json({ message: 'Token invalido ou expirado.' })
    }

    const tokenMatches = await bcrypt.compare(token, tokenRecord.TOKEN_HASH)

    if (!tokenMatches) {
      return response.status(400).json({ message: 'Token invalido ou expirado.' })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    await executeDatabaseQuery(
      'UPDATE USERS SET PASSWORD_HASH = ? WHERE ID = ?;',
      [newPasswordHash, userRecord.ID]
    )

    await executeDatabaseQuery(
      'UPDATE PASSWORD_RESET_TOKENS SET USED_AT = NOW() WHERE ID = ?;',
      [tokenRecord.ID]
    )

    return response.json({ message: 'Senha atualizada com sucesso.' })
  } catch (controllerError) {
    console.error('Erro no reset password:', controllerError)
    return response.status(500).json({ message: 'Erro inesperado.' })
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  googleLoginController,
  forgotPasswordController,
  resetPasswordController
}
