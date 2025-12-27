<template>
  <div
    class="app-layout"
    :style="{
      '--sidebar-expanded': '274px',
      '--sidebar-collapsed': '64px',
      '--sidebar-offset': sidebarOffset
    }"
  >
    <AppSidebar
      v-if="showSidebar && isBoardSelectionReady"
      :expanded="sidebarOpen"
      :is-mobile="isMobile"
      :active-board-id="activeBoardId"
      @toggle="toggleSidebar"
      @select-board="handleSelectBoard"
      @refresh-board="handleRefreshBoard"
    />

    <div
      v-if="showSidebar && isMobile && sidebarOpen"
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

    <div
      class="main-content"
      :style="{
        backgroundImage: currentBackground
          ? `url(${currentBackground})`
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }"
    >
      <AppHeader
        v-if="showSidebar"
        :current-background-id="currentBackgroundId"
        @background-changed="updateBackground"
      />
      <AuthHeader v-else />
      <router-view
        :current-background="currentBackground"
        :filtered-user-id="filteredUserId"
        :search-term="searchTerm"
        :board-id="activeBoardId"
        :is-board-selection-ready="isBoardSelectionReady"
        :board-refresh-token="boardRefreshToken"
      />
    </div>
  </div>
</template>

<script>
import AppSidebar from './components/Sidebar.vue'
import AppHeader from './components/Header.vue'
import AuthHeader from './components/AuthHeader.vue'
import { fetchBoards } from '@/services/kanban/boards_service'
import {
  fetchPreferences,
  resolveBoardSelection,
  updatePreferences
} from '@/services/kanban/preferences_service'
import coffee from '@/assets/coffee.webp'
import flowers from '@/assets/flowers.webp'
import food from '@/assets/food.webp'
import galaxy from '@/assets/galaxy.webp'
import game from '@/assets/game.webp'
import mario from '@/assets/mario-bross.webp'
import starwars from '@/assets/stars-wars.webp'
import aurora from '@/assets/aurora.webp'
import mountains from '@/assets/mountains.webp'
import forest from '@/assets/forest-mist.webp'
import beach from '@/assets/beach-sunset.webp'
import neon from '@/assets/neon-city.webp'
import desert from '@/assets/desert-dunes.webp'
import autumn from '@/assets/autumn-forest.webp'
import coder from '@/assets/code-desk.webp'
import minimal from '@/assets/minimal-pastel.webp'
import underwater from '@/assets/underwater.webp'
import citynight from '@/assets/city-night.webp'

const BACKGROUNDS_BY_ID = {
  coffee,
  flowers,
  food,
  galaxy,
  game,
  mario,
  starwars,
  aurora,
  mountains,
  forest,
  beach,
  neon,
  desert,
  autumn,
  coder,
  minimal,
  underwater,
  citynight
}

