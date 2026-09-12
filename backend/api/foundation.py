from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.core import get_db
from database.universal_service import UniversalDatabaseService
from models.connection import DatabaseConnection
from models.user import User
from models.query import QueryHistory, SavedQuery
from api.deps import get_current_user, get_active_connection

router = APIRouter()

def _database_service(connection: DatabaseConnection) -> UniversalDatabaseService:
    return UniversalDatabaseService(connection)


@router.get("/health")
def health() -> Dict[str, Any]:
    return {"success": True, "message": "AI Data Assistant backend is running"}


@router.get("/schema")
def schema(
    connection: DatabaseConnection = Depends(get_active_connection)
) -> Dict[str, Any]:
    try:
        tables = _database_service(connection).get_tables()
        return {"success": True, "data": {"tables": tables}}
    except (FileNotFoundError, OSError) as exc:
        raise HTTPException(status_code=503, detail="Unable to connect to the configured database") from exc


@router.get("/schema/{table_name}")
def table_schema(
    table_name: str,
    connection: DatabaseConnection = Depends(get_active_connection)
) -> Dict[str, Any]:
    try:
        service = _database_service(connection)
        return {
            "success": True,
            "data": {
                "name": table_name,
                "columns": service.get_table_schema(table_name),
                "indexes": service.get_indexes(table_name),
            },
        }
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Table not found") from exc
    except (FileNotFoundError, OSError) as exc:
        raise HTTPException(status_code=503, detail="Unable to connect to the configured database") from exc


@router.get("/schema/{table_name}/preview")
def table_preview(
    table_name: str,
    connection: DatabaseConnection = Depends(get_active_connection)
) -> Dict[str, Any]:
    try:
        service = _database_service(connection)
        tables = [t["name"] for t in service.get_tables()]
        if table_name not in tables:
            raise KeyError(f"Table not found: {table_name}")
        quote = '`' if connection.db_type == 'mysql' else '"'
        rows = service.execute_read_query(f'SELECT * FROM {quote}{table_name}{quote} LIMIT 50')
        return {
            "success": True,
            "data": {
                "name": table_name,
                "rows": rows
            }
        }
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Table not found") from exc
    except (FileNotFoundError, OSError) as exc:
        raise HTTPException(status_code=503, detail="Unable to connect to the configured database") from exc
        
@router.get("/dashboard")
def dashboard(
    connection: DatabaseConnection = Depends(get_active_connection)
) -> Dict[str, Any]:
    try:
        service = _database_service(connection)
        tables = service.get_tables()
    except (FileNotFoundError, OSError, KeyError):
        tables = []
        
    return {
        "success": True,
        "data": {
            "database": {"id": connection.id, "name": connection.name, "status": "connected"},
            "statistics": {
                "total_tables": len(tables),
                "total_records": sum(table["records"] for table in tables),
                "queries_run": 0,
                "ai_queries": 0,
            },
            "recent_queries": [],
            "schema_overview": tables,
        },
    }

class SaveQueryRequest(BaseModel):
    name: str
    description: Optional[str] = None
    question: str
    sql_query: str

class UpdateSavedQueryRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@router.get("/queries")
def queries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    history = db.query(QueryHistory).filter(QueryHistory.user_id == current_user.id).order_by(QueryHistory.created_at.desc()).all()
    results = []
    for h in history:
        results.append({
            "id": h.id,
            "question": h.question,
            "sql_query": h.sql_query,
            "status": h.status,
            "execution_time_ms": h.execution_time_ms,
            "row_count": h.row_count,
            "created_at": h.created_at.isoformat() if h.created_at else None,
            "error_message": h.error_message
        })
    return {"success": True, "data": {"queries": results}}

@router.get("/saved-queries")
def saved_queries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    saved = db.query(SavedQuery).filter(SavedQuery.user_id == current_user.id).order_by(SavedQuery.created_at.desc()).all()
    results = []
    for s in saved:
        results.append({
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "question": s.question,
            "sql_query": s.sql_query,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None
        })
    return {"success": True, "data": {"queries": results}}

@router.post("/saved-queries")
def create_saved_query(
    request: SaveQueryRequest,
    db: Session = Depends(get_db),
    connection: DatabaseConnection = Depends(get_active_connection),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    saved = SavedQuery(
        user_id=current_user.id,
        connection_id=connection.id,
        name=request.name,
        description=request.description,
        question=request.question,
        sql_query=request.sql_query
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return {"success": True, "data": {"id": saved.id}}

@router.put("/saved-queries/{query_id}")
def update_saved_query(
    query_id: int,
    request: UpdateSavedQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    saved = db.query(SavedQuery).filter(SavedQuery.id == query_id, SavedQuery.user_id == current_user.id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved query not found")
    if request.name is not None:
        saved.name = request.name
    if request.description is not None:
        saved.description = request.description
    db.commit()
    return {"success": True}

@router.delete("/saved-queries/{query_id}")
def delete_saved_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    saved = db.query(SavedQuery).filter(SavedQuery.id == query_id, SavedQuery.user_id == current_user.id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved query not found")
    db.delete(saved)
    db.commit()
    return {"success": True}

@router.get("/analytics")
def analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    from collections import defaultdict
    queries = db.query(QueryHistory).filter(QueryHistory.user_id == current_user.id).all()
    
    total_queries = len(queries)
    successful_queries = sum(1 for q in queries if q.status == 'success')
    failed_queries = sum(1 for q in queries if q.status == 'failed')
    execution_times = [q.execution_time_ms for q in queries if q.execution_time_ms is not None]
    average_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0

    ai_queries = sum(1 for q in queries if q.question is not None and q.question.strip() != "")
    sql_queries = total_queries - ai_queries

    by_day = defaultdict(int)
    time_by_day = defaultdict(list)

    for q in queries:
        if q.created_at:
            day_str = q.created_at.strftime('%m-%d')
            by_day[day_str] += 1
            if q.execution_time_ms is not None:
                time_by_day[day_str].append(q.execution_time_ms)

    sorted_days = sorted(by_day.keys())[-7:] # last 7 active days

    queries_per_day = [{'name': d, 'queries': by_day[d]} for d in sorted_days]
    
    success_vs_failure = [
        {'name': 'Success', 'value': successful_queries},
        {'name': 'Failed', 'value': failed_queries}
    ]

    ai_vs_sql = [
        {'name': 'AI Generated', 'value': ai_queries},
        {'name': 'Manual SQL', 'value': sql_queries}
    ]

    average_response_time = [
        {'name': d, 'time': round(sum(time_by_day[d])/len(time_by_day[d])) if time_by_day[d] else 0}
        for d in sorted_days
    ]

    return {
        "success": True,
        "data": {
            "total_queries": total_queries,
            "successful_queries": successful_queries,
            "failed_queries": failed_queries,
            "average_execution_time": round(average_execution_time),
            "ai_queries": ai_queries,
            "sql_queries": sql_queries,
            "queries_per_day": queries_per_day,
            "success_vs_failure": success_vs_failure,
            "ai_vs_sql": ai_vs_sql,
            "average_response_time": average_response_time,
        },
    }
