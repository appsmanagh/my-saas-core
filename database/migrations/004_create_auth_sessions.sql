CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_auth_sessions_user_id
    ON auth_sessions(user_id);

CREATE INDEX idx_auth_sessions_expires_at
    ON auth_sessions(expires_at);