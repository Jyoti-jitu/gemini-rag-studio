from pydantic import BaseModel, Field
from typing import List

class RootResponse(BaseModel):
    message: str = Field(..., example="Gemini RAG API is running")

class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    gemini_initialized: bool = Field(..., example=True)
    chroma_initialized: bool = Field(..., example=True)
    document_count: int = Field(..., example=12)

class DocumentUploadResponse(BaseModel):
    message: str = Field(..., example="Document indexed successfully")
    filename: str = Field(..., example="sample.pdf")
    chunks: int = Field(..., example=25)

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question to ask the document context", example="What is this document about?")

class SourceMetadata(BaseModel):
    filename: str = Field(..., example="sample.pdf")
    page: int = Field(..., example=1)

class ChatResponse(BaseModel):
    question: str = Field(..., example="What is this document about?")
    answer: str = Field(..., example="This document outlines the architecture...")
    sources: List[SourceMetadata]
