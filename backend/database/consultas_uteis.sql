/* =========================================================
   CONSULTAS ÚTEIS — TAREFANDO KANBAN
   Banco: tarefando_kanban_db
   ========================================================= */

/* =========================
   👤 USERS
   ========================= */

-- Usuários cadastrados recentemente
SELECT ID, NAME, EMAIL, CREATED_AT
FROM USERS
ORDER BY CREATED_AT DESC
LIMIT 20;

-- Usuários que não são owner de nenhum board
SELECT U.ID, U.NAME, U.EMAIL
FROM USERS U
LEFT JOIN KANBAN_BOARDS B ON B.OWNER_USER_ID = U.ID
WHERE B.ID IS NULL
ORDER BY U.CREATED_AT DESC;


/* =========================
   📋 BOARDS + VISIBILIDADE
   ========================= */

-- Boards com visibilidade e total de membros
SELECT
  B.ID,
  B.NAME,
  B.VISIBILITY,
  B.OWNER_USER_ID,
  U.NAME AS OWNER_NAME,
  COUNT(BM.USER_ID) AS TOTAL_MEMBROS
FROM KANBAN_BOARDS B
JOIN USERS U ON U.ID = B.OWNER_USER_ID
LEFT JOIN KANBAN_BOARD_MEMBERS BM ON BM.BOARD_ID = B.ID
GROUP BY B.ID, B.NAME, B.VISIBILITY, B.OWNER_USER_ID, U.NAME
ORDER BY B.CREATED_AT DESC;

-- Trocar visibilidade do board
UPDATE KANBAN_BOARDS
SET VISIBILITY = 'SHARED'
WHERE ID = 1;


/* =========================
   👥 MEMBROS / ROLES
   ========================= */

-- Membros de um board com nome e role
SELECT
  BM.BOARD_ID,
  BM.USER_ID,
  U.NAME,
  U.EMAIL,
  BM.ROLE
FROM KANBAN_BOARD_MEMBERS BM
JOIN USERS U ON U.ID = BM.USER_ID
WHERE BM.BOARD_ID = 1
ORDER BY BM.ROLE DESC, U.NAME ASC;

-- Quantidade de membros por board
SELECT
  BM.BOARD_ID,
  COUNT(*) AS TOTAL
FROM KANBAN_BOARD_MEMBERS BM
GROUP BY BM.BOARD_ID
ORDER BY TOTAL DESC;


/* =========================
   🧩 COLUNAS
   ========================= */

-- Colunas ordenadas por board
SELECT
  BOARD_ID,
  ID,
  NAME,
  ORDER_INDEX
FROM KANBAN_COLUMNS
WHERE BOARD_ID = 1
ORDER BY ORDER_INDEX;


/* =========================
   📝 TASKS
   ========================= */

-- Tasks mais recentes por board
SELECT
  T.ID,
  T.TITLE,
  T.COLUMN_ID,
  T.ASSIGNED_USER_ID,
  T.CREATED_AT
FROM KANBAN_TASKS T
WHERE T.BOARD_ID = 1
ORDER BY T.CREATED_AT DESC
LIMIT 20;

-- Tasks sem responsável
SELECT
  T.ID,
  T.TITLE,
  T.BOARD_ID
FROM KANBAN_TASKS T
WHERE T.ASSIGNED_USER_ID IS NULL
ORDER BY T.ID DESC;

-- Tasks atrasadas (prazo < hoje e não concluídas)
SELECT
  T.ID,
  T.TITLE,
  T.DUE_DATE,
  T.COLUMN_ID,
  T.ASSIGNED_USER_ID
FROM KANBAN_TASKS T
JOIN KANBAN_COLUMNS C ON C.ID = T.COLUMN_ID
WHERE T.DUE_DATE < CURDATE()
  AND C.ORDER_INDEX <> 3
ORDER BY T.DUE_DATE ASC;

-- Próximos prazos (7 dias)
SELECT
  T.ID,
  T.TITLE,
  T.DUE_DATE,
  T.ASSIGNED_USER_ID
FROM KANBAN_TASKS T
WHERE T.DUE_DATE BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY T.DUE_DATE ASC;

-- Visibilidade de tasks para um usuário (PRIVATE/SHARED)
SELECT
  T.ID,
  T.TITLE,
  T.ASSIGNED_USER_ID,
  T.USER_ID AS CREATED_BY,
  T.BOARD_ID,
  B.VISIBILITY
FROM KANBAN_TASKS T
JOIN KANBAN_BOARDS B ON B.ID = T.BOARD_ID
WHERE T.BOARD_ID = 1
  AND (
    B.OWNER_USER_ID = 1
    OR B.VISIBILITY = 'SHARED'
    OR T.ASSIGNED_USER_ID = 1
  )
ORDER BY T.ID DESC;


/* =========================
   ✅ CHECKLIST
   ========================= */

-- Progresso de checklist por task
SELECT
  T.ID AS TASK_ID,
  T.TITLE,
  SUM(CASE WHEN CI.COMPLETED = 1 THEN 1 ELSE 0 END) AS DONE,
  COUNT(CI.ID) AS TOTAL
FROM KANBAN_TASKS T
LEFT JOIN KANBAN_TASK_CHECKLIST_ITEMS CI ON CI.TASK_ID = T.ID
WHERE T.BOARD_ID = 1
GROUP BY T.ID, T.TITLE
ORDER BY T.ID DESC;
