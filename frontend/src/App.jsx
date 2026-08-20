import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Library,
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
  Layers,
  Bot,
  User,
  ChevronRight,
  ChevronDown,
  Loader2,
  Copy,
  Check,
  Feather,
  BookMarked,
  FileSearch,
  Search,
  Quote,
  ScrollText,
  Bookmark
} from 'lucide-react';

const SUGGESTED_RESEARCH_PROMPTS = [
  { label: 'Executive Summary', prompt: 'Provide a comprehensive summary of the indexed library documents.' },
  { label: 'Key Requirements', prompt: 'What are the main requirements or instructions detailed in the text?' },
  { label: 'Definitions & Dates', prompt: 'List all important terms, dates, and definitions found in the documents.' }
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
      text: "Welcome to the **RAG Knowledge Library & Archive**.\n\nAdd your PDF or TXT reference texts to the library catalog on the left to index them into ChromaDB. Once cataloged, ask any research query to generate grounded answers synthesized by Google Gemini 2.5 Flash.",
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [query, setQuery] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [copiedMsgId, setCopiedMsgId] = useState(null);

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
        setUploadStatus({ type: 'success', text: `Cataloged "${data.filename}" (${data.chunks} chunks)` });
        if (!documents.some(d => d.filename === data.filename)) {
          setDocuments(prev => [...prev, { filename: data.filename, chunks: data.chunks }]);
        }
        setFile(null);
        checkHealth();
      } else {
        setUploadStatus({ type: 'error', text: data.detail || 'Failed to catalog document.' });
      }
    } catch {
      setUploadStatus({ type: 'error', text: 'Network error uploading document.' });
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
          text: `⚠️ **Exception**: ${data.detail || 'Unable to generate response.'}`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: '⚠️ **Network Error**: Unable to reach local archive backend server.',
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

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#fbf9f4] text-stone-900 font-sans antialiased overflow-hidden">
      
      {/* TOP PAPER HEADER */}
      <header className="h-16 border-b border-[#e8e2d5] bg-[#f7f3ea] px-6 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2c2416] text-[#f4efe4] flex items-center justify-center shadow-sm">
            <Library className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="font-serif-title font-bold text-base text-[#2c2416] tracking-tight">
              Knowledge Library & Archive
            </h1>
            <p className="text-[11px] text-stone-500 font-sans">Gemini 2.5 Flash • ChromaDB Repository</p>
          </div>
        </div>

        {/* Paper Status Badges */}
        <div className="flex items-center gap-4 text-xs font-sans">
          <div className="flex items-center gap-3 bg-[#ffffff] border border-[#e6dfd1] rounded-lg px-3 py-1.5 shadow-xs">
            {/* ChromaDB */}
            <div className="flex items-center gap-1.5" title="Vector Database Status">
              <Database className="w-3.5 h-3.5 text-amber-800" />
              <span className="text-stone-600 text-[11px]">ChromaDB:</span>
              <span className={health?.chroma_initialized ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                {health?.chroma_initialized ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="h-3.5 w-[1px] bg-[#e6dfd1]" />

            {/* Gemini LLM */}
            <div className="flex items-center gap-1.5" title="Gemini LLM Status">
              <Cpu className="w-3.5 h-3.5 text-amber-800" />
              <span className="text-stone-600 text-[11px]">Gemini 2.5:</span>
              <span className={health?.gemini_initialized ? 'text-emerald-700 font-semibold' : 'text-amber-800 font-semibold'}>
                {health?.gemini_initialized ? 'Ready' : 'API Key Required'}
              </span>
            </div>

            <div className="h-3.5 w-[1px] bg-[#e6dfd1]" />

            {/* Total Chunks */}
            <div className="flex items-center gap-1.5" title="Total Indexed Vector Chunks">
              <Layers className="w-3.5 h-3.5 text-amber-900" />
              <span className="text-stone-700 font-medium text-[11px]">{health?.document_count ?? 0} Chunks Cataloged</span>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={loadingHealth}
            className="p-2 rounded-lg bg-[#ffffff] border border-[#e6dfd1] text-stone-600 hover:text-stone-900 hover:border-stone-400 shadow-xs transition"
            title="Refresh System Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-amber-800' : ''}`} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: LIBRARY CATALOG & INGESTION */}
        <aside className="w-80 border-r border-[#e8e2d5] bg-[#f7f3ea]/50 p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          
          {/* Section: Ingestion / Add to Library */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-title font-semibold text-sm text-[#2c2416] flex items-center gap-1.5">
                <Feather className="w-4 h-4 text-amber-800" />
                Archive Ingestion
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
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition text-center ${
                  isDragging
                    ? 'border-amber-800 bg-amber-50/60'
                    : file
                    ? 'border-amber-700/60 bg-amber-50/40'
                    : 'border-[#e0d7c7] hover:border-amber-700/50 bg-[#fffefb]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#f4efe4] border border-[#dfd6c5] flex items-center justify-center text-amber-900">
                  <ScrollText className="w-4 h-4 text-amber-800" />
                </div>

                <div>
                  <p className="text-xs font-medium text-stone-800 truncate max-w-[200px]">
                    {file ? file.name : 'Drop PDF or TXT document'}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Maximum size 10MB</p>
                </div>

                <label className="text-[11px] font-semibold text-amber-900 hover:text-amber-800 cursor-pointer underline underline-offset-2 transition">
                  <span>Select File</span>
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
                className="w-full py-2.5 px-3 rounded-lg bg-[#2c2416] hover:bg-[#3d3321] text-[#f7f3ea] font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {uploading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Indexing Document...</>
                ) : (
                  <><BookMarked className="w-3.5 h-3.5" /> Catalog & Index Document</>
                )}
              </button>
            </form>

            {/* Upload Message */}
            {uploadStatus && (
              <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                )}
                <span className="leading-snug">{uploadStatus.text}</span>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-[#e8e2d5]" />

          {/* Section: Catalog Index */}
          <div className="flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-title font-semibold text-sm text-[#2c2416] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-800" />
                Library Catalog ({documents.length})
              </h2>
            </div>

            {documents.length === 0 ? (
              <div className="p-5 rounded-xl border border-[#e6dfd1] bg-[#ffffff] text-center text-xs text-stone-500 my-auto flex flex-col items-center gap-2 shadow-xs">
                <Bookmark className="w-7 h-7 text-amber-800/40" />
                <p className="font-serif-title font-medium text-stone-700 text-sm">Library is Empty</p>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Add PDF or TXT reference materials to populate the knowledge collection.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-[#e6dfd1] hover:border-amber-700/40 flex items-center justify-between gap-3 text-xs transition shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 rounded-lg bg-[#f5efe4] text-amber-900 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium text-stone-900 truncate" title={doc.filename}>{doc.filename}</p>
                        <p className="text-[10px] text-stone-500">{doc.chunks} vector chunks</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.filename)}
                      className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      title="Remove from library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing API Key Banner */}
          {!health?.gemini_initialized && (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-xs flex flex-col gap-1 shadow-xs">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-800" />
                <span>API Key Setup Needed</span>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Add your Gemini API key to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">.env</code> to generate answers.
              </p>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN AREA: READING ROOM & RESEARCH FEED */}
        <main className="flex-1 flex flex-col bg-[#fbf9f4] relative overflow-hidden">
          
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#2c2416] text-[#f4efe4]'
                    : 'bg-[#ffffff] border border-[#e6dfd1] text-amber-900'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Content Bubble */}
                <div className={`flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-5 rounded-2xl text-xs md:text-sm leading-relaxed relative group ${
                    msg.sender === 'user'
                      ? 'bg-[#f0e8d8] border border-[#e0d4be] text-stone-900 rounded-tr-none shadow-xs'
                      : 'bg-white border border-[#eae3d2] text-stone-800 rounded-tl-none shadow-xs'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Copy Button */}
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#f5efe4] text-stone-600 hover:text-stone-900 transition opacity-0 group-hover:opacity-100"
                        title="Copy answer text"
                      >
                        {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Bibliographic Citations (Retrieved Sources) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="w-full text-xs font-sans">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className="text-amber-900 hover:text-amber-800 flex items-center gap-1.5 font-semibold py-1 text-[11px]"
                      >
                        {expandedSources[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>Bibliographic Sources ({msg.sources.length} citations)</span>
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="mt-1.5 flex flex-col gap-1.5 pl-3 border-l-2 border-amber-800/30">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="bg-white border border-[#e6dfd1] rounded-lg p-2.5 text-[11px] text-stone-700 flex items-center justify-between shadow-xs">
                              <span className="flex items-center gap-1.5 font-medium text-stone-900">
                                <FileText className="w-3.5 h-3.5 text-amber-800" />
                                {src.filename}
                              </span>
                              <span className="text-stone-500 font-mono text-[10px]">Page {src.page}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-stone-400 px-1 font-mono">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loadingChat && (
              <div className="flex gap-3 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#e6dfd1] text-amber-900 flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#e6dfd1] text-stone-700 text-xs flex items-center gap-3 shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-800" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-stone-900 font-serif-title">Searching Library Records...</span>
                    <span className="text-[10px] text-stone-500">Retrieving vector similarity matches from ChromaDB</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Research Prompt Suggestions Bar */}
          <div className="px-6 py-2.5 border-t border-[#e8e2d5] bg-[#f7f3ea]/80 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
            <span className="text-[10px] font-bold text-amber-950 uppercase tracking-wider shrink-0 flex items-center gap-1 font-serif-title">
              <Quote className="w-3 h-3 text-amber-800" /> Research Prompts:
            </span>
            {SUGGESTED_RESEARCH_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={loadingChat}
                className="text-[11px] font-medium whitespace-nowrap px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-[#e0d7c7] text-stone-800 transition flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom Fountain Input Form */}
          <div className="p-4 bg-[#f7f3ea] border-t border-[#e8e2d5] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3 max-w-3xl mx-auto"
            >
              <div className="flex-1 bg-white border border-[#ded5c2] focus-within:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-2 transition shadow-xs">
                <FileSearch className="w-4 h-4 text-amber-800 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Inquire about any cataloged document in the archive..."
                  disabled={loadingChat}
                  className="flex-1 bg-transparent text-xs md:text-sm text-stone-900 placeholder-stone-400 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!query.trim() || loadingChat}
                className="py-3 px-5 rounded-xl bg-[#2c2416] hover:bg-[#3d3321] text-[#f7f3ea] font-medium text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
              >
                <span>Query Archive</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}
