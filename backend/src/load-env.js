const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function loadEnv() {
  // raiz do backend (um nível acima da pasta src)
  const projectRoot = path.resolve(__dirname, "..");

  const dockerEnv = path.join(projectRoot, ".env.docker");
  const localEnv = path.join(projectRoot, ".env.local");
  const defaultEnv = path.join(projectRoot, ".env");

  if (fs.existsSync(dockerEnv)) {
    console.log("🔧 Carregando variáveis do .env.docker");
    dotenv.config({ path: dockerEnv });
  } else if (fs.existsSync(localEnv)) {
    console.log("🔧 Carregando variáveis do .env.local");
    dotenv.config({ path: localEnv });
  } else if (fs.existsSync(defaultEnv)) {
    console.log(
      "⚠️ Nenhum .env específico encontrado. Carregando .env padrão."
    );
    dotenv.config({ path: defaultEnv });
  } else {
    console.log(
      "⚠️ Nenhum arquivo .env encontrado. Usando variáveis do ambiente."
    );
  }
}

module.exports = loadEnv;
