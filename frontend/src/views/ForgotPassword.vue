<template>
  <div class="tarefando-bg">
    <div class="gradient-bg"></div>

    <div class="card">
      <div class="brand">
        <div class="logo-glow">
          <img src="/favicon.ico" class="logo" :alt="$t('app.logoAlt')" />
        </div>
        <h1>{{ $t('auth.forgot.title') }}</h1>
        <p class="subtitle">
          {{ $t('auth.forgot.subtitle') }}
        </p>
      </div>

      <form class="form" autocomplete="off" @submit.prevent="handleSubmit">
        <div class="input-group modern">
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="off"
            placeholder=" "
            data-cy="forgot-email"
          />
          <label for="email" :class="{ active: email }">{{
            $t('auth.labels.email')
          }}</label>
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

        <transition name="fade">
          <div v-if="infoMsg" class="info-box" data-cy="forgot-info">
            <div class="info-title">{{ $t('auth.forgot.ready') }}</div>
            <div class="info-text">{{ infoMsg }}</div>
          </div>
        </transition>

        <transition name="fade">
          <p v-if="errorMsg" class="error-msg" data-cy="forgot-error">
            {{ errorMsg }}
          </p>
        </transition>

        <button
          v-if="!isGoogleAccount"
          type="submit"
          class="btn"
          :disabled="loading || isCooldownActive"
          data-cy="forgot-submit"
        >
          <span v-if="loading" class="loader"></span>

          <span v-else-if="isCooldownActive">
            {{ $t('auth.forgot.resendIn', { seconds: cooldownSeconds }) }}
          </span>

          <span v-else>{{ $t('auth.forgot.submit') }}</span>
        </button>
      </form>

      <div class="back" data-cy="forgot-back" @click="goToLogin">
        {{ $t('auth.backToLogin') }}
      </div>
    </div>

    <footer class="footer">
      <span>© {{ new Date().getFullYear() }} {{ $t('app.name') }}</span>
      <span class="footer-cta">{{ $t('app.footerCta') }}</span>
    </footer>
  </div>
</template>

<script>
import { onBeforeUnmount, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { requestPasswordReset } from '@/services/auth_service'

export default {
  setup() {
    const router = useRouter()
    const { t } = useI18n()

    const email = ref('')
    const loading = ref(false)
    const errorMsg = ref('')
    const infoMsg = ref('')
    const isGoogleAccount = ref(false)

    // cooldown
    const cooldownSeconds = ref(0)
    let cooldownIntervalId = null

    const isCooldownActive = computed(() => cooldownSeconds.value > 0)

    function startCooldown(seconds = 30) {
      cooldownSeconds.value = seconds

      if (cooldownIntervalId) {
        clearInterval(cooldownIntervalId)
      }

      cooldownIntervalId = setInterval(() => {
        if (cooldownSeconds.value <= 1) {
          cooldownSeconds.value = 0
          clearInterval(cooldownIntervalId)
          cooldownIntervalId = null
          return
        }
        cooldownSeconds.value -= 1
      }, 1000)
    }

    onBeforeUnmount(() => {
      if (cooldownIntervalId) {
        clearInterval(cooldownIntervalId)
      }
    })

    async function handleSubmit() {
      if (loading.value || isCooldownActive.value) return

      loading.value = true
      errorMsg.value = ''
      infoMsg.value = ''
      isGoogleAccount.value = false

      try {
        const data = await requestPasswordReset(email.value)

        const baseMsg = data?.message || t('auth.forgot.emailSent')

        // Conta Google → não faz cooldown e remove botão
        if (data?.hint === 'GOOGLE_ACCOUNT') {
          isGoogleAccount.value = true
          infoMsg.value = t('auth.forgot.googleAccount')
          return
        }

        // Conta com senha → mostra mensagem e inicia cooldown
        infoMsg.value = baseMsg
        startCooldown(30)
      } catch (error) {
        console.error(error)
        errorMsg.value =
          error?.response?.data?.message || t('auth.forgot.error')
      } finally {
        loading.value = false
      }
    }

    function goToLogin() {
      router.push('/login')
    }

    return {
      email,
      loading,
      errorMsg,
      infoMsg,
      cooldownSeconds,
      isGoogleAccount,
      isCooldownActive,
      handleSubmit,
      goToLogin
    }
  }
}
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}
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
  padding: 24px;
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

