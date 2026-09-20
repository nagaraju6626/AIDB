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


def _natural_language_check(question: str, schema: Dict[str, Any], adapter: Any) -> None:
    tables, columns = _schema_candidates(schema)
    known_words = {word.lower() for word in tables + columns}
    words = _tokens(question)

    for word in words:
        if word.lower() in known_words or len(word) < 3:
            continue
        table_match = _similar(word, tables)
        if table_match:
            raise QueryCorrectionError(
                "INVALID_TABLE",
                f"Table '{word}' does not exist.",
                f"Did you mean '{table_match}'?",
                question.replace(word, table_match),
            )
        column_match = _similar(word, columns)
        if column_match:
            raise QueryCorrectionError(
                "INVALID_COLUMN",
                f"Column '{word}' does not exist in the selected database.",
                f"Did you mean '{column_match}'?",
                question.replace(word, column_match),
            )

    # Only compare likely filter values. Unknown values elsewhere are allowed and can validly return zero rows.
    for match in re.finditer(r"\b(?:from|where|in|is|equals?)\s+['\"]?([A-Za-z][A-Za-z0-9 _-]*)", question, re.IGNORECASE):
        value = match.group(1).strip().split()[0].strip("'\"")
        if len(value) < 4 or value.lower() in known_words:
            continue
        for table_name, table_columns in schema.items():
            for column in table_columns:
                column_name = column["name"]
                if str(column.get("type", "")).lower().startswith(("varchar", "char", "text")):
                    try:
                        rows = adapter.execute_read_query(
                            f"SELECT DISTINCT `{column_name}` FROM `{table_name}` WHERE `{column_name}` IS NOT NULL LIMIT 200"
                        )
                    except Exception:
                        continue
                    values = [str(row.get(column_name)) for row in rows if row.get(column_name) is not None]
                    match_value = _similar(value, values)
                    if match_value:
                        raise QueryCorrectionError(
                            "INVALID_VALUE",
                            f"'{value}' was not found as a matching value in the selected database.",
                            f"Did you mean '{match_value}'?",
                            question.replace(value, match_value),
                        )


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

    looks_like_sql = question.lstrip().lower().startswith(("select", "with", "delete", "update", "insert", "drop", "alter", "truncate", "create", "grant", "revoke"))
    if looks_like_sql:
        return _sql_check(question, schema, adapter, dialect)

    _natural_language_check(question, schema, adapter)
    return _sql_check(generated_sql, schema, adapter, dialect)
