const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth_middleware");

const {
  getKanbanColumns,
  getKanbanBoards,
  getKanbanUsers,
  getKanbanTasks,
  createKanbanTask,
  updateKanbanTask,
  deleteKanbanTask,
  moveKanbanTask,
  addBoardMember,
  getKanbanPreferences,
  updateKanbanPreferences,
  createKanbanBoard,
  deleteKanbanBoard,
  renameKanbanBoard,
  updateKanbanBoardVisibility,
} = require("../controllers/kanban.controller");

router.use(authenticateToken);

router.get("/columns", getKanbanColumns);
router.get("/boards", getKanbanBoards);
router.get("/preferences", getKanbanPreferences);
router.put("/preferences", updateKanbanPreferences);
router.get("/users", getKanbanUsers);
router.get("/tasks", getKanbanTasks);

router.post("/tasks", createKanbanTask);
router.post("/members", addBoardMember);
router.put("/tasks/:id", updateKanbanTask);
router.put("/tasks/:id/move", moveKanbanTask);
router.delete("/tasks/:id", deleteKanbanTask);

router.post("/boards", createKanbanBoard);
router.put("/boards/:id", renameKanbanBoard);
router.put("/boards/:id/visibility", updateKanbanBoardVisibility);
router.delete("/boards/:id", deleteKanbanBoard);

module.exports = router;
