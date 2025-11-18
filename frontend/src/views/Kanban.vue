<template>
  <div class="tarefando-kanban-bg">
    <div class="gradient-bg"></div>
    <div class="kanban" :style="{ backgroundImage: `url(${backgroundUrl})` }">
      <div class="columns">
        <div
          class="column"
          v-for="column in columns"
          :key="column.id"
          :data-column-id="column.id"
        >
          <h2>{{ column.name }}</h2>

          <draggable
            :list="columnTasks[String(column.id)] || []"
            :group="{ name: 'tasks', pull: true, put: true }"
            item-key="id"
            @add="(evt) => onTaskMoved(evt, column.id)"
          >
            <template #item="{ element: task }">
              <div
                v-if="shouldShowTask(task)"
                class="task"
                :data-id="task.id"
                @click="editTask(task)"
              >
                <h3 :title="task.title">{{ task.title }}</h3>

                <div class="task-meta">
                  <!-- Ícone de descrição -->
                  <span
                    v-if="task.description"
                    class="icon"
                    title="Esse card possui descrição"
                  >
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <path
                        d="M4 6h16M4 12h16M4 18h10"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </span>

                  <!-- Ícone de checklist -->
                  <span
                    v-if="task.checklist?.length"
                    class="icon"
                    :title="`${getChecklistCompleted(task)}/${task.checklist.length} itens concluídos`"
                  >
                    <svg class="icon-svg" viewBox="0 0 24 24">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        fill="none"
                      />
                    </svg>
                    <span class="check-count">
                      {{ getChecklistCompleted(task) }}/{{
                        task.checklist.length
                      }}
                    </span>
                  </span>
                </div>
              </div>
            </template>
          </draggable>

          <button class="add-task-btn" @click="addTask(column)">
            + Adicionar Tarefa
          </button>
        </div>
      </div>

      <TaskModal
        v-if="showModal"
        :initialTask="selectedTask"
        :users="users"
        :columns="columns"
        @save="handleSaveTask"
        @close="showModal = false"
        @delete="handleDeleteTask"
      />
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import draggable from 'vuedraggable'
import TaskModal from '@/components/TaskModal.vue'
import mario from '@/assets/mario-bross.webp'
import api from '@/services/api'
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTask
} from '@/services/task_service'

