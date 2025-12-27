const { databaseConnectionPool } = require("./database_connection");

async function getDatabaseName() {
  if (process.env.DB_NAME) {
    return process.env.DB_NAME;
  }

  const [rows] = await databaseConnectionPool.execute(
    "SELECT DATABASE() AS name;"
  );

  return rows?.[0]?.name || null;
}

async function columnExists(databaseName, tableName, columnName) {
  const [rows] = await databaseConnectionPool.execute(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1;
    `,
    [databaseName, tableName, columnName]
  );

  return rows.length > 0;
}

async function tableExists(databaseName, tableName) {
  const [rows] = await databaseConnectionPool.execute(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
    LIMIT 1;
    `,
    [databaseName, tableName]
  );

  return rows.length > 0;
}

async function ensureKanbanSchema() {
  const databaseName = await getDatabaseName();

  if (!databaseName) {
    console.warn(
      "⚠️  Não foi possível detectar o banco atual. Pulando migrations."
    );
    return;
  }

  const hasVisibility = await columnExists(
    databaseName,
    "KANBAN_BOARDS",
    "VISIBILITY"
  );

  if (!hasVisibility) {
    await databaseConnectionPool.execute(
      `
      ALTER TABLE KANBAN_BOARDS
      ADD COLUMN VISIBILITY enum('PRIVATE','SHARED')
        NOT NULL DEFAULT 'PRIVATE'
      AFTER OWNER_USER_ID;
      `
    );
  }

  const hasBoardMembersTable = await tableExists(
    databaseName,
    "KANBAN_BOARD_MEMBERS"
  );

  if (!hasBoardMembersTable) {
    await databaseConnectionPool.execute(
      `
      CREATE TABLE IF NOT EXISTS KANBAN_BOARD_MEMBERS (
        ID int(11) NOT NULL AUTO_INCREMENT,
        BOARD_ID int(11) NOT NULL,
        USER_ID int(11) NOT NULL,
        ROLE enum('OWNER','VIEWER','EDITOR') NOT NULL DEFAULT 'EDITOR',
        CREATED_AT timestamp NULL DEFAULT current_timestamp(),
        PRIMARY KEY (ID),
        UNIQUE KEY uk_board_members_board_user (BOARD_ID, USER_ID),
        KEY idx_board_members_board_id (BOARD_ID),
        KEY idx_board_members_user_id (USER_ID),
        CONSTRAINT fk_board_members_board
          FOREIGN KEY (BOARD_ID) REFERENCES KANBAN_BOARDS (ID)
          ON DELETE CASCADE,
        CONSTRAINT fk_board_members_user
          FOREIGN KEY (USER_ID) REFERENCES USERS (ID)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `
    );
  }
}

module.exports = {
  ensureKanbanSchema,
};
