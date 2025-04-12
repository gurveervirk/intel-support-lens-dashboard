from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.storage.docstore.mongodb import MongoDocumentStore
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext
from llama_index.core.ingestion import IngestionPipeline
from llama_index.readers.file import PyMuPDFReader, MarkdownReader, PandasCSVReader
from llama_index.core.query_engine import CitationQueryEngine
from llama_index.core.base.response.schema import Response
from sqlalchemy import (
    make_url, 
    create_engine, 
    Column, 
    Integer, 
    String, 
    Float, 
    DateTime, 
    Boolean, 
    Index,
    ForeignKey
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone
from typing import Optional, Any
from .models import Citation, QueryEngineResponse, TopSimilarDocument
import os
import time
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

# Define the QueryLog class
class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True)
    query = Column(String)
    response = Column(String)
    latency = Column(Float)
    success = Column(Boolean)
    error = Column(String)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))

    Index('query_logs_timestamp_idx', timestamp)
    Index('query_logs_success_idx', success)

    def __repr__(self):
        return f"<QueryLog(query='{self.query}', latency={self.latency}, success={self.success})>"

# Define the CitedDocument class
class CitedDocument(Base):
    __tablename__ = "cited_documents"

    id = Column(Integer, primary_key=True)
    file_path = Column(String)
    node_id = Column(String)
    score = Column(Float)
    query_log_id = Column(Integer, ForeignKey('query_logs.id'))

    query_log = relationship("QueryLog", backref="cited_documents")

    def __repr__(self):
        return f"<CitedDocument(file_path='{self.file_path}', node_id='{self.node_id}', score={self.score})>"

# Create Ingestor class to handle file reading and vector store operations
class Ingestor:
    def __init__(self):
        # Get the connection string and DB name from environment variables
        self.connection_string = os.getenv("CONNECTION_STRING")
        self.db_name = os.getenv("DB_NAME")
        self.mongo_uri = os.getenv("MONGO_URI")
        self.temp_dir = os.getenv("TEMP_DIR")
        url = make_url(self.connection_string)

        # Create a PGVectorStore instance using the connection string
        self.vector_store = PGVectorStore.from_params(
            database=self.db_name,
            host=url.host,
            password=url.password,
            port=url.port,
            user=url.username,
            table_name="support_docs",
            embed_dim=768,
            hybrid_search=True,
            hnsw_kwargs={
                "hnsw_m": 16,
                "hnsw_ef_construction": 64,
                "hnsw_ef_search": 40,
                "hnsw_dist_method": "vector_cosine_ops",
            },
        )

        # Create a MongoDocumentStore instance for document storage
        self.document_store = MongoDocumentStore.from_uri(
            uri=self.mongo_uri,
            db_name="zeta_assmt_2_2025_doc_store"
        )

        # Create a StorageContext instance using the PGVectorStore
        self.storage_context = StorageContext.from_defaults(
            vector_store=self.vector_store,
            docstore=self.document_store,
        )

        # Create an IngestionPipeline instance for insert operations
        self.ingestion_pipeline = IngestionPipeline(
            name="support_docs_ingestion_pipeline",
            project_name="zeta_assmt_2_2025",
            vector_store=self.vector_store,
            docstore=self.document_store,
        )

        # Create a VectorStoreIndex instance using the StorageContext
        self.index = VectorStoreIndex.from_vector_store(
            vector_store=self.vector_store,
        )

        # Database engine and session
        self.engine = create_engine(self.connection_string)
        Base.metadata.create_all(self.engine)  # Create tables if they don't exist
        self.Session = sessionmaker(bind=self.engine)

    def load_data(self):
        """
        Load data from the `TEMP_DIR` directory and save it to the vector store.
        """
        try:
            # Read files from the directory
            file_reader = SimpleDirectoryReader(
                input_dir=self.temp_dir,
                file_extractor={
                    "pdf": PyMuPDFReader,
                    "md": MarkdownReader,
                    "csv": PandasCSVReader
                },
                filename_as_id=True,
                recursive=True,
            )
            documents = file_reader.load_data()

            # Process `file_path` metadata for each document
            for doc in documents:
                # Parse into absolute path, then split to get path after `TEMP_DIR`
                doc.metadata["file_path"] = os.path.abspath(doc.metadata["file_path"])
                doc.metadata["file_path"] = os.path.relpath(doc.metadata["file_path"], self.temp_dir)

            # Run the ingestion pipeline to add documents to the vector store
            self.ingestion_pipeline.run(
                documents=documents,
                show_progress=True,
            )

            logger.info(f"Loaded {len(documents)} documents into the vector store.")
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise e
        finally:
            # Remove the files from the directory after ingestion
            for file in os.listdir(self.temp_dir):
                file_path = os.path.join(self.temp_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)

    def log_query(self, query: str, response: str, latency: float, success: bool, error: str = None) -> int:
        """
        Log a query and its response to the database, and return the log's ID.
        """
        session = self.Session()
        log_id = None
        try:
            log = QueryLog(
                query=query,
                response=response,
                latency=latency,
                success=success,
                error=error,
            )
            session.add(log)
            session.commit()
            session.refresh(log)  # Refresh to get the ID after commit
            log_id = log.id
        except Exception as e:
            logger.error(f"Error logging query: {e}")
            session.rollback()
        finally:
            session.close()
        
        return log_id
    
    def store_cited_document(self, file_path: str, node_id: str, score: float, query_log_id: int):
        """
        Store a cited document in the database.
        """
        session = self.Session()
        try:
            cited_doc = CitedDocument(
                file_path=file_path,
                node_id=node_id,
                score=score,
                query_log_id=query_log_id,
            )
            session.add(cited_doc)
            session.commit()
        except Exception as e:
            logger.error(f"Error storing cited document: {e}")
            session.rollback()
        finally:
            session.close()

    def get_nodes(self, node_ids: list[str]) -> Optional[Any]:
        """
        Retrieve a node from the vector store using its ID.
        """
        try:
            nodes = self.vector_store.get_nodes(
                node_ids=node_ids,
            )
            return nodes
        except Exception as e:
            logger.error(f"Error retrieving node: {e}")
            return None
    
    def get_nodes_content(self, node_ids: list[str]) -> Optional[dict]:
        """
        Retrieve the content of a node from the vector store using its ID.
        """
        try:
            nodes = self.get_nodes(node_ids=node_ids)
            if nodes is None:
                return None
            response = dict()
            for node in nodes:
                content = node.get_content()
                # Remove `\r`
                content = content.replace("\r", "")
                response[node.node_id] = content
            return response
        except Exception as e:
            logger.error(f"Error retrieving node content: {e}")
            return None
        
    def search_documents(self, query: str, k: int = 5) -> list[TopSimilarDocument]:
        """
        Search for documents in the vector store using a query text.
        """
        start_time = time.time()
        success = False
        error = None
        results = []
        retrieved_nodes = []
        
        try:
            retriever = self.index.as_retriever(
                similarity_top_k=k,
                vector_store_query_mode="hybrid"
            )
            retrieved_nodes = retriever.retrieve(query)
            if not retrieved_nodes:
                raise ValueError("No similar documents found.")
            results = [
                TopSimilarDocument(
                    file_path=result.node.metadata["file_path"],
                    score=result.score,
                    content=result.node.get_content().replace("\r", ""),
                )
                for result in retrieved_nodes
            ]
            success = True
            response_text = f"Top {k} similar documents retrieved!"
        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            error = str(e)
            response_text = f"Error searching documents: {str(e)}"
        finally:
            end_time = time.time()
            latency = end_time - start_time
        
        # Log the query and response
        log_id = self.log_query(
            query=query,
            response=response_text,
            latency=latency,
            success=success,
            error=error
        )
        
        # Store the retrieved documents in the cited_documents table
        if success and log_id and retrieved_nodes:
            for result in retrieved_nodes:
                self.store_cited_document(
                    file_path=result.node.metadata["file_path"],
                    node_id=result.node.node_id,
                    score=result.score,
                    query_log_id=log_id
                )
        
        return results