export default {
  name: 'KanbanBoard',

  components: {
    draggable,
    TaskModal
  },

  props: {
    currentBackground: String,
    filteredUserId: String,
    searchTerm: String
  },

  // 👉 Composition API só para tratar o background
  setup(props) {
    const backgroundUrl = ref('')

    watch(
      () => props.currentBackground,
      (newBg) => {
        if (newBg) {
          backgroundUrl.value = newBg
          localStorage.setItem('kanbanBackground', newBg)
        }
      },
      { immediate: true }
    )

    onMounted(() => {
      if (!props.currentBackground) {
        const savedBg = localStorage.getItem('kanbanBackground')
        backgroundUrl.value = savedBg || mario
      }
    })

    return { backgroundUrl }
  },

  // 👉 Options API para o resto (tasks, columns, users, modal etc.)
  data() {
    return {
      columns: [],
      users: [],
      tasks: [],
      columnTasks: {}, // ← listas reais por coluna usadas pelo draggable
      showModal: false,
      selectedTask: null,
      loading: false,
      errorMsg: ''
    }
  },

  async created() {
    await this.fetchData()
  },

  methods: {
    // 🔹 Busca columns, users e tasks do backend e monta columnTasks
    async fetchData() {
      try {
        this.loading = true
        this.errorMsg = ''

        const [columnsRes, usersRes, tasksRes] = await Promise.all([
          api.get('/kanban/columns'),
          api.get('/kanban/users'),
          fetchTasks() // vem do task_service.js
        ])

        this.columns = columnsRes.data
        this.users = usersRes.data
        this.tasks = tasksRes

        // monta um mapa colunaId -> array de tasks (usado pelo draggable)
        const map = {}
        this.columns.forEach((col) => {
          map[String(col.id)] = []
        })

        this.tasks.forEach((task) => {
          const key = String(task.columnId)
          if (!map[key]) {
            map[key] = []
          }
          map[key].push(task)
        })

        this.columnTasks = map

        // avisa o pai sobre os usuários
        this.$emit('update-users', this.users)
      } catch (error) {
        console.error(error)
        this.errorMsg = 'Erro ao carregar dados do Kanban.'
      } finally {
        this.loading = false
      }
    },

    getChecklistCompleted(task) {
      return task.checklist?.filter((item) => item.completed).length || 0
    },

    // 🔹 Aplica filtro de usuário + busca
    shouldShowTask(task) {
      const filteredUserId = this.filteredUserId
      const searchTerm = this.searchTerm

      if (filteredUserId) {
        if (String(task.assignedUser) !== String(filteredUserId)) {
          return false
        }
      }

      if (searchTerm && searchTerm.length > 1) {
        const search = searchTerm.toLowerCase()
        const inTitle = task.title?.toLowerCase().includes(search)
        const inDescription = task.description?.toLowerCase().includes(search)

        if (!inTitle && !inDescription) {
          return false
        }
      }

      return true
    },

    // 🔹 Abrir modal para criar nova tarefa
    addTask(column) {
      this.selectedTask = {
        title: '',
        description: '',
        dueDate: '',
        duration: '',
        checklist: [],
        assignedUser: '',
        columnId: column.id,
        type: 'tarefa'
      }
      this.showModal = true
    },

    // 🔹 Abrir modal para editar tarefa existente
    editTask(task) {
      this.selectedTask = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
      }
      this.showModal = true
    },
    // 🔹 Salvar (criar ou atualizar) tarefa no backend
    async handleSaveTask(task) {
      try {
        const existing = this.tasks.find((t) => t.id === task.id)
        let savedTask

        if (existing) {
          savedTask = await updateTask(task.id, task)
        } else {
          savedTask = await createTask(task)
        }

        const isDone = String(savedTask.columnId) === '3'
        if (isDone) {
          this.notifyTaskCompleted(savedTask.title)
        }

        this.showModal = false

        // Recarrega tudo para sincronizar tasks + columnTasks
        await this.fetchData()
      } catch (error) {
        console.error(error)
        this.errorMsg = 'Erro ao salvar tarefa.'
      }
    },

    // 🔹 Excluir tarefa no backend
    async handleDeleteTask(taskId) {
      try {
        await deleteTask(taskId)
        this.showModal = false
        await this.fetchData()
      } catch (error) {
        console.error(error)
        this.errorMsg = 'Erro ao excluir tarefa.'
      }
    },

    // 🔹 Quando arrasta card de uma coluna para outra
    // 🔹 Quando arrasta card de uma coluna para outra
    async onTaskMoved(evt, newColumnId) {
      const el = evt.item
      const taskId = el.getAttribute('data-id')
      const task = this.tasks.find((t) => String(t.id) === String(taskId))

      if (!task) {
        console.warn('Task não encontrada ao mover!', taskId)
        return
      }

      const previousColumnId = task.columnId
      task.columnId = newColumnId

      try {
        await moveTask(task.id, newColumnId)

        const isDone = String(newColumnId) === '3'
        if (isDone) {
          this.notifyTaskCompleted(task.title)
        }

        // Recarrega do backend pra garantir consistência
        await this.fetchData()
      } catch (error) {
        console.error(error)
        this.errorMsg = 'Erro ao mover tarefa.'
        task.columnId = previousColumnId
        await this.fetchData()
      }
    },

    notifyTaskCompleted(title) {
      if (Notification.permission === 'granted') {
        new Notification('🎉 Tarefa concluída!', {
          body: `A tarefa "${title}" foi movida para "Feito".`,
          icon: '/favicon.ico'
        })
      }
    }
  }
}
</script>

