<template>
  <div
    class="sidebar"
    :class="{
      expanded,
      mobile: isMobile,
      open: expanded,
      closed: !expanded
    }"
  >
    <div v-if="expanded" class="sidebar-content">
      <button
        class="sidebar-toggle"
        :aria-label="$t('kanban.sidebar.toggleLabel')"
        @click="toggleSidebar"
        data-cy="sidebar-toggle"
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
          <h3>
            {{ firstName }}
            <span class="ws-label">{{ $t('kanban.sidebar.workspaceLabel') }}</span>
          </h3>
        </div>
      </div>

      <hr class="divider" />

      <!-- ✅ header da lista + criar -->
      <div class="boards-header">
        <div class="section-title">{{ $t('kanban.sidebar.yourBoards') }}</div>

        <button
          type="button"
          class="new-board-btn"
          data-cy="board-create"
          @click="openCreateBoard"
        >
          <span class="material-icons" style="font-size: 18px">add</span>
          {{ $t('kanban.sidebar.newBoard') }}
        </button>
      </div>

      <div class="board-list">
        <button
          v-for="board in boards"
          :key="board.id"
          type="button"
          class="board-item"
          :class="{
            active: Number(board.id) === Number(activeBoardId),
            shared: isShared(board)
          }"
          @click="selectBoard(board.id)"
          :data-cy="`board-item-${board.id}`"
        >
          <!-- ✅ ESQUERDA: nome (2 linhas) + badge embaixo -->
          <div class="board-title">
            <span class="board-name">{{ board.name }}</span>

            <span v-if="isShared(board)" class="board-shared-by">
              {{ $t('kanban.sidebar.sharedBy') }}
              <b>{{ board.ownerName }}</b>
            </span>
          </div>
          <!-- ✅ DIREITA: ações (não encolhe) -->
          <div class="board-actions">
            <!-- ✅ só owner pode renomear -->
            <button
              v-if="isOwner(board)"
              type="button"
              class="icon-btn"
              :title="$t('kanban.sidebar.rename')"
              @click.stop="openRenameBoard(board)"
              :data-cy="`board-rename-${board.id}`"
            >
              <span class="material-icons" style="font-size: 18px">edit</span>
            </button>

            <!-- ✅ só owner pode excluir -->
            <button
              v-if="isOwner(board)"
              type="button"
              class="icon-btn"
              :title="$t('kanban.sidebar.delete')"
              @click.stop="openDeleteBoard(board)"
              :data-cy="`board-delete-${board.id}`"
            >
              <span class="material-icons" style="font-size: 18px">delete</span>
            </button>
          </div>
        </button>
      </div>

      <!-- ✅ Visibilidade do board (somente owner) -->
      <div
        v-if="activeBoard && isOwner(activeBoard)"
        class="visibility-card"
        data-cy="board-visibility"
      >
        <div class="visibility-header">
          <span class="visibility-title">{{
            $t('kanban.sidebar.visibility.label')
          }}</span>
          <span
            class="visibility-badge"
            :class="activeVisibility === 'SHARED' ? 'shared' : 'private'"
          >
            {{
              activeVisibility === 'SHARED'
                ? $t('kanban.sidebar.visibility.shared')
                : $t('kanban.sidebar.visibility.private')
            }}
          </span>
        </div>

        <div class="visibility-actions">
          <button
            type="button"
            class="visibility-btn"
            :class="{ active: activeVisibility === 'PRIVATE' }"
            :disabled="isUpdatingVisibility"
            @click="setBoardVisibility('PRIVATE')"
            data-cy="visibility-private"
          >
            {{ $t('kanban.sidebar.visibility.private') }}
          </button>
          <button
            type="button"
            class="visibility-btn"
            :class="{ active: activeVisibility === 'SHARED' }"
            :disabled="isUpdatingVisibility"
            @click="setBoardVisibility('SHARED')"
            data-cy="visibility-shared"
          >
            {{ $t('kanban.sidebar.visibility.shared') }}
          </button>
        </div>

        <p class="visibility-hint">
          {{
            activeVisibility === 'SHARED'
              ? $t('kanban.sidebar.visibility.sharedHint')
              : $t('kanban.sidebar.visibility.privateHint')
          }}
        </p>
      </div>

      <button class="logout-button" data-cy="logout-button" @click="logout">
        <span
          class="material-icons"
          style="vertical-align: middle; margin-right: 6px"
        >
          logout
        </span>
        {{ $t('kanban.sidebar.logout') }}
      </button>
    </div>

    <div v-else class="collapsed-logo" @click="toggleSidebar">
      <span class="logo-text">{{ firstLetter }}</span>
    </div>

    <!-- ✅ Modal criar/renomear -->
    <div
      v-if="showBoardModal"
      class="modal-overlay"
      @click.self="closeBoardModal"
      data-cy="board-modal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">
            {{
              boardModalMode === 'create'
                ? $t('kanban.sidebar.createBoardTitle')
                : $t('kanban.sidebar.renameBoardTitle')
            }}
          </h3>
          <button type="button" class="close-x" @click="closeBoardModal">
            ×
          </button>
        </div>

        <div class="modal-body">
          <label class="modal-label">{{
            $t('kanban.sidebar.boardNameLabel')
          }}</label>
          <input
            v-model="boardNameInput"
            class="modal-input"
            type="text"
            :placeholder="$t('kanban.sidebar.boardNamePlaceholder')"
            @keyup.enter="submitBoardModal"
            data-cy="board-name-input"
          />

          <p v-if="boardModalError" class="modal-error">
            {{ boardModalError }}
          </p>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="modal-cancel"
            data-cy="board-modal-cancel"
            @click="closeBoardModal"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            class="modal-confirm"
            :disabled="isSavingBoard || !boardNameInput.trim()"
            @click="submitBoardModal"
            data-cy="board-modal-save"
          >
            {{
              isSavingBoard
                ? $t('common.saving')
                : $t('common.save')
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ Modal confirmar EXCLUSÃO -->
    <div
      v-if="showDeleteBoardModal"
      class="modal-overlay"
      @click.self="closeDeleteBoardModal"
      data-cy="board-delete-modal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ $t('kanban.sidebar.deleteTitle') }}</h3>
          <button type="button" class="close-x" @click="closeDeleteBoardModal">
            ×
          </button>
        </div>

        <div class="modal-body">
          <p style="margin: 0; color: rgba(229, 236, 250, 0.92)">
            {{ $t('kanban.sidebar.deleteConfirm') }}
            <b style="color: #ffe08a">{{ boardToDelete?.name }}</b>?
          </p>

          <p style="margin: 0; color: rgba(229, 236, 250, 0.72)">
            {{ $t('kanban.sidebar.deleteWarning') }}
          </p>

          <p v-if="deleteBoardError" class="modal-error">
            {{ deleteBoardError }}
          </p>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="modal-cancel"
            @click="closeDeleteBoardModal"
            data-cy="board-delete-cancel"
          >
            {{ $t('common.cancel') }}
          </button>

          <button
            type="button"
            class="modal-confirm"
            :disabled="isDeletingBoard"
            @click="confirmDeleteBoard"
            data-cy="board-delete-confirm"
          >
            {{
              isDeletingBoard
                ? $t('common.deleting')
                : $t('common.delete')
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { useToast } from 'vue-toastification'
import { logout as authLogout } from '@/services/auth_service'
import {
  createBoard,
  deleteBoard,
  fetchBoards as fetchBoardsService,
  renameBoard,
  updateBoardVisibility
} from '@/services/kanban/boards_service'

export default {
  name: 'AppSidebar',

  props: {
    expanded: { type: Boolean, default: true },
    isMobile: { type: Boolean, default: false },
    activeBoardId: { type: [String, Number], default: null }
  },

  emits: ['toggle', 'select-board', 'refresh-board'],

  data() {
    return {
      userName: '',
      boards: [],
      loggedUserId: null,

      // modal create/rename (já existia)
      showBoardModal: false,
      boardModalMode: 'create', // 'create' | 'rename'
      boardNameInput: '',
      boardModalError: '',
      isSavingBoard: false,
      boardToRename: null,

      // ✅ modal delete (NOVO)
      showDeleteBoardModal: false,
      boardToDelete: null,
      isDeletingBoard: false,
      deleteBoardError: '',

      isUpdatingVisibility: false
    }
  },

  computed: {
    firstName() {
      const fallback = this.$t('common.userFallback')
      const safeName = this.userName || fallback
      return safeName.split(' ')[0] || fallback
    },
    firstLetter() {
      const fallback = this.$t('common.userFallback')
      const safeName = this.userName || fallback
      return safeName.charAt(0).toUpperCase() || fallback.charAt(0)
    },
    activeBoard() {
      if (!this.activeBoardId) return null
      return (
        this.boards.find(
          (board) => Number(board.id) === Number(this.activeBoardId)
        ) || null
      )
    },
    activeVisibility() {
      return this.activeBoard?.visibility || 'PRIVATE'
    }
  },

  mounted() {
    this.fetchUserName()
    this.fetchBoards()
  },

  methods: {
    toggleSidebar() {
      this.$emit('toggle')
    },
    getBoardDisplayName(board) {
      const name = (board?.name || '').trim()

      // board compartilhado: "Nome · compartilhado por Fulano"
      if (this.isShared(board)) {
        const owner = (board?.ownerName || this.$t('common.someone')).trim()
        return `${name} · ${this.$t('kanban.sidebar.sharedBy')} ${owner}`
      }

      // board próprio: só o nome
      return name
    },
    selectBoard(boardId) {
      this.$emit('select-board', Number(boardId))
    },

    isOwner(board) {
      return (
        this.loggedUserId &&
        Number(board.ownerUserId) === Number(this.loggedUserId)
      )
    },

    isShared(board) {
      return (
        this.loggedUserId &&
        Number(board.ownerUserId) !== Number(this.loggedUserId)
      )
    },

    logout() {
      const toast = useToast()
      authLogout()
      toast.success(this.$t('auth.logoutSuccess'))
      setTimeout(() => this.$router.push('/login'), 1500)
    },

    async fetchBoards() {
      try {
        const boards = await fetchBoardsService()
        this.boards = this.sortBoardsByOwnerFirst(boards)
      } catch (error) {
        console.error('Erro ao carregar boards:', error)
        this.boards = []
      }
    },

    fetchUserName() {
      const storedUser = localStorage.getItem('loggedUser')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          this.userName = userData.name || this.$t('common.userFallback')
          this.loggedUserId = userData.id || userData.user_id || null
        } catch (error) {
          console.error('Erro ao recuperar o nome do usuário:', error)
          this.userName = this.$t('common.userFallback')
          this.loggedUserId = null
        }
      } else {
        this.userName = this.$t('common.userFallback')
        this.loggedUserId = null
      }
    },
    sortBoardsByOwnerFirst(boards) {
      if (!Array.isArray(boards) || !boards.length) return []
      if (!this.loggedUserId) return boards

      return [...boards].sort((firstBoard, secondBoard) => {
        const firstIsOwner =
          Number(firstBoard.ownerUserId) === Number(this.loggedUserId)
        const secondIsOwner =
          Number(secondBoard.ownerUserId) === Number(this.loggedUserId)

        if (firstIsOwner === secondIsOwner) return 0
        return firstIsOwner ? -1 : 1
      })
    },

    openCreateBoard() {
      this.boardModalMode = 'create'
      this.boardToRename = null
      this.boardNameInput = ''
      this.boardModalError = ''
      this.showBoardModal = true
    },

    openRenameBoard(board) {
      this.boardModalMode = 'rename'
      this.boardToRename = board
      this.boardNameInput = board?.name || ''
      this.boardModalError = ''
      this.showBoardModal = true
    },

    closeBoardModal() {
      this.showBoardModal = false
      this.boardModalError = ''
      this.boardNameInput = ''
      this.boardToRename = null
      this.isSavingBoard = false
    },

    async submitBoardModal() {
      const toast = useToast()
      const name = (this.boardNameInput || '').trim()

      if (!name) {
        this.boardModalError = this.$t('kanban.sidebar.errors.emptyName')
        return
      }

      this.boardModalError = ''
      this.isSavingBoard = true

      try {
        if (this.boardModalMode === 'create') {
          const created = await createBoard(name)
          await this.fetchBoards()

          if (created?.id) {
            this.selectBoard(created.id)
          }

          toast.success(this.$t('kanban.sidebar.created'))
          this.closeBoardModal()
          return
        }

        const boardId = this.boardToRename?.id
        if (!boardId) {
          this.boardModalError = this.$t('kanban.sidebar.errors.invalidBoard')
          return
        }

        const updated = await renameBoard(boardId, name)
        await this.fetchBoards()

        if (updated?.id) {
          this.selectBoard(updated.id)
        }

        toast.success(this.$t('kanban.sidebar.renamed'))
        this.closeBoardModal()
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          this.$t('kanban.sidebar.errors.saveBoard')
        this.boardModalError = msg
      } finally {
        this.isSavingBoard = false
      }
    },

    // =========================
    // ✅ DELETE BOARD (NOVO)
    // =========================
    openDeleteBoard(board) {
      this.boardToDelete = board
      this.deleteBoardError = ''
      this.isDeletingBoard = false
      this.showDeleteBoardModal = true
    },

    closeDeleteBoardModal() {
      this.showDeleteBoardModal = false
      this.boardToDelete = null
      this.deleteBoardError = ''
      this.isDeletingBoard = false
    },

    async confirmDeleteBoard() {
      const toast = useToast()

      const boardId = this.boardToDelete?.id
      if (!boardId) return

      this.isDeletingBoard = true
      this.deleteBoardError = ''

      try {
        await deleteBoard(boardId)
        await this.fetchBoards()

        // se deletou o board ativo, troca pro 1º da lista
        if (Number(this.activeBoardId) === Number(boardId)) {
          const nextId = this.boards?.[0]?.id
          if (nextId) this.selectBoard(nextId)
        }

        toast.success(this.$t('kanban.sidebar.deleted'))
        this.closeDeleteBoardModal()
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          this.$t('kanban.sidebar.errors.deleteBoard')
        this.deleteBoardError = msg
      } finally {
        this.isDeletingBoard = false
      }
    },

    async setBoardVisibility(nextVisibility) {
      if (!this.activeBoard?.id || !this.isOwner(this.activeBoard)) return
      if (this.activeVisibility === nextVisibility) return

      const toast = useToast()
      this.isUpdatingVisibility = true

      try {
        await updateBoardVisibility(this.activeBoard.id, nextVisibility)

        this.boards = this.boards.map((board) =>
          Number(board.id) === Number(this.activeBoard.id)
            ? { ...board, visibility: nextVisibility }
            : board
        )

        toast.success(this.$t('kanban.sidebar.visibility.updated'))
        this.$emit('refresh-board', this.activeBoard.id)
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          this.$t('kanban.sidebar.visibility.error')
        toast.error(msg)
      } finally {
        this.isUpdatingVisibility = false
      }
    }
  }
}
</script>

<style scoped>
/* =========================
   ✅ Seu CSS base (mantive)
   ========================= */
.sidebar {
  background: rgba(27, 30, 48, 0.93);
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
    width 0.3s,
    transform 0.3s ease;

  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-expanded, 274px);
  z-index: 40;

  backdrop-filter: blur(16px);

  min-width: 64px;
  max-width: 100vw;
}

.sidebar.expanded {
  width: var(--sidebar-expanded, 274px);
}

.sidebar:not(.expanded) {
  width: var(--sidebar-collapsed, 64px);
  min-width: var(--sidebar-collapsed, 64px);
  max-width: var(--sidebar-collapsed, 64px);
}

.sidebar-content {
  padding: 26px 18px 14px 18px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
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

/* ✅ header da lista */
.boards-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.new-board-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(186, 225, 252, 0.14);

  background: rgba(35, 41, 77, 0.45);
  color: #bae1fc;

  font-weight: 900;
  cursor: pointer;

  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.12s ease;
}

.new-board-btn:hover {
  background: rgba(35, 41, 77, 0.65);
  border-color: rgba(186, 225, 252, 0.22);
  transform: translateY(-1px);
}

/* =========================
   ✅ Board list
   ========================= */
.board-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 224, 138, 0.5) rgba(35, 40, 77, 0.35);
}

