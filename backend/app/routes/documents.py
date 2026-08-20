from fastapi import APIRouter, UploadFile, File, HTTPException, status
import os
from app.schemas import DocumentUploadResponse
from app.services.document_service import document_service
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store

router = APIRouter(prefix="/documents", tags=["Documents"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit

@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and index a PDF or TXT document",
    description="Extracts text from PDF or TXT file, chunks it, generates Gemini embeddings, and stores vectors in ChromaDB."
)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename missing in upload payload."
        )

    filename = file.filename
    extension = os.path.splitext(filename)[1].lower()

    if extension not in [".pdf", ".txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{extension}'. Only PDF (.pdf) and Text (.txt) files are supported."
        )

    # Read content and enforce size limits
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    # Extract text by pages based on extension
    try:
        if extension == ".pdf":
            pages = document_service.extract_text_from_pdf(content)
        else:
            pages = document_service.extract_text_from_txt(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from document: {str(e)}"
        )

    if not pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text could be extracted from the uploaded document."
        )

    # Chunk text
    chunks = document_service.chunk_document_pages(pages, filename)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document text was too short or empty after processing."
        )

    # Check embedding & vector store service health
    if not embedding_service.is_initialized():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini Embedding service is not properly initialized. Please verify GEMINI_API_KEY."
        )

    if not vector_store.is_healthy():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ChromaDB vector store is not operational."
        )

    # Generate embeddings and push to ChromaDB
    try:
        texts = [chunk["text"] for chunk in chunks]
        ids = [chunk["id"] for chunk in chunks]
        metadatas = [chunk["metadata"] for chunk in chunks]

        embeddings = embedding_service.get_embeddings(texts)

        # Store in ChromaDB
        vector_store.add_documents(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )

        return DocumentUploadResponse(
            message="Document indexed successfully",
            filename=filename,
            chunks=len(chunks)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Indexing failed: {str(e)}"
        )

@router.delete(
    "/{filename}",
    summary="Delete a document from vector index",
    description="Removes all indexed chunks associated with the specified filename."
)
async def delete_document(filename: str):
    if not vector_store.is_healthy():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ChromaDB vector store is not operational."
        )
    try:
        vector_store.delete_document(filename)
        return {"message": f"Document '{filename}' removed from index."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document '{filename}': {str(e)}"
        )
