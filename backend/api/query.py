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
from services.query_validator import QueryCorrectionError, validate_query_before_execution
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
        
        is_direct_sql = question.lstrip().lower().startswith(("select", "with", "delete", "update", "insert", "drop", "alter", "truncate", "create", "grant", "revoke"))
        ai_response = {"intent": "Direct SQL query", "chart_type": "none"}
        raw_sql = question if is_direct_sql else None
        if not is_direct_sql:
            ai_response = ai_service.generate_sql(question=question, schema=schema, dialect=connection.db_type)
            raw_sql = ai_response.get("sql")
        if not raw_sql:
            raise HTTPException(status_code=500, detail="AI did not generate a SQL query")

        try:
            safe_sql = validate_query_before_execution(
                question=question,
                generated_sql=raw_sql,
                schema=schema,
                adapter=adapter,
                dialect=connection.db_type,
            )
        except QueryCorrectionError as exc:
            history_record.status = "failed"
            history_record.error_message = exc.message
            history_record.sql_query = raw_sql
            db.commit()
            raise HTTPException(
                status_code=422,
                detail={
                    "validation_error": True,
                    "error_type": exc.error_type,
                    "message": exc.message,
                    "suggestion": exc.suggestion,
                    "corrected_query": exc.corrected_query,
                },
            ) from exc

        history_record.sql_query = raw_sql
        db.commit()
            
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
