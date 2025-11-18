<template>
  <div class="tarefando-bg">
    <div class="gradient-bg"></div>
    <div class="login-card">
      <div class="brand">
        <div class="logo-glow">
          <img src="/favicon.ico" class="logo" alt="Logo Tarefando" />
        </div>
        <h1>Tarefando</h1>
        <p class="slogan">
          Plataforma moderna para produtividade de equipes e profissionais
          <span class="emoji">🚀</span>
        </p>
      </div>
      <div class="social-login">
        <div id="signin-button" class="google-btn"></div>
      </div>
      <div class="divider"><span>ou</span></div>
      <form
        @submit.prevent="handleLocalLogin"
        class="login-form"
        autocomplete="off"
      >
        <div class="input-group modern">
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="off"
          />
          <label for="email" :class="{ active: email }">E-mail</label>
          <span class="input-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9dc0e6"
              stroke-width="2"
            >
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </span>
        </div>
        <div class="input-group modern">
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="off"
          />
          <label for="password" :class="{ active: password }">Senha</label>
          <span class="input-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9dc0e6"
              stroke-width="2"
            >
              <rect x="5" y="11" width="14" height="7" rx="2" />
              <path d="M12 15v-4a4 4 0 1 1 8 0v4" />
            </svg>
          </span>
        </div>

        <transition name="fade">
          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        </transition>
        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="!loading">Entrar</span>
          <span v-else class="loader"></span>
        </button>
      </form>

      <div class="register-link" @click="goToRegister">
        Novo aqui? <span>Crie sua conta</span>
      </div>
    </div>
    <footer class="footer">
      <span>© {{ new Date().getFullYear() }} Tarefando</span>
      <span class="footer-cta">— Mais foco, menos caos &#58&#41</span>
    </footer>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { login as loginRequest } from '@/services/auth_service'

export default {
  setup() {
    const router = useRouter()
    const toast = useToast()

    const email = ref('')
    const password = ref('')
    const errorMsg = ref('')
    const loading = ref(false)

    // 🔹 Login via backend (email + senha)
    const handleLocalLogin = async () => {
      loading.value = true
      errorMsg.value = ''

      try {
        const { user } = await loginRequest(email.value, password.value)

        toast.success(`Bem-vindo(a), ${user.name}! ✨`)
        router.push('/kanban')
      } catch (err) {
        console.error(err)

        const backendMessage =
          err?.response?.data?.message || 'Email ou senha inválidos.'

        errorMsg.value = backendMessage
        toast.error(backendMessage)
      } finally {
        loading.value = false
      }
    }

    // 🔹 Login via Google (ainda local)
    const handleCredentialResponse = (response) => {
      const token = response.credential
      const userInfo = parseJwt(token)
      if (userInfo) {
        const userData = {
          name: userInfo.given_name,
          email: userInfo.email
        }
        // Aqui ainda é só local — depois, se quiser, integramos com o backend
        localStorage.setItem('loggedUser', JSON.stringify(userData))
        // não temos JWT válido do seu backend aqui
        // então as tasks protegidas por token podem não funcionar com esse login
        router.push('/kanban')
      }
    }

    const parseJwt = (token) => {
      try {
        return JSON.parse(atob(token.split('.')[1]))
      } catch (e) {
        errorMsg.value = 'Erro de login Google.'
        return null
      }
    }

    const goToRegister = () => router.push('/register')

    onMounted(() => {
      const clientId = process.env.VUE_APP_GOOGLE_CLIENT_ID
      const checkGoogle = () => {
        if (window.google) {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse
          })
          google.accounts.id.renderButton(
            document.getElementById('signin-button'),
            { theme: 'filled_black', size: 'large', width: 320 }
          )
        } else {
          setTimeout(checkGoogle, 100)
        }
      }
      checkGoogle()
    })

    return {
      email,
      password,
      errorMsg,
      loading,
      handleLocalLogin,
      goToRegister
    }
  }
}
</script>

