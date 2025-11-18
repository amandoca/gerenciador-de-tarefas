// src/controllers/kanban.controller.js
const { executeDatabaseQuery } = require("../config/database_connection");

// GET /api/kanban/columns
async function getKanbanColumns(request, response) {
  try {
    const columns = await executeDatabaseQuery(
      `
      SELECT
        ID AS id,
        NAME AS name,
        ORDER_INDEX AS order_index
      FROM KANBAN_COLUMNS
      ORDER BY ORDER_INDEX ASC;
      `
    );
    return response.json(columns);
  } catch (error) {
    console.error("Error fetching kanban columns:", error);
    return response.status(500).json({
      message: "Failed to fetch kanban columns.",
    });
  }
}

// GET /api/kanban/users
async function getKanbanUsers(request, response) {
  try {
    const users = await executeDatabaseQuery(
      `
      SELECT
        ID AS id,
        NAME AS name,
        EMAIL AS email
      FROM USERS
      ORDER BY NAME ASC;
      `
    );
    return response.json(users);
  } catch (error) {
    console.error("Error fetching kanban users:", error);
    return response.status(500).json({
      message: "Failed to fetch users for kanban.",
    });
  }
}

// GET /api/kanban/tasks
async function getKanbanTasks(request, response) {
  try {
    // vem do token (auth_middleware)
    const userId = request.user.user_id;
    const tasksRows = await executeDatabaseQuery(
      `
      SELECT
        T.ID AS id,
        T.USER_ID AS userId,
        T.TITLE AS title,
        T.DESCRIPTION AS description,
        T.DUE_DATE AS dueDate,
        T.COLUMN_ID AS columnId,
        T.ASSIGNED_USER_ID AS assignedUser,
        T.TYPE AS type
      FROM KANBAN_TASKS T
      WHERE T.USER_ID = ?
      ORDER BY T.ID DESC;
      `,
      [userId]
    );
    const checklistRows = await executeDatabaseQuery(
      `
      SELECT
        ID AS id,
        TASK_ID AS taskId,
        TEXT AS text,
        COMPLETED AS completed
      FROM KANBAN_TASK_CHECKLIST_ITEMS;
      `
    );
    const tasks = tasksRows.map((task) => ({
      ...task,
      checklist: checklistRows
        .filter((item) => item.taskId === task.id)
        .map((item) => ({
          id: item.id,
          text: item.text,
          completed: !!item.completed,
        })),
    }));
    return response.json(tasks);
  } catch (error) {
    console.error("Error fetching kanban tasks:", error);
    return response.status(500).json({
      message: "Failed to fetch kanban tasks.",
    });
  }
}

// POST /api/kanban/tasks
async function createKanbanTask(request, response) {
  try {
    const {
      title,
      description,
      dueDate,
      columnId,
      assignedUser,
      checklist,
      type,
    } = request.body;
    if (!title) {
      return response.status(400).json({ message: "Title is required." });
    }
    const userIdFromToken = request.user.user_id;
    const newColumnId = columnId ? Number(columnId) : 1;
    const newAssignedUser =
      assignedUser !== undefined && assignedUser !== null
        ? Number(assignedUser)
        : null;
    const newType = type || "tarefa";

    const insertResult = await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_TASKS (USER_ID, TITLE, DESCRIPTION, DUE_DATE, COLUMN_ID, ASSIGNED_USER_ID, TYPE)
      VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [
        userIdFromToken,
        title,
        description || "",
        dueDate || null,
        newColumnId,
        newAssignedUser,
        newType,
      ]
    );

    const newTaskId = insertResult.insertId;

    if (Array.isArray(checklist) && checklist.length > 0) {
      for (const item of checklist) {
        await executeDatabaseQuery(
          `
          INSERT INTO KANBAN_TASK_CHECKLIST_ITEMS (TASK_ID, TEXT, COMPLETED)
          VALUES (?, ?, ?);
          `,
          [newTaskId, item.text || "", item.completed ? 1 : 0]
        );
      }
    }

    const [createdTaskRow] = await executeDatabaseQuery(
      `
      SELECT
        T.ID AS id,
        T.USER_ID AS userId,
        T.TITLE AS title,
        T.DESCRIPTION AS description,
        T.DUE_DATE AS dueDate,
        T.COLUMN_ID AS columnId,
        T.ASSIGNED_USER_ID AS assignedUser,
        T.TYPE AS type
      FROM KANBAN_TASKS T
      WHERE T.ID = ?;
      `,
      [newTaskId]
    );

    const checklistRows = await executeDatabaseQuery(
      `
      SELECT
        ID AS id,
        TASK_ID AS taskId,
        TEXT AS text,
        COMPLETED AS completed
      FROM KANBAN_TASK_CHECKLIST_ITEMS
      WHERE TASK_ID = ?;
      `,
      [newTaskId]
    );

    const newTask = {
      ...createdTaskRow,
      checklist: checklistRows.map((item) => ({
        id: item.id,
        text: item.text,
        completed: !!item.completed,
      })),
    };

    return response.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating kanban task:", error);
    return response.status(500).json({
      message: "Failed to create kanban task.",
    });
  }
}

