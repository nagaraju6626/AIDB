import os
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# The main application database (storing users, connections, queries)
# We will use SQLite for ease of setup.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aidb_app.db")

# Fix for postgres/postgres:// URL issues and SQLite specific args
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fix for Railway MySQL URL issues (default mysql:// needs pymysql driver)
if SQLALCHEMY_DATABASE_URL.startswith("mysql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_database_info():
    parsed_url = urlparse(SQLALCHEMY_DATABASE_URL)
    database_name = parsed_url.path.lstrip("/")
    if parsed_url.scheme.startswith("sqlite"):
        database_name = database_name or parsed_url.path

    return {
        "type": "sqlite" if parsed_url.scheme.startswith("sqlite") else parsed_url.scheme.split("+", 1)[0],
        "host": parsed_url.hostname or "local",
        "database": database_name,
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