/* Scrollbar personalizada - Webkit (Chrome, Safari, Edge) */
.board-list::-webkit-scrollbar {
  width: 8px;
}

.board-list::-webkit-scrollbar-track {
  background: rgba(35, 40, 77, 0.35);
  border-radius: 10px;
  margin: 4px 0;
}

.board-list::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(255, 224, 138, 0.55) 0%,
    rgba(255, 203, 103, 0.45) 100%
  );
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: background 0.3s ease;
}

.board-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(255, 224, 138, 0.75) 0%,
    rgba(255, 203, 103, 0.65) 100%
  );
  background-clip: padding-box;
}

.visibility-card {
  background: rgba(25, 29, 47, 0.92);
  border: 1.6px solid rgba(186, 225, 252, 0.16);
  border-radius: 16px;
  padding: 14px 14px 12px 14px;
  margin: 12px 0 16px 0;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.visibility-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.visibility-title {
  font-weight: 800;
  color: #ffe08a;
  letter-spacing: 0.01em;
}

.visibility-badge {
  font-size: 0.78rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
}

.visibility-badge.private {
  color: #ffe08a;
  background: rgba(255, 224, 138, 0.14);
  border-color: rgba(255, 224, 138, 0.45);
}

.visibility-badge.shared {
  color: #b8ffd8;
  background: rgba(33, 206, 124, 0.16);
  border-color: rgba(33, 206, 124, 0.4);
}

.visibility-actions {
  display: flex;
  gap: 10px;
}

.visibility-btn {
  flex: 1;
  border-radius: 10px;
  padding: 8px 10px;
  font-weight: 800;
  font-size: 0.85rem;
  background: rgba(35, 40, 73, 0.9);
  color: #e5ecfa;
  border: 1px solid rgba(186, 225, 252, 0.16);
  transition:
    transform 0.12s ease,
    box-shadow 0.16s ease,
    background 0.16s ease;
}

.visibility-btn.active {
  background: linear-gradient(87deg, #ffe08a 60%, #ffcb67 100%);
  color: #191c2a;
  box-shadow: 0 8px 16px rgba(255, 224, 138, 0.2);
  border-color: transparent;
}

.visibility-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.visibility-hint {
  margin: 10px 0 0 0;
  font-size: 0.82rem;
  color: rgba(229, 236, 250, 0.72);
  line-height: 1.3;
}

.board-item {
  width: 100%;
  text-align: left;

  display: flex;
  align-items: flex-start; /* pra não “apertar” em cima */
  justify-content: space-between;
  gap: 10px;

  padding: 12px 12px;
  margin-bottom: 10px;

  border-radius: 12px;
  border: 1px solid rgba(186, 225, 252, 0.12);

  background: rgba(35, 41, 77, 0.55);
  color: #e5ecfa;

  font-weight: 800;
  font-size: 1rem;

  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);

  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.12s ease,
    box-shadow 0.18s ease;

  cursor: pointer;
  position: relative; /* ✅ pra barra funcionar */
}

.board-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 6px;
  border-radius: 999px;
  background: linear-gradient(180deg, #ffe08a, #bae1fc);
  box-shadow: 0 0 16px rgba(255, 224, 138, 0.45);
}
.board-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px; /* aumenta o espaço entre título e badge */
}

