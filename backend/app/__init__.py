from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from datetime import date, timedelta
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from llama_index.core import Settings
from datetime import date
from .db import Ingestor, QueryEngine, QueryLog, CitedDocument
from .models import (
    QueryEngineResponse, 
    LLMResponseMetrics, 
    TopQueriedDocument, 
    QueryLogVolumeMetrics,
    UserQuery,
    Timeframe,
    TopKSimilarDocumentQuery,
    TopKDocCiteQuery,
    QueryLogInput,
    QueryLogOutput,
    Citation,
    TopSimilarDocument
)
import os
import logging
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Initialize Google GenAI LLM and Embedding models
Settings.llm = GoogleGenAI(
    model="gemini-2.0-flash",
)
Settings.embed_model = GoogleGenAIEmbedding(
    model="text-embedding-004",
    embed_batch_size=100
)

# Initialize FastAPI app
app = FastAPI()

# CORS middleware configuration
origins = [
    "http://localhost:8080",  # Allow requests from this origin
    "http://localhost",
    "http://localhost:3000",
    "*", # TODO: Remove wildcard in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Database setup
DATABASE_URL = os.getenv("CONNECTION_STRING")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize Ingestor and QueryEngine instances
ingestor = Ingestor()
query_engine = QueryEngine(ingestor=ingestor)

# Get TEMP_DIR from environment variables
TEMP_DIR = os.getenv("TEMP_DIR", "../temp")

# Endpoint to upload support documents
@app.post("/upload-docs/")
async def upload_docs(files: list[UploadFile] = File(...)):
    """Upload support documents (pdf, md, csv)."""
    try:
        # Log the input files
        logger.info(f"Received {len(files)} files for upload.")
        for file in files:
            logger.info(f"File name: {file.filename}, Content type: {file.content_type}")
        # Save uploaded files to the 'TEMP_DIR' directory
        os.makedirs(TEMP_DIR, exist_ok=True)

        for file in files:
            file_path = os.path.join(TEMP_DIR, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())

        # Load the data into the vector store
        ingestor.load_data()

        return {"message": "Files uploaded and ingested successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to get query log volume per day, week, and month
@app.get("/query-log-volume/", response_model=QueryLogVolumeMetrics)
async def get_query_log_volume(db: Session = Depends(get_db)):
    """Get query log volume per day, week, and month."""
    today = date.today()
    daily_volume = db.query(func.count(QueryLog.id)).filter(func.date(QueryLog.timestamp) == today).scalar()
    weekly_volume = db.query(func.count(QueryLog.id)).filter(QueryLog.timestamp >= today - timedelta(days=7)).scalar()
    monthly_volume = db.query(func.count(QueryLog.id)).filter(QueryLog.timestamp >= today - timedelta(days=30)).scalar()

    return QueryLogVolumeMetrics(
        daily_count=daily_volume,
        weekly_count=weekly_volume,
        monthly_count=monthly_volume
    )

# Endpoint to get top K queried documents
@app.post("/top-queried-documents/", response_model=list[TopQueriedDocument])
async def get_top_queried_documents(query: TopKDocCiteQuery, db: Session = Depends(get_db)):
    """Get top K queried documents."""
    k = query.k
    start_date = query.start_date
    end_date = query.end_date

    if k is not None and k <= 0:
        raise HTTPException(status_code=400, detail="K must be a positive integer")
    
    if start_date is None:
        # If start_date is None, get all records up to end_date
        start_date = date(1970, 1, 1)  # Use a very old date as the starting point
    
    if end_date is not None and end_date < start_date:
        raise HTTPException(status_code=400, detail="End date must be greater than or equal to start date")
    if end_date is None:
        end_date = date.today()

    # If k is None, return all documents
    query = db.query(CitedDocument.file_path, func.count(CitedDocument.file_path).label("count"))
    query = query.join(QueryLog, CitedDocument.query_log_id == QueryLog.id)
    query = query.filter(QueryLog.timestamp >= start_date, QueryLog.timestamp <= end_date + timedelta(days=1))
    query = query.group_by(CitedDocument.file_path)
    query = query.order_by(func.count(CitedDocument.file_path).desc())
    
    if k is not None:
        query = query.limit(k)

    top_docs = query.all()

    result = [TopQueriedDocument(file_path=file_path, count=count) for file_path, count in top_docs]
    return result

# Endpoint to get top K similar documents for a given query
@app.post("/top-similar-documents/", response_model=list[TopSimilarDocument])
async def get_top_similar_documents(query: TopKSimilarDocumentQuery, db: Session = Depends(get_db)):
    """Get top K similar documents for a given query."""
    k = query.k
    query = query.query

    if k is not None and k <= 0:
        raise HTTPException(status_code=400, detail="K must be a positive integer")

    response = ingestor.search_documents(
        query=query,
        k=k,
    )

    if not response:
        raise HTTPException(status_code=404, detail="No similar documents found")
    
    return response

# Endpoint to get LLM response success rates and latency for a day or timeframe
@app.post("/llm-response-metrics/", response_model=LLMResponseMetrics)
async def get_llm_response_metrics(timeframe: Timeframe, db: Session = Depends(get_db)):
    """Get LLM response success rates and latency for a day or timeframe."""
    start_date = timeframe.start_date
    end_date = timeframe.end_date
    
    if start_date is None:
        # If start_date is None, get all records up to end_date
        start_date = date(1970, 1, 1)  # Use a very old date as the starting point
        
    if end_date is not None and end_date < start_date:
        raise HTTPException(status_code=400, detail="End date must be greater than or equal to start date")
    if end_date is None:
        end_date = date.today()

    success_count = db.query(func.count(QueryLog.id)).filter(
        QueryLog.success == True,
        QueryLog.timestamp >= start_date,
        QueryLog.timestamp <= end_date + timedelta(days=1)
    ).scalar()

    failure_count = db.query(func.count(QueryLog.id)).filter(
        QueryLog.success == False,
        QueryLog.timestamp >= start_date,
        QueryLog.timestamp <= end_date + timedelta(days=1)
    ).scalar()

    total_count = success_count + failure_count

    if total_count == 0:
        success_rate = 0.0
    else:
        success_rate = (success_count / total_count) * 100

    avg_latency = db.query(func.avg(QueryLog.latency)).filter(
        QueryLog.timestamp >= start_date,
        QueryLog.timestamp <= end_date + timedelta(days=1)
    ).scalar()

    if avg_latency is None:
        avg_latency = -1.0  # Indicate no data available

    return LLMResponseMetrics(
        success_rate=success_rate,
        avg_latency=avg_latency
    )

# Endpoint to query the query engine
@app.post("/query/", response_model=QueryEngineResponse)
async def query_engine_endpoint(user_query: UserQuery):
    """Query the query engine with user's query and return response."""
    try:
        response: QueryEngineResponse = query_engine.query(user_query.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to get query logs for a specific timeframe
@app.post("/query-logs/", response_model=list[QueryLogOutput | None])
async def get_query_logs(query: QueryLogInput, db: Session = Depends(get_db)):
    """Get query logs for a specific timeframe."""
    start_date = query.start_date
    end_date = query.end_date
    k = query.k
    include_citations = query.include_citations
    include_errors = query.include_errors

    if k is not None and k <= 0:
        raise HTTPException(status_code=400, detail="K must be a positive integer")
        
    if start_date is None:
        # If start_date is None, get all records up to end_date
        start_date = date(1970, 1, 1)  # Use a very old date as the starting point
        
    if end_date is not None and end_date < start_date:
        raise HTTPException(status_code=400, detail="End date must be greater than or equal to start date")
    if end_date is None:
        end_date = date.today()

    logs = db.query(QueryLog).filter(
        QueryLog.timestamp >= start_date,
        QueryLog.timestamp <= end_date + timedelta(days=1)
    )

    if k is not None:
        logs = logs.limit(k)
    
    logs = logs.all()

    if not logs:
        return []

    logs = [
        QueryLogOutput(
            id=log.id,
            query=log.query,
            response=log.response,
            latency=log.latency,
            success=log.success,
            error=log.error,
            timestamp=log.timestamp,
            citations=[],
        ) for log in logs
    ]

    if not include_errors:
        logs = [log for log in logs if log.success]

    if include_citations:
        for log in logs:
            citations = db.query(CitedDocument).filter(CitedDocument.query_log_id == log.id).all()

            if not citations:
                continue

            # Get content for each citation
            node_ids = [doc.node_id for doc in citations]
            response = ingestor.get_nodes_content(
                node_ids=node_ids
            )

            log.citations = [
                Citation(
                    file_path=doc.file_path,
                    score=doc.score,
                    content=response[doc.node_id]
                ) for doc in citations
            ]

    return logs