// PUT /api/kanban/tasks/:id/move
async function moveKanbanTask(request, response) {
  try {
    const taskId = Number(request.params.id);
    const { columnId } = request.body;

    if (!columnId) {
      return response.status(400).json({ message: "columnId is required." });
    }

    const newColumnId = Number(columnId);

    // Atualiza apenas a coluna
    const updateResult = await executeDatabaseQuery(
      `
      UPDATE KANBAN_TASKS
      SET COLUMN_ID = ?
      WHERE ID = ?;
      `,
      [newColumnId, taskId]
    );

    if (updateResult.affectedRows === 0) {
      return response.status(404).json({ message: "Task not found." });
    }

    // Busca a tarefa atualizada
    const [taskRow] = await executeDatabaseQuery(
      `
      SELECT
        T.ID AS id,
        T.USER_ID AS userId,
        T.TITLE AS title,
        T.DESCRIPTION AS description,
        T.DUE_DATE AS dueDate,
        T.COLUMN_ID AS columnId,
        T.ASSIGNED_USER_ID AS assignedUser,
        T.TYPE AS type
      FROM KANBAN_TASKS T
      WHERE T.ID = ?;
      `,
      [taskId]
    );

    // Busca checklist da tarefa (se existir)
    const checklistRows = await executeDatabaseQuery(
      `
      SELECT
        ID AS id,
        TASK_ID AS taskId,
        TEXT AS text,
        COMPLETED AS completed
      FROM KANBAN_TASK_CHECKLIST_ITEMS
      WHERE TASK_ID = ?;
      `,
      [taskId]
    );

    const task = {
      ...taskRow,
      checklist: checklistRows.map((item) => ({
        id: item.id,
        text: item.text,
        completed: !!item.completed,
      })),
    };

    return response.json(task);
  } catch (error) {
    console.error("Error moving kanban task:", error);
    return response.status(500).json({
      message: "Failed to move kanban task.",
    });
  }
}

// PUT /api/kanban/tasks/:id  (Atualizar tarefa completa)
async function updateKanbanTask(request, response) {
  try {
    const taskId = Number(request.params.id);
    const {
      title,
      description,
      dueDate,
      columnId,
      assignedUser,
      checklist,
      type,
    } = request.body;

    // Validação simples
    if (!title) {
      return response.status(400).json({ message: "Title is required." });
    }

    const newAssignedUser =
      assignedUser !== undefined && assignedUser !== null
        ? Number(assignedUser)
        : null;

    const newColumnId = columnId ? Number(columnId) : null;
    const newType = type || "tarefa";

    // Atualizar os campos principais
    const updateResult = await executeDatabaseQuery(
      `
        UPDATE KANBAN_TASKS
        SET TITLE = ?, DESCRIPTION = ?, DUE_DATE = ?, COLUMN_ID = ?, ASSIGNED_USER_ID = ?, TYPE = ?
        WHERE ID = ?;
      `,
      [
        title,
        description || "",
        dueDate || null,
        newColumnId,
        newAssignedUser,
        newType,
        taskId,
      ]
    );

    if (updateResult.affectedRows === 0) {
      return response.status(404).json({ message: "Task not found." });
    }

    // Checklist → apaga e recria
    await executeDatabaseQuery(
      `DELETE FROM KANBAN_TASK_CHECKLIST_ITEMS WHERE TASK_ID = ?;`,
      [taskId]
    );

    if (Array.isArray(checklist)) {
      for (const item of checklist) {
        await executeDatabaseQuery(
          `
            INSERT INTO KANBAN_TASK_CHECKLIST_ITEMS (TASK_ID, TEXT, COMPLETED)
            VALUES (?, ?, ?);
          `,
          [taskId, item.text || "", item.completed ? 1 : 0]
        );
      }
    }

    // Buscar tarefa atualizada
    const [updatedTask] = await executeDatabaseQuery(
      `
        SELECT
          T.ID AS id,
          T.USER_ID AS userId,
          T.TITLE AS title,
          T.DESCRIPTION AS description,
          T.DUE_DATE AS dueDate,
          T.COLUMN_ID AS columnId,
          T.ASSIGNED_USER_ID AS assignedUser,
          T.TYPE AS type
        FROM KANBAN_TASKS T
        WHERE T.ID = ?;
      `,
      [taskId]
    );

    const checklistRows = await executeDatabaseQuery(
      `
        SELECT
          ID AS id,
          TASK_ID AS taskId,
          TEXT AS text,
          COMPLETED AS completed
        FROM KANBAN_TASK_CHECKLIST_ITEMS
        WHERE TASK_ID = ?;
      `,
      [taskId]
    );

    updatedTask.checklist = checklistRows.map((item) => ({
      id: item.id,
      text: item.text,
      completed: !!item.completed,
    }));

    return response.json(updatedTask);
  } catch (error) {
    console.error("Error updating kanban task:", error);
    return response.status(500).json({
      message: "Failed to update kanban task.",
    });
  }
}

// DELETE /api/kanban/tasks/:id
async function deleteKanbanTask(request, response) {
  try {
    const taskId = Number(request.params.id);

    await executeDatabaseQuery(
      `DELETE FROM KANBAN_TASK_CHECKLIST_ITEMS WHERE TASK_ID = ?;`,
      [taskId]
    );

    const deleteResult = await executeDatabaseQuery(
      `DELETE FROM KANBAN_TASKS WHERE ID = ?;`,
      [taskId]
    );

    if (deleteResult.affectedRows === 0) {
      return response.status(404).json({
        message: "Task not found.",
      });
    }

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting kanban task:", error);
    return response.status(500).json({
      message: "Failed to delete kanban task.",
    });
  }
}

module.exports = {
  getKanbanColumns,
  getKanbanUsers,
  getKanbanTasks,
  createKanbanTask,
  updateKanbanTask,
  deleteKanbanTask,
  moveKanbanTask,
};