.board-item:hover {
  background: rgba(35, 41, 77, 0.7);
  border-color: rgba(186, 225, 252, 0.22);
  /* ✅ remove o "pulo" */
  transform: none;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
}
.board-item:active {
  transform: translateY(0);
}

.board-item.active {
  background: linear-gradient(
    135deg,
    rgba(255, 224, 138, 0.18),
    rgba(186, 225, 252, 0.1)
  );
  border-color: rgba(255, 224, 138, 0.95);
  box-shadow:
    0 0 0 1px rgba(255, 224, 138, 0.35),
    0 14px 30px rgba(0, 0, 0, 0.25),
    0 0 22px rgba(255, 224, 138, 0.18);
  animation: boardActivePulse 320ms ease-out;
}

@keyframes boardActivePulse {
  0% {
    transform: scale(0.985);
  }
  60% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}
.board-item.active .board-title {
  color: #fff3c0;
  text-shadow: 0 0 10px rgba(255, 224, 138, 0.22);
}
.board-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.board-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.board-name {
  font-weight: 900;
  color: #e5ecfa;
  line-height: 1.15;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-shared-by {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(229, 236, 250, 0.78);

  padding: 2px 0; /* sem pílula grande */
  background: transparent;
  border: none;

  line-height: 1.2;
}

.board-shared-by b {
  color: #bae1fc; /* destaque no nome do owner */
  font-weight: 900;
}
.board-tag {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(186, 225, 252, 0.12);
  border: 1px solid rgba(186, 225, 252, 0.18);
  color: #bae1fc;
  align-self: flex-start; /* ✅ não estica */
  width: fit-content; /* ✅ fica do tamanho do texto */
}

.board-item.shared .board-tag {
  background: rgba(255, 224, 138, 0.12);
  border-color: rgba(255, 224, 138, 0.18);
  color: #ffe08a;
}

.icon-btn {
  border: none;
  background: transparent;
  color: rgba(229, 236, 250, 0.75);
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition:
    background 0.16s ease,
    color 0.16s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e5ecfa;
}

/* =========================
   ✅ Logout
   ========================= */
.logout-button {
  background: linear-gradient(90deg, #ffe08a 60%, #ffcb67 100%);
  border: none;

  padding: 13px 0;
  width: 100%;

  color: #232849;
  font-size: 1.01rem;
  font-weight: bold;

  cursor: pointer;
  border-radius: 8px;

  box-shadow: 0 2px 18px #ffe08a22;

  transition:
    background 0.18s,
    color 0.18s,
    transform 0.13s,
    box-shadow 0.16s;
}

.logout-button:hover {
  background: linear-gradient(90deg, #bae1fc 40%, #ffe08a 100%);
  color: #191d31;
  transform: translateY(-1px);
  box-shadow: 0 4px 24px #ffe08a44;
}

/* =========================
   ✅ Modal
   ========================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 22, 0.7);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 420px;
  border-radius: 14px;
  border: 1px solid rgba(186, 225, 252, 0.14);
  background: linear-gradient(120deg, #202336 75%, #252a43 100%);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  border-bottom: 1px solid rgba(186, 225, 252, 0.08);
}

.modal-title {
  margin: 0;
  color: #ffe08a;
  font-weight: 900;
  font-size: 1.05rem;
}

.close-x {
  border: none;
  background: transparent;
  color: rgba(229, 236, 250, 0.7);
  font-size: 1.4rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 8px;
}

.close-x:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e5ecfa;
}

.modal-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-label {
  font-size: 0.9rem;
  color: rgba(186, 225, 252, 0.9);
  font-weight: 700;
}

.modal-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 12px;
  border-radius: 10px;
  border: 1px solid rgba(186, 225, 252, 0.14);
  background: rgba(35, 41, 77, 0.55);
  color: #e5ecfa;
  outline: none;
}

.modal-input:focus {
  border-color: rgba(255, 224, 138, 0.55);
  box-shadow: 0 0 0 3px rgba(255, 224, 138, 0.08);
}

.modal-error {
  margin: 0;
  color: #ffb8b8;
  font-weight: 700;
  font-size: 0.88rem;
}

.modal-footer {
  padding: 14px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  border-top: 1px solid rgba(186, 225, 252, 0.08);
}

.modal-cancel {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(186, 225, 252, 0.18);
  background: transparent;
  color: #bae1fc;
  font-weight: 900;
  cursor: pointer;
}

.modal-cancel:hover {
  background: rgba(255, 255, 255, 0.06);
}

.modal-confirm {
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(90deg, #ffe08a 60%, #ffcb67 100%);
  color: #232849;
  font-weight: 900;
  cursor: pointer;
}

.modal-confirm:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* =========================
   ✅ Mobile
   ========================= */
.sidebar.mobile {
  transform: translateX(-105%);
  box-shadow: 0 0 0 transparent;
}

.sidebar.mobile.open {
  transform: translateX(0);
  box-shadow: 0 12px 32px #0b0b19aa;
}

@media (max-width: 900px) {
  .sidebar {
    width: 66vw;
    min-width: 56px;
    max-width: 340px;
    z-index: 100;
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
</style>
