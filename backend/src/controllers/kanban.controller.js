// backend/src/controllers/kanban.controller.js
const { executeDatabaseQuery } = require("../config/database_connection");

/**
 * ✅ Helpers
 */
async function getUserBoardIdOr404(request, response) {
  const userId = request.user.user_id;

  const [board] = await executeDatabaseQuery(
    `
    SELECT B.ID
    FROM KANBAN_BOARDS B
    LEFT JOIN KANBAN_BOARD_MEMBERS BM
      ON BM.BOARD_ID = B.ID AND BM.USER_ID = ?
    WHERE B.OWNER_USER_ID = ? OR BM.USER_ID IS NOT NULL
    ORDER BY (B.OWNER_USER_ID = ?) DESC, B.ID ASC
    LIMIT 1;
    `,
    [userId, userId, userId],
  );

  if (!board) {
    response.status(404).json({ message: "Board not found." });
    return null;
  }

  return board.ID;
}

async function getBoardIdFromRequestOr404(request, response) {
  const userId = request.user.user_id;

  const boardIdRaw = request.query.boardId || request.body.boardId;
  const boardId = boardIdRaw ? Number(boardIdRaw) : null;

  let resolvedBoardId = boardId;

  if (!resolvedBoardId) {
    resolvedBoardId = await getUserBoardIdOr404(request, response);
    if (!resolvedBoardId) return null;
  }

  const [hasAccess] = await executeDatabaseQuery(
    `
    SELECT B.ID
    FROM KANBAN_BOARDS B
    LEFT JOIN KANBAN_BOARD_MEMBERS BM
      ON BM.BOARD_ID = B.ID AND BM.USER_ID = ?
    WHERE B.ID = ?
      AND (B.OWNER_USER_ID = ? OR BM.USER_ID IS NOT NULL)
    LIMIT 1;
    `,
    [userId, resolvedBoardId, userId],
  );

  if (!hasAccess) {
    response.status(403).json({
      message: "You do not have access to this board.",
    });
    return null;
  }

  return resolvedBoardId;
}

async function assertTaskAccessOr403(taskId, userId, response) {
  const [row] = await executeDatabaseQuery(
    `
    SELECT
      T.ID AS taskId,
      T.BOARD_ID AS boardId,
      T.USER_ID AS taskCreatorId,
      B.OWNER_USER_ID AS boardOwnerId,
      B.VISIBILITY AS boardVisibility
    FROM KANBAN_TASKS T
    JOIN KANBAN_BOARDS B ON B.ID = T.BOARD_ID
    LEFT JOIN KANBAN_BOARD_MEMBERS BM
      ON BM.BOARD_ID = T.BOARD_ID AND BM.USER_ID = ?
    WHERE T.ID = ?
      AND (B.OWNER_USER_ID = ? OR BM.USER_ID IS NOT NULL)
    LIMIT 1;
    `,
    [userId, taskId, userId],
  );

  if (!row) {
    response.status(403).json({
      message: "You do not have access to this task.",
    });
    return null;
  }

  return row; // { taskId, boardId, taskCreatorId, boardOwnerId, boardVisibility }
}

/**
 * ✅ GET /api/kanban/columns
 */
async function getKanbanColumns(request, response) {
  try {
    const boardId = await getBoardIdFromRequestOr404(request, response);
    if (!boardId) return;

    const columns = await executeDatabaseQuery(
      `
      SELECT ID as id, NAME as name, ORDER_INDEX as order_index
      FROM KANBAN_COLUMNS
      WHERE BOARD_ID = ?
      ORDER BY ORDER_INDEX;
      `,
      [boardId],
    );

    return response.json(columns);
  } catch (error) {
    console.error("Error fetching kanban columns:", error);
    return response
      .status(500)
      .json({ message: "Failed to fetch kanban columns." });
  }
}

/**
 * ✅ GET /api/kanban/users (membros do board + sinalização de owner)
 */
async function getKanbanUsers(request, response) {
  try {
    const boardId = await getBoardIdFromRequestOr404(request, response);
    if (!boardId) return;

    const users = await executeDatabaseQuery(
      `
      SELECT
        U.ID AS id,
        U.NAME AS name,
        U.EMAIL AS email,
        CASE WHEN B.OWNER_USER_ID = U.ID THEN 1 ELSE 0 END AS isOwner
      FROM KANBAN_BOARDS B
      JOIN KANBAN_BOARD_MEMBERS BM ON BM.BOARD_ID = B.ID
      JOIN USERS U ON U.ID = BM.USER_ID
      WHERE B.ID = ?
      ORDER BY isOwner DESC, U.NAME ASC;
      `,
      [boardId],
    );

    return response.json(users.map((u) => ({ ...u, isOwner: !!u.isOwner })));
  } catch (error) {
    console.error("Error fetching kanban users:", error);
    return response
      .status(500)
      .json({ message: "Failed to fetch users for kanban." });
  }
}

