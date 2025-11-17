// frontend/src/services/auth_service.js
import api from './api'

export async function register(name, email, password) {
  const response = await api.post('/auth/register', {
    name,
    email,
    password
  })

  return response.data // { message, user }
}

export async function login(email, password) {
  const response = await api.post('/auth/login', {
    email,
    password
  })

  const { token, user } = response.data

  // guarda token + usuário
  localStorage.setItem('token', token)
  localStorage.setItem('loggedUser', JSON.stringify(user))

  return response.data // { message, token, user }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('loggedUser')
}
