import unittest

from services.query_validator import QueryCorrectionError, validate_query_before_execution


class ValidationAdapter:
    def __init__(self):
        self.user_queries = []

    def execute_read_query(self, query):
        if "SELECT DISTINCT" in query:
            return [{"city": "Hyderabad"}, {"city": "Mumbai"}, {"city": "Delhi"}]
        self.user_queries.append(query)
        raise AssertionError("user SQL execution was reached")


SCHEMA = {
    "customers": [
        {"name": "customer_id", "type": "int"},
        {"name": "city", "type": "varchar(50)"},
    ],
    "products": [{"name": "product_name", "type": "varchar(100)"}],
}


class QueryValidationTests(unittest.TestCase):
    def test_hderabad_typo_is_blocked_before_user_sql_execution(self):
        adapter = ValidationAdapter()

        with self.assertRaises(QueryCorrectionError) as context:
            validate_query_before_execution(
                "SELECT * FROM customers WHERE city = 'hderabad' LIMIT 1000",
                "SELECT * FROM customers WHERE city = 'hderabad' LIMIT 1000",
                SCHEMA,
                adapter,
                "mysql",
            )

        self.assertEqual(context.exception.error_type, "INVALID_VALUE")
        self.assertIn("Hyderabad", context.exception.suggestion)
        self.assertEqual(adapter.user_queries, [])

    def test_unknown_but_valid_value_is_allowed_to_return_zero_rows(self):
        adapter = ValidationAdapter()
        sql = validate_query_before_execution(
            "SELECT * FROM customers WHERE city = 'Pune'",
            "SELECT * FROM customers WHERE city = 'Pune'",
            SCHEMA,
            adapter,
            "mysql",
        )
        self.assertIn("Pune", sql)
        self.assertEqual(adapter.user_queries, [])


if __name__ == "__main__":
    unittest.main()
