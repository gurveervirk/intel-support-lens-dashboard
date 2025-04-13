from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class BaseCitation(BaseModel):
    file_path: str
    score: float

class Citation(BaseCitation):
    content: str

class QueryEngineResponse(BaseModel):
    response: str
    citations: list[Citation]

class LLMResponseMetrics(BaseModel):
    success_rate: float
    avg_latency: float

class TopSimilarDocument(BaseModel):
    file_path: str
    score: float
    content: str

class TopQueriedDocument(BaseModel):
    file_path: str
    count: int

class QueryLogVolumeMetrics(BaseModel):
    daily_count: int
    weekly_count: int
    monthly_count: int

class UserQuery(BaseModel):
    query: str

class Timeframe(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = date.today()

class TopKQuery(BaseModel):
    k: Optional[int] = None

class TopKSimilarDocumentQuery(TopKQuery):
    query: str

class TopKDocCiteQuery(TopKQuery, Timeframe):
    pass

class QueryLogInput(TopKQuery, Timeframe):
    include_citations: Optional[bool] = False
    include_errors: Optional[bool] = False

class QueryLogOutput(BaseModel):
    id: int
    query: str
    response: str
    latency: float
    success: bool
    error: Optional[str] = None
    timestamp: datetime
    citations: Optional[list[Citation]] = None