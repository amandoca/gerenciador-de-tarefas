<template>
  <div class="tarefando-kanban-bg">
    <div class="gradient-bg"></div>
    <div
      class="kanban"
      :style="{ backgroundImage: `url(${backgroundUrl})` }"
      data-cy="kanban-root"
    >
      <div
        v-if="errorMsg"
        class="kanban-alert"
        role="alert"
        data-cy="kanban-alert"
      >
        <span class="kanban-alert-text">{{ errorMsg }}</span>
        <button
          type="button"
          class="kanban-alert-close"
          aria-label="Fechar aviso"
          @click="closeAlert"
        >
          ×
        </button>
      </div>
      <div class="columns">
        <div
          v-for="column in columns"
          :key="column.id"
          class="column"
          :data-column-id="column.id"
          :data-cy="`column-${column.id}`"
        >
          <h2 :data-cy="`column-title-${column.id}`">
            {{ getColumnTitle(column) }}
          </h2>
          <button
            class="add-task-btn"
            :data-cy="`add-task-${column.id}`"
            @click="addTask(column)"
          >
            + {{ $t('kanban.addTask') }}
          </button>

          <div class="column-tasks" :data-cy="`column-tasks-${column.id}`">
            <draggable
              :list="columnTasks[String(column.id)] || []"
              :group="{ name: 'tasks', pull: true, put: true }"
              item-key="id"
              @change="handleTaskMoved(column.id, $event)"
            >
              <template #item="{ element: task }">
                <div
                  v-if="shouldShowTask(task)"
                  class="task"
                  :data-id="task.id"
                  @click="editTask(task)"
                  :data-cy="`task-card-${task.id}`"
                >
                  <h3 :title="task.title">{{ task.title }}</h3>

                  <div class="task-meta">
                    <span
                      v-if="task.description"
                      class="icon"
                      :title="$t('kanban.taskHasDescription')"
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
                      :title="
                        $t('kanban.checklistProgress', {
                          done: getChecklistCompleted(task),
                          total: task.checklist.length
                        })
                      "
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
          </div>
        </div>
      </div>

      <TaskModal
        v-if="showModal"
        :key="selectedTask?.id || 'new'"
        :initial-task="selectedTask"
        :users="users"
        :board-id="selectedBoardId"
        :columns="columns"
        :current-user-id="loggedUserId"
        :is-board-owner="isBoardOwner"
        @save="handleSaveTask"
        @close="handleCloseModal"
        @delete="handleDeleteTask"
        @member-added="handleMemberAdded"
      />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import draggable from 'vuedraggable'
import TaskModal from '@/components/TaskModal.vue'
import mario from '@/assets/mario-bross.webp'
import { fetchBoardColumns } from '@/services/kanban/boards_service'
import { fetchBoardUsers } from '@/services/kanban/users_service'
import {
  createTask,
  deleteTask,
  fetchTasks,
  moveTask,
  updateTask
} from '@/services/kanban/tasks_service'

