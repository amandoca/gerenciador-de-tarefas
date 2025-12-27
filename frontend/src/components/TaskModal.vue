<template>
  <div class="modal-overlay" data-cy="task-modal-overlay" @click.self="closeModal">
    <div class="modal" data-cy="task-modal">
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="icon-glow">✏️</span>
          {{
            task.id
              ? $t('kanban.taskModal.editTitle')
              : $t('kanban.taskModal.newTitle')
          }}
        </h2>
      </div>

      <div class="modal-body">
        <div class="form-group modern">
          <label for="title">{{ $t('kanban.taskModal.titleLabel') }}</label>
          <input
            id="title"
            v-model="task.title"
            :placeholder="$t('kanban.taskModal.titlePlaceholder')"
            required
            autocomplete="off"
            data-cy="task-title"
            :disabled="!canEditTitle"
          />
        </div>

        <p
          v-if="showCreatorHint"
          class="permission-hint"
          data-cy="task-permission-creator"
        >
          {{ $t('kanban.taskModal.creatorEditHint') }}
        </p>
        <p
          v-else-if="isEditingExisting && !isBoardOwner && !isCreator"
          class="permission-hint muted"
          data-cy="task-permission-limited"
        >
          {{ $t('kanban.taskModal.limitedEditHint') }}
        </p>

        <div class="task-type-area">
          <label class="type-label" for="type">{{
            $t('kanban.taskModal.typeLabel')
          }}</label>
          <select
            id="type"
            v-model="task.type"
            class="type-select"
            data-cy="task-type"
            :disabled="!canEditType"
          >
            <option value="tarefa">{{ $t('kanban.taskModal.types.task') }}</option>
            <option value="historia">
              {{ $t('kanban.taskModal.types.story') }}
            </option>
            <option value="bug">{{ $t('kanban.taskModal.types.bug') }}</option>
          </select>
          <span class="type-badge" :class="task.type">
            {{ getTypeLabel(task.type) }}
          </span>
        </div>

        <div class="form-group modern">
          <label for="description">{{
            $t('kanban.taskModal.descriptionLabel')
          }}</label>
          <textarea
            id="description"
            v-model="task.description"
            :placeholder="$t('kanban.taskModal.descriptionPlaceholder')"
            autocomplete="off"
            class="modal-textarea"
            data-cy="task-description"
            :disabled="!canEditDescription"
          ></textarea>
        </div>

        <!-- Linha: Prazo + Duração + Coluna -->
        <div class="form-row form-row-3">
          <div class="form-group modern">
            <label for="dueDate">{{ $t('kanban.taskModal.dueDate') }}</label>
            <input
              id="dueDate"
              v-model="task.dueDate"
              type="date"
              data-cy="task-due-date"
            />
          </div>

          <div class="form-group modern">
            <label for="duration">{{ $t('kanban.taskModal.duration') }}</label>
            <input
              id="duration"
              v-model="task.duration"
              :class="{
                'input-error': task.duration && !validateDuration(task.duration)
              }"
              :placeholder="$t('kanban.taskModal.durationPlaceholder')"
              autocomplete="off"
              type="text"
              inputmode="text"
              data-cy="task-duration"
            />
          </div>

          <div class="form-group modern">
            <label for="columnId">{{ $t('kanban.taskModal.column') }}</label>
            <select
              id="columnId"
              v-model.number="task.columnId"
              data-cy="task-column"
            >
              <option v-for="col in columns" :key="col.id" :value="col.id">
                {{ col.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Seção Pessoas (largura total) -->
        <div class="people-section">
          <div class="people-section-header">
            <div class="people-section-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span class="people-section-title">{{
              $t('kanban.taskModal.people')
            }}</span>
          </div>

          <div class="people-section-content">
            <!-- Atribuir para -->
            <div class="assign-user-box">
              <label for="assignedUser" class="assign-label">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {{ $t('kanban.taskModal.assignee') }}
              </label>
              <select
                id="assignedUser"
                v-model.number="task.assignedUser"
                class="assign-select"
                data-cy="task-assignee"
                :disabled="!canEditAssignee"
              >
                <option value="">
                  {{ $t('kanban.taskModal.selectAssignee') }}
                </option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ formatUserOption(user) }}
                </option>
              </select>
            </div>

            <!-- Adicionar pessoa -->
            <!-- Adicionar pessoa -->
            <div class="add-person-box">
              <!-- label igual ao "Responsável" -->
              <label class="assign-label">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                {{ $t('kanban.taskModal.invitePerson') }}
              </label>

              <button
                type="button"
                class="invite-select"
                :class="{ open: memberAccordionOpen }"
                @click.stop="toggleMemberAccordion"
                data-cy="invite-toggle"
              >
                <span class="invite-placeholder">
                  {{
                    memberAccordionOpen
                      ? $t('kanban.taskModal.inviteOpenHint')
                      : $t('kanban.taskModal.invitePlaceholder')
                  }}
                </span>

                <span v-if="addingMember" class="member-pill loading">
                  <span class="spinner"></span>
                </span>

                <svg
                  v-else
                  class="chevron-icon"
                  :class="{ open: memberAccordionOpen }"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div v-show="memberAccordionOpen" class="add-person-panel">
                <div class="add-person-form" :class="{ shake: memberShake }">
                  <div class="input-with-feedback">
                    <input
                      v-model="newMemberEmail"
                      class="email-input"
                      :class="{
                        shake: memberShake,
                        error: memberMsg.startsWith('❌')
                      }"
                      type="email"
                      :placeholder="$t('kanban.taskModal.invitePlaceholder')"
                      autocomplete="off"
                      @keyup.enter="addMember"
                      data-cy="invite-email"
                    />
                    <div
                      v-if="memberMsg"
                      class="member-feedback below"
                      :class="memberMsg.startsWith('✅') ? 'ok' : 'error'"
                      data-cy="invite-feedback"
                    >
                      <span class="feedback-icon">{{
                        memberMsg.startsWith('✅') ? '✅' : '⚠️'
                      }}</span>
                      <span class="feedback-text">{{
                        memberMsg.replace('✅ ', '').replace('❌ ', '')
                      }}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="add-btn"
                    :disabled="addingMember || !newMemberEmail.trim()"
                    @click="addMember"
                    data-cy="invite-submit"
                  >
                    {{ $t('common.add') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Checklist -->
        <div class="checklist-container">
          <div class="checklist-header">
            <div class="checklist-title">
              <span>{{ $t('kanban.taskModal.checklist') }}</span>
              <button
                v-if="task.checklist && task.checklist.length > 0"
                style="cursor: pointer"
                class="delete-checklist-btn"
                @click="confirmDeleteChecklist"
                data-cy="checklist-delete"
              >
                {{ $t('common.delete') }}
              </button>
            </div>
            <div class="progress-area">
              <div class="progress-bar">
                <div
                  class="progress-bar-fill"
                  :style="{ width: completedCount + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ completedCount }}%</span>
            </div>
          </div>

        <div
          v-for="(item, index) in task.checklist"
          :key="item.id || item._tempId"
          class="checklist-item"
          :data-cy="`checklist-item-${item.id || item._tempId}`"
        >
          <input
            v-model="item.completed"
            type="checkbox"
            class="checklist-checkbox"
            :aria-label="
              $t('kanban.taskModal.checklistComplete', { text: item.text })
            "
            :data-cy="`checklist-toggle-${item.id || item._tempId}`"
          />
          <input v-model="item.text" type="text" class="checklist-text" />
          <div class="item-actions">
            <button
              class="dots"
              :data-cy="`checklist-menu-${item.id || item._tempId}`"
              @click.stop="toggleMenu(index)"
            >
              ⋮
            </button>
            <div v-if="menuOpen === index" class="menu">
              <button
                :data-cy="`checklist-remove-${item.id || item._tempId}`"
                @click="removeItem(index)"
              >
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </div>

          <div class="checklist-item add-item">
            <input
              type="checkbox"
              disabled
              class="checklist-checkbox disabled"
            />
            <input
              v-model="newItemText"
              type="text"
              class="checklist-text new-item-input"
              :placeholder="$t('kanban.taskModal.addChecklistItem')"
              @keyup.enter="addNewItem"
              @blur="addNewItem"
              data-cy="checklist-add-input"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="left-actions">
          <button
            v-if="canDeleteTask"
            class="delete-btn"
            data-cy="task-delete"
            @click="confirmDeleteTask"
          >
            {{ $t('common.delete') }}
          </button>
        </div>
        <div class="right-actions">
          <button class="cancel-btn" data-cy="task-cancel" @click="closeModal">
            {{ $t('common.cancel') }}
          </button>
          <button class="save-btn" data-cy="task-save" @click="saveTask">
            {{ $t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Checklist delete confirmation modal -->
    <div
      v-if="showDeleteChecklistModal"
      class="modal-overlay small"
      data-cy="checklist-delete-modal"
    >
      <div class="confirm-box">
        <button
          class="close-btn"
          data-cy="checklist-delete-close"
          @click="closeDeleteChecklistModal"
        >
          ×
        </button>
        <p class="confirm-message">
          {{ $t('kanban.taskModal.deleteChecklistWarning') }}
        </p>
        <button
          class="delete-checklist-confirm"
          data-cy="checklist-delete-confirm"
          @click="deleteChecklist"
        >
          {{ $t('kanban.taskModal.deleteChecklistConfirm') }}
        </button>
      </div>
    </div>

    <!-- Tarefa delete confirmation modal -->
    <div
      v-if="showDeleteTaskModal"
      class="modal-overlay small"
      data-cy="task-delete-modal"
    >
      <div class="confirm-box">
        <button
          class="close-btn"
          data-cy="task-delete-close"
          @click="closeDeleteTaskModal"
        >
          ×
        </button>
        <p class="confirm-message">
          {{ $t('kanban.taskModal.deleteTaskWarning') }}
        </p>
        <button
          class="delete-checklist-confirm"
          data-cy="task-delete-confirm"
          @click="deleteTask"
        >
          {{ $t('kanban.taskModal.deleteTaskConfirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { addBoardMember } from '@/services/kanban/users_service'

export default {
  props: {
    initialTask: {
      type: Object,
      default: null
    },
    users: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    },
    boardId: {
      type: [String, Number],
      default: null
    },
    currentUserId: {
      type: [String, Number],
      default: null
    },
    isBoardOwner: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save', 'close', 'delete', 'member-added'],
  data() {
    return {
      tempIdCounter: 1,
      task: {
        title: '',
        description: '',
        dueDate: '',
        duration: '',
        checklist: [],
        assignedUser: '',
        columnId: this.columns?.[0]?.id,
        type: 'tarefa'
      },
      newItemText: '',
      menuOpen: null,
      showDeleteChecklistModal: false,
      showDeleteTaskModal: false,

      // 👥 member
      memberAccordionOpen: false,
      newMemberEmail: '',
      addingMember: false,
      memberMsg: '',
      memberShake: false
    }
  },

  computed: {
    completedCount() {
      const total = Array.isArray(this.task.checklist)
        ? this.task.checklist.length
        : 0

      if (!total) return 0

      const done = this.task.checklist.filter((item) => item.completed).length
      return Math.round((done / total) * 100)
    },
    isEditingExisting() {
      return !!this.task?.id
    },
    isCreator() {
      if (!this.currentUserId || !this.task?.userId) return false
      return Number(this.task.userId) === Number(this.currentUserId)
    },
    canEditTitle() {
      if (!this.isEditingExisting) return true
      return this.isBoardOwner || this.isCreator
    },
    canEditDescription() {
      if (!this.isEditingExisting) return true
      return this.isBoardOwner || this.isCreator
    },
    canEditType() {
      if (!this.isEditingExisting) return true
      return this.isBoardOwner || this.isCreator
    },
    canEditAssignee() {
      if (!this.isEditingExisting) return true
      return this.isBoardOwner
    },
    canDeleteTask() {
      if (!this.isEditingExisting) return false
      return this.isBoardOwner || this.isCreator
    },
    showCreatorHint() {
      return this.isEditingExisting && !this.isBoardOwner && this.isCreator
    }
  },
  watch: {
    initialTask: {
      immediate: true,
      handler(newVal) {
        this.task = this.buildTaskState(newVal)
      }
    },
    columns: {
      deep: true,
      handler() {
        if (!this.task?.id && !this.task?.columnId) {
          this.task.columnId = this.columns?.[0]?.id
        }
      }
    }
  },
  methods: {
    nextTempId() {
      const id = `tmp_${this.tempIdCounter}`
      this.tempIdCounter = this.tempIdCounter + 1
      return id
    },
    buildTaskState(sourceTask) {
      // ✅ cria um "state" totalmente desconectado da prop (evita mutação por referência)
      if (sourceTask) {
        const normalizedChecklist = Array.isArray(sourceTask.checklist)
          ? sourceTask.checklist.map((item) => ({
              ...item,
              // garante key estável no Vue mesmo quando não existir id
              _tempId: item?.id || item?._tempId || this.nextTempId()
            }))
          : []

        return {
          ...sourceTask,
          dueDate: sourceTask.dueDate ? sourceTask.dueDate.slice(0, 10) : '',
          checklist: normalizedChecklist,
          type: sourceTask.type || 'tarefa'
        }
      }

      return {
        title: '',
        description: '',
        dueDate: '',
        duration: '',
        checklist: [],
        assignedUser: '',
        columnId: this.columns?.[0]?.id,
        type: 'tarefa'
      }
    },
    toggleMemberAccordion() {
      this.memberAccordionOpen = !this.memberAccordionOpen
    },
    formatUserOption(user) {
      const name = user?.name || this.$t('common.noName')
      const email = user?.email ? ` — ${user.email}` : ''

      if (user?.isOwner) {
        return `${name} (${this.$t('kanban.taskModal.owner')})${email}`
      }

      return `${name} (${this.$t('kanban.taskModal.guest')})${email}`
    },
    saveTask() {
      if (!this.task.title.trim()) {
        alert(this.$t('kanban.taskModal.errors.titleRequired'))
        return
      }

      if (this.task.duration) {
        const converted = this.convertDurationToHHmm(this.task.duration)

        if (!converted) {
          alert(this.$t('kanban.taskModal.errors.durationFormat'))
          return
        }

        this.task.duration = converted
      }

      const payload = this.buildPayloadForSave()
      this.$emit('save', payload)
    },

    async addMember() {
      const email = (this.newMemberEmail || '').trim()
      if (!email) return

      if (!this.boardId) {
        this.memberMsg = `❌ ${this.$t('kanban.taskModal.errors.boardMissing')}`
        this.memberAccordionOpen = true
        this.$nextTick(() => {
          this.memberShake = true
          setTimeout(() => (this.memberShake = false), 350)
        })
        return
      }
      // (opcional) limpa feedback anterior ao tentar de novo
      this.memberMsg = ''

      // 🔥 reseta o shake pra poder tocar novamente
      this.memberShake = false

      try {
        this.addingMember = true

        await addBoardMember(email, this.boardId)

        this.memberMsg = `✅ ${this.$t('kanban.taskModal.memberAdded')}`
        this.newMemberEmail = ''
        this.memberAccordionOpen = true
        this.$emit('member-added')
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          this.$t('kanban.taskModal.errors.memberAdd')
        this.memberMsg = `❌ ${msg}`

        this.memberAccordionOpen = true

        // ✅ toca shake SEMPRE no erro (mesmo repetido)
        this.$nextTick(() => {
          this.memberShake = true
          setTimeout(() => (this.memberShake = false), 350)
        })
      } finally {
        this.addingMember = false
      }
    },

    getTypeLabel(type) {
      switch (type) {
        case 'bug':
          return this.$t('kanban.taskModal.typeLabels.bug')
        case 'historia':
          return this.$t('kanban.taskModal.typeLabels.story')
        case 'tarefa':
        default:
          return this.$t('kanban.taskModal.typeLabels.task')
      }
    },

    validateDuration(duration) {
      return this.convertDurationToHHmm(duration) !== null
    },

    convertDurationToHHmm(value) {
      if (!value) return ''

      const trimmed = value.trim().toLowerCase()

      // Formato HH:mm
      const hhmmRegex = /^\d{1,2}:\d{2}$/
      if (hhmmRegex.test(trimmed)) {
        const [h, m] = trimmed.split(':')
        return `${h.padStart(2, '0')}:${m}`
      }

      // Formato: 2h ou 2h 30m
      const hmRegex = /^(\d{1,2})h(\s*(\d{1,2})m)?$/
      const match = trimmed.match(hmRegex)

      if (match) {
        const hours = match[1]
        const minutes = match[3] || '0'
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
      }

      return null
    },

    buildPayloadForSave() {
      const payload = { ...this.task }

      if (this.isEditingExisting && !this.isBoardOwner) {
        if (!this.isCreator) {
          delete payload.title
          delete payload.description
          delete payload.type
        }

        delete payload.assignedUser
      }

      return payload
    },

    closeModal() {
      this.$emit('close')
    },

    removeItem(index) {
      this.task.checklist.splice(index, 1)
      this.menuOpen = null
    },

    confirmDeleteTask() {
      this.showDeleteTaskModal = true
    },

    closeDeleteTaskModal() {
      this.showDeleteTaskModal = false
    },

    deleteTask() {
      this.$emit('delete', this.task.id)
      this.showDeleteTaskModal = false
    },

    confirmDeleteChecklist() {
      this.showDeleteChecklistModal = true
    },

    closeDeleteChecklistModal() {
      this.showDeleteChecklistModal = false
    },

    deleteChecklist() {
      this.task.checklist = []
      this.showDeleteChecklistModal = false
    },

    addNewItem() {
      const text = this.newItemText.trim()
      if (!text) return
      this.task.checklist.push({
        _tempId: this.nextTempId(),
        text,
        completed: false
      })
      this.newItemText = ''
    },

    toggleMenu(index) {
      this.menuOpen = this.menuOpen === index ? null : index
    }
  }
}
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 32, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* =========================
   👥 Accordion Add Member
   ========================= */
.member-accordion {
  width: 100%;
  border-radius: 14px;
  background: linear-gradient(
    120deg,
    rgba(25, 29, 49, 0.92),
    rgba(35, 40, 73, 0.55)
  );
  border: 1.6px solid rgba(186, 225, 252, 0.12);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  margin-bottom: 14px;
  overflow: hidden;
}

.member-accordion-trigger {
  width: 100%;
  padding: 12px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}

.member-accordion-trigger:hover {
  background: rgba(255, 255, 255, 0.03);
}

.member-accordion-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.member-accordion-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: rgba(255, 224, 138, 0.12);
  border: 1px solid rgba(255, 224, 138, 0.22);
  filter: drop-shadow(0 0 10px rgba(255, 224, 138, 0.08));
  flex-shrink: 0;
}

.member-accordion-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.member-accordion-title {
  color: #bae1fc;
  font-weight: 900;
  letter-spacing: 0.01em;
}

.member-accordion-subtitle {
  color: rgba(229, 236, 250, 0.78);
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-accordion-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.member-accordion-chevron {
  color: rgba(255, 224, 138, 0.9);
  font-size: 1.1rem;
  transition: transform 0.18s ease;
  user-select: none;
}

.member-accordion.open .member-accordion-chevron {
  transform: rotate(180deg);
}

.member-accordion-panel {
  padding: 12px 12px 12px 12px;
  border-top: 1px solid rgba(186, 225, 252, 0.08);
  animation: memberPanelIn 0.18s ease;
}

@keyframes memberPanelIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.member-form-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.member-input {
  flex: 1;
  min-width: 0;
  padding: 12px 12px;
  border-radius: 10px;
  border: 1.6px solid rgba(186, 225, 252, 0.12);
  background: rgba(35, 40, 73, 0.92);
  color: #e5ecfa;
  outline: none;
  transition:
    border 0.18s,
    box-shadow 0.18s,
    background 0.18s;
}

.member-input:focus {
  border: 1.6px solid rgba(255, 224, 138, 0.65);
  box-shadow: 0 0 0 3px rgba(255, 224, 138, 0.08);
  background: rgba(35, 40, 73, 1);
}

.member-btn {
  padding: 12px 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 900;
  background: linear-gradient(87deg, #ffe08a 60%, #ffcb67 100%);
  color: #191c2a;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition:
    transform 0.12s ease,
    filter 0.12s ease,
    box-shadow 0.16s ease;
  box-shadow: 0 10px 18px rgba(255, 224, 138, 0.12);
}

.member-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(255, 224, 138, 0.16);
}

.member-btn:active {
  transform: translateY(0);
  filter: brightness(0.98);
}

.member-btn[disabled] {
  filter: grayscale(1) opacity(0.55);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(25, 28, 42, 0.12);
  border: 1px solid rgba(25, 28, 42, 0.18);
  font-weight: 900;
}

.member-hint {
  margin-top: 10px;
  color: rgba(229, 236, 250, 0.72);
  font-size: 0.9rem;
}

/* Pills feedback */
.member-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 900;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-pill.ok {
  color: #b8ffd8;
  background: rgba(33, 206, 124, 0.12);
  border-color: rgba(33, 206, 124, 0.35);
}

.member-pill.error {
  color: #ffb8b8;
  background: rgba(255, 107, 107, 0.12);
  border-color: rgba(255, 107, 107, 0.35);
}

.member-pill.loading {
  color: #ffe08a;
  background: rgba(255, 224, 138, 0.12);
  border-color: rgba(255, 224, 138, 0.22);
}

/* =========================
   Modal base (seu CSS)
   ========================= */
.modal {
  background: linear-gradient(120deg, #202336 75%, #252a43 100%);
  color: #ffe08a;
  width: 100%;
  max-width: 620px;
  max-height: 76vh;
  border-radius: 18px;
  box-shadow:
    0 8px 38px #10101c88,
    0 1.5px 12px #ffe08a33;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2.2px solid #232849;
  animation: modalPop 0.45s cubic-bezier(0.24, 0.8, 0.42, 1.21);
}

.permission-hint {
  margin: -6px 0 12px 0;
  font-size: 0.85rem;
  color: rgba(255, 224, 138, 0.92);
  font-weight: 600;
}

.permission-hint.muted {
  color: rgba(229, 236, 250, 0.68);
}

input[disabled],
textarea[disabled],
select[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes modalPop {
  0% {
    opacity: 0;
    transform: translateY(44px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}

.modal-header {
  padding: 23px 28px 8px 28px;
  background: none;
  display: flex;
  align-items: center;
}

.icon-glow {
  filter: drop-shadow(0 0 8px #ffe08a99);
  font-size: 1.4em;
  margin-right: 2px;
}

.modal-title {
  margin: 0;
  font-size: 1.42rem;
  color: #ffe08a;
  font-weight: 800;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 6px;
  text-shadow: 0 1px 8px #ffe08a33;
}

.modal-textarea {
  max-width: 100%;
  width: 100%;
  resize: vertical;
  box-sizing: border-box;
  font-size: 1.05rem;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1.5px solid #2b324f;
  background: #222540;
  color: #f4f7fa;
  transition: border 0.19s;
}

.modal-textarea:focus {
  outline: none;
  border: 1.5px solid #ffe08a;
  background: #232849;
}

textarea {
  resize: vertical;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.modal-body {
  padding: 28px 28px 16px 28px;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box; /* ✅ */
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #ffe08a;
  letter-spacing: 0.01em;
  font-size: 1.07rem;
}

.form-group.modern {
  width: 100%;
  margin-bottom: 18px;
}

.form-group.modern label {
  color: #bae1fc;
  font-size: 1.01rem;
  font-weight: 600;
  margin-bottom: 5px;
  display: block;
  letter-spacing: 0.01em;
  opacity: 0.9;
}

.form-group.modern input,
.form-group.modern textarea,
.form-group.modern select,
.modal-textarea {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 15px 13px;
  border-radius: 9px;
  background: #232849;
  color: #e5ecfa;
  border: 1.7px solid #232849;
  font-size: 1.07rem;
  outline: none;
  box-shadow: 0 1.5px 8px #23284911;
  transition:
    border 0.19s,
    box-shadow 0.21s;
}

.form-group.modern input:focus,
.form-group.modern textarea:focus,
.form-group.modern select:focus {
  border: 1.7px solid #ffe08a;
  background: #232849ee;
  box-shadow: 0 2px 14px #ffe08a11;
}

.form-row {
  display: flex;
  gap: 14px;
}

.form-row.form-row-3 {
  gap: 12px;
}

.form-row.form-row-3 .form-group.modern {
  flex: 1;
  margin-bottom: 0;
}

.form-row .form-group.modern {
  flex: 1 1 0;
}

/* Checklist Visual */
.checklist-container {
  margin-top: 18px;
  padding: 18px 10px 12px 10px;
  border-radius: 11px;
  background: #191d31;
  border: 1.5px solid #23294d;
}

.checklist-header {
  margin-bottom: 13px;
}

.checklist-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.delete-checklist-btn {
  background: none;
  color: #ffb933;
  border: none;
  font-size: 0.93rem;
  cursor: pointer;
  font-weight: 500;
  margin-left: 12px;
  transition: color 0.19s;
}

.delete-checklist-btn:hover {
  color: #ff6b6b;
}

.progress-area {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 6px 0;
}

.progress-bar {
  flex: 1;
  height: 7px;
  background: #313764;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(89deg, #ffe08a 50%, #bae1fc 100%);
  transition: width 0.27s;
}

.progress-text {
  color: #ffe08a;
  font-size: 0.97rem;
  font-weight: 600;
  margin-left: 7px;
  letter-spacing: 0.03em;
  text-shadow: 0 1px 8px #ffe08a24;
}

.checklist-item {
  display: flex;
  align-items: center;
  margin-bottom: 9px;
  background: #232849;
  border-radius: 8px;
  padding: 7px 8px;
  gap: 10px;
  border: 1.3px solid #232849;
  transition:
    border 0.18s,
    box-shadow 0.18s;
}

.checklist-item:focus-within {
  border: 1.5px solid #ffe08a;
  box-shadow: 0 1px 7px #ffe08a14;
}

.checklist-checkbox {
  width: 19px;
  height: 19px;
  accent-color: #ffe08a;
  border-radius: 6px;
  border: 1px solid #ffe08a55;
  background: #232849;
  margin-right: 8px;
  flex-shrink: 0;
}

.checklist-checkbox.disabled {
  opacity: 0.7;
}

.checklist-text {
  flex: 1;
  background: none;
  border: none;
  color: #e5ecfa;
  font-size: 1.01rem;
  padding: 3px 2px;
  border-radius: 6px;
  outline: none;
}

.checklist-text:focus {
  background: #191d31;
  color: #ffe08a;
}

.add-item .checklist-text {
  color: #b8f0ff;
}

.item-actions {
  position: relative;
}

.dots {
  background: none;
  border: none;
  font-size: 19px;
  color: #ffe08a;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.19s;
}

.dots:hover {
  background: #232849;
}

.menu {
  position: absolute;
  top: 34px;
  right: 0;
  background: #232849;
  border: 1px solid #444d80;
  border-radius: 7px;
  padding: 4px 0;
  z-index: 10;
  box-shadow: 0 2px 8px #1b1e3040;
  min-width: 86px;
}

.menu button {
  background: none;
  border: none;
  color: #ffe08a;
  padding: 7px 14px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.96rem;
  border-radius: 5px;
  transition: background 0.18s;
}

.menu button:hover {
  background: #191d31;
  color: #ff6b6b;
}

/* Modal Footer */
.modal-footer {
  padding: 19px 28px 23px 28px;
  background: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1.5px solid #232849;
  margin-top: 15px;
  gap: 8px;
}

.left-actions,
.right-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.save-btn {
  background: linear-gradient(89deg, #ffe08a 70%, #bae1fc 100%);
  color: #1b1e30;
  padding: 12px 36px;
  border-radius: 7px;
  font-weight: 800;
  font-size: 1.09rem;
  border: none;
  box-shadow: 0 1px 8px #ffe08a11;
  letter-spacing: 0.07em;
  cursor: pointer;
  transition:
    background 0.22s,
    box-shadow 0.19s;
}

.save-btn:hover {
  background: linear-gradient(89deg, #fff6b0 70%, #d4f0ff 100%);
  box-shadow: 0 3px 16px #ffe08a33;
}

.cancel-btn {
  background: none;
  color: #bae1fc;
  border: 1.6px solid #bae1fc;
  padding: 11px 23px;
  border-radius: 7px;
  font-weight: 700;
  font-size: 1.05rem;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.19s;
}

.cancel-btn:hover {
  background: #232849;
  color: #ffe08a;
}

/* Botão Excluir */
.delete-btn {
  background: none;
  color: #ff6b6b;
  border: 1.6px solid #ff6b6b;
  padding: 11px 24px;
  border-radius: 7px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.19s,
    color 0.18s;
}

.delete-btn:hover {
  background: #232849;
  color: #ffe08a;
  border-color: #ffe08a;
}

/* Modal de confirmação */
.modal-overlay.small {
  background: rgba(26, 28, 44, 0.87);
  z-index: 3000;
}

.confirm-box {
  background: linear-gradient(120deg, #232849 80%, #202336 100%);
  border: 1.8px solid #ffe08a77;
  border-radius: 14px;
  padding: 26px 22px 21px 22px;
  width: 334px;
  position: relative;
  box-shadow: 0 4px 24px #10101c99;
  color: #ffe08a;
}

.confirm-message {
  color: #bae1fc;
  margin-bottom: 18px;
  font-size: 1.02rem;
  font-weight: 500;
  text-align: center;
}

.delete-checklist-confirm {
  background: linear-gradient(89deg, #ffb933 70%, #ff6b6b 120%);
  color: #1b1e30;
  border: none;
  padding: 12px 0;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-weight: 700;
  font-size: 1.08rem;
  transition:
    background 0.18s,
    color 0.18s;
  margin-top: 4px;
}

.delete-checklist-confirm:hover {
  background: linear-gradient(89deg, #ffe08a 50%, #ff6b6b 130%);
  color: #191d31;
}

.close-btn {
  position: absolute;
  top: 7px;
  right: 12px;
  background: none;
  color: #ffe08a;
  font-size: 1.35rem;
  border: none;
  cursor: pointer;
  font-weight: 900;
}

.close-btn:hover {
  color: #ff6b6b;
}

/* Scrollbar */
.modal-body::-webkit-scrollbar {
  width: 9px;
}

.modal-body::-webkit-scrollbar-thumb {
  background-color: #232849;
  border-radius: 7px;
}

.modal-body::-webkit-scrollbar-track {
  background-color: transparent;
}

.input-error {
  border-color: #ff6b6b !important;
  background: #232849cc !important;
}

.task-type-area {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.type-label {
  color: #ffe08a;
  font-size: 1.04rem;
  font-weight: 500;
}

.type-select {
  background: #232849;
  color: #e5ecfa;
  border-radius: 7px;
  border: 1.4px solid #2b324f;
  padding: 7px 13px;
  font-size: 1.04rem;
  font-weight: 500;
  outline: none;
  transition: border 0.18s;
}

.type-select:focus {
  border: 1.5px solid #ffe08a;
}

.type-badge {
  display: inline-block;
  padding: 5px 15px 5px 10px;
  border-radius: 22px;
  font-weight: 700;
  font-size: 1.01rem;
  margin-left: 6px;
  box-shadow: 0 2px 7px #ffe08a33;
  letter-spacing: 0.02em;
  background: #232849;
  border: 2px solid #232849;
}

.type-badge.tarefa {
  background: linear-gradient(90deg, #202336 60%, #ffe08a44 100%);
  color: #ffe08a;
  border-color: #ffe08a77;
}

.type-badge.historia {
  background: linear-gradient(90deg, #202336 60%, #bae1fc44 100%);
  color: #bae1fc;
  border-color: #bae1fc77;
}

.type-badge.bug {
  background: linear-gradient(90deg, #202336 60%, #ff6b6b44 100%);
  color: #ff6b6b;
  border-color: #ff6b6b77;
}

/* =========================
   Seção Pessoas (Novo Layout)
   ========================= */
.people-section {
  width: 100%;
  background: linear-gradient(
    135deg,
    rgba(25, 29, 49, 0.95) 0%,
    rgba(35, 40, 77, 0.85) 100%
  );
  border-radius: 14px;
  padding: 16px;
  border: 1.5px solid rgba(186, 225, 252, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  box-sizing: border-box; /* ✅ evita ultrapassar com padding/borda */
}
.assign-user-box,
.add-person-box {
  display: flex;
  flex-direction: column;
}
.people-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(186, 225, 252, 0.08);
}

.people-section-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(255, 224, 138, 0.15) 0%,
    rgba(255, 203, 103, 0.1) 100%
  );
  border-radius: 8px;
  border: 1.5px solid rgba(255, 224, 138, 0.25);
  color: #ffe08a;
}

.people-section-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #ffe08a;
  letter-spacing: 0.02em;
}

.people-section-content {
  display: flex;
  gap: 12px;
  align-items: stretch; /* 👈 garante mesma altura */
}
.member-feedback {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.88rem;
  line-height: 1.2;
  display: flex;
  max-width: 100%;
  overflow: hidden;
  white-space: normal;

  word-break: break-word;
  align-items: flex-start;
  width: 100%;
  box-sizing: border-box;
  flex: 0 0 100%;
  gap: 8px;
  word-break: break-word;
  white-space: normal; /* ✅ garante texto normal */
  border: 1px solid transparent;
  background: rgba(186, 225, 252, 0.06);
  color: rgba(229, 236, 250, 0.9);
}

.member-feedback.ok {
  border-color: rgba(33, 206, 124, 0.35);
  background: rgba(33, 206, 124, 0.1);
  color: #b8ffd8;
}

.member-feedback.error {
  border-color: rgba(255, 107, 107, 0.35);
  background: rgba(255, 107, 107, 0.1);
  color: #ffb8b8;
}
.member-feedback.below {
  margin-top: 6px;
}

.input-with-feedback {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.feedback-icon {
  flex: 0 0 auto;
  margin-top: 1px;
}

.feedback-text {
  flex: 1;
  word-break: break-word; /* ✅ evita estourar */
}

/* Atribuir para - Box */
.assign-user-box {
  flex: 1;
  min-width: 0;
  background: rgba(32, 35, 54, 0.7);
  border-radius: 10px;
  padding: 12px;
  border: 1.5px solid rgba(186, 225, 252, 0.08);
  transition: border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.assign-user-box:focus-within {
  border-color: rgba(255, 224, 138, 0.4);
}

.assign-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #bae1fc;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: 0.01em;
}

.assign-label svg {
  color: rgba(186, 225, 252, 0.6);
}

.assign-select {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 32px 10px 12px;
  border-radius: 8px;
  background: rgba(35, 40, 73, 0.95);
  color: #e5ecfa;
  border: 1.5px solid rgba(186, 225, 252, 0.1);
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  transition:
    border 0.2s ease,
    box-shadow 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23bae1fc' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.assign-select:hover {
  border-color: rgba(186, 225, 252, 0.2);
}

.assign-select:focus {
  border-color: rgba(255, 224, 138, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 224, 138, 0.08);
}

.assign-select option {
  background: #232849;
  color: #e5ecfa;
}

/* Adicionar pessoa - Box */
.add-person-box {
  flex: 1;
  min-width: 0;
  background: rgba(32, 35, 54, 0.7);
  border-radius: 10px;
  padding: 12px; /* antes 12px */
  border-radius: 10px; /* antes 10px */
  transition: border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: visible;
}
.add-person-box:focus-within {
  border-color: rgba(255, 224, 138, 0.4);
}
.add-person-box:hover {
  border-color: rgba(186, 225, 252, 0.15);
}
.invite-select {
  width: 100%;
  padding: 12px 12px;
  border-radius: 8px;
  background: rgba(35, 40, 73, 0.95);
  color: #e5ecfa;
  border: 1.5px solid rgba(186, 225, 252, 0.1);
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition:
    border 0.2s ease,
    box-shadow 0.2s ease;
}
.invite-select.open,
.invite-select:focus {
  border-color: rgba(255, 224, 138, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 224, 138, 0.08);
}

.invite-select:hover {
  border-color: rgba(186, 225, 252, 0.2);
}
.invite-placeholder {
  color: rgba(186, 225, 252, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.add-person-trigger {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.2s ease;
}

.add-person-trigger:hover {
  background: rgba(255, 255, 255, 0.02);
}

.add-person-trigger.open {
  border-bottom: 1px solid rgba(186, 225, 252, 0.08);
}

.add-person-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #bae1fc;
  font-size: 0.88rem;
  font-weight: 600;
}

.add-person-left svg {
  color: rgba(186, 225, 252, 0.7);
}

.add-person-trigger:hover .add-person-left svg {
  color: #ffe08a;
}

.chevron-icon {
  color: rgba(186, 225, 252, 0.5);
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.chevron-icon.open {
  transform: rotate(180deg);
  color: #ffe08a;
}

.add-person-panel {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* ✅ impede "vazar" para fora */
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.add-person-form {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.email-input {
  flex: 1 1 40px;
  margin-top: 8px;
  min-width: 0;
  height: 40px;
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(35, 40, 73, 0.95);
  color: #e5ecfa;
  border: 1.5px solid rgba(186, 225, 252, 0.1);
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  transition:
    border 0.2s ease,
    box-shadow 0.2s ease;
}

.email-input::placeholder {
  color: rgba(186, 225, 252, 0.4);
}

.email-input:focus {
  border-color: rgba(255, 224, 138, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 224, 138, 0.08);
}

.add-btn {
  padding: 0 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, #ffe08a 0%, #ffcb67 100%);
  color: #191c2a;
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  width: auto;
  min-width: 110px; /* ✅ tamanho consistente */
  height: 40px;
  justify-content: center;
  gap: 6px;
  flex: 0 0 auto; /* 👈 botão não encolhe */
  white-space: nowrap;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  box-shadow: 0 2px 8px rgba(255, 224, 138, 0.15);
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 224, 138, 0.25);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Spinner de loading */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 224, 138, 0.3);
  border-top-color: #ffe08a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.email-input.error {
  border-color: rgba(255, 107, 107, 0.55);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.1);
}

@keyframes shakeX {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  50% {
    transform: translateX(4px);
  }
  75% {
    transform: translateX(-3px);
  }
  100% {
    transform: translateX(0);
  }
}

.shake {
  animation: shakeX 0.35s ease;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Ajuste responsivo */
@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }

  .form-row.form-row-3 {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .form-row.form-row-3 .form-group.modern {
    flex: 1 1 45%;
    min-width: 120px;
  }

  .people-section-content {
    flex-direction: column;
  }
}
@media (max-width: 700px) {
  .add-person-form {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
