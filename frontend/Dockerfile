FROM node:18

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código do frontend
COPY . .

# Expõe a porta padrão do Vue CLI (npm run serve)
EXPOSE 8080

# Comando para rodar o servidor de desenvolvimento acessível externamente
CMD ["npm", "run", "serve", "--", "--host", "0.0.0.0"]
