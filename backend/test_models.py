import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"), timeout=10.0)
models = client.models.list()
for m in models.data:
    print(m.id)
