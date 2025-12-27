#!/bin/bash

echo -e "\033[1;36m📜 Exibindo logs (API + Frontend)...\033[0m"
echo -e "\033[1;33mUse CTRL+C para sair.\033[0m"

docker-compose logs -f api frontend
