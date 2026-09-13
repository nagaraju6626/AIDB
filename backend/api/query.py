import time
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from database.core import get_db
from models.connection import DatabaseConnection
from api.deps import get_current_user
from models.user import User
from database.universal_service import UniversalDatabaseService
from services.ai_service import AIService
from services.sql_validator import validate_sql, SQLValidationError
from api.notifications import create_notification

router = APIRouter()
ai_service = AIService()

def get_adapter(connection: DatabaseConnection) -> UniversalDatabaseService:
    return UniversalDatabaseService(connection)

from models.query import QueryHistory

@router.post("/ask")
def ask_question(
    connection_id: int = Body(...),
    question: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.id == connection_id,
        DatabaseConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")

    adapter = get_adapter(connection)
    
    history_record = QueryHistory(
        user_id=current_user.id,
        connection_id=connection.id,
        question=question,
        status="running"
    )
    db.add(history_record)
    db.commit()
    db.refresh(history_record)
    
    try:
        schema = adapter.get_schema()
        
        ai_response = ai_service.generate_sql(question=question, schema=schema, dialect=connection.db_type)
        raw_sql = ai_response.get("sql")
        if not raw_sql:
            raise HTTPException(status_code=500, detail="AI did not generate a SQL query")
            
        history_record.sql_query = raw_sql
        db.commit()
            
        try:
            safe_sql = validate_sql(raw_sql, dialect=connection.db_type)
        except SQLValidationError as e:
            raise HTTPException(status_code=400, detail=f"Blocked unsafe query: {str(e)}")
            
        start_time = time.time()
        results = adapter.execute_read_query(safe_sql, limit=1000)
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        history_record.status = "success"
        history_record.execution_time_ms = execution_time_ms
        history_record.row_count = len(results)
        history_record.sql_query = safe_sql
        db.commit()
        
        insight_data = ai_service.generate_insight(question, safe_sql, results)
        columns = list(results[0].keys()) if results else []
        
        create_notification(db, current_user.id, "success", "Query Completed", "Your database query was executed successfully.")
        
        if insight_data.get("insight_source") == "fallback":
            create_notification(db, current_user.id, "warning", "AI Insight Unavailable", "The query completed, but AI insight could not be generated.")
        
        return {
            "success": True,
            "data": {
                "question": question,
                "intent": ai_response.get("intent", ""),
                "sql": safe_sql,
                "columns": columns,
                "rows": results,
                "row_count": len(results),
                "execution_time_ms": execution_time_ms,
                "chart_type": ai_response.get("chart_type", "none"),
                "insight": insight_data.get("insight", ""),
                "insight_source": insight_data.get("insight_source", "ai")
            }
        }
    except Exception as e:
        history_record.status = "failed"
        history_record.error_message = str(e)
        db.commit()
        
        create_notification(db, current_user.id, "error", "Query Failed", "The query could not be completed.")
        
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        adapter.disconnect()
