import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Fetch database URL from environment, or fallback appropriately
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql://mooshi_user:mooshi_password@localhost:5432/mooshi_db"
)

# Set up the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
