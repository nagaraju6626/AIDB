import difflib
import re
from typing import Any, Dict, Optional

from sqlglot import exp, parse_one

from services.sql_validator import SQLValidationError, validate_sql


class QueryCorrectionError(Exception):
    def __init__(self, error_type: str, message: str, suggestion: str, corrected_query: str):
        super().__init__(message)
        self.error_type = error_type
        self.message = message
        self.suggestion = suggestion
        self.corrected_query = corrected_query


def _similar(value: str, candidates: list[str]) -> Optional[str]:
    value_lower = value.lower()
    ranked = sorted(
        ((difflib.SequenceMatcher(None, value_lower, candidate.lower()).ratio(), candidate) for candidate in candidates),
        reverse=True,
    )
    for score, candidate in ranked:
        if score >= 0.82 and candidate.lower() != value_lower:
            if candidate.lower() == f"{value_lower}s" or value_lower == f"{candidate.lower()}s":
                continue
            return candidate
    return None


def _tokens(question: str) -> list[str]:
    return re.findall(r"[A-Za-z_][A-Za-z0-9_]*", question)


def _schema_candidates(schema: Dict[str, Any]) -> tuple[list[str], list[str]]:
    tables = list(schema.keys())
    columns = [column["name"] for table in schema.values() for column in table]
    return tables, columns



def _sql_check(sql: str, schema: Dict[str, Any], adapter: Any, dialect: str) -> str:
    try:
        parsed = parse_one(sql, read=dialect)
    except Exception as exc:
        raise QueryCorrectionError(
            "INVALID_SQL",
            "The SQL could not be parsed.",
            str(exc),
            sql,
        ) from exc

    try:
        safe_sql = validate_sql(sql, dialect=dialect)
    except SQLValidationError as exc:
        raise QueryCorrectionError(
            "UNSUPPORTED_OPERATION",
            str(exc),
            "This assistant currently supports read-only database queries.",
            sql,
        ) from exc

    tables = [table.name for table in parsed.find_all(exp.Table)]
    for table_name in tables:
        if table_name not in schema:
            replacement = _similar(table_name, list(schema.keys()))
            raise QueryCorrectionError(
                "INVALID_TABLE",
                f"Table '{table_name}' does not exist.",
                f"Did you mean '{replacement}'?" if replacement else "Check the table name in the selected database.",
                sql.replace(table_name, replacement, 1) if replacement else sql,
            )

    available_columns = {
        column["name"].lower()
        for table_name in tables
        for column in schema.get(table_name, [])
    }

    # Check unquoted text identifiers before generic column validation so the error explains
    # that a literal needs quotes instead of reporting it only as an unknown column.
    for comparison in parsed.find_all(exp.EQ):
        right = comparison.right
        if isinstance(right, exp.Column) and right.name.lower() not in available_columns:
            suggested_sql = re.sub(
                rf"(?<!['\"`])\b{re.escape(right.name)}\b(?!['\"`])",
                f"'{right.name}'",
                sql,
                count=1,
            )
            raise QueryCorrectionError(
                "INVALID_SQL_VALUE",
                f"'{right.name}' is a text value and should be enclosed in quotes.",
                f"Suggested SQL: {suggested_sql}",
                suggested_sql,
            )

    for column in parsed.find_all(exp.Column):
        if column.name == "*" or column.name.lower() in available_columns:
            continue
        replacement = _similar(column.name, list(available_columns))
        raise QueryCorrectionError(
            "INVALID_COLUMN",
            f"Column '{column.name}' does not exist in the selected table(s).",
            f"Did you mean '{replacement}'?" if replacement else "Check the column name in the selected database.",
            sql.replace(column.name, replacement, 1) if replacement else sql,
        )

    # Validate quoted string filters only when a strong match exists. An unknown value
    # without a close database value remains valid and may legitimately return zero rows.
    table_aliases = {table.alias_or_name: table.name for table in parsed.find_all(exp.Table)}
    for comparison in parsed.find_all(exp.EQ):
        left = comparison.left
        right = comparison.right
        if not isinstance(left, exp.Column) or not isinstance(right, exp.Literal) or not right.is_string:
            continue
        table_name = table_aliases.get(left.table, left.table) if left.table else (tables[0] if len(tables) == 1 else None)
        if not table_name or table_name not in schema:
            continue
        column_definition = next(
            (column for column in schema[table_name] if column["name"].lower() == left.name.lower()),
            None,
        )
        if not column_definition or not str(column_definition.get("type", "")).lower().startswith(("varchar", "char", "text")):
            continue
        try:
            rows = adapter.execute_read_query(
                f"SELECT DISTINCT `{left.name}` FROM `{table_name}` WHERE `{left.name}` IS NOT NULL LIMIT 200"
            )
        except Exception:
            continue
        values = [str(row.get(left.name)) for row in rows if row.get(left.name) is not None]
        replacement = _similar(right.name, values)
        if replacement:
            raise QueryCorrectionError(
                "INVALID_VALUE",
                f"The value '{right.name}' was not found for column '{left.name}'.",
                f"Did you mean '{replacement}'?",
                sql.replace(right.sql(dialect=dialect), f"'{replacement}'", 1),
            )

    return safe_sql


def is_sql_query(question: str, dialect: str = "mysql") -> bool:
    q = question.strip()
    q_lower = q.lower()
    
    sql_starts = ("select", "with", "explain", "show", "describe", "delete", "update", "insert", "drop", "alter", "truncate", "create", "grant", "revoke")
    if not q_lower.startswith(sql_starts):
        return False
        
    if q.endswith(';'):
        return True
        
    if q_lower.startswith("show "):
        tokens = q_lower.split()
        if len(tokens) > 1 and tokens[1] not in ("tables", "databases", "columns", "index", "status", "variables", "create", "grants", "warnings", "errors"):
            return False
            
    if q_lower.startswith("select "):
        tokens = q_lower.split()
        if len(tokens) > 1 and tokens[1] in ("the", "me", "all", "a"):
            return False
            
    uppercase_keywords = ["SELECT ", "FROM ", "WHERE ", "GROUP BY ", "ORDER BY ", "JOIN "]
    if any(kw in q for kw in uppercase_keywords):
        return True

    if "*" in q:
        return True
        
    if q_lower.startswith("select ") and re.search(r'\b(from|form|where|join|group by|order by|limit)\b', q_lower):
        return True
        
    try:
        parsed = parse_one(q, read=dialect)
        if not isinstance(parsed, exp.Command):
            return True
    except Exception:
        pass
        
    return False


def validate_query_before_execution(
    question: str,
    generated_sql: str,
    schema: Dict[str, Any],
    adapter: Any,
    dialect: str,
) -> str:
    if not question.strip():
        raise QueryCorrectionError(
            "EMPTY_QUERY",
            "Please enter a database question.",
            "Enter a natural-language question or a read-only SELECT query.",
            question,
        )

    looks_like_sql = is_sql_query(question, dialect)
    if looks_like_sql:
        return _sql_check(question, schema, adapter, dialect)


    return _sql_check(generated_sql, schema, adapter, dialect)
