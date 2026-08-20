from fastapi import APIRouter, HTTPException, status
from app.schemas import ChatRequest, ChatResponse, SourceMetadata
from app.config import settings
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store
from app.services.gemini_service import gemini_service

router = APIRouter(tags=["Chat"])

@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask a question about indexed documents",
    description="Embeds the user query, performs vector similarity search in ChromaDB, constructs context, and uses Gemini 2.5 Flash to synthesize an answer."
)
async def chat(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    if not embedding_service.is_initialized():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini Embedding service is not properly configured. Check GEMINI_API_KEY."
        )

    if not gemini_service.is_initialized():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini LLM Service is not properly configured. Check GEMINI_API_KEY."
        )

    if not vector_store.is_healthy():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ChromaDB vector database is unavailable."
        )

    try:
        # 1. Generate query embedding
        query_embedding = embedding_service.get_embedding(question)

        # 2. Similarity search in ChromaDB
        relevant_chunks = vector_store.search(
            query_embedding=query_embedding,
            top_k=settings.TOP_K
        )

        if not relevant_chunks:
            return ChatResponse(
                question=question,
                answer="I don't know based on the provided documents.",
                sources=[]
            )

        # 3. Build context string & extract sources
        context_blocks = []
        sources_seen = set()
        sources_list = []

        for item in relevant_chunks:
            doc_text = item.get("document", "")
            meta = item.get("metadata", {})

            context_blocks.append(doc_text)

            fname = meta.get("filename", "unknown")
            page_num = meta.get("page", 1)

            source_key = (fname, page_num)
            if source_key not in sources_seen:
                sources_seen.add(source_key)
                sources_list.append(SourceMetadata(filename=fname, page=page_num))

        context_str = "\n\n---\n\n".join(context_blocks)

        # 4. Synthesize final answer with Gemini 2.5 Flash
        answer = gemini_service.generate_rag_answer(
            question=question,
            context=context_str
        )

        return ChatResponse(
            question=question,
            answer=answer,
            sources=sources_list
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat query: {str(e)}"
        )
