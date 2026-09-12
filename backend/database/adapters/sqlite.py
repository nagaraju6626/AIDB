import sqlite3
from typing import List, Dict, Any
from .base import DatabaseAdapter

class SQLiteAdapter(DatabaseAdapter):
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection = None

    def connect(self):
        # connect to the database in read-only mode by using uri
        # actually sqlite3 python driver needs URI support
        self.connection = sqlite3.connect(f"file:{self.db_path}?mode=ro", uri=True)
        self.connection.row_factory = sqlite3.Row

    def disconnect(self):
        if self.connection:
            self.connection.close()

    def get_schema(self) -> Dict[str, Any]:
        if not self.connection:
            self.connect()
        cursor = self.connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        schema = {}
        for table_row in tables:
            table_name = table_row['name']
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            schema[table_name] = [
                {"name": col['name'], "type": col['type'], "pk": col['pk']}
                for col in columns
            ]
        return schema

    def execute_safe_query(self, query: str, limit: int = 1000) -> List[Dict[str, Any]]:
        if not self.connection:
            self.connect()
        cursor = self.connection.cursor()
        
        # Enforce limit implicitly by limiting fetch, though the query should ideally have a LIMIT
        cursor.execute(query)
        rows = cursor.fetchmany(limit)
        
        results = []
        for row in rows:
            results.append(dict(row))
        return results