<style scoped>
/* (seu CSS original, mantive igual) */
.tarefando-kanban-bg {
  min-height: 100vh;
  min-width: 100vw;
  background: linear-gradient(120deg, #191c2a 60%, #26314d 100%);
  position: relative;
  overflow: hidden;
}
.gradient-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 10%, #62c9f7 0, transparent 62%),
    radial-gradient(circle at 60% 80%, #ffe08a 0, transparent 50%),
    linear-gradient(120deg, #171b2b 60%, #23294d 100%);
  opacity: 0.17;
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

/* Brand header (igual login/register) */
.kanban-brand-card {
  z-index: 2;
  background: rgba(27, 30, 48, 0.96);
  box-shadow:
    0 8px 32px 0 rgba(27, 30, 48, 0.22),
    0 2px 14px #1012281f;
  border-radius: 18px;
  padding: 34px 32px 16px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 340px;
  max-width: 410px;
  margin: 46px auto 14px auto;
  border: 2px solid #252a43;
  position: relative;
}
.logo-glow {
  margin-bottom: 8px;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
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
  width: 42px;
  height: 42px;
  border-radius: 12px;
}
.kanban-brand-card h1 {
  font-size: 2rem;
  margin-bottom: 3px;
  letter-spacing: 0.07em;
  color: #ffe08a;
  font-weight: 900;
  text-shadow: 0 2px 10px #0000001a;
}
.kanban-brand-card .slogan {
  font-size: 1.01rem;
  color: #bae1fc;
  margin-bottom: 2px;
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.01em;
  opacity: 0.92;
  display: flex;
  align-items: center;
  gap: 4px;
}
.kanban-brand-card .emoji {
  animation: emojiPop 1.4s infinite alternate;
  filter: drop-shadow(0 1px 6px #ffe08a99);
}
@keyframes emojiPop {
  to {
    transform: translateY(-3px) scale(1.2);
  }
}

/* Kanban body */
.kanban {
  min-height: 100vh;
  padding: 0 0 54px 0;
  z-index: 1;
  position: relative;
  width: 100vw;
}
.columns {
  display: flex;
  gap: 110px;
  padding: 110px 5vw;
  justify-content: center;
  transition: margin-left 0.3s ease;
  margin: 0 auto;
}

/* Estilo das colunas */
.column {
  background: rgba(28, 32, 50, 0.97);
  padding: 16px 12px 22px 12px;
  border-radius: 17px;
  min-width: 265px;
  max-width: 330px;
  color: #f6f7fb;
  box-shadow: 0 4px 24px #101a2c22;
  border: 2px solid #23284d;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition:
    border 0.18s,
    box-shadow 0.18s;
  width: 100%;
}
.column h2 {
  font-size: 1.11rem;
  margin-bottom: 17px;
  padding-bottom: 7px;
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.11);
  font-weight: 700;
  color: #ffe08a;
  text-shadow: 0 1px 8px #ffe08a18;
  letter-spacing: 0.04em;
  text-align: center;
}

/* Tarefas/cards */
.task {
  background: linear-gradient(110deg, #202439 60%, #202c42 100%);
  padding: 20px 24px 20px 24px;
  margin-bottom: 16px;
  border-radius: 14px;
  min-height: 80px;
  max-height: 210px;
  width: 340px;
  box-sizing: border-box;
  cursor: pointer;
  color: #e7eafd;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 12px #23284933;
  border: 1.7px solid #202c42;
  font-size: 1.08rem;
  transition:
    box-shadow 0.18s,
    border 0.18s,
    background 0.22s;
}
.task:hover {
  background: linear-gradient(110deg, #232849 65%, #262f4d 100%);
  border: 1.7px solid #ffe08a;
  box-shadow: 0 4px 18px #ffe08a2c;
}
.task h3 {
  font-size: 1.12rem;
  font-weight: bold;
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ffe08a;
  letter-spacing: 0.01em;
}

/* Task meta */
.task-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 7px;
  color: #bae1fc;
  font-size: 0.82rem;
  opacity: 0.82;
}

/* Icons */
.icon {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 7px;
  border-radius: 5px;
  transition: background 0.2s ease;
}
.icon:hover {
  background: rgba(255, 255, 255, 0.17);
}
.icon-svg {
  width: 16px;
  height: 16px;
}
.check-count {
  font-size: 0.81rem;
}

/* Add task button */
.add-task-btn {
  background: linear-gradient(87deg, #ffe08a 60%, #ffcb67 100%);
  color: #191c2a;
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 8px;
  font-weight: 700;
  font-size: 1.01rem;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 12px #ffe08a22;
  transition:
    background 0.19s,
    box-shadow 0.17s;
}
.add-task-btn:hover {
  background: #ffe7b4;
  box-shadow: 0 4px 18px #ffe08a2c;
}

@media (max-width: 980px) {
  .columns {
    flex-wrap: wrap;
    gap: 24px;
    padding: 14px 1vw;
  }
  .column {
    min-width: 88vw;
    max-width: 99vw;
    margin-bottom: 30px;
  }
}
@media (max-width: 560px) {
  .kanban-brand-card {
    min-width: 98vw;
    max-width: 99vw;
    padding: 18px 2vw 13px 2vw;
  }
  .logo-glow {
    width: 32px;
    height: 32px;
  }
  .logo {
    width: 21px;
    height: 21px;
  }
  .columns {
    padding: 4px 1vw;
    gap: 13px;
  }
  .footer {
    font-size: 0.81rem;
  }
}
</style>
