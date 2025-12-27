#!/bin/bash

echo -e "\033[1;31m🧹 Limpando containers, imagens e volumes não utilizados...\033[0m"

docker system prune -f
docker volume prune -f
docker image prune -f

echo -e "\033[1;32m✔️ Limpeza concluída!\033[0m"