export default {
  components: { AppSidebar, AppHeader, AuthHeader },
  data() {
    return {
      currentBackground: null,
      kanbanUsers: [],
      filteredUserId: null,
      searchTerm: '',
      sidebarOpen: true,
      isMobile: false,
      activeBoardId: null,
      currentBackgroundId: null,
      isBoardSelectionReady: false,
      boardRefreshToken: 0
    }
  },

  computed: {
    showSidebar() {
      return this.$route.path === '/kanban' // Sidebar só aparece no Kanban
    },
    loggedUserId() {
      try {
        const raw = localStorage.getItem('loggedUser')
        const user = raw ? JSON.parse(raw) : null
        return user?.id || user?.user_id || null
      } catch {
        return null
      }
    },
    sidebarOffset() {
      if (!this.showSidebar) return '0px'
      if (this.isMobile) return '0px'
      return this.sidebarOpen ? '274px' : '64px'
    }
  },
  watch: {
    async '$route.path'(newPath) {
      if (newPath === '/kanban') {
        this.isBoardSelectionReady = false
        await this.loadBackgroundPreference()
        await this.loadInitialBoardSelection()
        this.isBoardSelectionReady = true
      }
    }
  },
  async mounted() {
    this.handleResize()
    window.addEventListener('resize', this.handleResize)

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().catch(() => {})
    }

    document.documentElement.style.setProperty(
      '--dynamic-background-transparent',
      'hsla(206, 13.7%, 10%, 0.9)'
    )
    await this.loadBackgroundPreference()
    await this.loadInitialBoardSelection()
    this.isBoardSelectionReady = true
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    document.body.style.overflow = ''
  },
  methods: {
    handleResize() {
      const mobile = window.innerWidth <= 900
      if (mobile !== this.isMobile) {
        this.isMobile = mobile
        this.sidebarOpen = mobile ? false : true
      }

      if (!mobile && this.isMobile === mobile) {
        this.sidebarOpen = true
      }

      if (!mobile) {
        document.body.style.overflow = ''
      } else if (!this.sidebarOpen) {
        document.body.style.overflow = ''
      }
    },
    handleSelectBoard(boardId) {
      const nextBoardId = boardId ? Number(boardId) : null
      if (!nextBoardId) return

      this.activeBoardId = nextBoardId
      this.isBoardSelectionReady = true

      updatePreferences({ lastBoardId: nextBoardId }).catch((error) => {
        console.error('Erro ao salvar preferências do board:', error)
      })
    },
    async loadInitialBoardSelection() {
      try {
        if (!this.showSidebar) return

        const [boards, preferences] = await Promise.all([
          fetchBoards(),
          fetchPreferences()
        ])

        if (!boards.length) {
          this.activeBoardId = null
          return
        }
        const selection = resolveBoardSelection(
          boards,
          preferences,
          this.loggedUserId
        )

        this.activeBoardId = selection.nextBoardId

        if (selection.shouldPersist && selection.nextBoardId) {
          await updatePreferences({ lastBoardId: selection.nextBoardId })
        }
      } catch (error) {
        this.activeBoardId = null
      }
    },
    async loadBackgroundPreference() {
      try {
        // só aplica no kanban
        if (!this.showSidebar) return

        const preferences = await fetchPreferences()
        const bgId = preferences?.backgroundId

        // ✅ se vier null, reseta pro default do usuário
        const resolvedBgId = bgId || 'mario'

        this.currentBackgroundId = resolvedBgId
        this.currentBackground = BACKGROUNDS_BY_ID[resolvedBgId] || mario
      } catch (error) {
        // fallback
        this.currentBackgroundId = 'mario'
        this.currentBackground = mario
      }
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
      if (this.isMobile) {
        document.body.style.overflow = this.sidebarOpen ? 'hidden' : ''
      }
    },
    async updateBackground(backgroundId) {
      this.currentBackgroundId = backgroundId
      this.currentBackground = BACKGROUNDS_BY_ID[backgroundId] || mario

      try {
        // update parcial: só backgroundId
        await updatePreferences({ backgroundId })
      } catch (error) {
        console.error('Erro ao salvar background no backend:', error)
      }
    },
    handleRefreshBoard() {
      this.boardRefreshToken = this.boardRefreshToken + 1
    },
    handleUserFilter(userId) {
      this.filteredUserId = userId
    },
    handleSearch(term) {
      this.searchTerm = term
    }
  }
}
</script>
<style>
/* Estilos globais */
nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 25;
  backdrop-filter: blur(2px);
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-left: var(--sidebar-offset, 0);
  transition: margin-left 0.3s ease;
}

.lock-scroll {
  height: 100vh;
  overflow: hidden;
}

@media (max-width: 900px) {
  .main-content {
    margin-left: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

@media (max-width: 1540px) {
  .main-content {
    overflow-y: auto;
  }
}

.main-content > * {
  flex-shrink: 0;
}
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.content {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #181818;
  color: #fff;
  padding: 16px;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #f7f8fa;
  color: #333;
}

h1,
h2,
h3 {
  margin: 0;
  padding: 0;
}

button {
  cursor: pointer;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: 0.2s all;
}

button:hover {
  opacity: 0.9;
}

/* Exemplo de classes utilitárias */
.flex {
  display: flex;
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
</style>
