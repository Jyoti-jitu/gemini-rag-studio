# Gemini RAG Backend 🚀

A production-ready, modular, and high-performance **Retrieval-Augmented Generation (RAG)** backend built with **FastAPI**, **Python 3.11+**, the official **Google GenAI SDK (`google-genai`)**, and **ChromaDB**.

---

## 📌 Project Overview

This backend provides a complete RAG pipeline that allows users to upload PDF or TXT documents, automatically extract and chunk text with preserved metadata (page numbers, source filenames), index vectors locally using **ChromaDB**, and answer queries accurately using **Google Gemini 2.5 Flash** and **Gemini Embeddings** without hallucinating outside knowledge.

---

## 🏗 Architecture & RAG Pipeline

```
[ PDF / TXT File ]
        │
        ▼
[ PyMuPDF / Text Extractor ]  ──► (Preserve Page Numbers & Clean Text)
        │
        ▼
[ Sliding-Window Chunking ]   ──► (chunk_size: 1000, chunk_overlap: 200)
        │
        ▼
[ Gemini Embedding Model ]    ──► (gemini-embedding-001)
        │
        ▼
[ ChromaDB PersistentStore ]  ──► (Stored locally in ./chroma_db)
        │
        ▼
[ User Question / Chat ]      ──► (Gemini Query Embedding)
        │
        ▼
[ Cosine Similarity Search ]  ──► (Retrieve Top 5 Chunks)
        │
        ▼
[ Strict Context Prompt ]     ──► (gemini-2.5-flash)
        │
        ▼
[ Answer + Source Attribution ]
```

---

## 📁 Project Structure

```
gemini-rag-backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI entry point & CORS configuration
│   ├── config.py          # Environment settings & Pydantic validation
│   ├── schemas.py         # Request & response data models
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── documents.py   # Upload & document indexing endpoints
│   │   └── chat.py        # RAG query synthesis endpoint
│   │
│   └── services/
│       ├── __init__.py
│       ├── gemini_service.py    # Text generation using gemini-2.5-flash
│       ├── embedding_service.py # Embeddings using gemini-embedding-001
│       ├── document_service.py  # PyMuPDF extraction & chunking logic
│       └── vector_store.py      # ChromaDB persistent vector database
│
├── data/                  # Local uploads storage directory
├── chroma_db/             # Local ChromaDB persistent vector storage
├── .env                   # Local secrets & API keys (Git ignored)
├── .env.example           # Template configuration file
├── .gitignore
├── requirements.txt       # Python dependencies
└── README.md              # Project documentation
```

---

## ⚡ Requirements

- **Python**: 3.11 or higher
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

---

## ⚙️ Installation & Virtual Environment Setup

### 1. Clone or Open Project Directory

Open your command line interface (PowerShell/CMD on Windows or Terminal on Linux/macOS) and navigate to the project directory:

```bash
cd gemini-rag-backend
```

### 2. Create Virtual Environment

#### On Windows (PowerShell):
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If PowerShell restricts scripts, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

#### On Windows (Command Prompt - cmd):
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

#### On Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🔑 Environment Variables Configuration

Copy `.env.example` to create a `.env` file:

#### Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

#### Linux / macOS / CMD:
```bash
cp .env.example .env
```

Open `.env` and fill in your Gemini API key:

