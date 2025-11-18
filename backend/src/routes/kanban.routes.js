const express = require("express");
const router = express.Router();

const {
  getKanbanColumns,
  getKanbanUsers,
  getKanbanTasks,
  createKanbanTask,
  updateKanbanTask,
  deleteKanbanTask,
  moveKanbanTask,
} = require("../controllers/kanban.controller");

router.get("/columns", getKanbanColumns);
router.get("/users", getKanbanUsers);
router.get("/tasks", getKanbanTasks);

router.post("/tasks", createKanbanTask);
router.put("/tasks/:id", updateKanbanTask); // atualização completa
router.put("/tasks/:id/move", moveKanbanTask); // mover coluna
router.delete("/tasks/:id", deleteKanbanTask);

module.exports = router;
