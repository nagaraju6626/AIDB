import sqlglot
from sqlglot import parse_one, exp

class SQLValidationError(Exception):
    pass

def validate_sql(query: str, dialect: str = "sqlite") -> str:
    """
    Validates that a SQL query is read-only (SELECT) and applies a LIMIT if necessary.
    Raises SQLValidationError if destructive operations are found.
    """
    try:
        parsed = parse_one(query, read=dialect)
    except Exception as e:
        raise SQLValidationError(f"Could not parse SQL: {str(e)}")

    # Check if the root expression is a Select statement
    if not isinstance(parsed, exp.Select):
        raise SQLValidationError("Only SELECT queries are allowed. Destructive operations are blocked.")

    # Check for destructive operations anywhere in the AST
    destructive_types = (exp.Delete, exp.Update, exp.Insert, exp.Drop, exp.Alter, exp.Command)
    for d_type in destructive_types:
        if list(parsed.find_all(d_type)):
            raise SQLValidationError("Destructive operations (DELETE, UPDATE, INSERT, DROP, ALTER) are not allowed.")

    # Ensure a limit is set to prevent massive data pulls
    if not parsed.args.get("limit"):
        parsed = parsed.limit(1000)
    else:
        # Optionally, restrict the maximum limit
        limit_val = parsed.args["limit"].expression
        if isinstance(limit_val, exp.Literal) and limit_val.is_number:
            if int(limit_val.name) > 1000:
                 parsed = parsed.limit(1000)

    return parsed.sql(dialect=dialect)
