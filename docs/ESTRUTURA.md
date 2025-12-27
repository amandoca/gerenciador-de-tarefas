# Estrutura do projeto

```text
backend/             API Node.js e Express
  database/          Scripts SQL e consultas úteis
  src/               Código-fonte da API
  tests/             Testes do backend

frontend/            Aplicação Vue.js
  cypress/           Testes E2E
  locales/           Arquivos de tradução
  public/            Arquivos públicos
  src/               Código-fonte do frontend

docs/                Documentação do projeto
.github/workflows/   Pipeline de CI
```

## Observação

Arquivos `.env` reais não devem ser versionados. Use os arquivos `.env.example` como base para configuração local.
