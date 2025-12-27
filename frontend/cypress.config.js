const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    env: {
      apiUrl: 'http://localhost:4000/api'
    },
    supportFile: 'cypress/support/e2e.js',
    video: false,
    viewportWidth: 1366,
    viewportHeight: 768
  }
})
