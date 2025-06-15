import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import 'animate.css'

// Popular localStorage com tarefas se ainda não existir
if (!localStorage.getItem('kanbanTasks')) {
  const predefinedTasks = [
    {
      id: 1001,
      title: 'Criar estrutura do projeto',
      type: 'historia',
      description: 'Inicializar repositório e configurar pastas base.',
      dueDate: '2025-04-22',
      assignedUser: '1',
      columnId: '3',
      duration: '',
      checklist: [
        { text: 'Criar repositório Git', completed: true },
        { text: 'Criar estrutura de pastas', completed: true }
      ]
    },
    {
      id: 1002,
      title: 'Configurar ambiente de desenvolvimento',
      type: 'historia',
      description:
        'Instalar dependências e definir padrões de lint e prettier.',
      dueDate: '2025-04-24',
      assignedUser: '2',
      columnId: '3',
      duration: '',
      checklist: [
        { text: 'Instalar eslint', completed: true },
        { text: 'Configurar prettier', completed: true }
      ]
    },
    {
      id: 1003,
      title: 'Criar componente Header',
      type: 'tarefa',
      description: 'Componente de topo com logo e navegação.',
      dueDate: '2025-04-25',
      assignedUser: '3',
      columnId: '3',
      duration: '',
      checklist: [
        { text: 'Logo', completed: false },
        { text: 'Menu de navegação', completed: false }
      ]
    },
    {
      id: 1004,
      title: 'Criar autenticação com JWT',
      type: 'tarefa',
      description: 'Login, cadastro e persistência de sessão.',
      dueDate: '2025-04-26',
      assignedUser: '4',
      columnId: '1',
      duration: '',
      checklist: [
        { text: 'Tela de login', completed: true },
        { text: 'Integração com backend', completed: true }
      ]
    },
    {
      id: 1005,
      title: 'Conectar com banco de dados',
      type: 'tarefa',
      description: 'Criar models no backend usando ORM.',
      dueDate: '2025-04-27',
      assignedUser: '5',
      columnId: '1',
      duration: '',
      checklist: [
        { text: 'Model de usuário', completed: true },
        { text: 'Model de tarefa', completed: false }
      ]
    },
    {
      id: 1006,
      title: 'Estilizar dashboard principal',
      type: 'tarefa',
      description: 'Layout e responsividade das seções principais.',
      dueDate: '2025-04-28',
      assignedUser: '6',
      columnId: '1',
      duration: '',
      checklist: [
        { text: 'Grid layout', completed: false },
        { text: 'Responsivo mobile', completed: false }
      ]
    },
    {
      id: 1007,
      title: 'Realizar testes E2E com Cypress',
      type: 'bug',
      description: 'Cobertura dos fluxos principais.',
      dueDate: '2025-04-29',
      assignedUser: '7',
      columnId: '1',
      duration: '',
      checklist: [
        { text: 'Login e logout', completed: true },
        { text: 'Criar tarefa', completed: true }
      ]
    },
    {
      id: 1008,
      title: 'Publicar versão MVP',
      type: 'tarefa',
      description: 'Primeiro deploy funcional do projeto.',
      dueDate: '2025-04-20',
      assignedUser: '8',
      columnId: '2',
      duration: '',
      checklist: [
        { text: 'Rodar build', completed: true },
        { text: 'Publicar em produção', completed: true }
      ]
    },
    {
      id: 1009,
      title: 'Refatorar código do modal',
      type: 'bug',
      description: 'Simplificar lógica do componente de tarefas.',
      dueDate: '2025-04-26',
      assignedUser: '9',
      columnId: '2',
      duration: '',
      checklist: [
        { text: 'Remover lógica duplicada', completed: true },
        { text: 'Isolar em funções reutilizáveis', completed: true }
      ]
    },
    {
      id: 1010,
      title: 'Criar documentação do projeto',
      type: 'tarefa',
      description: 'Guia de setup e contribuição para novos devs.',
      dueDate: '2025-04-30',
      assignedUser: '10',
      columnId: '2',
      duration: '',
      checklist: [
        { text: 'README.md', completed: false },
        { text: 'Guia de contribuição', completed: false }
      ]
    },
    {
      id: 1011,
      title: 'Adicionar dark mode',
      type: 'tarefa',
      description: 'Permitir alternância entre claro e escuro.',
      dueDate: '2025-04-29',
      assignedUser: '6',
      columnId: '2',
      duration: '',
      checklist: [
        { text: 'Detectar preferência do SO', completed: true },
        { text: 'Botão de alternar tema', completed: false }
      ]
    },
    {
      id: 1012,
      title: 'Corrigir bug ao deletar tarefa',
      type: 'bug',
      description: 'Botão de deletar não responde em algumas situações.',
      dueDate: '2025-04-21',
      assignedUser: '3',
      columnId: '1',
      duration: '',
      checklist: [
        { text: 'Reproduzir erro', completed: true },
        { text: 'Corrigir handler', completed: false }
      ]
    }
  ]
  localStorage.setItem('kanbanTasks', JSON.stringify(predefinedTasks))
}

const app = createApp(App)

app.use(router)
app.mount('#app')
app.use(Toast)

// Solicitar permissão de notificações
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    alert('Seu navegador não suporta notificações.')
    return
  }

  const permission = await Notification.requestPermission()
}

// Chamar a função assim que o app carregar
requestNotificationPermission()
