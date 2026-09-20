import os
import json
import time
import logging
from typing import Dict, Any, Tuple
from groq import Groq
from groq import APIError, APIConnectionError, RateLimitError

logger = logging.getLogger(__name__)

DEFAULT_MODEL_NAME = "qwen/qwen3.8-27b"

def _get_api_key() -> str | None:
    value = os.getenv("GROQ_API_KEY")
    if not value:
        return None
    return value.strip().strip('"').strip("'").strip() or None

class AIService:
    def __init__(self):
        self.api_key = _get_api_key()
        self.model_name = os.getenv("AI_MODEL", DEFAULT_MODEL_NAME).strip() or DEFAULT_MODEL_NAME
        self.client = Groq(api_key=self.api_key, timeout=15.0) if self.api_key else None
        logger.info(
            "Groq API key configured: %s; model configured: %s",
            "YES" if self.api_key else "NO",
            self.model_name,
        )

    def _execute_with_retry(self, func, *args, **kwargs):
        max_retries = 3
        base_delay = 2
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except RateLimitError as e:
                logger.warning(f"Groq API rate limit on attempt {attempt + 1}/{max_retries}")
                if attempt == max_retries - 1:
                    logger.error("Groq API quota exceeded or rate limited after max retries.")
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
                
                logger.info(f"Retrying Groq API after {delay} seconds...")
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
        if not self.api_key or self.client is None:
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

    def _generate_fallback_insight(self, results: list) -> str:
        if not results:
            return "No records matched this query."
        
        if len(results) == 1:
            row = results[0]
            parts = []
            for k, v in row.items():
                if isinstance(v, (int, float)):
                    parts.append(f"{k} is {v}")
            if parts:
                return f"The result shows that {', '.join(parts)}."
            return f"The query returned a single record with {list(row.keys())[0]} as {list(row.values())[0]}."

        columns = list(results[0].keys())
        numeric_cols = [c for c in columns if isinstance(results[0][c], (int, float))]
        
        if numeric_cols:
            col = numeric_cols[0]
            sorted_res = sorted([r for r in results if r.get(col) is not None], key=lambda x: x[col], reverse=True)
            if sorted_res:
                highest = sorted_res[0]
                non_numeric = [c for c in columns if c != col]
                if non_numeric:
                    label_col = non_numeric[0]
                    label_val = highest.get(label_col)
                    return f"The highest {col} is {highest[col]} for {label_val}."
                return f"The highest {col} is {highest[col]}."
                
        return f"The query returned {len(results)} records."

    def generate_insight(self, question: str, sql: str, results: list) -> Dict[str, str]:
        """Generates a natural language insight based on the query results."""
        # Limit results length to avoid token explosion
        results_subset = results[:50]
        system_prompt = "You are a helpful data analyst. Provide a very concise, natural language summary of the query results to directly answer the user's question. Do not explain the SQL. Just give the answer derived from the data. Keep it under 3 sentences."
        
        user_prompt = f"""
User asked: "{question}"
Executed SQL: {sql}
Results (up to 50 rows): {json.dumps(results_subset)}
"""
        if not self.api_key or self.client is None:
            return {"insight": self._generate_fallback_insight(results), "insight_source": "fallback"}

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
            insight_text = self._execute_with_retry(_call_groq)
            return {"insight": insight_text, "insight_source": "ai"}
        except Exception as e:
            logger.warning(f"AI Insight generation failed: {str(e)}. Using fallback activation.")
            return {"insight": self._generate_fallback_insight(results), "insight_source": "fallback"}
