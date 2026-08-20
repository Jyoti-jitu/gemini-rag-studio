import fitz  # PyMuPDF
from typing import List, Dict, Any
from app.config import settings

class DocumentService:
    """
    Service for parsing text from PDFs and TXT files, cleaning, and sliding-window chunking.
    """
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def extract_text_from_pdf(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extract text page by page from raw PDF bytes.
        Returns a list of dicts: [{"page": 1, "text": "..."}, ...]
        """
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text").strip()
            if text:
                pages.append({
                    "page": page_num + 1,
                    "text": text
                })
        doc.close()
        return pages

    def extract_text_from_txt(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extract text from raw TXT bytes.
        Returns a single-page dictionary representation: [{"page": 1, "text": "..."}]
        """
        text = file_bytes.decode("utf-8", errors="ignore").strip()
        if not text:
            return []
        return [{"page": 1, "text": text}]

    def chunk_document_pages(self, pages: List[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
        """
        Splits extracted page contents into chunks of size `chunk_size` with `chunk_overlap`.
        
        Returns list of chunks:
        [
            {
                "id": "example.pdf_p1_c0",
                "text": "...",
                "metadata": {
                    "filename": "example.pdf",
                    "page": 1,
                    "chunk_id": "example.pdf_p1_c0"
                }
            },
            ...
        ]
        """
        chunks = []
        global_chunk_idx = 0

        # Sanitize filename for ID creation
        safe_filename = filename.replace(" ", "_")

        for page_info in pages:
            page_num = page_info["page"]
            text = page_info["text"]
            text_len = len(text)

            if text_len == 0:
                continue

            start = 0
            while start < text_len:
                end = start + self.chunk_size
                chunk_str = text[start:end].strip()

                if chunk_str:
                    chunk_id = f"{safe_filename}_p{page_num}_c{global_chunk_idx}"
                    chunks.append({
                        "id": chunk_id,
                        "text": chunk_str,
                        "metadata": {
                            "filename": filename,
                            "page": page_num,
                            "chunk_id": chunk_id
                        }
                    })
                    global_chunk_idx += 1

                if end >= text_len:
                    break

                # Advance window by chunk_size - chunk_overlap
                step = self.chunk_size - self.chunk_overlap
                if step <= 0:
                    step = 1
                start += step

        return chunks

document_service = DocumentService()
