#!/bin/bash

echo -e "\033[1;34m⏹️ Parando containers...\033[0m"

docker-compose down

echo -e "\033[1;32m✔️ Todos containers foram encerrados.\033[0m"
