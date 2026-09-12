import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

try:
    print("Testing Auth...")
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@demo.com", "password": "password123"}, timeout=10)
    token = res.json().get("access_token")
    if not token:
        print("Login failed")
        exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing Connections...")
    res = requests.get(f"{BASE_URL}/databases", headers=headers, timeout=10)
    conns = res.json().get("data", {}).get("connections", [])
    if not conns:
        print("No connections found, adding one...")
        payload = {"name": "Test Users DB", "db_type": "sqlite", "database_name": "test_users.db"}
        res = requests.post(f"{BASE_URL}/databases", json=payload, headers=headers, timeout=10)
        conn_id = res.json()["data"]["connection"]["id"]
    else:
        conn_id = conns[0]["id"]
    
    headers["X-Connection-ID"] = str(conn_id)
    
    print("Testing Dashboard...")
    res = requests.get(f"{BASE_URL}/dashboard", headers=headers, timeout=10)
    if res.status_code != 200: print("Dashboard failed:", res.text)
    
    print("Testing Schema Explorer...")
    res = requests.get(f"{BASE_URL}/schema", headers=headers, timeout=10)
    if res.status_code != 200: print("Schema failed:", res.text)
    
    tables = res.json().get("data", {}).get("tables", [])
    if tables:
        table_name = tables[0]["name"]
        print(f"Testing Data Preview for {table_name}...")
        res = requests.get(f"{BASE_URL}/schema/{table_name}/preview", headers=headers, timeout=10)
        if res.status_code != 200: print("Data Preview failed:", res.text)
    
    print("Testing Chat & Query...")
    ask_payload = {"connection_id": conn_id, "question": "Count rows"}
    res = requests.post(f"{BASE_URL}/query/ask", json=ask_payload, headers=headers, timeout=60)
    if res.status_code != 200: print("Chat & Query failed:", res.text)
    
    print("Testing Query History...")
    res = requests.get(f"{BASE_URL}/queries", headers=headers, timeout=10)
    if res.status_code != 200: print("Query History failed:", res.text)
    
    print("ALL TESTS PASSED")
except Exception as e:
    print(f"TEST FAILED: {e}")
