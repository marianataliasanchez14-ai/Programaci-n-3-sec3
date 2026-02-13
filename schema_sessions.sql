-- Tabla para las sesiones de usuario (connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
  sid varchar PRIMARY KEY NOT NULL,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
