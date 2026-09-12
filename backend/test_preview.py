import requests

BASE_URL = "http://127.0.0.1:8000/api"

try:
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@demo.com", "password": "password123"}, timeout=10)
    token = res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}", "X-Connection-ID": "11"} # using conn_id 11 since we saved it earlier, or maybe 1?
    
    # Try fetching schema first
    res = requests.get(f"{BASE_URL}/schema", headers=headers, timeout=10)
    print("Schema Response:", res.status_code)
    
    # Let's see tables
    tables = res.json().get("data", {}).get("tables", [])
    if tables:
        table_name = tables[0]["name"]
        print(f"Trying preview for table: {table_name}")
        res2 = requests.get(f"{BASE_URL}/schema/{table_name}/preview", headers=headers, timeout=10)
        print("Preview Response Status:", res2.status_code)
        print("Preview Response:", res2.text[:200])
except Exception as e:
    print(e)