/**
 * ✅ GET /api/kanban/tasks
 */
async function getKanbanTasks(request, response) {
  try {
    const boardId = await getBoardIdFromRequestOr404(request, response);
    if (!boardId) return;

    const userId = request.user.user_id;

    const tasksRows = await executeDatabaseQuery(
      `
  SELECT
    T.ID AS id,
    T.USER_ID AS userId,
    T.BOARD_ID AS boardId,
    T.TITLE AS title,
    T.DESCRIPTION AS description,
    T.DUE_DATE AS dueDate,
    T.DURATION AS duration,
    T.COLUMN_ID AS columnId,
    T.ASSIGNED_USER_ID AS assignedUser,
    T.TYPE AS type
  FROM KANBAN_TASKS T
  JOIN KANBAN_BOARDS B ON B.ID = T.BOARD_ID
  WHERE T.BOARD_ID = ?
    AND (
      B.OWNER_USER_ID = ?
      OR (B.VISIBILITY = 'SHARED')
      OR T.ASSIGNED_USER_ID = ?
      -- opcional: OR T.USER_ID = ?  (se quiser deixar ver as que ela criou)
    )
  ORDER BY T.ID DESC;
  `,
      [boardId, userId, userId],
    );

    const taskIds = tasksRows.map((task) => task.id);

    const checklistRows =
      taskIds.length > 0
        ? await executeDatabaseQuery(
            `
            SELECT
              ID AS id,
              TASK_ID AS taskId,
              TEXT AS text,
              COMPLETED AS completed
            FROM KANBAN_TASK_CHECKLIST_ITEMS
            WHERE TASK_ID IN (${taskIds.map(() => "?").join(",")});
            `,
            taskIds,
          )
        : [];

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
    return response
      .status(500)
      .json({ message: "Failed to fetch kanban tasks." });
  }
}

/**
 * ✅ POST /api/kanban/tasks
 */