export default {
  name: 'KanbanBoard',

  components: { draggable, TaskModal },

  props: {
    currentBackground: { type: String, default: '' },
    filteredUserId: { type: [String, Number], default: null },
    searchTerm: { type: String, default: '' },

    boardId: { type: [String, Number], default: null },
    isBoardSelectionReady: { type: Boolean, default: false },
    boardRefreshToken: { type: Number, default: 0 }
  },

  emits: ['update-users', 'board-changed'],

  setup(props) {
    const backgroundUrl = computed(() => {
      return props.currentBackground || mario
    })

    return { backgroundUrl }
  },

  data() {
    return {
      columns: [],
      users: [],
      tasks: [],
      columnTasks: {},
      showModal: false,
      selectedTask: null,
      loading: false,
      errorMsg: '',
      selectedBoardId: null,
      loggedUserId: null
    }
  },

  computed: {
    isBoardOwner() {
      if (!this.loggedUserId) return false
      const owner = this.users.find((user) => user.isOwner)
      return owner ? Number(owner.id) === Number(this.loggedUserId) : false
    }
  },

  watch: {
    // ✅ se o pai mandar outro boardId, recarrega
    boardId: {
      immediate: true,
      handler(newVal) {
        this.fetchData(newVal)
      }
    },
    isBoardSelectionReady(newVal) {
      if (newVal) {
        this.fetchData(this.boardId)
      }
    },
    boardRefreshToken() {
      if (this.selectedBoardId) {
        this.fetchData(this.selectedBoardId)
      }
    }
  },

  async created() {
    const raw = localStorage.getItem('loggedUser')
    const user = raw ? JSON.parse(raw) : null
    this.loggedUserId = user?.id || user?.user_id || null
  },

  methods: {
    async fetchData(boardIdOverride) {
      try {
        this.loading = true
        this.errorMsg = ''

        if (!this.isBoardSelectionReady) {
          return
        }

        const resolvedBoardId = boardIdOverride || this.boardId

        if (!resolvedBoardId) {
          this.clearBoardState()
          this.errorMsg = this.$t('kanban.errors.noBoard')
          return
        }

        const selectedBoardId = Number(resolvedBoardId)

        if (!selectedBoardId) {
          this.clearBoardState()
          this.errorMsg = this.$t('kanban.errors.noBoard')
          return
        }

        const [columns, users, tasks] = await Promise.all([
          fetchBoardColumns(selectedBoardId),
          fetchBoardUsers(selectedBoardId),
          fetchTasks(selectedBoardId)
        ])

        this.columns = columns
        this.users = users
        this.tasks = tasks
        this.selectedBoardId = selectedBoardId

        const map = {}
        this.columns.forEach((col) => {
          map[String(col.id)] = []
        })

        this.tasks.forEach((task) => {
          const key = String(task.columnId)
          if (!map[key]) map[key] = []
          map[key].push(task)
        })

        this.columnTasks = map
        this.$emit('update-users', this.users)
        this.$emit('board-changed', selectedBoardId)
      } catch (error) {
        console.error(error)
        this.clearBoardState()
        this.errorMsg = this.$t('kanban.errors.load')
      } finally {
        this.loading = false
      }
    },

    clearBoardState() {
      this.columns = []
      this.users = []
      this.tasks = []
      this.columnTasks = {}
      this.selectedBoardId = null
    },

    isDoneColumn(columnId) {
      const col = this.columns.find((c) => String(c.id) === String(columnId))
      return col?.order_index === 3
    },

    getColumnTitle(column) {
      const orderIndex = Number(column?.order_index)

      if (orderIndex === 1) {
        return this.$t('kanban.columns.todo')
      }

      if (orderIndex === 2) {
        return this.$t('kanban.columns.inProgress')
      }

      if (orderIndex === 3) {
        return this.$t('kanban.columns.done')
      }

      return column?.name || ''
    },

    getChecklistCompleted(task) {
      return task.checklist?.filter((item) => item.completed).length || 0
    },

    shouldShowTask(task) {
      const filteredUserId = this.filteredUserId
      const searchTerm = this.searchTerm

      if (filteredUserId) {
        if (String(task.assignedUser) !== String(filteredUserId)) return false
      }

      if (searchTerm && searchTerm.length > 1) {
        const search = searchTerm.toLowerCase()
        const inTitle = task.title?.toLowerCase().includes(search)
        const inDescription = task.description?.toLowerCase().includes(search)
        if (!inTitle && !inDescription) return false
      }

      return true
    },

    addTask(column) {
      if (!this.selectedBoardId) {
        this.errorMsg = this.$t('kanban.errors.boardLoading')
        return
      }

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

    handleCloseModal() {
      this.showModal = false
    },

    handleMemberAdded() {
      this.fetchData(this.selectedBoardId)
    },

    editTask(task) {
      if (!this.selectedBoardId) {
        this.errorMsg = this.$t('kanban.errors.boardLoading')
        return
      }

      this.selectedTask = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
      }
      this.showModal = true
    },

    async handleSaveTask(task) {
      try {
        const existing = this.tasks.find((t) => t.id === task.id)
        let savedTask

        if (existing) savedTask = await updateTask(task.id, task)
        else savedTask = await createTask(task)

        if (this.isDoneColumn(savedTask.columnId)) {
          this.notifyTaskCompleted(savedTask.title)
        }

        this.showModal = false

        // ✅ Recarrega e checa se ainda está visível pra mim
        await this.fetchData(this.selectedBoardId)

        const stillVisible = this.tasks.some(
          (t) => Number(t.id) === Number(savedTask.id)
        )

        if (!stillVisible) {
          const assignedToOther =
            savedTask.assignedUser &&
            String(savedTask.assignedUser) !== String(this.loggedUserId)

          if (assignedToOther) {
            this.errorMsg = this.$t('kanban.taskHiddenWarning')
          }
        }
      } catch (error) {
        console.error(error)
        this.errorMsg = this.$t('kanban.errors.saveTask')
      }
    },

    async handleDeleteTask(taskId) {
      try {
        await deleteTask(taskId)
        this.showModal = false
        await this.fetchData(this.selectedBoardId)
      } catch (error) {
        console.error(error)
        this.errorMsg = this.$t('kanban.errors.deleteTask')
      }
    },

    async handleTaskMoved(newColumnId, event) {
      const movedTask = event?.added?.element || event?.moved?.element
      if (!movedTask) return

      const previousColumnId = movedTask.columnId
      movedTask.columnId = newColumnId

      const localTaskIndex = this.tasks.findIndex((t) => t.id === movedTask.id)
      if (localTaskIndex !== -1) {
        this.tasks[localTaskIndex].columnId = newColumnId
      }

      try {
        await moveTask(movedTask.id, newColumnId)

        if (this.isDoneColumn(newColumnId)) {
          this.notifyTaskCompleted(movedTask.title)
        }

        await this.fetchData(this.selectedBoardId)
      } catch (error) {
        console.error(error)
        this.errorMsg = this.$t('kanban.errors.moveTask')

        movedTask.columnId = previousColumnId
        if (localTaskIndex !== -1) {
          this.tasks[localTaskIndex].columnId = previousColumnId
        }
        await this.fetchData(this.selectedBoardId)
      }
    },

    notifyTaskCompleted(title) {
      if (Notification.permission === 'granted') {
        new Notification(this.$t('kanban.notifications.taskDoneTitle'), {
          body: this.$t('kanban.notifications.taskDoneBody', { title }),
          icon: '/favicon.ico'
        })
      }
    },

    closeAlert() {
      this.errorMsg = ''
    }
  }
}
</script>

