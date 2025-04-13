# Intel Support Lens Dashboard - Backend

## Overview

The Intel Support Lens Dashboard backend provides a robust API service that powers the document search and QA interface for Intel's internal support teams. It integrates vector search technology with modern LLM capabilities to provide accurate, context-aware responses based on your support documentation.

## Technologies Used

- **FastAPI**: Modern, high-performance web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM for database operations
- **PostgreSQL with pgvector**: Vector database for storing document embeddings
- **MongoDB**: NoSQL database for storing documents, and for checking for changes in the documents, when upserting them
- **LlamaIndex**: Framework for connecting custom data to LLMs
- **Google Gemini**: LLM provider for generating responses
- **Google Text Embedding**: Embedding model for vector representations
- **Pydantic**: Data validation and settings management
- **Python-dotenv**: Environment variable management
- **Locust**: Load testing tool for performance benchmarking

## Document Ingestion Pipeline

The backend implements a sophisticated document ingestion pipeline:

1. **Document Upload**: API endpoint accepts multiple document formats (PDF, Markdown, CSV)
2. **Document Changes Inspection**: MongoDB is used to check for changes in the documents before upserting them
3. **Chunking**: Documents are split into smaller chunks for efficient processing
4. **Embedding Generation**: Each chunk is converted into a vector representation using Google Text Embedding
5. **Database Storage**: Chunks and their metadata are stored in PostgreSQL with pgvector for efficient vector search
6. **Indexing**: Chunks are indexed for fast retrieval during query processing
7. **Metadata Storage**: Metadata about the documents is stored in MongoDB for easy access and management

## API Endpoints

| Endpoint                  | Method | Description                             |
| ------------------------- | ------ | --------------------------------------- |
| `/upload-docs/`           | POST   | Upload and ingest documents             |
| `/query/`                 | POST   | Query the LLM using RAG architecture    |
| `/top-similar-documents/` | POST   | Find semantically similar documents     |
| `/top-queried-documents/` | POST   | Track most frequently queried documents |
| `/query-log-volume/`      | GET    | Get query volume metrics                |
| `/llm-response-metrics/`  | POST   | Get LLM performance metrics             |
| `/query-logs/`            | POST   | Retrieve historical query logs          |

## Development Approach

This application was developed leveraging GitHub Copilot to enhance code quality and maintainability. Using Copilot allowed for:

- Breaking down the monolithic design into modular components
- Creating reusable code patterns across the application
- Implementing best practices in FastAPI and SQLAlchemy
- Generating robust error handling and validation
- Designing testable code with clear separation of concerns

## Load Testing

The backend includes Locust configuration for load testing the API endpoints. The load tests help ensure the system can handle concurrent users and maintain response times under high loads. Test reports are available in the repository.

## How It Works

1. **Document Ingestion**: Support documents are uploaded and processed
2. **Vector Search**: When a query is received, relevant document chunks are retrieved using semantic search
3. **Context Assembly**: Retrieved context is assembled with the user query
4. **LLM Processing**: The context and query are sent to Google Gemini
5. **Response Generation**: Gemini generates a comprehensive response based on the provided context
6. **Citation Tracking**: All document sources are tracked and returned as citations

This architecture provides a powerful tool for support teams who need accurate, contextual answers from their documentation corpus without needing to search manually through hundreds of documents.

## Miscellaneous

Some sample questions are provided in `questions.txt` for testing the API. The questions cover a range of topics related to Intel's support documentation and can be used to validate the system's performance.

Sample data is provided in `data/` directory for testing purposes. This includes sample documents and metadata that can be used to verify the document ingestion pipeline and API functionality.