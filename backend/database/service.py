import os
import sqlite3
from typing import Any, Dict, List


class SQLiteDatabaseService:
    """Read-only metadata and health access for configured SQLite databases."""

    def __init__(self, database_name: str):
        self.database_path = self._resolve_path(database_name)

    @staticmethod
    def _resolve_path(database_name: str) -> str:
        if os.path.isabs(database_name):
            return database_name
        return os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), database_name))

    def connect(self) -> sqlite3.Connection:
        if not os.path.exists(self.database_path):
            raise FileNotFoundError(f"Database file not found: {self.database_path}")
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def test_connection(self) -> bool:
        with self.connect() as connection:
            connection.execute("SELECT 1")
        return True

    def get_tables(self) -> List[Dict[str, Any]]:
        with self.connect() as connection:
            table_rows = connection.execute(
                "SELECT name FROM sqlite_master "
                "WHERE type = 'table' AND name NOT LIKE 'sqlite_%' "
                "ORDER BY name"
            ).fetchall()
            tables = []
            for table_row in table_rows:
                table_name = table_row["name"]
                record_count = connection.execute(
                    f'SELECT COUNT(*) AS count FROM "{table_name}"'
                ).fetchone()["count"]
                tables.append({
                    "name": table_name,
                    "columns": len(self.get_table_schema(table_name, connection)),
                    "records": record_count,
                })
            return tables

    def get_table_schema(
        self, table_name: str, connection: sqlite3.Connection | None = None
    ) -> List[Dict[str, Any]]:
        if not table_name.replace("_", "").isalnum():
            raise ValueError("Invalid table name")
        owns_connection = connection is None
        active_connection = connection or self.connect()
        try:
            table_exists = active_connection.execute(
                "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
                (table_name,),
            ).fetchone()
            if not table_exists:
                raise KeyError(f"Table not found: {table_name}")

            foreign_keys = active_connection.execute(
                f'PRAGMA foreign_key_list("{table_name}")'
            ).fetchall()
            foreign_key_map = {row["from"]: row for row in foreign_keys}
            columns = active_connection.execute(
                f'PRAGMA table_info("{table_name}")'
            ).fetchall()
            return [
                {
                    "name": column["name"],
                    "type": column["type"] or "TEXT",
                    "nullable": not bool(column["notnull"]),
                    "primary_key": bool(column["pk"]),
                    "foreign_key": (
                        {
                            "table": foreign_key_map[column["name"]]["table"],
                            "column": foreign_key_map[column["name"]]["to"],
                        }
                        if column["name"] in foreign_key_map
                        else None
                    ),
                }
                for column in columns
            ]
        finally:
            if owns_connection:
                active_connection.close()

    def get_indexes(self, table_name: str) -> List[Dict[str, Any]]:
        if not table_name.replace("_", "").isalnum():
            raise ValueError("Invalid table name")
        with self.connect() as connection:
            indexes = connection.execute(
                f'PRAGMA index_list("{table_name}")'
            ).fetchall()
            return [{"name": row["name"], "unique": bool(row["unique"])} for row in indexes]

    def execute_read_query(self, query: str, parameters: tuple = ()) -> List[Dict[str, Any]]:
        if "delete" in query.lower() or "update" in query.lower() or "drop" in query.lower() or "insert" in query.lower():
            raise ValueError("Only read queries are allowed")
        with self.connect() as connection:
            cursor = connection.execute(query, parameters)
            return [dict(row) for row in cursor.fetchall()]
