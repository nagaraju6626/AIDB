from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from database.core import Base
from datetime import datetime

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type = Column(String(50)) # 'success', 'error', 'info', 'warning'
    title = Column(String(255))
    message = Column(String(1000))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