```env
GEMINI_API_KEY=AIzaSy...YourActualGeminiApiKeyHere...

CHROMA_DB_PATH=./chroma_db
COLLECTION_NAME=documents

CHUNK_SIZE=1000
CHUNK_OVERLAP=200

TOP_K=5

GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 🚀 How to Run the Server

Start the development server with Uvicorn:

```bash
uvicorn app.main:app --reload
```

The application will start at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 📡 API Endpoints Reference

### 1. Root Status
- **Method**: `GET`
- **Path**: `/`
- **Response**:
```json
{
  "message": "Gemini RAG API is running"
}
```

### 2. System Health Check
- **Method**: `GET`
- **Path**: `/health`
- **Response**:
```json
{
  "status": "ok",
  "gemini_initialized": true,
  "chroma_initialized": true,
  "document_count": 25
}
```

### 3. Upload & Index Document
- **Method**: `POST`
- **Path**: `/documents/upload`
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (PDF or TXT)
- **Response**:
```json
{
  "message": "Document indexed successfully",
  "filename": "sample_paper.pdf",
  "chunks": 18
}
```

### 4. RAG Chat Query
- **Method**: `POST`
- **Path**: `/chat`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "question": "What are the main findings discussed in the paper?"
}
```
- **Response**:
```json
{
  "question": "What are the main findings discussed in the paper?",
  "answer": "The main findings state that...",
  "sources": [
    {
      "filename": "sample_paper.pdf",
      "page": 3
    },
    {
      "filename": "sample_paper.pdf",
      "page": 4
    }
  ]
}
```

---

## 💻 Example Curl Commands

### Upload a PDF Document
```bash
curl -X POST "http://localhost:8000/documents/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf"
```

### Upload a Text File
```bash
curl -X POST "http://localhost:8000/documents/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/notes.txt"
```

### Ask a Question
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"question": "Summarize the key points of the uploaded document."}'
```

---

## 🌐 How to Connect a React Frontend

If you are developing a React / Vite / Next.js frontend, call the API directly using `fetch` or `axios`.

### React Code Example (`App.jsx`):

```javascript
import React, { useState } from 'react';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Handle Document Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setUploadStatus("Uploading & Indexing...");

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus(`Indexed ${data.filename} (${data.chunks} chunks)!`);
      } else {
        setUploadStatus(`Error: ${data.detail}`);
      }
    } catch (err) {
      setUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Chat Submission
  const handleChat = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setChatResponse(data);
    } catch (err) {
      alert(`Chat error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Gemini RAG Assistant</h1>
      
      {/* Upload Section */}
      <form onSubmit={handleUpload} style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
        <h3>Upload Document (PDF / TXT)</h3>
        <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" disabled={loading || !file} style={{ marginLeft: "10px" }}>
          Upload & Index
        </button>
        {uploadStatus && <p>{uploadStatus}</p>}
      </form>

      {/* Chat Section */}
      <form onSubmit={handleChat} style={{ border: "1px solid #ccc", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
        <h3>Ask Question</h3>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the document..."
          style={{ width: "70%", padding: "8px" }}
        />
        <button type="submit" disabled={loading} style={{ marginLeft: "10px", padding: "8px 16px" }}>
          Ask
        </button>
      </form>

      {/* Response Display */}
      {chatResponse && (
        <div style={{ marginTop: "20px", padding: "20px", background: "#f5f5f5", borderRadius: "8px" }}>
          <h4>Answer:</h4>
          <p>{chatResponse.answer}</p>

          {chatResponse.sources?.length > 0 && (
            <div>
              <strong>Sources:</strong>
              <ul>
                {chatResponse.sources.map((src, i) => (
                  <li key={i}>{src.filename} (Page {src.page})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🛠 Troubleshooting

1. **"Gemini API key is missing or not configured"**:
   - Ensure you created the `.env` file in the root directory.
   - Verify `GEMINI_API_KEY=AIzaSy...` has no quotes or spaces.

2. **ChromaDB permission errors or SQLite lock issues on Windows**:
   - Ensure the `./chroma_db` folder has write permissions.
   - Restart Uvicorn if another process locked SQLite.

3. **`google-genai` Module Not Found**:
   - Activate your virtual environment before running the server:
     - PowerShell: `.\venv\Scripts\Activate.ps1`
     - Cmd: `venv\Scripts\activate.bat`
   - Re-run `pip install -r requirements.txt`.

4. **PyMuPDF extraction issues**:
   - Make sure `pymupdf` is installed. Scanned image PDFs require OCR; PyMuPDF handles embedded text PDFs.

---

## 📜 License

MIT License - feel free to use and adapt this production RAG template for your own projects!
