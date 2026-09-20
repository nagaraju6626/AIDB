from services.query_validator import validate_query_before_execution, is_sql_query, QueryCorrectionError

class DummyAdapter:
    def execute_read_query(self, sql):
        return []

schema = {
    "products": [
        {"name": "product_id", "type": "int"},
        {"name": "product_name", "type": "varchar(255)"}
    ],
    "customers": [
        {"name": "customer_id", "type": "int"},
        {"name": "first_name", "type": "varchar(255)"},
        {"name": "city", "type": "varchar(255)"}
    ]
}
adapter = DummyAdapter()

def check(question: str):
    print(f"\n--- Testing: '{question}' ---")
    is_sql = is_sql_query(question)
    if is_sql:
        print("-> Detected as: SQL")
        generated_sql = question
    else:
        print("-> Detected as: NATURAL LANGUAGE (Will go to AI)")
        # Simulate AI generating valid SQL
        generated_sql = "SELECT customer_id FROM customers WHERE city = 'Hyderabad'" if 'customer' in question else "SELECT product_name FROM products"
        
    try:
        validate_query_before_execution(question, generated_sql, schema, adapter, "mysql")
        print("-> Validation Result: PASSED (Will execute)")
    except QueryCorrectionError as e:
        print(f"-> Validation Result: ERROR -> {e.message}")
    except Exception as e:
        print(f"-> Validation Result: UNKNOWN ERROR -> {e}")

check("show the customer in Hyderabad")
check("give me the product name")
check("show me the top 5 products")
check("SELECT * FROM customers;")
check("SELECT customer FROM customers;")
check("SELECT * FORM customers;")
