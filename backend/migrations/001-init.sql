-- SmartSchedule initial schema (idempotent)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(150) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(100),
  expo_push_token VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  timezone                VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  default_remind_minutes  INTEGER NOT NULL DEFAULT 30,
  notify_via_push         BOOLEAN NOT NULL DEFAULT TRUE,
  work_start_hour         INTEGER NOT NULL DEFAULT 0,
  work_end_hour           INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  id                      SERIAL PRIMARY KEY,
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type               VARCHAR(20) NOT NULL DEFAULT 'task',
  title                   VARCHAR(255) NOT NULL,
  description             TEXT,
  start_time              TIMESTAMPTZ NOT NULL,
  end_time                TIMESTAMPTZ,
  status                  VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority                VARCHAR(20) NOT NULL DEFAULT 'normal',
  remind_at               TIMESTAMPTZ,
  is_reminded             BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at         TIMESTAMPTZ,
  end_notified_at         TIMESTAMPTZ,
  recurrence_type         VARCHAR(20) NOT NULL DEFAULT 'none',
  recurrence_interval     INTEGER NOT NULL DEFAULT 1,
  recurrence_until        TIMESTAMPTZ,
  recurrence_parent_id    INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_start ON schedules(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_remind ON schedules(remind_at, is_reminded);

CREATE TABLE IF NOT EXISTS tags (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  color       VARCHAR(20),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tags_user_name_unique UNIQUE (user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);

CREATE TABLE IF NOT EXISTS schedule_tags (
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  tag_id      INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (schedule_id, tag_id)
);

CREATE TABLE IF NOT EXISTS schedule_shares (
  schedule_id           INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  shared_with_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (schedule_id, shared_with_user_id)
);

CREATE TABLE IF NOT EXISTS schedule_templates (
  id                       SERIAL PRIMARY KEY,
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                     VARCHAR(50) NOT NULL,
  item_type                VARCHAR(20) NOT NULL DEFAULT 'task',
  title                    VARCHAR(255) NOT NULL,
  description              TEXT,
  duration_minutes         INTEGER,
  default_remind_minutes   INTEGER,
  priority                 VARCHAR(20) NOT NULL DEFAULT 'normal',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT schedule_templates_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS schedule_audit_logs (
  id           BIGSERIAL PRIMARY KEY,
  schedule_id  INTEGER NOT NULL,
  user_id      UUID NOT NULL,
  action       VARCHAR(30) NOT NULL,
  changes      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_schedule ON schedule_audit_logs(schedule_id, created_at);
