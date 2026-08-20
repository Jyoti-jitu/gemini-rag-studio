import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Upload,
  FileText,
  Trash2,
  Send,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  BookOpen,
  Layers,
  Bot,
  User,
  ChevronRight,
  ChevronDown,
  Loader2,
  KeyAlert,
  FileCode,
  Info
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Summarize the main points of the uploaded documents.",
  "What key requirements are mentioned in the file?",
  "Extract essential dates, definitions, and conclusions."
];

export default function App() {
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Welcome to **Gemini 2.5 RAG Studio**. Upload a PDF or TXT document on the left panel to begin asking questions grounded in your knowledge base.',
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [query, setQuery] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [openSources, setOpenSources] = useState({});

  const chatEndRef = useRef(null);

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
    } catch {
      setHealth({ status: 'offline', gemini_initialized: false, chroma_initialized: false, document_count: 0 });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadStatus({ type: 'success', text: `Indexed "${data.filename}" (${data.chunks} chunks)` });
        if (!documents.some(d => d.filename === data.filename)) {
          setDocuments(prev => [...prev, { filename: data.filename, chunks: data.chunks }]);
        }
        setFile(null);
        checkHealth();
      } else {
        setUploadStatus({ type: 'error', text: data.detail || 'Failed to upload document.' });
      }
    } catch {
      setUploadStatus({ type: 'error', text: 'Network error uploading file.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.filename !== filename));
        checkHealth();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (customQuery = query) => {
    const text = customQuery.trim();
    if (!text || loadingChat) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoadingChat(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();

      if (res.ok) {
        const botMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: data.answer,
          sources: data.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errorMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `⚠️ **Error**: ${data.detail || 'Unable to process query.'}`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: '⚠️ **Error**: Connection failed. Ensure backend server is running.',
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  const toggleSources = (msgId) => {
    setOpenSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* TOP HEADER */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm text-slate-100 tracking-tight">Gemini RAG Studio</span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">2.5 Flash</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-md px-3 py-1">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">VectorDB:</span>
              <span className={health?.chroma_initialized ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {health?.chroma_initialized ? 'Active' : 'Offline'}
              </span>
            </div>
            <div className="h-3 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Gemini LLM:</span>
              <span className={health?.gemini_initialized ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {health?.gemini_initialized ? 'Ready' : 'API Key Required'}
              </span>
            </div>
            <div className="h-3 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Chunks:</span>
              <span className="text-indigo-400 font-semibold">{health?.document_count ?? 0}</span>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={loadingHealth}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Refresh Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* MAIN SPLIT VIEW */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR: KNOWLEDGE BASE */}
        <aside className="w-80 border-r border-slate-800/80 bg-slate-900/30 p-4 flex flex-col gap-5 shrink-0 overflow-y-auto">
          
          {/* Upload Box */}
          <div className="flex flex-col gap-2.5">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              Upload Document
            </h2>

            <form onSubmit={handleUpload} className="flex flex-col gap-2">
              <label className="border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 hover:bg-indigo-950/20 rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition text-center">
                <FileText className="w-6 h-6 text-slate-500" />
                <span className="text-xs text-slate-300 font-medium truncate max-w-[220px]">
                  {file ? file.name : 'Select PDF or TXT file'}
                </span>
                <span className="text-[10px] text-slate-500">Max size 10MB</span>
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
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {uploading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing & Indexing...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Ingest & Index Document</>
                )}
              </button>
            </form>

            {uploadStatus && (
              <div className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                uploadStatus.type === 'success' ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-300' : 'bg-rose-950/30 border border-rose-500/20 text-rose-300'
              }`}>
                {uploadStatus.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span className="truncate">{uploadStatus.text}</span>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-slate-800/60" />

          {/* Indexed Documents List */}
          <div className="flex flex-col gap-2.5 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Indexed Files ({documents.length})
              </h2>
            </div>

            {documents.length === 0 ? (
              <div className="p-4 rounded-lg border border-slate-800/40 bg-slate-950/40 text-center text-xs text-slate-500 my-auto flex flex-col items-center gap-1">
                <FileCode className="w-6 h-6 text-slate-600" />
                <span>No documents indexed yet.</span>
                <span className="text-[10px] text-slate-600">Uploaded documents will appear here.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px]">
                {documents.map((doc, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-2 text-xs transition">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-slate-200 truncate" title={doc.filename}>{doc.filename}</p>
                        <p className="text-[10px] text-slate-500">{doc.chunks} chunks</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.filename)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Alert Banner */}
          {!health?.gemini_initialized && (
            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex flex-col gap-1">
              <span className="font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Setup Required
              </span>
              <p className="text-[11px] text-amber-300/80 leading-normal">
                Set <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">GEMINI_API_KEY</code> in <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">.env</code> to generate answers.
              </p>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN AREA: CHAT INTERFACE */}
        <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                }`}>
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div className={`space-y-1.5 max-w-xl ${msg.sender === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-3.5 rounded-xl text-xs md:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Sources Toggle */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="text-[11px]">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium py-0.5"
                      >
                        {openSources[msg.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>Retrieved Context ({msg.sources.length} sources)</span>
                      </button>

                      {openSources[msg.id] && (
                        <div className="mt-1.5 flex flex-col gap-1 pl-2 border-l border-indigo-500/20">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-2">
                              <FileText className="w-3 h-3 text-indigo-400" />
                              <span>{src.filename} (Page {src.page})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 block px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {loadingChat && (
              <div className="flex gap-3 max-w-md">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-300 text-xs flex items-center gap-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Searching vectors & synthesizing response...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggestions Pill Bar */}
          <div className="px-5 py-2 border-t border-slate-900 bg-slate-950 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">Prompts:</span>
            {SUGGESTED_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={loadingChat}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 backdrop-blur-md shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 max-w-3xl mx-auto"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your indexed documents..."
                disabled={loadingChat}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
              <button
                type="submit"
                disabled={!query.trim() || loadingChat}
                className="py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}
