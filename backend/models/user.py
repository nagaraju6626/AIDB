from sqlalchemy import Boolean, Column, Integer, String, DateTime
from database.core import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="ANALYST") # ADMIN, ANALYST, VIEWER
    created_at = Column(DateTime, default=datetime.utcnow)
