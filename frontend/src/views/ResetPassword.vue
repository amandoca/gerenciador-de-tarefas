<template>
  <div class="tarefando-bg">
    <div class="gradient-bg"></div>

    <div class="card">
      <div class="brand">
        <div class="logo-glow">
          <img src="/favicon.ico" class="logo" :alt="$t('app.logoAlt')" />
        </div>

        <h1>{{ $t('auth.reset.title') }}</h1>
        <p class="subtitle">
          {{ $t('auth.reset.subtitle') }}
          <span class="email">{{ email }}</span>
        </p>
      </div>

      <form class="form" autocomplete="off" @submit.prevent="handleSubmit">
        <div class="input-group modern">
          <input
            id="password"
            v-model="newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            class="has-toggle"
            required
            autocomplete="off"
            placeholder=" "
            data-cy="reset-password"
          />
          <label for="password" :class="{ active: newPassword }">{{
            $t('auth.reset.newPassword')
          }}</label>
          <button
            type="button"
            class="password-toggle"
            :aria-label="
              showNewPassword
                ? $t('auth.password.hide')
                : $t('auth.password.show')
            "
            @click="toggleNewPasswordVisibility"
            data-cy="reset-password-toggle"
          >
            <span class="material-icons">{{
              showNewPassword ? 'visibility_off' : 'visibility'
            }}</span>
          </button>
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

        <div class="input-group modern">
          <input
            id="confirm"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="has-toggle"
            required
            autocomplete="off"
            placeholder=" "
            data-cy="reset-confirm"
          />
          <label for="confirm" :class="{ active: confirmPassword }">{{
            $t('auth.reset.confirmPassword')
          }}</label>
          <button
            type="button"
            class="password-toggle"
            :aria-label="
              showConfirmPassword
                ? $t('auth.password.hide')
                : $t('auth.password.show')
            "
            @click="toggleConfirmPasswordVisibility"
            data-cy="reset-confirm-toggle"
          >
            <span class="material-icons">{{
              showConfirmPassword ? 'visibility_off' : 'visibility'
            }}</span>
          </button>
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
          <div v-if="newPassword" class="rules" data-cy="reset-rules">
            <div class="rules-title">{{ $t('auth.reset.rulesTitle') }}</div>

            <div
              class="rule"
              :class="{ ok: hasMinLength }"
              data-cy="rule-min-length"
            >
              <span class="dot"></span>
              <span>{{ $t('auth.reset.rules.minLength') }}</span>
            </div>

            <div
              class="rule"
              :class="{ ok: hasUppercase }"
              data-cy="rule-uppercase"
            >
              <span class="dot"></span>
              <span>{{ $t('auth.reset.rules.uppercase') }}</span>
            </div>

            <div
              class="rule"
              :class="{ ok: hasLowercase }"
              data-cy="rule-lowercase"
            >
              <span class="dot"></span>
              <span>{{ $t('auth.reset.rules.lowercase') }}</span>
            </div>

            <div
              class="rule"
              :class="{ ok: hasNumber }"
              data-cy="rule-number"
            >
              <span class="dot"></span>
              <span>{{ $t('auth.reset.rules.number') }}</span>
            </div>

            <div
              class="rule"
              :class="{ ok: hasSpecial }"
              data-cy="rule-special"
            >
              <span class="dot"></span>
              <span>{{ $t('auth.reset.rules.special') }}</span>
            </div>

            <div class="strength">
              <div class="strength-label">
                {{ $t('auth.reset.strength', { score: passwordScore }) }}
              </div>
              <div class="bar">
                <div
                  class="fill"
                  :style="{ width: passwordScore * 20 + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </transition>

        <transition name="fade">
          <p v-if="errorMsg" class="error-msg" data-cy="reset-error">
            {{ errorMsg }}
          </p>
        </transition>

        <button
          class="btn"
          type="submit"
          :disabled="loading || !passwordIsValid"
          data-cy="reset-submit"
        >
          <span v-if="!loading">{{ $t('auth.reset.submit') }}</span>
          <span v-else class="loader"></span>
        </button>
      </form>

      <div class="back" data-cy="reset-back" @click="goToLogin">
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
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import { resetPassword } from '@/services/auth_service'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const toast = useToast()
    const { t } = useI18n()

    const email = ref('')
    const token = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const showNewPassword = ref(false)
    const showConfirmPassword = ref(false)
    const loading = ref(false)
    const errorMsg = ref('')

    onMounted(() => {
      email.value = String(route.query.email || '')
      token.value = String(route.query.token || '')

      if (!email.value || !token.value) {
        errorMsg.value = t('auth.reset.invalidLink')
      }
    })

    // ✅ regras da senha (front)
    const hasMinLength = computed(() => newPassword.value.length >= 8)
    const hasUppercase = computed(() => /[A-Z]/.test(newPassword.value))
    const hasLowercase = computed(() => /[a-z]/.test(newPassword.value))
    const hasNumber = computed(() => /[0-9]/.test(newPassword.value))
    const hasSpecial = computed(() => /[^A-Za-z0-9]/.test(newPassword.value))

    const passwordScore = computed(() => {
      const checks = [
        hasMinLength.value,
        hasUppercase.value,
        hasLowercase.value,
        hasNumber.value,
        hasSpecial.value
      ]
      return checks.filter(Boolean).length
    })

    const passwordIsValid = computed(() => passwordScore.value === 5)

    async function handleSubmit() {
      errorMsg.value = ''

      if (!email.value || !token.value) {
        errorMsg.value = t('auth.reset.invalidLink')
        return
      }

      if (!passwordIsValid.value) {
        errorMsg.value = t('auth.reset.rulesError')
        return
      }

      if (newPassword.value !== confirmPassword.value) {
        errorMsg.value = t('auth.reset.mismatch')
        return
      }

      loading.value = true

      try {
        const data = await resetPassword(
          email.value,
          token.value,
          newPassword.value
        )

        toast.success(data?.message || t('auth.reset.success'))
        router.push('/login')
      } catch (error) {
        console.error(error)
        const backendMessage =
          error?.response?.data?.message || t('auth.reset.error')

        errorMsg.value = backendMessage
      } finally {
        loading.value = false
      }
    }

    function goToLogin() {
      router.push('/login')
    }

    function toggleNewPasswordVisibility() {
      showNewPassword.value = !showNewPassword.value
    }

    function toggleConfirmPasswordVisibility() {
      showConfirmPassword.value = !showConfirmPassword.value
    }

    return {
      email,
      newPassword,
      confirmPassword,
      showNewPassword,
      showConfirmPassword,
      loading,
      errorMsg,
      handleSubmit,
      goToLogin,
      toggleNewPasswordVisibility,
      toggleConfirmPasswordVisibility,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      passwordScore,
      passwordIsValid
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
.email {
  color: #ffe08a;
  font-weight: 900;
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

.input-group.modern input.has-toggle {
  padding-right: 86px;
}

.password-toggle {
  position: absolute;
  right: 14px;
  top: 12px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #9dc0e6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    color 0.18s,
    border 0.18s,
    background 0.18s;
}

.password-toggle:hover {
  color: #ffe08a;
  border-color: #ffe08a66;
  background: #232849;
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

.rules {
  margin-top: 2px;
  background: #10152a;
  border: 1px solid #2b3144;
  border-radius: 12px;
  padding: 12px;
}

.rules-title {
  color: #bae1fc;
  font-weight: 900;
  margin-bottom: 10px;
}

.rule {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #cfe7ff;
  opacity: 0.78;
  margin: 6px 0;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.rule .dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 2px solid #93c2fd;
  display: inline-block;
  transition: all 0.22s ease;
}

.rule.ok {
  opacity: 1;
  transform: translateX(4px);
}

.rule.ok .dot {
  border-color: #ffe08a;
  background: #ffe08a;
  box-shadow: 0 0 12px #ffe08a55;
}

.strength {
  margin-top: 12px;
}
.strength-label {
  color: #bae1fc;
  font-weight: 800;
  margin-bottom: 6px;
}

.bar {
  height: 10px;
  border-radius: 999px;
  background: #202439;
  border: 1px solid #222a4a;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe08a, #ffcb67);
  width: 0%;
  transition: width 0.25s ease;
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
  cursor: pointer;
  width: 100%;
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
