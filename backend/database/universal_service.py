import os
import urllib.parse
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any, Dict, List
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from models.connection import DatabaseConnection
from security.encryption import decrypt_password

def to_json_compatible(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): to_json_compatible(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [to_json_compatible(item) for item in value]
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)

class UniversalDatabaseService:
    def __init__(self, connection_model: DatabaseConnection):
        self.connection_model = connection_model
        self.engine = self._create_engine()
        
    def _create_engine(self) -> Engine:
        if self.connection_model.db_type == "sqlite":
            db_path = self.connection_model.database_name
            if not os.path.isabs(db_path):
                # Resolve relative to the project root (backend folder)
                db_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), db_path))
            return create_engine(f"sqlite:///{db_path}")
            
        # Decrypt password for postgres/mysql
        raw_password = decrypt_password(self.connection_model.password) if self.connection_model.password else ""
        encoded_password = urllib.parse.quote_plus(raw_password) if raw_password else ""
        
        if self.connection_model.db_type == "postgres":
            url = f"postgresql+psycopg2://{self.connection_model.username}:{encoded_password}@{self.connection_model.host}:{self.connection_model.port}/{self.connection_model.database_name}"
            return create_engine(url)
        elif self.connection_model.db_type == "mysql":
            url = f"mysql+pymysql://{self.connection_model.username}:{encoded_password}@{self.connection_model.host}:{self.connection_model.port}/{self.connection_model.database_name}"
            return create_engine(url)
        else:
            raise ValueError(f"Unsupported database type: {self.connection_model.db_type}")

    def test_connection(self) -> bool:
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            raise Exception(f"Connection failed: {str(e)}")

    def get_tables(self) -> List[Dict[str, Any]]:
        from database.core import Base
        internal_tables = set(Base.metadata.tables.keys())
        
        inspector = inspect(self.engine)
        table_names = inspector.get_table_names()
        
        tables = []
        with self.engine.connect() as conn:
            for t_name in table_names:
                if t_name.startswith("sqlite_") or t_name in internal_tables:
                    continue
                try:
                    quote = '`' if self.connection_model.db_type == 'mysql' else '"'
                    count = conn.execute(text(f'SELECT COUNT(*) FROM {quote}{t_name}{quote}')).scalar()
                except Exception:
                    count = 0
                    
                columns = inspector.get_columns(t_name)
                tables.append({
                    "name": t_name,
                    "columns": len(columns),
                    "records": count,
                })
        return tables

    def get_table_schema(self, table_name: str) -> List[Dict[str, Any]]:
        inspector = inspect(self.engine)
        if table_name not in inspector.get_table_names():
            raise KeyError(f"Table not found: {table_name}")
            
        columns = inspector.get_columns(table_name)
        foreign_keys = inspector.get_foreign_keys(table_name)
        pk_constraint = inspector.get_pk_constraint(table_name)
        pk_columns = pk_constraint.get("constrained_columns", []) if pk_constraint else []
        
        fk_map = {}
        for fk in foreign_keys:
            for constrained_col, referred_col in zip(fk["constrained_columns"], fk["referred_columns"]):
                fk_map[constrained_col] = {
                    "table": fk["referred_table"],
                    "column": referred_col
                }
                
        result = []
        for col in columns:
            result.append({
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": col.get("nullable", True),
                "primary_key": col["name"] in pk_columns,
                "foreign_key": fk_map.get(col["name"])
            })
        return result

    def get_indexes(self, table_name: str) -> List[Dict[str, Any]]:
        inspector = inspect(self.engine)
        if table_name not in inspector.get_table_names():
            raise KeyError(f"Table not found: {table_name}")
            
        indexes = inspector.get_indexes(table_name)
        return [
            {"name": idx["name"], "unique": idx["unique"]}
            for idx in indexes
        ]

    def execute_read_query(self, query: str, parameters: tuple = (), limit: int = 1000) -> List[Dict[str, Any]]:
        if any(kw in query.lower() for kw in ["delete ", "update ", "drop ", "insert ", "alter "]):
            raise ValueError("Only read queries are allowed")
            
        with self.engine.connect() as conn:
            cursor = conn.execute(text(query), parameters)
            # Fetch limited rows
            rows = cursor.fetchmany(limit)
            return [to_json_compatible(dict(row._mapping)) for row in rows]
            
    def get_schema(self) -> Dict[str, Any]:
        """Returns the full schema of the database as expected by Gemini."""
        tables = self.get_tables()
        schema = {}
        for t in tables:
            t_name = t["name"]
            cols = self.get_table_schema(t_name)
            schema[t_name] = [
                {"name": c["name"], "type": c["type"], "pk": 1 if c["primary_key"] else 0}
                for c in cols
            ]
        return schema
        
    def disconnect(self):
        self.engine.dispose()
