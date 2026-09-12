from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConnectionBase(BaseModel):
    name: str
    db_type: str
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: str
    username: Optional[str] = None

class ConnectionCreate(ConnectionBase):
    password: Optional[str] = None

class ConnectionResponse(ConnectionBase):
    id: int
    created_at: datetime
    user_id: int

    model_config = {"from_attributes": True}
