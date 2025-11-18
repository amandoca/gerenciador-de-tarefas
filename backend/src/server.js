// src/server.js

// Load environment variables
require("./load-env")();

// Express framework
const express = require("express");

const kanbanRoutes = require("./routes/kanban.routes");

const authenticateUser = require("./middlewares/auth_middleware");

// Middleware to allow Cross-Origin requests (frontend → backend)
const cors = require("cors");

// Database helper function
const { executeDatabaseQuery } = require("./config/database_connection");

// Authentication routes (register and login)
const authenticationRouter = require("./routes/auth_routes");

// Create the main Express application server
const applicationServer = express();

// Define the API port (default: 4000)
const apiPort = Number(process.env.API_PORT) || 4000;

// -----------------------
// Global Middlewares
// -----------------------

// Allows requests from other origins (useful for when your frontend calls this API)
applicationServer.use(cors());

// Allows API to receive JSON body in POST/PUT requests
applicationServer.use(express.json());

// -----------------------
// Health Check Route
// -----------------------

/**
 * Route: GET /health
 *
 * Purpose:
 * A quick check to confirm that:
 * - the API is running
 * - the database connection is working
 *
 * This is a diagnostic route used by developers.
 */
applicationServer.get("/health", async (request, response) => {
  try {
    const healthCheckResult = await executeDatabaseQuery(
      "SELECT 1 AS health_check_value;"
    );

    return response.json({
      status: "ok",
      message: "Tarefando API is running and the database is reachable.",
      database_result: healthCheckResult,
    });
  } catch (databaseError) {
    console.error("Database connection test failed:", databaseError);

    return response.status(500).json({
      status: "error",
      message: "API is running, but the database connection failed.",
    });
  }
});

// -----------------------
// Authentication Module
// -----------------------

// Routes:
// POST /api/auth/register
// POST /api/auth/login
applicationServer.use("/api/auth", authenticationRouter);

// -----------------------
// Start API Server
// -----------------------

applicationServer.use("/api/kanban", authenticateUser, kanbanRoutes);

applicationServer.listen(apiPort, () => {
  console.log(`Tarefando API is running on http://localhost:${apiPort}`);
});
