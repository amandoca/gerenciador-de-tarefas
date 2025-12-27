<template>
  <header class="auth-header">
    <LanguageSelector />
  </header>
</template>

<script>
import LanguageSelector from './LanguageSelector.vue'

export default {
  name: 'AuthHeader',
  components: { LanguageSelector }
}
</script>

<style scoped>
.auth-header {
  position: fixed;
  top: 18px;
  right: 22px;
  z-index: 50;
  display: flex;
  align-items: center;
}
</style>
