<template>
  <div class="sidebar" :class="{ expanded }">
    <div v-if="expanded" class="sidebar-content">
      <button
        class="sidebar-toggle"
        aria-label="Expandir ou recolher menu"
        @click="toggleSidebar"
      >
        <span class="material-icons">
          {{ expanded ? 'chevron_left' : 'chevron_right' }}
        </span>
      </button>
      <div class="workspace-header">
        <div class="workspace-logo">
          <span class="logo-text">{{ firstLetter }}</span>
        </div>
        <div class="workspace-info">
          <h3>{{ firstName }} <span class="ws-label">workspace</span></h3>
        </div>
      </div>
      <hr class="divider" />
      <div class="board-list">
        <div class="section-title">Seus quadros</div>
        <div class="board-item" v-for="board in boards" :key="board.id">
          <span class="board-name">{{ board.name }}</span>
        </div>
      </div>
      <button class="logout-button" @click="logout">
        <span
          class="material-icons"
          style="vertical-align: middle; margin-right: 6px"
        >
          logout
        </span>
        Sair
      </button>
    </div>
    <div v-else class="collapsed-logo">
      <span class="logo-text">{{ firstLetter }}</span>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

export default {
  data() {
    return {
      expanded: true,
      userName: 'Usuário',
      boards: [{ id: 1, name: 'Meu Primeiro Tarefando 🗂️' }]
    }
  },
  computed: {
    firstName() {
      return this.userName.split(' ')[0] || 'Usuário'
    },
    firstLetter() {
      return this.userName.charAt(0).toUpperCase() || 'U'
    }
  },
  mounted() {
    this.fetchUserName()
  },
  methods: {
    toggleSidebar() {
      this.expanded = !this.expanded
    },
    logout() {
      const toast = useToast()
      localStorage.removeItem('loggedUser')
      toast.success('Sessão encerrada com sucesso.')
      setTimeout(() => {
        this.$router.push('/login')
      }, 1500)
    },
    fetchUserName() {
      const storedUser = localStorage.getItem('loggedUser')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          this.userName = userData.name || 'Usuário'
        } catch (error) {
          console.error('Erro ao recuperar o nome do usuário:', error)
        }
      }
    }
  }
}
</script>

<style scoped>
.sidebar {
  background: rgba(27, 30, 48, 0.93);
  /* Gradiente sutil igual ao Kanban/Login */
  box-shadow:
    0 8px 32px 0 #191d3140,
    0 2px 18px #ffe08a11;
  border-right: 2px solid #232849;
  color: #fffbe5;
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition:
    left 0.3s,
    width 0.3s;
  position: fixed;
  top: 0;
  left: 0;
  width: 274px;
  z-index: 30;
  backdrop-filter: blur(16px);
  min-width: 64px;
  max-width: 100vw;
}

