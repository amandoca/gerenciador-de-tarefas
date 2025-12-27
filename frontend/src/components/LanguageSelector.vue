<template>
  <div class="language-selector" data-cy="language-selector">
    <label class="language-label" :for="selectId">
      {{ $t('common.language') }}
    </label>
    <select
      :id="selectId"
      class="language-select"
      :value="currentLocale"
      :aria-label="$t('common.language')"
      @change="handleLocaleChange"
      data-cy="language-select"
    >
      <option
        v-for="option in languageOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const LANGUAGE_STORAGE_KEY = 'appLocale'

export default {
  name: 'LanguageSelector',
  setup() {
    const { locale, t } = useI18n()

    const selectId = 'language-selector'

    const currentLocale = computed(() => locale.value)

    const languageOptions = computed(() => [
      { value: 'pt-BR', label: `🇧🇷 ${t('common.languages.ptBr')}` },
      { value: 'en-US', label: `🇺🇸 ${t('common.languages.enUs')}` }
    ])

    function handleLocaleChange(event) {
      const nextLocale = event.target.value
      locale.value = nextLocale
      saveLocale(nextLocale)
    }

    function saveLocale(nextLocale) {
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale)
      } catch (error) {
        console.error('Erro ao salvar idioma:', error)
      }
    }

    return {
      selectId,
      currentLocale,
      languageOptions,
      handleLocaleChange
    }
  }
}
</script>

<style scoped>
.language-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-label {
  font-size: 0.85rem;
  color: #c9d6e6;
  font-weight: 600;
}

.language-select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(186, 225, 252, 0.2);
  color: #e5ecfa;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  outline: none;
  min-width: 150px;
}

.language-select option {
  color: #0f1220;
}
</style>
