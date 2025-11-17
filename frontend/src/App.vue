<template>
  <div class="app-layout">
    <Sidebar v-if="showSidebar" />
    <div class="main-content">
      <Header
        v-if="showSidebar"
        :users="kanbanUsers"
        :filteredUserId="filteredUserId"
        :searchTerm="searchTerm"
        @background-changed="updateBackground"
        @user-filter="handleUserFilter"
        @search="handleSearch"
      />
      <router-view
        :currentBackground="currentBackground"
        :filteredUserId="filteredUserId"
        :searchTerm="searchTerm"
        @update-users="kanbanUsers = $event"
      />
    </div>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'

export default {
  components: { Sidebar, Header },
  data() {
    return {
      currentBackground: '',
      kanbanUsers: [],
      filteredUserId: null,
      searchTerm: ''
    }
  },
  computed: {
    showSidebar() {
      return this.$route.path === '/kanban' // Sidebar só aparece no Kanban
    }
  },
  mounted() {
    const savedBg = localStorage.getItem('kanbanBackground')
    if (savedBg) {
      this.currentBackground = savedBg
    }

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {})
    }

    document.documentElement.style.setProperty(
      '--dynamic-background-transparent',
      'hsla(206, 13.7%, 10%, 0.9)'
    )
  },
  methods: {
    updateBackground(url) {
      this.currentBackground = url
      localStorage.setItem('kanbanBackground', url)
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

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
