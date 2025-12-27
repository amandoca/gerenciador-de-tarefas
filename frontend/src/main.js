import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import 'animate.css'
import i18n from './i18n'

const app = createApp(App)

app.use(router)
app.use(Toast)
app.use(i18n)
app.mount('#app')

// Solicitar permissão de notificações
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert(i18n.global.t('common.notificationsUnsupported'))
    return
  }

  await Notification.requestPermission()
}

// Chamar a função assim que o app carregar
requestNotificationPermission()
