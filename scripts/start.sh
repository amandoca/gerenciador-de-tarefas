#!/bin/bash

echo "🚀 Iniciando Kanban Tarefando via Docker..."

# Passo 1: reconstruir imagens e subir tudo
echo "📦 Construindo containers e iniciando serviços..."
docker-compose up -d --build

# Passo 2: mostrar status
echo "📊 Containers ativos:"
docker ps

# Passo 3: testar API automaticamente
echo "🔍 Testando API (health check)..."
sleep 3
curl http://localhost:4000/health

echo ""
echo "💚 Tudo pronto!"
echo "🌎 Front-end: http://localhost:8080"
echo "🛠 API: http://localhost:4000"