<style scoped>
.tarefando-bg {
  min-height: 100vh;
  min-width: 100vw;
  background: linear-gradient(120deg, #191c2a 60%, #26314d 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.gradient-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 10%, #62c9f7 0, transparent 62%),
    radial-gradient(circle at 60% 80%, #ffe08a 0, transparent 50%),
    linear-gradient(120deg, #171b2b 60%, #23294d 100%);
  opacity: 0.18;
  z-index: 0;
  animation: moveBg 14s infinite alternate;
}
@keyframes moveBg {
  0% {
    background-position:
      80% 10%,
      60% 80%;
  }
  100% {
    background-position:
      75% 15%,
      65% 90%;
  }
}
.login-card {
  z-index: 2;
  background: rgba(27, 30, 48, 0.98);
  box-shadow:
    0 12px 40px 0 rgba(27, 30, 48, 0.25),
    0 2px 14px #1012281f;
  backdrop-filter: blur(22px);
  border-radius: 18px;
  padding: 50px 44px 36px 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 390px;
  min-width: unset;
  margin: 52px 0 32px 0;
  border: 2px solid #252a43;
  transition:
    box-shadow 0.2s,
    border 0.19s;
  position: relative;
  animation: fadeIn 1.1s cubic-bezier(0.17, 0.67, 0.83, 0.67);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}
.logo-glow {
  margin-bottom: 8px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow:
    0 0 16px 2px #ffe08a66,
    0 2px 20px #ffe08a22;
  background: #222233;
  animation: glow 2.5s infinite alternate;
}
@keyframes glow {
  to {
    box-shadow:
      0 0 28px 4px #ffe08aee,
      0 2px 22px #ffe08a33;
  }
}
.logo {
  width: 46px;
  height: 46px;
  border-radius: 13px;
}
h1 {
  font-size: 2.25rem;
  margin-bottom: 3px;
  letter-spacing: 0.07em;
  color: #ffe08a;
  font-weight: 900;
  text-shadow: 0 2px 10px #00000026;
}
.slogan {
  font-size: 1.03rem;
  color: #bae1fc;
  margin-bottom: 9px;
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.01em;
  opacity: 0.94;
  display: flex;
  align-items: center;
  gap: 3px;
}
.emoji {
  display: inline-block;
  animation: emojiPop 1.4s infinite alternate;
  filter: drop-shadow(0 1px 6px #ffe08a99);
}
@keyframes emojiPop {
  to {
    transform: translateY(-3px) scale(1.2);
  }
}
.social-login {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 13px;
  text-align: -webkit-center;
}
#signin-button {
  width: 100%;
}
.google-btn {
  filter: drop-shadow(0 2px 12px #ffe08a44);
}
.divider {
  width: 100%;
  text-align: center;
  border-bottom: 1.5px solid #2b3144;
  line-height: 0.1em;
  margin: 18px 0 19px 0;
}
.divider span {
  background: #191d31;
  padding: 0 16px;
  color: #ffe08a;
  font-size: 1.13rem;
  font-weight: 600;
}
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.input-group label {
  font-size: 1.03rem;
  color: #93c2fd;
  margin-bottom: 2px;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.input-wrapper {
  display: flex;
  align-items: center;
  background: #19203a;
  border-radius: 8px;
  border: 1.5px solid #222a4a;
  transition: border 0.17s;
  box-shadow: 0 1px 6px #16203018;
}
.input-wrapper:focus-within {
  border-color: #ffe08a;
}
.input-wrapper .icon {
  width: 21px;
  height: 21px;
  margin-left: 9px;
  margin-right: 6px;
  opacity: 0.7;
}
.input-wrapper input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #fffbe5;
  font-size: 1.09rem;
  padding: 11px 8px;
  border-radius: 8px;
}
.input-wrapper input::placeholder {
  color: #c3cbd6a0;
}
.login-btn {
  margin-top: 8px;
  background: linear-gradient(89deg, #ffe08a 20%, #ffcb67 100%);
  color: #1a1d35;
  padding: 13px 0;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1.13rem;
  border: none;
  letter-spacing: 0.07em;
  box-shadow: 0 2px 18px #ffe08a33;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    background 0.22s,
    box-shadow 0.2s;
}
.login-btn:active {
  box-shadow: 0 1px 2px #0002;
  background: #ffe8ba;
}
.login-btn[disabled] {
  filter: grayscale(1) opacity(0.57);
  cursor: not-allowed;
}
.loader {
  display: inline-block;
  width: 23px;
  height: 23px;
  border: 3px solid #ffe08a77;
  border-top: 3px solid #ffca67;
  border-radius: 50%;
  animation: spin 1.08s linear infinite;
  vertical-align: middle;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.error-msg {
  color: #f26767;
  background: #231e1e99;
  padding: 8px 14px;
  border-radius: 7px;
  font-size: 1.03rem;
  margin-top: -5px;
  margin-bottom: 2px;
  text-align: center;
  letter-spacing: 0.01em;
  font-weight: 500;
  box-shadow: 0 2px 10px #90000010;
}

.register-link {
  color: #ffe08a;
  margin-top: 15px;
  font-size: 1.13rem;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
}
.register-link span {
  color: #ffca67;
  text-decoration: underline;
  font-weight: 700;
  transition: color 0.2s;
}
.register-link span:hover {
  color: #bae1fc;
}
.footer {
  margin-top: 36px;
  color: #ffe08a;
  font-size: 0.96rem;
  text-align: center;
  width: 100vw;
  position: absolute;
  bottom: 13px;
  left: 0;
  z-index: 3;
  font-weight: 500;
  display: flex;
  justify-content: center;
  gap: 7px;
  opacity: 0.81;
  pointer-events: none;
}
.footer-cta {
  color: #bae1fc;
  font-weight: 700;
  font-size: 0.99rem;
  opacity: 0.9;
}
.input-group.modern {
  position: relative;
  margin-bottom: 20px;
}

.input-group.modern input {
  width: 76%;
  padding: 17px 48px 15px 42px;
  border: none;
  border-radius: 8px;
  background: #202439;
  color: #e5ecfa;
  font-size: 1.08rem;
  outline: none;
  box-shadow: 0 2px 14px #20284022;
  border: 1.5px solid #222a4a;
  transition:
    box-shadow 0.19s,
    border 0.18s,
    background 0.2s;
}

.input-group.modern input:focus {
  background: #232849;
  border: 1.7px solid #ffe08a;
  box-shadow: 0 2px 18px #ffe08a22;
}

.input-group.modern label {
  position: absolute;
  left: 42px;
  top: 17px;
  color: #9dc0e6;
  font-size: 1.07rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  pointer-events: none;
  background: transparent;
  opacity: 0.93;
  transition: all 0.19s cubic-bezier(0.77, 0.1, 0.62, 1.33);
}

.input-group.modern input:focus + label,
.input-group.modern input:not(:placeholder-shown) + label,
.input-group.modern label.active {
  top: -13px;
  left: 32px;
  font-size: 0.92rem;
  color: #ffe08a;
  background: #191d31;
  padding: 0 8px;
  border-radius: 7px;
  opacity: 1;
  z-index: 2;
}

.input-group.modern .input-icon {
  position: absolute;
  left: 13px;
  top: 14px;
  width: 22px;
  height: 22px;
  pointer-events: none;
  opacity: 0.72;
  transition: opacity 0.18s;
}

.input-group.modern input:focus ~ .input-icon svg,
.input-group.modern input:not(:placeholder-shown) ~ .input-icon svg {
  stroke: #ffe08a;
  opacity: 1;
  transition: 0.22s;
}

@media (max-width: 560px) {
  .login-card {
    padding: 18px 3vw 17px 3vw;
    min-width: unset;
    width: 99vw;
    margin: 22px 0 8vw 0;
  }
  .brand h1 {
    font-size: 1.26rem;
  }
  .logo-glow {
    width: 34px;
    height: 34px;
  }
  .logo {
    width: 28px;
    height: 28px;
  }
  .footer {
    font-size: 0.82rem;
  }
}
</style>
