import os
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Any, Dict, List

from database.core import get_db
from database.universal_service import UniversalDatabaseService
from models.connection import DatabaseConnection
from schemas.connection import ConnectionCreate, ConnectionResponse
from api.deps import get_current_user
from models.user import User
from security.encryption import encrypt_password

router = APIRouter()

@router.post("")
def create_connection(
    conn: ConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if conn.db_type not in ["sqlite", "postgres", "mysql"]:
        raise HTTPException(status_code=400, detail="Unsupported database type.")
        
    db_conn = DatabaseConnection(
        name=conn.name,
        db_type=conn.db_type,
        host=conn.host,
        port=conn.port,
        database_name=conn.database_name,
        username=conn.username,
        password=encrypt_password(conn.password) if conn.password else None,
        user_id=current_user.id
    )
    db.add(db_conn)
    db.commit()
    db.refresh(db_conn)
    return {"success": True, "data": {"connection": ConnectionResponse.model_validate(db_conn).model_dump()}}

@router.get("")
def get_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    connections = db.query(DatabaseConnection).filter(DatabaseConnection.user_id == current_user.id).order_by(DatabaseConnection.id).all()
    safe_connections = [ConnectionResponse.model_validate(connection).model_dump() for connection in connections]
    return {"success": True, "data": {"connections": safe_connections}}

@router.post("/test")
def test_connection_params(
    conn: ConnectionCreate,
    current_user: User = Depends(get_current_user)
):
    if conn.db_type not in ["sqlite", "postgres", "mysql"]:
        raise HTTPException(status_code=400, detail="Unsupported database type.")
    
    # Create a temporary connection model
    temp_conn = DatabaseConnection(
        name=conn.name,
        db_type=conn.db_type,
        host=conn.host,
        port=conn.port,
        database_name=conn.database_name,
        username=conn.username,
        password=conn.password
    )
    try:
        service = UniversalDatabaseService(temp_conn)
        service.test_connection()
        tables = service.get_tables()
        return {"success": True, "message": "Connection successful", "data": {"tables": len(tables)}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect: {str(e)}")
    finally:
        if 'service' in locals():
            service.disconnect()

@router.post("/{conn_id}/test")
def test_connection(
    conn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    connection = db.query(DatabaseConnection).filter(DatabaseConnection.id == conn_id, DatabaseConnection.user_id == current_user.id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    try:
        service = UniversalDatabaseService(connection)
        service.test_connection()
        tables = service.get_tables()
        return {"success": True, "message": "Connection successful", "data": {"tables": len(tables)}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect: {str(e)}")
    finally:
        if 'service' in locals():
            service.disconnect()

@router.put("/{conn_id}")
def update_connection(
    conn_id: int,
    conn_data: ConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    connection = db.query(DatabaseConnection).filter(DatabaseConnection.id == conn_id, DatabaseConnection.user_id == current_user.id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    connection.name = conn_data.name
    connection.db_type = conn_data.db_type
    connection.host = conn_data.host
    connection.port = conn_data.port
    connection.database_name = conn_data.database_name
    connection.username = conn_data.username
    if conn_data.password:
        connection.password = encrypt_password(conn_data.password)
        
    db.commit()
    return {"success": True, "message": "Connection updated"}

@router.delete("/{conn_id}")
def delete_connection(
    conn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    connection = db.query(DatabaseConnection).filter(DatabaseConnection.id == conn_id, DatabaseConnection.user_id == current_user.id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    db.delete(connection)
    db.commit()
    return {"success": True, "message": "Connection deleted"}
