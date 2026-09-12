from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.core import Base

class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    connection_id = Column(Integer, ForeignKey("database_connections.id"))
    
    question = Column(String(500), index=True)
    sql_query = Column(Text)
    status = Column(String(50)) # 'success', 'failed'
    execution_time_ms = Column(Integer)
    row_count = Column(Integer)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SavedQuery(Base):
    __tablename__ = "saved_queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    connection_id = Column(Integer, ForeignKey("database_connections.id"))
    
    name = Column(String(200), index=True)
    description = Column(Text, nullable=True)
    question = Column(String(500))
    sql_query = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
