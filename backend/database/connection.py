"""
Database connection and session configuration for SQLite.
Supports both SQLAlchemy ORM and direct SQLite connections.
"""
import os
import sqlite3

DATABASE_PATH = os.environ.get("DATABASE_PATH", "quantum_traffic.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

def get_raw_connection():
    """Get a direct sqlite3 connection with Row factory, WAL mode, and 30s busy timeout."""
    conn = sqlite3.connect(DATABASE_PATH, timeout=30.0)
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=30000;")
    except Exception:
        pass
    conn.row_factory = sqlite3.Row
    return conn

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import declarative_base, sessionmaker

    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

    def get_db():
        """FastAPI dependency for database session."""
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
except ImportError:
    # Graceful fallback if sqlalchemy is not yet installed in runtime
    engine = None
    SessionLocal = None
    Base = object

    def get_db():
        conn = get_raw_connection()
        try:
            yield conn
        finally:
            conn.close()