<style scoped>
/* (seu CSS original, mantive igual) */
.tarefando-kanban-bg {
  min-height: 100vh;
  min-width: 100vw;
  width: 100%;
  background: linear-gradient(120deg, #191c2a 60%, #26314d 100%);
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
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
  height: 100vh;
  padding: 0;
  z-index: 1;
  position: relative;
  width: 100%;
  overflow: hidden;
}

.kanban-alert {
  position: absolute;
  top: 98px;
  right: 303px;
  max-width: min(420px, calc(100% - 32px));
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(27, 30, 48, 0.94);
  border: 1px solid rgba(255, 224, 138, 0.4);
  color: #ffe08a;
  font-weight: 600;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2);
  z-index: 5;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  display: flex;
  align-items: center;
  gap: 12px;
}

.kanban-alert-text {
  flex: 1;
  min-width: 0;
}

.kanban-alert-close {
  border: 0;
  background: transparent;
  color: #ffe08a;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 8px;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}
.kanban-alert-close:hover {
  background: rgba(255, 224, 138, 0.18);
  color: #fff4c7;
}
.kanban-alert-close:focus-visible {
  outline: 2px solid rgba(255, 224, 138, 0.7);
  outline-offset: 2px;
}

@media (max-width: 900px) {
  .kanban-alert {
    right: 16px;
    left: 16px;
    max-width: unset;
  }
}
.columns {
  display: flex;
  gap: clamp(22px, 3vw, 40px);
  padding: 96px clamp(18px, 4vw, 56px) 24px clamp(18px, 4vw, 56px);
  justify-content: center;
  transition: margin-left 0.3s ease;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}

@media (min-width: 901px) {
  .columns {
    /* Centraliza no viewport, compensando o offset da sidebar */
    transform: translateX(calc(-1 * var(--sidebar-offset, 0px) / 2));
  }
}

/* Estilo das colunas */
.column {
  background: rgba(28, 32, 50, 0.97);
  padding: 16px 12px 22px 12px;
  border-radius: 17px;
  min-width: 280px;
  max-width: 380px;
  width: clamp(280px, 26vw, 380px);
  height: calc(100vh - 170px);
  color: #f6f7fb;
  box-shadow: 0 4px 24px #101a2c22;
  border: 2px solid #23284d;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition:
    border 0.18s,
    box-shadow 0.18s;
  flex: 0 0 auto;
  gap: 10px;
}
.column-tasks {
  flex: 1;
  min-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding-right: 4px;
  margin-right: -4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 224, 138, 0.4) rgba(35, 40, 77, 0.3);
}

