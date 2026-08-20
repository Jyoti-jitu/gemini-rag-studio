import chromadb
from typing import List, Dict, Any, Optional
from app.config import settings

class VectorStore:
    """
    Service managing local persistent vector database via ChromaDB.
    """
    def __init__(self):
        try:
            self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
            self.collection = self.client.get_or_create_collection(
                name=settings.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            self.initialized = True
        except Exception as e:
            self.client = None
            self.collection = None
            self.initialized = False

    def is_healthy(self) -> bool:
        """Return True if ChromaDB persistent client and collection are ready."""
        return self.initialized and self.collection is not None

    def add_documents(
        self,
        ids: List[str],
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]]
    ):
        """
        Store documents, embeddings, metadata, and unique IDs in ChromaDB.
        """
        if not self.is_healthy():
            raise RuntimeError("ChromaDB vector database is not initialized.")

        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search collection using query vector and return top K matching chunks with metadata.
        """
        if not self.is_healthy():
            raise RuntimeError("ChromaDB vector database is not initialized.")

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        retrieved = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else []
            dists = results["distances"][0] if results.get("distances") else []

            for i in range(len(docs)):
                retrieved.append({
                    "document": docs[i],
                    "metadata": metas[i] if i < len(metas) else {},
                    "distance": dists[i] if i < len(dists) else 0.0
                })

        return retrieved

    def delete_document(self, filename: str):
        """
        Remove all indexed chunks belonging to a specific document filename.
        """
        if not self.is_healthy():
            raise RuntimeError("ChromaDB vector database is not initialized.")

        self.collection.delete(where={"filename": filename})

    def get_collection_count(self) -> int:
        """
        Get total number of document chunks indexed in the collection.
        """
        if not self.is_healthy():
            return 0
        return self.collection.count()

vector_store = VectorStore()