.sidebar.expanded {
  width: 274px;
}
.sidebar:not(.expanded) {
  width: 64px;
  min-width: 64px;
  max-width: 64px;
}
.sidebar-content {
  padding: 26px 18px 14px 18px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-toggle {
  display: none;
  position: absolute;
  top: 14px;
  right: -22px;
  background: #ffe08a;
  color: #232849;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 12px #ffe08a44;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  font-size: 1.55em;
  transition:
    background 0.2s,
    color 0.2s;
}

.sidebar-toggle:hover {
  background: #bae1fc;
  color: #191d31;
}

@media (max-width: 900px) {
  .sidebar {
    width: 66vw;
    min-width: 56px;
    max-width: 340px;
    position: fixed;
    z-index: 100;
    left: 0;
    top: 0;
    box-shadow: 0 4px 32px #23294d33;
  }
  .sidebar:not(.expanded) {
    width: 56px;
    min-width: 56px;
    max-width: 56px;
  }
  .sidebar-content {
    padding: 15px 8px 8px 8px;
  }
  .sidebar-toggle {
    display: flex;
  }
}

@media (max-width: 560px) {
  .sidebar {
    width: 93vw;
    max-width: 96vw;
    min-width: 52px;
  }
  .sidebar-content {
    padding: 12px 2vw 6px 2vw;
  }
  .collapsed-logo {
    height: 52px;
    font-size: 1.45rem;
  }
  .workspace-header {
    gap: 8px;
    margin-bottom: 10px;
  }
  .workspace-logo {
    width: 32px;
    height: 32px;
    font-size: 1.09rem;
  }
  .board-item {
    font-size: 0.95rem;
    padding: 7px 5px 7px 11px;
    border-radius: 7px;
  }
}

@media (max-width: 400px) {
  .sidebar {
    width: 98vw;
    min-width: 45px;
  }
}

.sidebar-content {
  /* overflow-y: auto;  // Pode ativar se sidebar for longa */
  height: 100%;
}

.collapsed-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  font-size: 2rem;
  font-weight: 900;
  background: linear-gradient(120deg, #232849 65%, #26294d 100%);
  color: #ffe08a;
  letter-spacing: 1px;
  border-bottom: 1.5px solid #191d31;
  box-shadow: 0 2px 12px #23294d22;
}

.workspace-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.workspace-logo {
  width: 46px;
  height: 46px;
  background: linear-gradient(135deg, #ffe08a 50%, #bae1fc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #232849;
  font-size: 1.39rem;
  border-radius: 50%;
  box-shadow: 0 2px 16px #ffe08a33;
  border: 3px solid #232849;
  letter-spacing: 0.7px;
}

.logo-text {
  font-family: inherit;
  font-weight: 900;
  font-size: 1.18em;
}

.workspace-info h3 {
  margin: 0 0 1px 0;
  font-size: 1.15rem;
  font-weight: bold;
  color: #ffe08a;
  letter-spacing: 0.02em;
  display: flex;
  gap: 4px;
  align-items: center;
}

.workspace-info .ws-label {
  font-size: 0.8rem;
  color: #bae1fc;
  font-weight: 700;
  margin-left: 2px;
  opacity: 0.9;
}

.workspace-info span {
  font-size: 0.92rem;
  color: #bae1fc;
  letter-spacing: 0.02em;
  font-weight: 400;
  opacity: 0.78;
}

.divider {
  border: none;
  height: 1.5px;
  background: linear-gradient(
    90deg,
    #ffe08a 0 10%,
    #23294d 25%,
    #23294d 75%,
    #bae1fc 100%
  );
  margin: 8px 0 18px 0;
  opacity: 0.8;
  border-radius: 3px;
}

.section-title {
  font-size: 0.8rem;
  font-weight: bold;
  color: #ffe08a;
  text-transform: uppercase;
  padding: 0 0 8px 2px;
  letter-spacing: 1px;
}

.board-list {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 2px;
}

.board-item {
  padding: 11px 10px 11px 15px;
  background: #23294d;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.16s;
  color: #ffe08a;
  font-weight: 500;
  font-size: 1.06rem;
  box-shadow: 0 2px 10px #191d3112;
  border: 1.5px solid transparent;
}
.board-item:hover {
  background: #191d31;
  border: 1.5px solid #ffe08a77;
  color: #bae1fc;
  box-shadow: 0 3px 12px #ffe08a23;
}

/* 🔹 Botão de Logout */
.logout-button {
  background: linear-gradient(90deg, #ffe08a 60%, #ffcb67 100%);
  border: none;
  padding: 13px 0;
  color: #232849;
  font-size: 1.01rem;
  font-weight: bold;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 2px 18px #ffe08a22;
  transition:
    background 0.18s,
    color 0.18s,
    transform 0.13s;
  width: 100%;
  margin-top: 12px;
  margin-bottom: 4px;
  letter-spacing: 0.05em;
}
.logout-button:hover {
  background: linear-gradient(90deg, #bae1fc 40%, #ffe08a 100%);
  color: #191d31;
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 4px 24px #ffe08a44;
}
</style>
