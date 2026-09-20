import re

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
        from sqlglot import parse_one, exp
        parsed = parse_one(q, read=dialect)
        if not isinstance(parsed, exp.Command):
            return True
    except Exception:
        pass
        
    return False

queries = {
    "show me the top 5 products": False,
    "which product sold the most": False,
    "show customers from Hyderabad": False,
    "show sales by region": False,
    "show product sold most": False,
    "show top 5 products": False,
    "give me customer details from Hyderabad": False,
    "which region has highest sales": False,
    "SELECT * FROM products;": True,
    "SELECT product_name FROM products;": True,
    "SELECT product FROM products;": True,
    "SELECT * FORM products;": True,
    "SELECT product FORM products;": True,
    "select product form products": True,  
    "select customers from hyderabad": True,
    "select the best product": False
}

for q, expected in queries.items():
    res = is_sql_query(q)
    if res != expected:
        print(f"[FAIL] {q} -> got {res} expected {expected}")
    else:
        print(f"[PASS] {q}")
