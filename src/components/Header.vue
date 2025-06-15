<template>
  <header class="kanban-header">
    <!-- Filtro de usuários -->
    <div v-if="users?.length" class="users-filter-bar">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-avatar"
        :class="{ selected: filteredUserId === user.id }"
        @click="
          () => {
            $emit('user-filter', filteredUserId === user.id ? null : user.id)
          }
        "
        :title="user.name"
      >
        <span>{{ user.name[0] }}</span>
      </div>
      <div
        class="user-avatar clear-filter"
        v-if="filteredUserId"
        @click="$emit('user-filter', null)"
        title="Limpar filtro"
      >
        ✕
      </div>
    </div>

    <!-- Barra de busca -->
    <div class="search-bar">
      <input
        type="text"
        placeholder="Buscar tarefa..."
        :value="searchTerm"
        @input="
          (e) => {
            $emit('search', e.target.value)
          }
        "
        maxlength="40"
      />
    </div>

    <BackgroundSelector @background-changed="handleBackgroundChange" />
  </header>
</template>

<script>
import BackgroundSelector from './BackgroundSelector.vue'

export default {
  components: { BackgroundSelector },
  props: {
    users: Array,
    filteredUserId: String,
    searchTerm: String
  },
  emits: ['background-changed', 'user-filter', 'search'],
  methods: {
    handleBackgroundChange(url) {
      this.$emit('background-changed', url)
    }
  }
}
</script>

<style scoped>
.kanban-header {
  background: linear-gradient(120deg, #1b1e30d8 70%, #23294dd2 100%);
  box-shadow:
    0 4px 32px #23294d22,
    0 2px 14px #ffe08a16;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #ffe08a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 82px;
  padding: 0 42px 0 32px;
  font-size: 1rem;
  position: fixed;
  top: 0;
  left: 274px;
  width: calc(100% - 274px);
  transition:
    left 0.3s,
    width 0.3s;
  z-index: 30;
  border-bottom: 2px solid #232849;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-glow-header {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #222233;
  box-shadow:
    0 0 12px 2px #ffe08a77,
    0 2px 12px #ffe08a22;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  animation: glowHeader 2.5s infinite alternate;
}
@keyframes glowHeader {
  to {
    box-shadow:
      0 0 22px 5px #ffe08aee,
      0 2px 16px #ffe08a33;
  }
}
.logo-header {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: block;
}

.title {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 2px 0;
  letter-spacing: 0.05em;
  color: #ffe08a;
  text-shadow:
    0 2px 12px #ffe08a11,
    0 1px 4px #23284922;
  line-height: 1.1;
}
.highlight {
  color: #ffe08a;
  background: linear-gradient(90deg, #ffe08a 70%, #bae1fc 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #bae1fc;
  font-size: 1.01rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  margin-left: 2px;
  opacity: 0.95;
}

.users-filter-bar {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-right: 18px;
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #232849;
  color: #ffe08a;
  font-weight: 800;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2.1px solid #232849;
  transition:
    border 0.2s,
    box-shadow 0.18s;
  box-shadow: 0 1.5px 5px #ffe08a22;
  user-select: none;
}
.user-avatar.selected {
  border: 2.1px solid #ffe08a;
  background: #ffe08a;
  color: #191c2a;
  box-shadow: 0 2px 14px #ffe08a44;
}
.user-avatar.clear-filter {
  background: #ffe08a;
  color: #232849;
  font-size: 1.45rem;
  font-weight: bold;
  border: 2px solid #ffe08a;
  margin-left: 7px;
}
.user-avatar:hover {
  border-color: #bae1fc;
  background: #191c2a;
  color: #bae1fc;
}

.user-avatar.selected:hover,
.user-avatar.clear-filter:hover {
  background: #bae1fc;
  color: #191c2a;
  border-color: #bae1fc;
}

.search-bar {
  margin-left: 18px;
  margin-right: 18px;
}
.search-bar input {
  border-radius: 7px;
  border: 1.5px solid #232849;
  background: #222233;
  color: #ffe08a;
  font-size: 1rem;
  padding: 7px 13px;
  min-width: 200px;
  max-width: 290px;
  outline: none;
  transition: border 0.2s;
}
.search-bar input:focus {
  border: 1.5px solid #ffe08a;
  background: #232849;
  color: #ffe08a;
}

@media (max-width: 800px) {
  .kanban-header {
    padding: 0 8vw 0 3vw;
    height: 72px;
    left: 0 !important;
    width: 100% !important;
  }
  .title {
    font-size: 1.3rem;
  }
  .logo-glow-header {
    width: 32px;
    height: 32px;
  }
  .logo-header {
    width: 22px;
    height: 22px;
  }
}

@media (max-width: 560px) {
  .kanban-header {
    padding: 0 2vw 0 2vw;
    min-height: 54px;
    height: 58px;
  }
  .title {
    font-size: 1.09rem;
  }
  .subtitle {
    font-size: 0.85rem;
  }
}
</style>
