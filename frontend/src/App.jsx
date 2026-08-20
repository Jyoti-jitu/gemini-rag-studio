import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Upload,
  FileText,
  Trash2,
  Send,
  Sparkles,
  CheckCircle2,
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
  Copy,
  Check,
  Zap,
  Info,
  ShieldCheck,
  ShieldAlert,
  FilePlus,
  Trash,
  Search,
  ArrowRight
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  { icon: Sparkles, label: 'Executive Summary', prompt: 'Provide a concise executive summary of all uploaded documents.' },
  { icon: Search, label: 'Key Requirements', prompt: 'List all specific requirements, guidelines, or conditions stated.' },
  { icon: Layers, label: 'Action Items & Dates', prompt: 'Extract important dates, deadlines, and key terms mentioned.' }
];

export default function App() {
  // System Health
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Ingestion State
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Chat State
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Welcome to **Gemini 2.5 RAG Studio**.\n\nUpload your `.pdf` or `.txt` enterprise documents on the left panel to build a vector index in ChromaDB. Once indexed, ask any question to retrieve grounded answers synthesized by Google Gemini 2.5 Flash.",
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [query, setQuery] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const chatEndRef = useRef(null);

  // Fetch Health
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

  // Upload Document
  const handleUpload = async (e) => {
    if (e) e.preventDefault();
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
        setUploadStatus({ type: 'error', text: data.detail || 'Failed to index document.' });
      }
    } catch {
      setUploadStatus({ type: 'error', text: 'Network error uploading file.' });
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
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

  // Chat Query
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
          text: `⚠️ **API Exception**: ${data.detail || 'Unable to generate response.'}`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: '⚠️ **Network Error**: Unable to reach backend API at `http://localhost:8000`.',
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleSources = (msgId) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: 'Chat history cleared. How can I assist you with your indexed documents?',
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* TOP NAV BAR */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-indigo-600/20">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm text-slate-100 tracking-tight">Gemini RAG Studio</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">
              Gemini 2.5 Flash
            </span>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5">
            {/* ChromaDB Status */}
            <div className="flex items-center gap-1.5" title="Vector DB Health Status">
              <div className={`w-2 h-2 rounded-full ${health?.chroma_initialized ? 'bg-emerald-400 animate-pulse-subtle' : 'bg-rose-400'}`} />
              <span className="text-slate-400 text-[11px]">ChromaDB</span>
            </div>

            <div className="h-3 w-[1px] bg-slate-800" />

            {/* Gemini LLM Status */}
            <div className="flex items-center gap-1.5" title="Gemini LLM Status">
              <div className={`w-2 h-2 rounded-full ${health?.gemini_initialized ? 'bg-emerald-400 animate-pulse-subtle' : 'bg-amber-400'}`} />
              <span className="text-slate-400 text-[11px]">Gemini 2.5</span>
            </div>

            <div className="h-3 w-[1px] bg-slate-800" />

            {/* Total Chunks */}
            <div className="flex items-center gap-1.5" title="Total Indexed Vector Chunks">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-indigo-300 font-semibold font-mono text-[11px]">{health?.document_count ?? 0} chunks</span>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={loadingHealth}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
            title="Refresh System Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* WORKSPACE LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: KNOWLEDGE BASE ENGINE */}
        <aside className="w-80 border-r border-slate-800/80 bg-slate-900/30 p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          
          {/* Section: Ingestion Zone */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                Document Ingestion
              </h2>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-2.5">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition text-center ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : file
                    ? 'border-indigo-500/50 bg-indigo-950/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-200 truncate max-w-[200px]">
                    {file ? file.name : 'Drop PDF / TXT file here'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">PDF or TXT up to 10MB</p>
                </div>

                <label className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer transition">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {uploading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Chunking & Indexing...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Ingest & Embed Document</>
                )}
              </button>
            </form>

            {/* Ingestion Feedback */}
            {uploadStatus && (
              <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/20 text-rose-300'
              }`}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <span className="leading-snug">{uploadStatus.text}</span>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-slate-800/60" />

          {/* Section: Indexed Collection */}
          <div className="flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Indexed Knowledge ({documents.length})
              </h2>
            </div>

            {documents.length === 0 ? (
              <div className="p-5 rounded-xl border border-slate-800/40 bg-slate-950/40 text-center text-xs text-slate-500 my-auto flex flex-col items-center gap-2">
                <Database className="w-7 h-7 text-slate-700" />
                <p className="font-medium text-slate-400">No documents indexed</p>
                <p className="text-[11px] text-slate-600">Upload a PDF or TXT file above to build your vector search index.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs transition group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium text-slate-200 truncate" title={doc.filename}>{doc.filename}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{doc.chunks} vector chunks</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.filename)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition opacity-60 group-hover:opacity-100"
                      title="Remove document from index"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing API Key Warning */}
          {!health?.gemini_initialized && (
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>API Key Configured?</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Add your Gemini API key to <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200 font-mono">.env</code> to generate answers.
              </p>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN AREA: AI RAG WORKBENCH */}
        <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-indigo-400'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Content Bubble */}
                <div className={`flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed relative group ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Copy Button */}
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 transition opacity-0 group-hover:opacity-100"
                        title="Copy answer"
                      >
                        {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Retrieved Sources Citation Card */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="w-full text-xs">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium py-1 text-[11px]"
                      >
                        {expandedSources[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>Retrieved Context ({msg.sources.length} sources matched)</span>
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="mt-1.5 flex flex-col gap-1.5 pl-3 border-l-2 border-indigo-500/30">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 flex flex-col gap-1">
                              <div className="flex items-center justify-between text-indigo-300 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                  {src.filename}
                                </span>
                                <span className="text-slate-500 font-mono">Page {src.page}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Chat Loading State */}
            {loadingChat && (
              <div className="flex gap-3 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-200">Retrieving & Synthesizing...</span>
                    <span className="text-[10px] text-slate-500">Querying ChromaDB vector index with Gemini 2.5 Flash</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-6 py-2.5 border-t border-slate-900 bg-slate-950 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" /> Suggested:
            </span>
            {SUGGESTED_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={loadingChat}
                className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 text-slate-300 transition flex items-center gap-1.5 shrink-0"
              >
                <item.icon className="w-3 h-3 text-indigo-400" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom Chat Input Form */}
          <div className="p-4 bg-slate-900/40 border-t border-slate-800/80 backdrop-blur-xl shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3 max-w-3xl mx-auto"
            >
              <div className="flex-1 bg-slate-950 border border-slate-800 focus-within:border-indigo-500 rounded-xl px-4 py-2.5 flex items-center gap-2 transition">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask any question grounded in your documents..."
                  disabled={loadingChat}
                  className="flex-1 bg-transparent text-xs md:text-sm text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!query.trim() || loadingChat}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
              >
                <span>Send Query</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}
