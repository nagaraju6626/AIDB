import sqlglot
from sqlglot import exp

queries = [
    "show me the top 5 products",
    "give me the best selling products",
    "which product sold the most",
    "show customers from Hyderabad",
    "give me products above 1000",
    "how many customers are there",
    "show sales by region",
    "which product sale more",
    "give top product",
    "show product sold most",
    "customer from hyderabad",
    "show top 5 products",
    "give me customer details from Hyderabad",
    "which region has highest sales",
    "give top selling products",
    "SELECT * FROM products;",
    "SELECT product_name FROM products;",
    "SELECT product FROM products;",
    "SELECT * FORM products;",
    "SELECT product FORM products;",
    "select customers from hyderabad",
    "select the best product"
]

for q in queries:
    try:
        parsed = sqlglot.parse_one(q, read="mysql")
        is_cmd = isinstance(parsed, exp.Command)
        print(f"[{'CMD' if is_cmd else 'SQL'}] {q}")
    except Exception as e:
        print(f"[ERR] {q}")
