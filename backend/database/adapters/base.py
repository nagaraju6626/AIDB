from abc import ABC, abstractmethod
from typing import List, Dict, Any

class DatabaseAdapter(ABC):
    @abstractmethod
    def connect(self):
        pass

    @abstractmethod
    def disconnect(self):
        pass

    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """Returns the full schema of the database."""
        pass

    @abstractmethod
    def execute_safe_query(self, query: str, limit: int = 1000) -> List[Dict[str, Any]]:
        """Executes a READ-ONLY query and returns results."""
        pass
