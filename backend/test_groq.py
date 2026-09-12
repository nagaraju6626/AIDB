import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
print(f"GROQ_API_KEY loaded: {'Yes' if api_key else 'No'}, length: {len(api_key) if api_key else 0}")

try:
    client = Groq(api_key=api_key, timeout=10.0)
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": "Hello, just testing connectivity."}],
        model="qwen/qwen3.8-27b",
        max_tokens=10
    )
    print("Groq connectivity test: SUCCESS")
    print("Response:", response.choices[0].message.content.strip())
except Exception as e:
    print("Groq connectivity test: FAILED")
    print("Error:", str(e))
