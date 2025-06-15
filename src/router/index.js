import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Kanban from '@/views/Kanban.vue'
import Register from '@/views/Register.vue'
import { useToast } from 'vue-toastification' // ✅ Importa Toast

const toast = useToast()

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  {
    path: '/kanban',
    name: 'Kanban',
    component: Kanban,
    meta: { requiresAuth: true } // 🔒 Agora a rota requer autenticação!
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ✅ Proteção de rota + Toast Notification
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('loggedUser')

  if (to.meta.requiresAuth && !isAuthenticated) {
    toast.warning('Acesso negado! Faça login para acessar o Kanbanana.')
    next('/login')
  } else {
    next()
  }
})

export default router
