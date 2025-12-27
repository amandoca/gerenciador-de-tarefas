#!/bin/bash

echo -e "\033[1;35m🔄 Reiniciando stack completa...\033[0m"

docker-compose down
docker-compose up -d --build

echo -e "\033[1;32m✔️ Stack reiniciada e containers rodando!\033[0m"
docker ps