.card {
  z-index: 2;
  background: rgba(27, 30, 48, 0.98);
  box-shadow:
    0 12px 40px 0 rgba(27, 30, 48, 0.25),
    0 2px 14px #1012281f;
  backdrop-filter: blur(22px);
  border-radius: 18px;
  padding: 34px 32px 26px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 440px;
  border: 2px solid #252a43;
  animation: fadeIn 0.65s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-18px);
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
  margin-bottom: 12px;
  text-align: center;
}
.logo-glow {
  margin-bottom: 10px;
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
  font-size: 1.9rem;
  letter-spacing: 0.03em;
  color: #ffe08a;
  font-weight: 900;
  margin: 0;
}
.subtitle {
  margin-top: 10px;
  color: #bae1fc;
  opacity: 0.92;
  font-weight: 500;
  line-height: 1.35;
  font-size: 1.02rem;
}

.form {
  width: 100%;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group.modern {
  position: relative;
  width: 100%;
}

.input-group.modern input {
  width: 100%;
  padding: 16px 48px 14px 42px;
  border: none;
  border-radius: 10px;
  background: #202439;
  color: #e5ecfa;
  font-size: 1.05rem;
  outline: none;
  border: 1.5px solid #222a4a;
  box-sizing: border-box;
  max-width: 100%;
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
  top: 16px;
  color: #9dc0e6;
  font-size: 1.03rem;
  font-weight: 600;
  pointer-events: none;
  opacity: 0.93;
  transition: all 0.19s cubic-bezier(0.77, 0.1, 0.62, 1.33);
}

.input-group.modern input:focus + label,
.input-group.modern input:not(:placeholder-shown) + label,
.input-group.modern label.active {
  top: -12px;
  left: 30px;
  font-size: 0.9rem;
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
}

.input-group.modern input:focus ~ .input-icon svg,
.input-group.modern input:not(:placeholder-shown) ~ .input-icon svg {
  stroke: #ffe08a;
  opacity: 1;
  transition: 0.22s;
}

.btn {
  margin-top: 2px;
  background: linear-gradient(89deg, #ffe08a 20%, #ffcb67 100%);
  color: #1a1d35;
  padding: 13px 0;
  border-radius: 10px;
  font-weight: 900;
  font-size: 1.07rem;
  border: none;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 18px #ffe08a33;
  width: 100%;
  cursor: pointer;
  transition:
    filter 0.2s,
    transform 0.06s;
}
.btn:active {
  transform: translateY(1px);
}
.btn[disabled] {
  filter: grayscale(1) opacity(0.6);
  cursor: not-allowed;
}

.loader {
  display: inline-block;
  width: 22px;
  height: 22px;
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

.info-box {
  background: #10152a;
  border: 1px solid #2b3144;
  padding: 12px 14px;
  border-radius: 12px;
}
.info-title {
  color: #ffe08a;
  font-weight: 900;
  margin-bottom: 4px;
  text-align: center;
}
.info-text {
  color: #bae1fc;
  opacity: 0.95;
  line-height: 1.35;
  text-align: center;
}

.error-msg {
  color: #f26767;
  background: #231e1e99;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 1rem;
  text-align: center;
  box-shadow: 0 2px 10px #90000010;
}

.back {
  margin-top: 14px;
  color: #bae1fc;
  cursor: pointer;
  font-weight: 800;
  opacity: 0.95;
}

.footer {
  margin-top: 22px;
  color: #ffe08a;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
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
  opacity: 0.9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 560px) {
  .card {
    padding: 22px 16px 18px 16px;
  }
  h1 {
    font-size: 1.55rem;
  }
}
</style>
