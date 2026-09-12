from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database.core import Base

class DatabaseConnection(Base):
    __tablename__ = "database_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    db_type = Column(String) # sqlite, postgres, mysql
    host = Column(String, nullable=True)
    port = Column(Integer, nullable=True)
    database_name = Column(String)
    username = Column(String, nullable=True)
    # Never store raw passwords! Actually for demo, we'll store them encrypted, but here we just store a dummy or use sqlite which doesn't need it.
    # In a real app we would use AES encryption for passwords.
    password = Column(String, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
