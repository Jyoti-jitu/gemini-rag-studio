from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import RootResponse, HealthResponse
from app.routes.documents import router as documents_router
from app.routes.chat import router as chat_router
from app.services.gemini_service import gemini_service
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store

app = FastAPI(
    title="Gemini RAG Backend API",
    description="Production-ready RAG backend powered by FastAPI, Google Gemini 2.5 Flash, Gemini Embeddings, and ChromaDB.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = settings.ALLOWED_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents_router)
app.include_router(chat_router)

@app.get(
    "/",
    response_model=RootResponse,
    status_code=status.HTTP_200_OK,
    summary="Root Endpoint",
    description="Simple welcome endpoint to confirm API service is alive."
)
async def root():
    return RootResponse(message="Gemini RAG API is running")

@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Check backend operational status, Gemini API connection, and ChromaDB vector store health."
)
async def health_check():
    gemini_ready = gemini_service.is_initialized() and embedding_service.is_initialized()
    chroma_ready = vector_store.is_healthy()
    doc_count = vector_store.get_collection_count()

    overall_status = "ok" if (gemini_ready and chroma_ready) else "degraded"

    return HealthResponse(
        status=overall_status,
        gemini_initialized=gemini_ready,
        chroma_initialized=chroma_ready,
        document_count=doc_count
    )
