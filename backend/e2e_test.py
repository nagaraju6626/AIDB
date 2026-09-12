import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000/api"

print("1. Logging in...")
res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@demo.com", "password": "password123"}, timeout=10)
token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("2. Testing connection parameters (SQLite)...")
payload = {
    "name": "Test Users DB",
    "db_type": "sqlite",
    "database_name": "test_users.db"
}
res = requests.post(f"{BASE_URL}/databases/test", json=payload, headers=headers, timeout=20)
print("Test params response:", res.json())

print("3. Saving connection...")
res = requests.post(f"{BASE_URL}/databases", json=payload, headers=headers, timeout=10)
conn_id = res.json()["data"]["connection"]["id"]
print("Saved connection ID:", conn_id)

print("4. Fetching schema for new active connection...")
res = requests.get(f"{BASE_URL}/schema", headers={**headers, "X-Connection-ID": str(conn_id)}, timeout=10)
schema = res.json()
print("Schema tables:", schema.get("data", {}).get("tables", []))

print("5. Previewing table data (users)...")
res = requests.get(f"{BASE_URL}/schema/users/preview", headers={**headers, "X-Connection-ID": str(conn_id)}, timeout=10)
print("Data preview:", res.json().get("data", {}).get("rows", []))

print("6. Asking natural language question...")
ask_payload = {
    "connection_id": conn_id,
    "question": "Show all active users."
}
res = requests.post(f"{BASE_URL}/query/ask", json=ask_payload, headers=headers, timeout=60)
print("AI Query response status:", res.status_code)
print("AI Query response:", json.dumps(res.json(), indent=2))

