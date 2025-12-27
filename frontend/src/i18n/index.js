import { createI18n } from 'vue-i18n'
import ptBr from '../../locales/pt-BR.json'
import enUs from '../../locales/en-US.json'

const messages = {
  'pt-BR': ptBr,
  'en-US': enUs
}

function resolveInitialLocale() {
  try {
    const storedLocale = localStorage.getItem('appLocale')
    if (storedLocale === 'pt-BR' || storedLocale === 'en-US') {
      return storedLocale
    }
  } catch (error) {
    console.error('Erro ao ler idioma salvo:', error)
  }

  return 'pt-BR'
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: resolveInitialLocale(),
  fallbackLocale: 'pt-BR',
  messages
})

export default i18n
