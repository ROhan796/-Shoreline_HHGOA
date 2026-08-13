MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS generations (
    id              VARCHAR(12) PRIMARY KEY,
    slug            VARCHAR(12) UNIQUE NOT NULL,
    format          CHAR(1) NOT NULL CHECK (format IN ('A', 'B')),
    name            VARCHAR(100),
    role            VARCHAR(100),
    ai_title        VARCHAR(150),
    image_url       TEXT NOT NULL DEFAULT '',
    storage_type    VARCHAR(20) DEFAULT 'local',
    share_count     INTEGER DEFAULT 1,
    download_count  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_slug ON generations(slug);
CREATE INDEX IF NOT EXISTS idx_generations_format ON generations(format);

CREATE TABLE IF NOT EXISTS users (
    clerk_user_id   VARCHAR(100) PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    is_admin        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
    clerk_user_id   VARCHAR(100) PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    added_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_events (
    id              SERIAL PRIMARY KEY,
    generation_id   VARCHAR(12) REFERENCES generations(id) ON DELETE CASCADE,
    platform        VARCHAR(20) DEFAULT 'twitter',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS download_events (
    id              SERIAL PRIMARY KEY,
    generation_id   VARCHAR(12) REFERENCES generations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
"""


def run_migration():
    from db.connection import sync_query
    import psycopg2
    from config import settings

    if not settings.is_db_configured:
        print("[MIGRATE] No DATABASE_URL configured, skipping migration")
        return False

    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cur = conn.cursor()
        cur.execute(MIGRATION_SQL)
        conn.commit()
        cur.close()
        conn.close()
        print("[MIGRATE] Database migration completed successfully")
        return True
    except Exception as e:
        print(f"[MIGRATE] Migration failed: {e}")
        return False


if __name__ == "__main__":
    run_migration()
