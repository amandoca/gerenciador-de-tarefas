FROM node:18

# Diretório dentro do container
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar todo o backend para dentro do container
COPY . .

# Expor porta da API
EXPOSE 4000

# Comando para iniciar o servidor em modo desenvolvedor
CMD ["npm", "run", "dev"]
