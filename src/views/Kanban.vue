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
            :list="filteredTasks(column.id)"
            :group="{ name: 'tasks', pull: true, put: true }"
            itemKey="id"
            @add="(evt) => onTaskMoved(evt, column.id)"
          >
            <template #item="{ element: task }">
              <div class="task" :data-id="task.id" @click="editTask(task)">
                <h3 :title="task.title">{{ task.title }}</h3>
                <div class="task-meta">
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
                    <span class="check-count"
                      >{{ getChecklistCompleted(task) }}/{{
                        task.checklist.length
                      }}</span
                    >
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
import draggable from 'vuedraggable'
import TaskModal from '@/components/TaskModal.vue'
import { ref, watch, onMounted } from 'vue'
import mario from '@/assets/mario-bross.webp'

export default {
  components: { draggable, TaskModal },
  props: {
    currentBackground: String,
    filteredUserId: String,
    searchTerm: String
  },

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

  data() {
    return {
      columns: [],
      users: [],
      tasks: [],
      showModal: false,
      selectedTask: null
    }
  },

  async created() {
    await this.fetchData()
    this.loadTasksFromStorage()
    this.$emit('update-users', this.users)
  },

  methods: {
    async fetchData() {
      const [columnsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/columns'),
        fetch('http://localhost:5000/users')
      ])

      this.columns = await columnsRes.json()
      this.users = await usersRes.json()
      // 🔻 ADICIONE ESTA LINHA:
      this.$emit('update-users', this.users)
    },
    truncate(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
    },
    getChecklistCompleted(task) {
      return task.checklist.filter((item) => item.completed).length
    },
    handleDeleteTask(taskId) {
      this.tasks = this.tasks.filter((t) => t.id !== taskId)
      this.saveTasksToStorage()
      this.showModal = false
    },
    loadTasksFromStorage() {
      const stored = localStorage.getItem('kanbanTasks')
      this.tasks = stored ? JSON.parse(stored) : []
    },
    filteredTasks(columnId) {
      let tasks = this.tasks.filter((t) => t.columnId == columnId)

      // Use as PROPS!!
      const filteredUserId = this.filteredUserId
      const searchTerm = this.searchTerm

      // Log inicial

      // Filtro por usuário
      if (filteredUserId) {
        tasks = tasks.filter((t) => t.assignedUser == filteredUserId)
      }

      // Filtro por busca (título/descrição)
      if (searchTerm && searchTerm.length > 1) {
        const search = searchTerm.toLowerCase()
        tasks = tasks.filter(
          (t) =>
            (t.title && t.title.toLowerCase().includes(search)) ||
            (t.description && t.description.toLowerCase().includes(search))
        )
      }

      return tasks
    },

    setFilteredUser(id) {
      this.filteredUserId = id
    },
    setSearchTerm(term) {
      this.searchTerm = term
    },
    onTaskMoved(evt, newColumnId) {
      // Pega o elemento DOM arrastado
      const el = evt.item
      // Pega o ID salvo em data-id
      const taskId = el.getAttribute('data-id')

      // Busca a task verdadeira no array principal
      const task = this.tasks.find((t) => String(t.id) === String(taskId))

      if (task) {
        task.columnId = String(newColumnId)
        this.saveTasksToStorage()
        this.$forceUpdate?.()
      } else {
        console.warn('Task não encontrada ao mover!', taskId)
      }
    },
    saveTasksToStorage() {
      localStorage.setItem('kanbanTasks', JSON.stringify(this.tasks))
    },
    getTasksForColumn(columnId) {
      return this.tasks.filter((task) => task.columnId == columnId)
    },
    addTask(column) {
      this.selectedTask = {
        title: '',
        description: '',
        dueDate: '',
        checklist: [],
        assignedUser: '',
        columnId: column.id
      }
      this.showModal = true
    },
    editTask(task) {
      this.selectedTask = { ...task }
      this.showModal = true
    },
    handleSaveTask(task) {
      const existingIndex = this.tasks.findIndex((t) => t.id === task.id)

      if (existingIndex !== -1) {
        this.tasks[existingIndex] = task
      } else {
        task.id = Date.now()
        this.tasks.push(task)
      }

      const isDone = task.columnId === '3'
      if (isDone) this.notifyTaskCompleted(task.title)

      this.saveTasksToStorage()
      this.showModal = false
    },
    onTaskDrop(event, targetColumnId) {
      if (event && event.added) {
        const movedTask = event.added.element
        movedTask.columnId = targetColumnId
        this.saveTasksToStorage()
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
  padding: 20px 24px 20px 24px; /* <-- padding aumentado! */
  margin-bottom: 16px; /* um pouco mais de espaço entre os cards */
  border-radius: 14px; /* arredondamento maior fica bonito */
  min-height: 80px; /* mais altura */
  max-height: 210px; /* + espaço para textos maiores */
  width: 340px; /* ocupa toda a coluna */
  box-sizing: border-box;
  cursor: pointer;
  color: #e7eafd;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 12px #23284933;
  border: 1.7px solid #202c42;
  font-size: 1.08rem; /* fonte levemente maior */
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
  font-size: 1.12rem; /* título um pouco maior */
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
