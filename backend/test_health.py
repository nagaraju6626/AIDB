import requests

try:
    res = requests.get("http://127.0.0.1:8000/api/health")
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
except Exception as e:
    print("Error:", e)
