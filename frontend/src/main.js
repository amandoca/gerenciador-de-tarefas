import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import 'animate.css'

const app = createApp(App)

app.use(router)
app.mount('#app')
app.use(Toast)

// Solicitar permissão de notificações
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    alert('Seu navegador não suporta notificações.')
    return
  }

  const permission = await Notification.requestPermission()
}

// Chamar a função assim que o app carregar
requestNotificationPermission()
