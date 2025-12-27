-- =========================================================
-- TAREFANDO - init.sql (schema recomendado para GitHub)
-- Objetivo:
-- - Criar banco + tabelas do Kanban
-- - Sem seed (projeto inicia vazio)
-- =========================================================

-- 1) Database
CREATE DATABASE IF NOT EXISTS tarefando_kanban_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE tarefando_kanban_db;

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE IF NOT EXISTS `USERS` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(100) NOT NULL,
  `EMAIL` varchar(150) NOT NULL,
  `PASSWORD_HASH` varchar(255) NOT NULL,
  `PROVIDER` enum('LOCAL','GOOGLE') NOT NULL DEFAULT 'LOCAL',
  `CREATED_AT` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_users_email` (`EMAIL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- KANBAN_BOARDS
-- =========================================================
CREATE TABLE IF NOT EXISTS `KANBAN_BOARDS` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(120) NOT NULL,
  `OWNER_USER_ID` int(11) NOT NULL,
  `VISIBILITY` enum('PRIVATE','SHARED') NOT NULL DEFAULT 'PRIVATE',
  `CREATED_AT` timestamp NULL DEFAULT current_timestamp(),
  `UPDATED_AT` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `idx_boards_owner_user_id` (`OWNER_USER_ID`),
  CONSTRAINT `fk_boards_owner_user`
    FOREIGN KEY (`OWNER_USER_ID`) REFERENCES `USERS` (`ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- KANBAN_BOARD_MEMBERS
-- =========================================================
CREATE TABLE IF NOT EXISTS `KANBAN_BOARD_MEMBERS` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `BOARD_ID` int(11) NOT NULL,
  `USER_ID` int(11) NOT NULL,
  `ROLE` enum('OWNER','VIEWER','EDITOR') NOT NULL DEFAULT 'EDITOR',
  `CREATED_AT` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_board_members_board_user` (`BOARD_ID`,`USER_ID`),
  KEY `idx_board_members_board_id` (`BOARD_ID`),
  KEY `idx_board_members_user_id` (`USER_ID`),
  CONSTRAINT `fk_board_members_board`
    FOREIGN KEY (`BOARD_ID`) REFERENCES `KANBAN_BOARDS` (`ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_board_members_user`
    FOREIGN KEY (`USER_ID`) REFERENCES `USERS` (`ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- KANBAN_COLUMNS
-- =========================================================
CREATE TABLE IF NOT EXISTS `KANBAN_COLUMNS` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `BOARD_ID` int(11) NOT NULL,
  `NAME` varchar(100) NOT NULL,
  `ORDER_INDEX` int(11) NOT NULL,
  `CREATED_AT` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_columns_board_order` (`BOARD_ID`,`ORDER_INDEX`),
  KEY `idx_columns_board_id` (`BOARD_ID`),
  CONSTRAINT `fk_columns_board`
    FOREIGN KEY (`BOARD_ID`) REFERENCES `KANBAN_BOARDS` (`ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- KANBAN_TASKS
-- =========================================================
CREATE TABLE IF NOT EXISTS `KANBAN_TASKS` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `BOARD_ID` int(11) NOT NULL,
  `USER_ID` int(11) NOT NULL,                 -- criador
  `TITLE` varchar(200) NOT NULL,
  `DESCRIPTION` text DEFAULT NULL,
  `DUE_DATE` date DEFAULT NULL,
  `DURATION` varchar(20) DEFAULT NULL,
  `COLUMN_ID` int(11) NOT NULL,
  `ASSIGNED_USER_ID` int(11) DEFAULT NULL,    -- responsável
  `TYPE` varchar(20) NOT NULL DEFAULT 'tarefa',
  `CREATED_AT` timestamp NULL DEFAULT current_timestamp(),
  `UPDATED_AT` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`ID`),

  -- índices para performance (boards, colunas e filtros por responsável)
  KEY `idx_tasks_board_id` (`BOARD_ID`),
  KEY `idx_tasks_column_id` (`COLUMN_ID`),
  KEY `idx_tasks_user_id` (`USER_ID`),
  KEY `idx_tasks_assigned_user_id` (`ASSIGNED_USER_ID`),

  CONSTRAINT `fk_tasks_board`
    FOREIGN KEY (`BOARD_ID`) REFERENCES `KANBAN_BOARDS` (`ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_user`
    FOREIGN KEY (`USER_ID`) REFERENCES `USERS` (`ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_column`
    FOREIGN KEY (`COLUMN_ID`) REFERENCES `KANBAN_COLUMNS` (`ID`),
  CONSTRAINT `fk_tasks_assigned_user`
    FOREIGN KEY (`ASSIGNED_USER_ID`) REFERENCES `USERS` (`ID`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- KANBAN_TASK_CHECKLIST_ITEMS
-- =========================================================
CREATE TABLE IF NOT EXISTS `KANBAN_TASK_CHECKLIST_ITEMS` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `TASK_ID` int(11) NOT NULL,
  `TEXT` varchar(255) NOT NULL,
  `COMPLETED` tinyint(1) NOT NULL DEFAULT 0,
  `CREATED_AT` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `idx_checklist_task_id` (`TASK_ID`),
  CONSTRAINT `fk_checklist_task`
    FOREIGN KEY (`TASK_ID`) REFERENCES `KANBAN_TASKS` (`ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- PASSWORD_RESET_TOKENS
-- =========================================================
CREATE TABLE IF NOT EXISTS `PASSWORD_RESET_TOKENS` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_ID` int(11) NOT NULL,
  `TOKEN_HASH` varchar(255) NOT NULL,
  `EXPIRES_AT` timestamp NOT NULL,
  `USED_AT` timestamp NULL DEFAULT NULL,
  `CREATED_AT` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `idx_reset_user_id` (`USER_ID`),
  CONSTRAINT `fk_reset_user`
    FOREIGN KEY (`USER_ID`) REFERENCES `USERS` (`ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =========================================================
-- KANBAN_USER_PREFERENCES
-- 1 linha por usuário:
-- - lastBoardId (board selecionado)
-- - backgroundId (wallpaper)
-- =========================================================
CREATE TABLE IF NOT EXISTS `KANBAN_USER_PREFERENCES` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_ID` int(11) NOT NULL,
  `LAST_BOARD_ID` int(11) DEFAULT NULL,
  `BACKGROUND_ID` varchar(40) DEFAULT NULL,
  `UPDATED_AT` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_preferences_user_id` (`USER_ID`),
  KEY `idx_preferences_last_board_id` (`LAST_BOARD_ID`),
  CONSTRAINT `fk_preferences_user`
    FOREIGN KEY (`USER_ID`) REFERENCES `USERS` (`ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_preferences_last_board`
    FOREIGN KEY (`LAST_BOARD_ID`) REFERENCES `KANBAN_BOARDS` (`ID`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
