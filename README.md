# Intel Support Lens Dashboard

## Project Overview

The Intel Support Lens Dashboard is a comprehensive knowledge base solution designed for internal support teams. It combines semantic search technology with advanced LLM capabilities to provide instant, accurate answers to support questions based on your organization's documentation.

This application helps support agents quickly find information and respond to customer inquiries without having to manually search through extensive documentation. The system keeps track of documents, provides analytics on usage patterns, and continuously improves through interaction data.

## Key Features

- **AI-powered Question Answering**: Get contextually relevant answers based on support documentation
- **Semantic Document Search**: Find documents by meaning, not just keywords
- **Document Management**: Upload and manage support documentation
- **Analytics Dashboard**: Track system usage and performance metrics
- **Citation Tracking**: All responses include source citations for verification
- **Multi-format Support**: Handle Markdown, CSV, and plain text documents

## System Architecture

The application is built with a modern stack:

- **Backend**: FastAPI + PostgreSQL (with pgvector) + LlamaIndex + Google Gemini
- **Frontend**: React + TypeScript + TailwindCSS + shadcn/ui

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL with pgvector extension
- Google API key for Gemini

### Environment Setup

1. Clone this repository

```bash
git clone https://github.com/gurveervirk/intel-support-lens-dashboard.git
cd intel-support-lens-dashboard
```

2. Set up backend environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with the following variables:

```
GOOGLE_API_KEY=your_google_api_key
CONNECTION_STRING=postgresql://username:password@localhost:5432
DB_NAME=intel_support_lens
TEMP_DIR=./tmp
MONGO_URI=mongodb://localhost:27017/ # modify for your MongoDB instance
```

4. Set up the frontend environment

```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server

```bash
cd backend
python -m uvicorn app:app --reload
```

2. In a separate terminal, start the frontend development server

```bash
cd frontend
npm run dev
```

3. Access the application at http://localhost:8080

### Initial Data Setup

1. Use the document upload feature to add your initial support documentation
2. The system will process and index the documents automatically
3. Start using the chat interface to query your knowledge base

## Deployment Considerations

For production deployment:

- Use a production WSGI server like Gunicorn
- Set up proper database connection pooling
- Configure CORS settings appropriately
- Implement authentication and authorization
- Consider containerizing the application with Docker

## Performance

The application has been load tested with Locust and can handle multiple simultaneous users with reasonable response times. For large document collections, consider scaling the database and optimizing vector search parameters.

## Future Enhancements

- Integration with ticketing systems
- Support for more document formats
- Advanced analytics and reporting
- User feedback collection for response quality
- Fine-tuning capabilities for domain-specific terminology