class QueryEngine:
    def __init__(self, ingestor: Ingestor):
        self.ingestor = ingestor
        self.query_engine = CitationQueryEngine.from_args(
            index=self.ingestor.index,
            similarity_top_k=5,
            citation_chunk_size=1024
        )

    def query(self, query_text: str) -> QueryEngineResponse:
        """
        Query the vector store and return the response.
        """
        start_time = time.time()
        try:
            response: Response = self.query_engine.query(query_text)
            success = True
            error = None
        except Exception as e:
            response = None
            success = False
            error = str(e)
        finally:
            end_time = time.time()
            latency = end_time - start_time

        # Log the query and response
        log_id = self.ingestor.log_query(
            query=query_text,
            response=str(response),
            latency=latency,
            success=success,
            error=error,
        )
        logging.info(f"Response: {response.response}")

        # If the query was successful, store the cited documents
        cited_docs = []
        if success and response:
            try:
                # Parse response to extract cited documents
                citation_indices = set()
                pattern = r"\[(\d+)\]"  # Regex to find citation indices like [1], [2]
                matches = re.findall(pattern, response.response)
                for match in matches:
                    citation_indices.add(int(match) - 1) # Convert to zero-based index

                # Filter cited documents based on the indices
                cited_docs = [
                    response.source_nodes[i] for i in citation_indices if i < len(response.source_nodes)
                ]
                
                for citation in cited_docs:
                    self.ingestor.store_cited_document(
                        file_path=citation.node.metadata["file_path"],
                        node_id=citation.node.node_id,
                        score=citation.score,
                        query_log_id=log_id,
                    )
            except Exception as e:
                logger.error(f"Error storing cited documents: {e}")

        # Prepare the response object
        try:
            citations = [
                Citation(
                    content=citation.node.get_content().replace("\r", ""),
                    score=citation.score,
                    file_path=citation.node.metadata["file_path"],
                )
                for citation in cited_docs
            ]
            query_engine_response = QueryEngineResponse(
                response=str(response),
                citations=citations,
            )
        except Exception as e:
            logger.error(f"Error preparing response object: {e}")
            query_engine_response = QueryEngineResponse(
                response="Error preparing response.",
                citations=[],
            )

        return query_engine_response