async function createKanbanTask(request, response) {
  try {
    const {
      title,
      description,
      dueDate,
      duration,
      columnId,
      assignedUser,
      checklist,
      type,
    } = request.body;

    if (!title) {
      return response.status(400).json({ message: "Title is required." });
    }

    const userIdFromToken = request.user.user_id;
    const newColumnId = columnId ? Number(columnId) : null;

    const [creatorExists] = await executeDatabaseQuery(
      `SELECT ID FROM USERS WHERE ID = ? LIMIT 1;`,
      [userIdFromToken],
    );

    if (!creatorExists) {
      return response.status(401).json({
        message: "Usuário inválido. Faça login novamente.",
      });
    }

    if (!newColumnId) {
      return response.status(400).json({ message: "columnId is required." });
    }

    // Descobre o board da coluna e valida acesso (owner ou membro)
    const [colBoard] = await executeDatabaseQuery(
      `
      SELECT C.BOARD_ID AS boardId
      FROM KANBAN_COLUMNS C
      JOIN KANBAN_BOARDS B ON B.ID = C.BOARD_ID
      LEFT JOIN KANBAN_BOARD_MEMBERS BM
        ON BM.BOARD_ID = C.BOARD_ID AND BM.USER_ID = ?
      WHERE C.ID = ?
        AND (B.OWNER_USER_ID = ? OR BM.USER_ID IS NOT NULL)
      LIMIT 1;
      `,
      [userIdFromToken, newColumnId, userIdFromToken],
    );

    if (!colBoard) {
      return response
        .status(403)
        .json({ message: "You do not have access to this column/board." });
    }

    const boardId = colBoard.boardId;

    const hasAssignedUser =
      assignedUser !== undefined && assignedUser !== null && assignedUser !== "";
    const parsedAssignedUser = hasAssignedUser ? Number(assignedUser) : null;

    if (hasAssignedUser && Number.isNaN(parsedAssignedUser)) {
      return response.status(400).json({
        message: "assignedUser inválido.",
      });
    }

    // se veio vazio, atribui ao próprio criador (pra aparecer pra ele)
    const newAssignedUser = hasAssignedUser
      ? parsedAssignedUser
      : userIdFromToken;

    const newType = type || "tarefa";

    // Se atribuiu alguém, garante membership no board
    if (newAssignedUser) {
      const [userExists] = await executeDatabaseQuery(
        `SELECT ID FROM USERS WHERE ID = ? LIMIT 1;`,
        [newAssignedUser],
      );

      if (!userExists) {
        return response
          .status(400)
          .json({ message: "Assigned user does not exist." });
      }

      await executeDatabaseQuery(
        `
        INSERT IGNORE INTO KANBAN_BOARD_MEMBERS (BOARD_ID, USER_ID, ROLE)
        VALUES (?, ?, 'EDITOR');
        `,
        [boardId, newAssignedUser],
      );
    }

    const insertResult = await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_TASKS
        (BOARD_ID, USER_ID, TITLE, DESCRIPTION, DUE_DATE, DURATION, COLUMN_ID, ASSIGNED_USER_ID, TYPE)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        boardId,
        userIdFromToken,
        title,
        description || "",
        dueDate || null,
        duration || null,
        newColumnId,
        newAssignedUser,
        newType,
      ],
    );

    const newTaskId = insertResult.insertId;

    if (Array.isArray(checklist) && checklist.length > 0) {
      for (const item of checklist) {
        await executeDatabaseQuery(
          `
          INSERT INTO KANBAN_TASK_CHECKLIST_ITEMS (TASK_ID, TEXT, COMPLETED)
          VALUES (?, ?, ?);
          `,
          [newTaskId, item.text || "", item.completed ? 1 : 0],
        );
      }
    }

    const [createdTaskRow] = await executeDatabaseQuery(
      `
      SELECT
        T.ID AS id,
        T.USER_ID AS userId,
        T.BOARD_ID AS boardId,
        T.TITLE AS title,
        T.DESCRIPTION AS description,
        T.DUE_DATE AS dueDate,
        T.DURATION AS duration,
        T.COLUMN_ID AS columnId,
        T.ASSIGNED_USER_ID AS assignedUser,
        T.TYPE AS type
      FROM KANBAN_TASKS T
      WHERE T.ID = ?;
      `,
      [newTaskId],
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
      [newTaskId],
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

/**
 * ✅ PUT /api/kanban/tasks/:id/move
 * 🔒 Usa assertTaskAccessOr403
 */
async function moveKanbanTask(request, response) {
  try {
    const taskId = Number(request.params.id);
    const { columnId } = request.body;

    if (!columnId) {
      return response.status(400).json({ message: "columnId is required." });
    }

    const userId = request.user.user_id;

    const access = await assertTaskAccessOr403(taskId, userId, response);
    if (!access) return;

    const newColumnId = Number(columnId);

    // valida: coluna pertence ao mesmo board da task (e usuário tem acesso ao board)
    const [col] = await executeDatabaseQuery(
      `SELECT ID FROM KANBAN_COLUMNS WHERE ID = ? AND BOARD_ID = ? LIMIT 1;`,
      [newColumnId, access.boardId],
    );

    if (!col) {
      return response
        .status(400)
        .json({ message: "Invalid column for this board." });
    }

    const updateResult = await executeDatabaseQuery(
      `
      UPDATE KANBAN_TASKS
      SET COLUMN_ID = ?
      WHERE ID = ?;
      `,
      [newColumnId, taskId],
    );

    if (updateResult.affectedRows === 0) {
      return response.status(404).json({ message: "Task not found." });
    }

    const [taskRow] = await executeDatabaseQuery(
      `
      SELECT
        T.ID AS id,
        T.USER_ID AS userId,
        T.BOARD_ID AS boardId,
        T.TITLE AS title,
        T.DESCRIPTION AS description,
        T.DUE_DATE AS dueDate,
        T.DURATION AS duration,
        T.COLUMN_ID AS columnId,
        T.ASSIGNED_USER_ID AS assignedUser,
        T.TYPE AS type
      FROM KANBAN_TASKS T
      WHERE T.ID = ?;
      `,
      [taskId],
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
      [taskId],
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

/**
 * ✅ PUT /api/kanban/tasks/:id
 * 🔒 Usa assertTaskAccessOr403
 */
async function updateKanbanTask(request, response) {
  try {
    const taskId = Number(request.params.id);
    const payload = request.body || {};

    const userId = request.user.user_id;

    const access = await assertTaskAccessOr403(taskId, userId, response);
    if (!access) return;

    const isOwner = Number(access.boardOwnerId) === Number(userId);
    const isCreator = Number(access.taskCreatorId) === Number(userId);

    const allowedFields = new Set([
      "dueDate",
      "duration",
      "checklist",
      "columnId",
    ]);

    if (isOwner) {
      [
        "title",
        "description",
        "type",
        "assignedUser",
      ].forEach((field) => allowedFields.add(field));
    } else if (isCreator) {
      ["title", "description", "type"].forEach((field) =>
        allowedFields.add(field),
      );
    }

    const editableFields = [
      "title",
      "description",
      "dueDate",
      "duration",
      "columnId",
      "assignedUser",
      "checklist",
      "type",
    ];

    const providedFields = Object.keys(payload).filter(
      (key) => payload[key] !== undefined && editableFields.includes(key),
    );

    const forbiddenFields = providedFields.filter(
      (key) => !allowedFields.has(key),
    );

    if (forbiddenFields.length > 0) {
      return response.status(403).json({
        message: `You cannot edit the following fields: ${forbiddenFields.join(
          ", ",
        )}`,
      });
    }

    const [currentTask] = await executeDatabaseQuery(
      `
      SELECT
        TITLE AS title,
        DESCRIPTION AS description,
        DUE_DATE AS dueDate,
        DURATION AS duration,
        COLUMN_ID AS columnId,
        ASSIGNED_USER_ID AS assignedUser,
        TYPE AS type
      FROM KANBAN_TASKS
      WHERE ID = ?
      LIMIT 1;
      `,
      [taskId],
    );

    if (!currentTask) {
      return response.status(404).json({ message: "Task not found." });
    }

    const title =
      payload.title !== undefined ? String(payload.title).trim() : currentTask.title;

    if (payload.title !== undefined && !title) {
      return response.status(400).json({ message: "Title is required." });
    }

    const description =
      payload.description !== undefined
        ? String(payload.description)
        : currentTask.description;

    const dueDate =
      payload.dueDate !== undefined ? payload.dueDate || null : currentTask.dueDate;

    const duration =
      payload.duration !== undefined ? payload.duration || null : currentTask.duration;

    const newType =
      payload.type !== undefined ? payload.type || "tarefa" : currentTask.type;

    const newColumnId =
      payload.columnId !== undefined
        ? Number(payload.columnId)
        : currentTask.columnId;

    if (payload.columnId !== undefined) {
      if (!newColumnId || Number.isNaN(newColumnId)) {
        return response.status(400).json({ message: "columnId is required." });
      }
    }

    const newAssignedUser =
      payload.assignedUser !== undefined &&
      payload.assignedUser !== null &&
      payload.assignedUser !== ""
        ? Number(payload.assignedUser)
        : payload.assignedUser !== undefined
          ? null
          : currentTask.assignedUser;

    if (
      payload.assignedUser !== undefined &&
      payload.assignedUser !== null &&
      payload.assignedUser !== "" &&
      Number.isNaN(newAssignedUser)
    ) {
      return response.status(400).json({
        message: "assignedUser inválido.",
      });
    }

    // valida: se veio columnId, a coluna precisa ser do mesmo board
    if (payload.columnId !== undefined) {
      const [col] = await executeDatabaseQuery(
        `SELECT ID FROM KANBAN_COLUMNS WHERE ID = ? AND BOARD_ID = ? LIMIT 1;`,
        [newColumnId, access.boardId],
      );

      if (!col) {
        return response
          .status(400)
          .json({ message: "Invalid column for this board." });
      }
    }

    // se atribuiu alguém, garante membership no board da task
    if (payload.assignedUser !== undefined && newAssignedUser) {
      const [userExists] = await executeDatabaseQuery(
        `SELECT ID FROM USERS WHERE ID = ? LIMIT 1;`,
        [newAssignedUser],
      );

      if (!userExists) {
        return response
          .status(400)
          .json({ message: "Assigned user does not exist." });
      }

      await executeDatabaseQuery(
        `
        INSERT IGNORE INTO KANBAN_BOARD_MEMBERS (BOARD_ID, USER_ID, ROLE)
        VALUES (?, ?, 'EDITOR');
        `,
        [access.boardId, newAssignedUser],
      );
    }

    const updateResult = await executeDatabaseQuery(
      `
      UPDATE KANBAN_TASKS
      SET
        TITLE = ?,
        DESCRIPTION = ?,
        DUE_DATE = ?,
        DURATION = ?,
        COLUMN_ID = ?,
        ASSIGNED_USER_ID = ?,
        TYPE = ?
      WHERE ID = ?;
      `,
      [
        title,
        description || "",
        dueDate || null,
        duration || null,
        newColumnId,
        newAssignedUser,
        newType,
        taskId,
      ],
    );

    if (updateResult.affectedRows === 0) {
      return response.status(404).json({ message: "Task not found." });
    }

    if (payload.checklist !== undefined) {
      // refaz checklist
      await executeDatabaseQuery(
        `DELETE FROM KANBAN_TASK_CHECKLIST_ITEMS WHERE TASK_ID = ?;`,
        [taskId],
      );

      if (Array.isArray(payload.checklist)) {
        for (const item of payload.checklist) {
          await executeDatabaseQuery(
            `
            INSERT INTO KANBAN_TASK_CHECKLIST_ITEMS (TASK_ID, TEXT, COMPLETED)
            VALUES (?, ?, ?);
            `,
            [taskId, item.text || "", item.completed ? 1 : 0],
          );
        }
      }
    }

    const [updatedTaskRow] = await executeDatabaseQuery(
      `
      SELECT
        T.ID AS id,
        T.USER_ID AS userId,
        T.BOARD_ID AS boardId,
        T.TITLE AS title,
        T.DESCRIPTION AS description,
        T.DUE_DATE AS dueDate,
        T.DURATION AS duration,
        T.COLUMN_ID AS columnId,
        T.ASSIGNED_USER_ID AS assignedUser,
        T.TYPE AS type
      FROM KANBAN_TASKS T
      WHERE T.ID = ?;
      `,
      [taskId],
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
      [taskId],
    );

    const updatedTask = {
      ...updatedTaskRow,
      checklist: checklistRows.map((item) => ({
        id: item.id,
        text: item.text,
        completed: !!item.completed,
      })),
    };

    return response.json(updatedTask);
  } catch (error) {
    console.error("Error updating kanban task:", error);
    return response.status(500).json({
      message: "Failed to update kanban task.",
    });
  }
}

/**
 * ✅ DELETE /api/kanban/tasks/:id
 * 🔒 Usa assertTaskAccessOr403
 */
async function deleteKanbanTask(request, response) {
  try {
    const taskId = Number(request.params.id);
    const userId = request.user.user_id;

    const access = await assertTaskAccessOr403(taskId, userId, response);
    if (!access) return;

    const isOwner = Number(access.boardOwnerId) === Number(userId);
    const isCreator = Number(access.taskCreatorId) === Number(userId);

    if (!isOwner && !isCreator) {
      return response.status(403).json({
        message: "You can only delete tasks you created or boards you own.",
      });
    }

    await executeDatabaseQuery(
      `DELETE FROM KANBAN_TASK_CHECKLIST_ITEMS WHERE TASK_ID = ?;`,
      [taskId],
    );

    const deleteResult = await executeDatabaseQuery(
      `DELETE FROM KANBAN_TASKS WHERE ID = ?;`,
      [taskId],
    );

    if (deleteResult.affectedRows === 0) {
      return response.status(404).json({ message: "Task not found." });
    }

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting kanban task:", error);
    return response.status(500).json({
      message: "Failed to delete kanban task.",
    });
  }
}

/**
 * ✅ POST /api/kanban/members
 * (Somente criador pode convidar)
 */
async function addBoardMember(request, response) {
  try {
    const userId = request.user.user_id;
    const { email, boardId } = request.body;

    if (!email) {
      return response.status(400).json({ message: "Email é obrigatório." });
    }

    // Determina o board alvo: usa o enviado ou o primeiro acessível do usuário
    const resolvedBoardId =
      boardId !== undefined && boardId !== null
        ? Number(boardId)
        : await getUserBoardIdOr404(request, response);

    if (!resolvedBoardId) return;

    const [board] = await executeDatabaseQuery(
      `SELECT ID, OWNER_USER_ID FROM KANBAN_BOARDS WHERE ID = ? LIMIT 1;`,
      [resolvedBoardId],
    );

    if (!board) {
      return response.status(404).json({ message: "Board not found." });
    }

    if (Number(board.OWNER_USER_ID) !== Number(userId)) {
      return response
        .status(403)
        .json({ message: "Apenas o Criador pode convidar pessoas." });
    }

    const [user] = await executeDatabaseQuery(
      `SELECT ID, NAME, EMAIL FROM USERS WHERE EMAIL = ? LIMIT 1;`,
      [email],
    );

    if (!user) {
      return response.status(404).json({ message: "Usuário não encontrado." });
    }

    // ✅ evita duplicado (se tiver UNIQUE no banco também ajuda)
    await executeDatabaseQuery(
      `
      INSERT IGNORE INTO KANBAN_BOARD_MEMBERS (BOARD_ID, USER_ID, ROLE)
      VALUES (?, ?, 'EDITOR');
      `,
      [board.ID, user.ID],
    );

    return response.status(201).json({
      message: "Membro adicionado com sucesso.",
      member: { id: user.ID, name: user.NAME, email: user.EMAIL },
    });
  } catch (error) {
    console.error("Error adding board member:", error);
    return response.status(500).json({ message: "Erro ao adicionar membro." });
  }
}

/**
 * ✅ GET /api/kanban/boards
 * Regra:
 * - Owner: SEMPRE aparece (mesmo vazio)
 * - Membro: só aparece se tiver ao menos 1 task atribuída a mim no board
 */
async function getKanbanBoards(request, response) {
  try {
    const userId = request.user.user_id;

    const boards = await executeDatabaseQuery(
      `
      SELECT DISTINCT
        B.ID AS id,
        B.NAME AS name,
        B.OWNER_USER_ID AS ownerUserId,
        OU.NAME AS ownerName,
        B.VISIBILITY AS visibility,
        B.CREATED_AT AS createdAt
      FROM KANBAN_BOARDS B
      JOIN USERS OU ON OU.ID = B.OWNER_USER_ID
      LEFT JOIN KANBAN_BOARD_MEMBERS BM
        ON BM.BOARD_ID = B.ID AND BM.USER_ID = ?
      WHERE
        (B.OWNER_USER_ID = ? OR BM.USER_ID IS NOT NULL)
        AND
        (
          -- ✅ owner sempre vê seus boards (mesmo vazio)
          B.OWNER_USER_ID = ?
          OR
          -- ✅ membro (não-owner)
          (B.OWNER_USER_ID <> ? AND (
            -- board compartilhado: aparece mesmo sem tarefa atribuída
            B.VISIBILITY = 'SHARED'
            OR
            -- board privado: só aparece se tiver tarefa atribuída a mim
            EXISTS (
              SELECT 1
              FROM KANBAN_TASKS T
              WHERE T.BOARD_ID = B.ID
                AND T.ASSIGNED_USER_ID = ?
              LIMIT 1
            )
          ))
        )
      ORDER BY
        (B.OWNER_USER_ID = ?) DESC,
        B.CREATED_AT DESC;
      `,
      [userId, userId, userId, userId, userId, userId],
    );

    return response.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return response.status(500).json({ message: "Failed to fetch boards." });
  }
}

/**
 * ✅ GET /api/kanban/preferences
 * Retorna o último board selecionado pelo usuário logado
 */
async function getKanbanPreferences(request, response) {
  try {
    const userId = request.user.user_id;

    const [row] = await executeDatabaseQuery(
      `
  SELECT
    LAST_BOARD_ID AS lastBoardId,
    BACKGROUND_ID AS backgroundId
  FROM KANBAN_USER_PREFERENCES
  WHERE USER_ID = ?
  LIMIT 1;
  `,
      [userId],
    );

    return response.json({
      lastBoardId: row?.lastBoardId ? Number(row.lastBoardId) : null,
      backgroundId: row?.backgroundId || null,
    });
  } catch (error) {
    console.error("Error fetching kanban preferences:", error);
    return response
      .status(500)
      .json({ message: "Failed to fetch preferences." });
  }
}

/**
 * ✅ PUT /api/kanban/preferences
 * Salva o último board selecionado (validando acesso ao board)
 */
async function updateKanbanPreferences(request, response) {
  try {
    const userId = request.user.user_id;

    const { lastBoardId, backgroundId } = request.body;

    const boardId =
      lastBoardId !== undefined && lastBoardId !== null && lastBoardId !== ""
        ? Number(lastBoardId)
        : null;

    const bgId =
      backgroundId !== undefined && backgroundId !== null && backgroundId !== ""
        ? String(backgroundId).trim()
        : null;

    // nada pra atualizar
    if (!boardId && !bgId) {
      return response.status(400).json({
        message: "Nothing to update. Send lastBoardId and/or backgroundId.",
      });
    }

    // ✅ valida acesso ao board (owner OU membro) apenas se veio boardId
    if (boardId) {
      const [hasAccess] = await executeDatabaseQuery(
        `
        SELECT B.ID
        FROM KANBAN_BOARDS B
        LEFT JOIN KANBAN_BOARD_MEMBERS BM
          ON BM.BOARD_ID = B.ID AND BM.USER_ID = ?
        WHERE B.ID = ?
          AND (B.OWNER_USER_ID = ? OR BM.USER_ID IS NOT NULL)
        LIMIT 1;
        `,
        [userId, boardId, userId],
      );

      if (!hasAccess) {
        return response
          .status(403)
          .json({ message: "You do not have access to this board." });
      }
    }

    // ✅ upsert (atualiza só o que foi enviado)
    await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_USER_PREFERENCES (USER_ID, LAST_BOARD_ID, BACKGROUND_ID)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        LAST_BOARD_ID = COALESCE(VALUES(LAST_BOARD_ID), LAST_BOARD_ID),
        BACKGROUND_ID = COALESCE(VALUES(BACKGROUND_ID), BACKGROUND_ID);
      `,
      [userId, boardId, bgId],
    );

    return response.json({
      message: "Preferences updated.",
      lastBoardId: boardId, // pode vir null se você não mandou
      backgroundId: bgId, // pode vir null se você não mandou
    });
  } catch (error) {
    console.error("Error updating kanban preferences:", error);
    return response
      .status(500)
      .json({ message: "Failed to update preferences." });
  }
}

/**
 * ✅ POST /api/kanban/boards
 * Cria um board com colunas padrão + define como último board usado
 */
async function createKanbanBoard(request, response) {
  try {
    const userId = request.user.user_id;
    const { name } = request.body;

    const boardName = (name || "").trim();

    if (!boardName) {
      return response.status(400).json({ message: "Board name is required." });
    }

    // 1) cria board
    const insertBoard = await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_BOARDS (NAME, OWNER_USER_ID, VISIBILITY)
      VALUES (?, ?, 'PRIVATE');
      `,
      [boardName, userId],
    );

    const newBoardId = insertBoard.insertId;

    // 2) garante owner como membro
    await executeDatabaseQuery(
      `
      INSERT IGNORE INTO KANBAN_BOARD_MEMBERS (BOARD_ID, USER_ID, ROLE)
      VALUES (?, ?, 'OWNER');
      `,
      [newBoardId, userId],
    );

    // 3) cria colunas padrão
    await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_COLUMNS (BOARD_ID, NAME, ORDER_INDEX)
      VALUES
        (?, 'A Fazer', 1),
        (?, 'Em Progresso', 2),
        (?, 'Concluído', 3);
      `,
      [newBoardId, newBoardId, newBoardId],
    );

    // 4) salva preference pra abrir o board novo
    await executeDatabaseQuery(
      `
      INSERT INTO KANBAN_USER_PREFERENCES (USER_ID, LAST_BOARD_ID)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE LAST_BOARD_ID = VALUES(LAST_BOARD_ID);
      `,
      [userId, newBoardId],
    );

    // retorna board criado
    const [createdBoard] = await executeDatabaseQuery(
      `
      SELECT
        B.ID AS id,
        B.NAME AS name,
        B.OWNER_USER_ID AS ownerUserId,
        U.NAME AS ownerName,
        B.CREATED_AT AS createdAt
      FROM KANBAN_BOARDS B
      JOIN USERS U ON U.ID = B.OWNER_USER_ID
      WHERE B.ID = ?
      LIMIT 1;
      `,
      [newBoardId],
    );

    return response.status(201).json(createdBoard);
  } catch (error) {
    console.error("Error creating board:", error);
    return response.status(500).json({ message: "Failed to create board." });
  }
}

/**
 * ✅ PUT /api/kanban/boards/:id
 * Renomeia board (somente owner)
 */
async function renameKanbanBoard(request, response) {
  try {
    const userId = request.user.user_id;
    const boardId = Number(request.params.id);
    const { name } = request.body;

    const boardName = (name || "").trim();

    if (!boardId) {
      return response.status(400).json({ message: "boardId is required." });
    }

    if (!boardName) {
      return response.status(400).json({ message: "Board name is required." });
    }

    const [board] = await executeDatabaseQuery(
      `SELECT ID, OWNER_USER_ID FROM KANBAN_BOARDS WHERE ID = ? LIMIT 1;`,
      [boardId],
    );

    if (!board) {
      return response.status(404).json({ message: "Board not found." });
    }

    if (Number(board.OWNER_USER_ID) !== Number(userId)) {
      return response
        .status(403)
        .json({ message: "Only the owner can rename this board." });
    }

    await executeDatabaseQuery(
      `UPDATE KANBAN_BOARDS SET NAME = ? WHERE ID = ?;`,
      [boardName, boardId],
    );

    const [updatedBoard] = await executeDatabaseQuery(
      `
      SELECT
        B.ID AS id,
        B.NAME AS name,
        B.OWNER_USER_ID AS ownerUserId,
        U.NAME AS ownerName,
        B.CREATED_AT AS createdAt
      FROM KANBAN_BOARDS B
      JOIN USERS U ON U.ID = B.OWNER_USER_ID
      WHERE B.ID = ?
      LIMIT 1;
      `,
      [boardId],
    );

    return response.json(updatedBoard);
  } catch (error) {
    console.error("Error renaming board:", error);
    return response.status(500).json({ message: "Failed to rename board." });
  }
}

/**
 * ✅ PUT /api/kanban/boards/:id/visibility
 * Altera visibilidade do board (somente owner)
 */
async function updateKanbanBoardVisibility(request, response) {
  try {
    const userId = request.user.user_id;
    const boardId = Number(request.params.id);
    const visibilityRaw = (request.body?.visibility || "").toString().trim();
    const visibility = visibilityRaw.toUpperCase();

    if (!boardId) {
      return response.status(400).json({ message: "boardId is required." });
    }

    if (!["PRIVATE", "SHARED"].includes(visibility)) {
      return response.status(400).json({
        message: "visibility must be PRIVATE or SHARED.",
      });
    }

    const [board] = await executeDatabaseQuery(
      `SELECT ID, OWNER_USER_ID FROM KANBAN_BOARDS WHERE ID = ? LIMIT 1;`,
      [boardId],
    );

    if (!board) {
      return response.status(404).json({ message: "Board not found." });
    }

    if (Number(board.OWNER_USER_ID) !== Number(userId)) {
      return response.status(403).json({
        message: "Only the owner can change board visibility.",
      });
    }

    await executeDatabaseQuery(
      `UPDATE KANBAN_BOARDS SET VISIBILITY = ? WHERE ID = ?;`,
      [visibility, boardId],
    );

    return response.json({
      message: "Board visibility updated.",
      id: boardId,
      visibility,
    });
  } catch (error) {
    console.error("Error updating board visibility:", error);
    return response
      .status(500)
      .json({ message: "Failed to update board visibility." });
  }
}

/**
 * ✅ DELETE /api/kanban/boards/:id
 * Só o owner pode deletar.
 * Apaga: checklist -> tasks -> columns -> members -> preferences -> board
 */
async function deleteKanbanBoard(request, response) {
  try {
    const userId = request.user.user_id;
    const boardId = Number(request.params.id);

    if (!boardId) {
      return response.status(400).json({ message: "boardId is required." });
    }

    const [board] = await executeDatabaseQuery(
      `SELECT ID, OWNER_USER_ID FROM KANBAN_BOARDS WHERE ID = ? LIMIT 1;`,
      [boardId],
    );

    if (!board) {
      return response.status(404).json({ message: "Board not found." });
    }

    if (Number(board.OWNER_USER_ID) !== Number(userId)) {
      return response
        .status(403)
        .json({ message: "Only the owner can delete this board." });
    }

    // 1) checklist items das tasks do board
    await executeDatabaseQuery(
      `
      DELETE CI
      FROM KANBAN_TASK_CHECKLIST_ITEMS CI
      JOIN KANBAN_TASKS T ON T.ID = CI.TASK_ID
      WHERE T.BOARD_ID = ?;
      `,
      [boardId],
    );

    // 2) tasks do board
    await executeDatabaseQuery(`DELETE FROM KANBAN_TASKS WHERE BOARD_ID = ?;`, [
      boardId,
    ]);

    // 3) columns do board
    await executeDatabaseQuery(
      `DELETE FROM KANBAN_COLUMNS WHERE BOARD_ID = ?;`,
      [boardId],
    );

    // 4) members
    await executeDatabaseQuery(
      `DELETE FROM KANBAN_BOARD_MEMBERS WHERE BOARD_ID = ?;`,
      [boardId],
    );

    // 5) preferences apontando pro board
    await executeDatabaseQuery(
      `
      UPDATE KANBAN_USER_PREFERENCES
      SET LAST_BOARD_ID = NULL
      WHERE LAST_BOARD_ID = ?;
      `,
      [boardId],
    );

    // 6) board
    await executeDatabaseQuery(`DELETE FROM KANBAN_BOARDS WHERE ID = ?;`, [
      boardId,
    ]);

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting board:", error);
    return response.status(500).json({ message: "Failed to delete board." });
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
  addBoardMember,
  getKanbanBoards,
  getKanbanPreferences,
  updateKanbanPreferences,
  renameKanbanBoard,
  updateKanbanBoardVisibility,
  createKanbanBoard,
  deleteKanbanBoard,
};
