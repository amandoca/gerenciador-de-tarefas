import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') // <= esse nome bate com auth_service.js

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error?.response?.status
    const requestUrl = String(error?.config?.url || '')
    const isAuthRequest = requestUrl.includes('/auth/')

    if (statusCode === 401 && !isAuthRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('loggedUser')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
