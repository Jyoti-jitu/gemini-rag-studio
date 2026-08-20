from typing import List
from google import genai
from app.config import settings

class EmbeddingService:
    """
    Service for generating vector embeddings using Google GenAI SDK and Gemini embedding models.
    """
    def __init__(self):
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != "your_api_key_here":
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None

    def is_initialized(self) -> bool:
        """Check if embedding service client is initialized."""
        return self.client is not None

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for a single string.
        """
        if not self.client:
            raise ValueError("Gemini API key is missing or not configured.")

        try:
            response = self.client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text
            )
            if hasattr(response, 'embedding') and response.embedding and hasattr(response.embedding, 'values'):
                return list(response.embedding.values)
            elif hasattr(response, 'embeddings') and response.embeddings and len(response.embeddings) > 0:
                return list(response.embeddings[0].values)
            else:
                raise ValueError("No valid vector returned from Gemini Embedding API.")
        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {str(e)}")

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embedding vectors for a list of text strings.
        """
        if not self.client:
            raise ValueError("Gemini API key is missing or not configured.")

        if not texts:
            return []

        # Batch call or per-text call depending on size
        embeddings = []
        for text in texts:
            emb = self.get_embedding(text)
            embeddings.append(emb)
        return embeddings

embedding_service = EmbeddingService()
