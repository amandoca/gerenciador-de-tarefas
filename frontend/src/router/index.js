import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Kanban from '@/views/Kanban.vue'
import Register from '@/views/Register.vue'
import { useToast } from 'vue-toastification'
import ForgotPassword from '@/views/ForgotPassword.vue'
import ResetPassword from '@/views/ResetPassword.vue'
import i18n from '@/i18n'

const toast = useToast()

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  {
    path: '/kanban',
    name: 'Kanban',
    component: Kanban,
    meta: { requiresAuth: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ✅ Proteção de rota + Toast Notification
router.beforeEach((to, from, next) => {
  const hasUser = localStorage.getItem('loggedUser')
  const hasToken = localStorage.getItem('token')
  const isAuthenticated = Boolean(hasUser && hasToken)

  if (to.meta.requiresAuth && !isAuthenticated) {
    toast.warning(i18n.global.t('auth.accessDenied'))
    next('/login')
  } else {
    next()
  }
})

export default router
