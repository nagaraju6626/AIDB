import os
import json
import time
from typing import Dict, Any
from groq import Groq
from groq import APIError, APIConnectionError, RateLimitError

api_key = os.environ.get("GROQ_API_KEY")

MODEL_NAME = os.environ.get("AI_MODEL", "qwen-2.5-32b")

class AIService:
    def __init__(self):
        self.api_key = api_key
        # Delay throwing an error to avoid crashing FastAPI startup.
        # Initialize client with a dummy key if missing to avoid immediate SDK crashes.
        self.client = Groq(api_key=api_key or "UNCONFIGURED_KEY", timeout=15.0)
        self.model_name = "qwen/qwen3.8-27b"

    def _execute_with_retry(self, func, *args, **kwargs):
        max_retries = 3
        base_delay = 2
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except RateLimitError as e:
                if attempt == max_retries - 1:
                    raise Exception("Groq API quota exceeded or rate limited. Please try again later.")
                
                # Check for Retry-After header if available
                retry_after = None
                if hasattr(e, 'response') and e.response:
                    retry_after = e.response.headers.get('retry-after')
                
                if retry_after:
                    try:
                        delay = float(retry_after)
                    except ValueError:
                        delay = base_delay * (2 ** attempt)
                else:
                    delay = base_delay * (2 ** attempt)
                
                time.sleep(delay)
            except APIConnectionError as e:
                raise Exception("Failed to connect to Groq API. Please check your network connection.")
            except APIError as e:
                if "invalid api key" in str(e).lower() or getattr(e, 'status_code', None) == 401:
                    raise Exception("AI service configuration is invalid. Please configure a valid Groq API key on the backend.")
                raise Exception(f"AI Service error: {str(e)}")
            except Exception as e:
                error_str = str(e)
                if "API_KEY_INVALID" in error_str:
                    raise Exception("AI service configuration is invalid. Please configure a valid Groq API key on the backend.")
                raise Exception(f"AI Service error: {error_str}")

    def generate_sql(self, question: str, schema: Dict[str, Any], dialect: str = "sqlite") -> Dict[str, Any]:
        """Generates SQL and structured metadata from a natural language question."""
        system_prompt = f"""
You are an AI Database Assistant. Your task is to translate a natural language question into a SQL query for a {dialect} database.
You are given the following database schema (tables and columns):
{json.dumps(schema, indent=2)}

Important Rules:
1. ONLY use the tables and columns provided in the schema.
2. Return a valid {dialect} SQL query.
3. Your output MUST be a JSON object with the following structure:
{{
  "intent": "A short summary of what the user is asking",
  "tables": ["list", "of", "tables", "used"],
  "sql": "SELECT ... FROM ...",
  "chart_type": "bar | line | pie | scatter | none"
}}

Determine the most appropriate chart type based on the expected result.
- bar: for categorical comparisons
- line: for time series
- pie: for percentages
- none: if no chart makes sense

DO NOT wrap your response in markdown blocks. Return ONLY valid JSON.
"""
        if not self.api_key:
            raise Exception("API_KEY_INVALID")

        def _call_groq():
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User Question: \"{question}\""}
                ],
                model=self.model_name,
                response_format={"type": "json_object"},
                temperature=0.1
            )
            return response.choices[0].message.content

        try:
            content = self._execute_with_retry(_call_groq)
            return json.loads(content)
        except json.JSONDecodeError:
            raise Exception("AI Service returned invalid SQL format. Please rephrase your question.")

    def generate_insight(self, question: str, sql: str, results: list) -> str:
        """Generates a natural language insight based on the query results."""
        # Limit results length to avoid token explosion
        results_subset = results[:50]
        system_prompt = "You are a helpful data analyst. Provide a very concise, natural language summary of the query results to directly answer the user's question. Do not explain the SQL. Just give the answer derived from the data. Keep it under 3 sentences."
        
        user_prompt = f"""
User asked: "{question}"
Executed SQL: {sql}
Results (up to 50 rows): {json.dumps(results_subset)}
"""
        if not self.api_key:
            return "Insight unavailable: AI service configuration is invalid."

        def _call_groq():
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model_name,
                temperature=0.3
            )
            return response.choices[0].message.content.strip()

        try:
            return self._execute_with_retry(_call_groq)
        except Exception as e:
            if "quota exceeded" in str(e).lower() or "rate limit" in str(e).lower():
                return "Insight unavailable: Groq API rate limit exceeded."
            if "invalid" in str(e).lower() or "configuration" in str(e).lower():
                return "Insight unavailable: AI service configuration is invalid."
            return f"Insight unavailable due to an AI error: {str(e)}"
