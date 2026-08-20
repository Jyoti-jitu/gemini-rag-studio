import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  UploadCloud,
  FileText,
  Trash2,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cpu,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileUp,
  Layers,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "Summarize the key information in the uploaded documents.",
  "What are the main requirements or instructions specified?",
  "Extract important terms, dates, and definitions.",
  "What are the primary conclusions or findings?"
];

export default function App() {
  // System state
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  
  // Documents state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [documentsList, setDocumentsList] = useState([]);
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello! I am your **Gemini 2.5 Flash RAG Assistant**. Upload a `.pdf` or `.txt` document on the left, then ask me anything about its content!',
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedSource, setExpandedSource] = useState(null);
  
  const chatEndRef = useRef(null);

  // Fetch health status
  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({ status: 'offline', gemini_initialized: false, chroma_initialized: false, document_count: 0 });
      }
    } catch (err) {
      setHealth({ status: 'offline', gemini_initialized: false, chroma_initialized: false, document_count: 0 });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Handle document upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadMessage({ type: 'success', text: `Successfully indexed "${data.filename}" in ${data.chunks} chunks.` });
        if (!documentsList.some(doc => doc.filename === data.filename)) {
          setDocumentsList(prev => [...prev, { filename: data.filename, chunks: data.chunks }]);
        }
        setFile(null);
        checkHealth();
      } else {
        setUploadMessage({ type: 'error', text: data.detail || 'Failed to upload document.' });
      }
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Network error uploading file.' });
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (filename) => {
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocumentsList(prev => prev.filter(doc => doc.filename !== filename));
        checkHealth();
      }
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  // Handle chat submit
  const handleSendQuery = async (queryText = inputQuery) => {
    const textToSend = queryText.trim();
    if (!textToSend || chatLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend }),
      });

      const data = await res.json();

      if (res.ok) {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: data.answer,
          sources: data.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `⚠️ **Error**: ${data.detail || 'Unable to process query.'}`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: '⚠️ **Error**: Connection lost or backend unreachable.',
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* HEADER BAR */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-wide">Gemini 2.5 RAG Studio</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full">v1.0</span>
            </div>
            <p className="text-xs text-slate-400">FastAPI • ChromaDB • Google Gemini 2.5 Flash</p>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            
            {/* ChromaDB Status */}
            <div className="flex items-center gap-1.5" title="Vector Database Status">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300">ChromaDB:</span>
              <span className={health?.chroma_initialized ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {health?.chroma_initialized ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="h-3 w-[1px] bg-slate-800" />

            {/* Gemini LLM Status */}
            <div className="flex items-center gap-1.5" title="Google Gemini LLM Initialization Status">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-300">Gemini:</span>
              <span className={health?.gemini_initialized ? 'text-emerald-400 font-medium flex items-center gap-1' : 'text-amber-400 font-medium flex items-center gap-1'}>
                {health?.gemini_initialized ? (
                  <><ShieldCheck className="w-3 h-3 text-emerald-400" /> Ready</>
                ) : (
                  <><ShieldAlert className="w-3 h-3 text-amber-400" /> Key Required</>
                )}
              </span>
            </div>

            <div className="h-3 w-[1px] bg-slate-800" />

            {/* Indexed Chunks Count */}
            <div className="flex items-center gap-1.5" title="Total Indexed Vector Chunks">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">Indexed Chunks:</span>
              <span className="text-indigo-300 font-semibold">{health?.document_count ?? 0}</span>
            </div>
          </div>

          {/* Refresh Health Button */}
          <button
            onClick={checkHealth}
            disabled={loadingHealth}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
            title="Refresh System Status"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR: DOCUMENT UPLOADER & KNOWLEDGE BASE */}
        <aside className="w-80 lg:w-96 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-md p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          
          {/* Section: Upload Document */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <h2>Knowledge Base Ingestion</h2>
            </div>
            
            <form onSubmit={handleFileUpload} className="flex flex-col gap-3">
              <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/60 hover:bg-indigo-950/20 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group">
                <FileUp className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition transform group-hover:-translate-y-1" />
                <div>
                  <p className="text-xs font-medium text-slate-300">
                    {file ? file.name : 'Click or drag PDF/TXT file here'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Supports PDF & TXT (Max 10MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Chunking & Indexing...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Index Document</>
                )}
              </button>
            </form>

            {/* Upload Message Feedback */}
            {uploadMessage && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                uploadMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                {uploadMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{uploadMessage.text}</span>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-slate-800/80" />

          {/* Section: Indexed Documents List */}
          <div className="flex flex-col gap-3 flex-1 min-h-[200px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h2>Indexed Vector Store</h2>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md font-mono">
                {documentsList.length} Files
              </span>
            </div>

            {documentsList.length === 0 ? (
              <div className="p-6 rounded-xl border border-slate-800/60 bg-slate-900/30 text-center flex flex-col items-center gap-2 my-auto">
                <FileText className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400">No active documents uploaded yet.</p>
                <p className="text-[11px] text-slate-500">Upload a PDF or TXT file above to start querying.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] pr-1">
                {documentsList.map((doc, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 flex items-center justify-between gap-3 transition">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-slate-200 truncate" title={doc.filename}>{doc.filename}</p>
                        <p className="text-[10px] text-slate-500">{doc.chunks} vector chunks</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.filename)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Remove from Index"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Key Warning Box if missing */}
          {!health?.gemini_initialized && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-300 text-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Gemini API Key Required</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Add your Gemini API key in <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200 font-mono">.env</code> to generate embeddings and LLM responses.
              </p>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN AREA: RAG CHAT INTERFACE */}
        <main className="flex-1 flex flex-col bg-slate-950/60 relative overflow-hidden">
          
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Sources Cards (if available) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1 w-full">
                      <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-400" /> Vector Sources Retrieved ({msg.sources.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, i) => (
                          <div
                            key={i}
                            className="bg-slate-900 border border-indigo-500/20 hover:border-indigo-500/50 rounded-lg px-3 py-1.5 text-[11px] text-indigo-300 flex items-center gap-2 transition cursor-pointer"
                            onClick={() => setExpandedSource(expandedSource === `${msg.id}-${i}` ? null : `${msg.id}-${i}`)}
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{src.filename} (Page {src.page})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Chat Loading State */}
            {chatLoading && (
              <div className="flex gap-3 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-200">Querying Vector Index & Gemini 2.5...</span>
                    <span className="text-[10px] text-slate-500">Embedding → Similarity Search → Synthesizing</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggested Questions Pill bar */}
          <div className="px-6 py-2 bg-slate-950/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> Suggestions:
            </span>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(q)}
                disabled={chatLoading}
                className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-slate-900/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <div className="p-4 bg-slate-900/80 border-t border-slate-800/80 backdrop-blur-xl shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="flex items-center gap-3 max-w-4xl mx-auto"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask a question about your indexed documents..."
                disabled={chatLoading}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || chatLoading}
                className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}