/* Scrollbar personalizada - Webkit (Chrome, Safari, Edge) */
.column-tasks::-webkit-scrollbar {
  width: 8px;
}

.column-tasks::-webkit-scrollbar-track {
  background: rgba(35, 40, 77, 0.3);
  border-radius: 10px;
  margin: 4px 0;
}

.column-tasks::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(255, 224, 138, 0.5) 0%,
    rgba(255, 203, 103, 0.4) 100%
  );
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: background 0.3s ease;
}

.column-tasks::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(255, 224, 138, 0.7) 0%,
    rgba(255, 203, 103, 0.6) 100%
  );
  background-clip: padding-box;
}

@media (max-width: 1400px) {
  .columns {
    gap: 30px;
    padding: 90px clamp(14px, 4vw, 40px) 24px clamp(14px, 4vw, 40px);
  }
  .column {
    min-width: 260px;
    max-width: 340px;
    width: clamp(260px, 30vw, 340px);
  }
}

@media (max-width: 1570px) {
  .kanban {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }
  .columns {
    flex-wrap: wrap;
    gap: 20px;
    padding: 82px 3vw 26px;
    overflow-x: visible;
  }
  .column {
    height: auto;
    min-width: 46vw;
    max-width: 50vw;
  }
  .column-tasks {
    max-height: none;
  }
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
  width: 100%;
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
  margin-top: 0;
  margin-bottom: 4px;
  font-weight: 700;
  font-size: 1.01rem;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 12px #ffe08a22;
  transition:
    background 0.19s,
    box-shadow 0.17s;
  position: sticky;
  top: 0;
  z-index: 2;
}
.add-task-btn:hover {
  background: #ffe7b4;
  box-shadow: 0 4px 18px #ffe08a2c;
}

@media (max-width: 980px) {
  .kanban {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }
  .columns {
    flex-wrap: wrap;
    gap: 16px;
    padding: 78px 3vw 24px;
    overflow-x: visible;
  }
  .column {
    min-width: 88vw;
    max-width: 98vw;
    height: auto;
    margin-bottom: 18px;
  }
  .column-tasks {
    max-height: none;
  }
}
@media (max-width: 700px) {
  .columns {
    gap: 10px;
    padding: 70px 3vw 20px;
    overflow-x: visible;
  }
  .column {
    min-width: 96vw;
    max-width: 98vw;
    padding: 14px 10px 18px 10px;
    height: auto;
  }
  .column-tasks {
    max-height: none;
    min-height: 240px;
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
    padding: 74px 2vw 24px;
    gap: 12px;
  }
  .column {
    min-width: 94vw;
    max-width: 98vw;
    height: auto;
  }
  .column-tasks {
    max-height: none;
  }
  .footer {
    font-size: 0.81rem;
  }
}

@media (max-width: 700px) {
  .columns {
    gap: 10px;
    padding: 70px 4vw 20px;
    overflow-x: visible;
  }
  .column {
    min-width: 96vw;
    max-width: 98vw;
    padding: 14px 10px 18px 10px;
    height: calc(100vh - 220px);
  }
  .column-tasks {
    max-height: calc(100vh - 300px);
    min-height: 240px;
  }
  .task {
    padding: 16px 18px;
    font-size: 1rem;
  }
  .task h3 {
    font-size: 1.05rem;
  }
}
</style>
