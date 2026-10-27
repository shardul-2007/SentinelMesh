from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# For SQLite, check_same_thread=False allows FastAPI multi-threaded requests
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def migrate_sqlite_schema():
    if settings.DATABASE_URL.startswith("sqlite"):
        from sqlalchemy import text
        with engine.connect() as conn:
            try:
                existing_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(agents)")).fetchall()]
                if existing_cols:
                    if "description" not in existing_cols:
                        conn.execute(text("ALTER TABLE agents ADD COLUMN description TEXT"))
                    if "assigned_policies" not in existing_cols:
                        conn.execute(text("ALTER TABLE agents ADD COLUMN assigned_policies TEXT DEFAULT '[]'"))
                    if "last_active_at" not in existing_cols:
                        conn.execute(text("ALTER TABLE agents ADD COLUMN last_active_at DATETIME"))
                    conn.commit()
            except Exception:
                pass

migrate_sqlite_schema()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
