import os
from google import genai
from app.config import settings

RAG_PROMPT_TEMPLATE = """You are a helpful RAG assistant.

Answer the user's question using ONLY the provided context.

If the answer cannot be found in the context, clearly say:
"I don't know based on the provided documents."

Do not invent facts.
Do not use outside knowledge.
Keep the answer concise and accurate.

Context:
{context}

Question:
{question}

Answer:"""

class GeminiService:
    """
    Service for interacting with Google Gemini API using google-genai SDK.
    """
    def __init__(self):
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != "your_api_key_here":
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None

    def is_initialized(self) -> bool:
        """Check if Gemini client is successfully initialized with an API key."""
        return self.client is not None

    def generate_rag_answer(self, question: str, context: str) -> str:
        """
        Generate answer for question based solely on retrieved context using Gemini 2.5 Flash.
        """
        if not self.client:
            raise ValueError("Gemini API key is missing or not configured in environment variables.")

        prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)

        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            if response and response.text:
                return response.text.strip()
            return "I don't know based on the provided documents."
        except Exception as e:
            raise RuntimeError(f"Failed to generate response from Gemini API: {str(e)}")

gemini_service = GeminiService()
