<template>
  <header class="kanban-header" :style="headerStyle">
    <div class="header-left">
      <button
        class="nav-toggle"
        :aria-label="$t('kanban.header.toggleSidebar')"
        @click="handleToggleSidebar"
      >
        <span class="material-icons">{{
          sidebarOpen ? 'menu_open' : 'menu'
        }}</span>
      </button>
      <!-- Filtro de usuários -->
      <div v-if="users?.length" class="users-filter-bar">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-avatar"
          :class="{ selected: filteredUserId === user.id }"
          :title="user.name"
          @click="handleUserFilterClick(user.id)"
        >
          <span>{{ user.name[0] }}</span>
        </div>
        <div
          v-if="filteredUserId"
          class="user-avatar clear-filter"
          :title="$t('kanban.header.clearFilter')"
          @click="clearUserFilter"
        >
          ✕
        </div>
      </div>

      <!-- Barra de busca -->
      <div class="search-bar">
        <input
          type="text"
          :placeholder="$t('kanban.header.searchPlaceholder')"
          :value="searchTerm"
          maxlength="40"
          @input="handleSearchInput"
          data-cy="header-search"
        />
      </div>
    </div>

    <div class="header-actions">
      <LanguageSelector />

      <BackgroundSelector
        :current-background-id="currentBackgroundId"
        @background-changed="handleBackgroundChange"
      />
    </div>
  </header>
</template>

<script>
import BackgroundSelector from './BackgroundSelector.vue'
import LanguageSelector from './LanguageSelector.vue'

export default {
  name: 'AppHeader',
  components: { BackgroundSelector, LanguageSelector },
  props: {
    currentBackgroundId: {
      type: String,
      default: null
    },
    users: {
      type: Array,
      default: () => []
    },
    filteredUserId: {
      type: [String, Number],
      default: null
    },
    searchTerm: {
      type: String,
      default: ''
    },
    sidebarOpen: {
      type: Boolean,
      default: true
    },
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  emits: ['background-changed', 'user-filter', 'search', 'toggle-sidebar'],
  computed: {
    headerStyle() {
      if (this.isMobile) {
        return {
          left: '0',
          width: '100%'
        }
      }
      const offset = this.sidebarOpen
        ? 'var(--sidebar-expanded, 274px)'
        : 'var(--sidebar-collapsed, 64px)'
      return {
        left: offset,
        width: `calc(100% - ${offset})`
      }
    }
  },
  methods: {
    handleToggleSidebar() {
      this.$emit('toggle-sidebar')
    },
    handleUserFilterClick(userId) {
      const isSameUser = this.filteredUserId === userId
      const nextUserId = isSameUser ? null : userId
      this.$emit('user-filter', nextUserId)
    },
    clearUserFilter() {
      this.$emit('user-filter', null)
    },
    handleSearchInput(event) {
      this.$emit('search', event.target.value)
    },
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
  left: var(--sidebar-expanded, 274px);
  width: calc(100% - var(--sidebar-expanded, 274px));
  transition:
    left 0.3s,
    width 0.3s;
  z-index: 30;
  border-bottom: 2px solid #232849;
}

.nav-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #ffe08a;
  border: 1.6px solid #232849;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  margin-right: 14px;
  cursor: pointer;
  transition:
    background 0.2s,
    border 0.2s,
    transform 0.18s;
}

.nav-toggle:hover {
  background: #232849;
  border-color: #ffe08a;
  transform: translateY(-1px);
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

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
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
  margin-left: 0;
  margin-right: 0;
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

@media (max-width: 1100px) {
  .kanban-header {
    padding: 0 8vw 0 3vw;
    height: 72px;
    left: 0;
    width: 100%;
  }
  .nav-toggle {
    display: inline-flex;
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
  .header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}

.users-filter-bar {
    gap: 6px;
    overflow-x: auto;
    padding: 4px 0;
  }
  .search-bar input {
    min-width: 0;
    width: 62vw;
    max-width: 80vw;
  }
  .title {
    font-size: 1.09rem;
  }
  .subtitle {
    font-size: 0.85rem;
  }
}
</style>
