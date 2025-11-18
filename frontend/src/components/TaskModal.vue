<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="icon-glow">✏️</span>
          {{ task.id ? 'Editar Tarefa' : 'Nova Tarefa' }}
        </h2>
      </div>

      <div class="modal-body">
        <div class="form-group modern">
          <label for="title">Título</label>
          <input
            id="title"
            v-model="task.title"
            placeholder="Título da Tarefa"
            required
            autocomplete="off"
          />
        </div>

        <div class="task-type-area">
          <label class="type-label" for="type">Tipo:</label>
          <select id="type" v-model="task.type" class="type-select">
            <option value="tarefa">Tarefa</option>
            <option value="historia">História</option>
            <option value="bug">Bug</option>
          </select>
          <span class="type-badge" :class="task.type">
            {{ getTypeLabel(task.type) }}
          </span>
        </div>

        <div class="form-group modern">
          <label for="description">Descrição</label>
          <textarea
            id="description"
            v-model="task.description"
            placeholder="Descreva a tarefa..."
            autocomplete="off"
            class="modal-textarea"
          ></textarea>
        </div>

        <!-- Linha: Prazo + Atribuir para -->
        <div class="form-row">
          <div class="form-group modern">
            <label for="dueDate">Prazo</label>
            <input type="date" id="dueDate" v-model="task.dueDate" />
          </div>
          <div class="form-group modern">
            <label for="assignedUser">Atribuir para</label>
            <select id="assignedUser" v-model="task.assignedUser">
              <option value="">Selecione...</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Linha: Duração -->
        <div class="form-group modern">
          <label for="duration">Duração</label>
          <input
            id="duration"
            v-model="task.duration"
            :class="{
              'input-error': task.duration && !validateDuration(task.duration)
            }"
            placeholder="Ex: 2h 30m ou 01:45"
            autocomplete="off"
            type="text"
            inputmode="text"
          />
        </div>

        <div class="form-group modern">
          <label for="columnId">Coluna</label>
          <select id="columnId" v-model="task.columnId">
            <option v-for="col in columns" :key="col.id" :value="col.id">
              {{ col.name }}
            </option>
          </select>
        </div>

        <!-- Checklist -->
        <div class="checklist-container">
          <div class="checklist-header">
            <div class="checklist-title">
              <span>Checklist</span>
              <button
                v-if="task.checklist && task.checklist.length > 0"
                style="cursor: pointer"
                class="delete-checklist-btn"
                @click="confirmDeleteChecklist"
              >
                Deletar
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
            :key="index"
            class="checklist-item"
          >
            <input
              type="checkbox"
              v-model="item.completed"
              class="checklist-checkbox"
              :aria-label="`Concluir ${item.text}`"
            />
            <input type="text" v-model="item.text" class="checklist-text" />
            <div class="item-actions">
              <button class="dots" @click="toggleMenu(index)">⋮</button>
              <div v-if="menuOpen === index" class="menu">
                <button @click="removeItem(index)">Deletar</button>
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
              type="text"
              v-model="newItemText"
              class="checklist-text new-item-input"
              placeholder="Adicionar um item"
              @keyup.enter="addNewItem"
              @blur="addNewItem"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="left-actions">
          <button class="delete-btn" v-if="task.id" @click="confirmDeleteTask">
            Excluir
          </button>
        </div>
        <div class="right-actions">
          <button class="cancel-btn" @click="closeModal">Cancelar</button>
          <button class="save-btn" @click="saveTask">Salvar</button>
        </div>
      </div>
    </div>

    <!-- Checklist delete confirmation modal -->
    <div class="modal-overlay small" v-if="showDeleteChecklistModal">
      <div class="confirm-box">
        <button class="close-btn" @click="showDeleteChecklistModal = false">
          ×
        </button>
        <p class="confirm-message">
          A exclusão de uma checklist é permanente e não há como recuperá-la.
        </p>
        <button class="delete-checklist-confirm" @click="deleteChecklist">
          Deletar checklist
        </button>
      </div>
    </div>
    <!-- Tarefa delete confirmation modal -->
    <div class="modal-overlay small" v-if="showDeleteTaskModal">
      <div class="confirm-box">
        <button class="close-btn" @click="showDeleteTaskModal = false">
          ×
        </button>
        <p class="confirm-message">
          Tem certeza que deseja excluir esta tarefa? Esta ação é permanente.
        </p>
        <button class="delete-checklist-confirm" @click="deleteTask">
          Deletar tarefa
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['initialTask', 'users', 'columns'],
  emits: ['save', 'close', 'delete'],
  data() {
    return {
      task: this.initialTask
        ? {
            ...this.initialTask,
            dueDate: this.initialTask.dueDate
              ? this.initialTask.dueDate.slice(0, 10)
              : '',
            checklist: this.initialTask.checklist || [],
            type: this.initialTask.type || 'tarefa'
          }
        : {
            title: '',
            description: '',
            dueDate: '',
            duration: '',
            checklist: [],
            assignedUser: '',
            columnId: this.columns[0]?.id,
            type: 'tarefa'
          },

      newItemText: '',
      menuOpen: null,
      showDeleteChecklistModal: false,
      showDeleteTaskModal: false
    }
  },
  computed: {
    completedCount() {
      const total = this.task.checklist.length || 1
      const done = this.task.checklist.filter((item) => item.completed).length
      return Math.round((done / total) * 100)
    }
  },
  methods: {
    saveTask() {
      if (!this.task.title.trim()) {
        alert('O título é obrigatório!')
        return
      }
      // Validação da duração
      if (this.task.duration && !this.validateDuration(this.task.duration)) {
        alert('Preencha a duração no formato "2h 30m" ou "01:45"')
        return
      }
      this.$emit('save', this.task)
    },
    getTypeLabel(type) {
      switch (type) {
        case 'bug':
          return '🐛 Bug'
        case 'historia':
          return '📚 História'
        case 'tarefa':
        default:
          return '🛠️ Tarefa'
      }
    },
    validateDuration(duration) {
      // Aceita "2h 30m" ou "01:45"
      const regex1 = /^\s*\d{1,2}h\s*(\d{1,2}m)?\s*$/ // Ex: 2h, 2h 30m
      const regex2 = /^\s*\d{1,2}:\d{2}\s*$/ // Ex: 01:45
      return regex1.test(duration) || regex2.test(duration)
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
    deleteTask() {
      this.$emit('delete', this.task.id)
      this.showDeleteTaskModal = false
    },
    confirmDeleteChecklist() {
      this.showDeleteChecklistModal = true
    },
    deleteChecklist() {
      this.task.checklist = []
      this.showDeleteChecklistModal = false
    },
    addNewItem() {
      const text = this.newItemText.trim()
      if (!text) return
      this.task.checklist.push({
        text: text,
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

/* Modal */
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

  resize: vertical; /* Só deixa crescer pra cima/baixo */
  box-sizing: border-box; /* Inclui padding/border no cálculo */
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
/* Corpo do Modal */
.modal-body {
  padding: 28px 28px 16px 28px; /* aumentei padding lateral/topo */
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px; /* <--- espaçamento vertical geral entre blocos */
}

.form-group {
  margin-bottom: 12px; /* Menor que antes, pois usamos gap no modal-body */
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #ffe08a;
  letter-spacing: 0.01em;
  font-size: 1.07rem;
}

/* Grupos de formulário */
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
  gap: 18px;
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

.form-group.row-label {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  margin-bottom: 0;
}

.form-group.row-label label {
  min-width: 90px; /* largura igual para ambos labels */
  margin-bottom: 0;
  color: #bae1fc;
  font-size: 1.01rem;
  font-weight: 600;
  opacity: 0.9;
}

.form-group.row-label input[type='date'] {
  flex: 1;
  width: 100%;
  min-width: 0;
}

.form-group.row-label input,
.form-group.row-label select {
  flex: 1;
  width: 100%;
  min-width: 0;
}
.form-group.row-label#duration-group {
  margin-top: 6px;
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
</style>
