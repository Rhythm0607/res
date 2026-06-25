import { useState } from 'react';
import { Send, UploadCloud, Bot, User, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function ResumeChatbot() {
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Hello! I am your AI Recruiter Assistant. Upload a candidate resume, and ask me to summarize it, find specific skills, or evaluate their fit for a role.' }]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_URL = 'http://localhost:8000/api/v1/chat';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    
    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setSessionId(res.data.session_id);
      setMessages(prev => [...prev, { role: 'ai', content: `Success! I have securely parsed and vectorized ${e.target.files![0].name}. What would you like to know about this candidate?` }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error: Failed to process the document. Please ensure the API is running and it is a valid PDF.' }]);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/ask`, {
        session_id: sessionId,
        question: userMsg,
        chat_history: []
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "I encountered an error retrieving that information." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      <div className="w-80 bg-card rounded-[24px] border border-border p-6 flex flex-col shadow-sm">
        <h3 className="font-bold text-lg mb-2 text-text">Candidate Context</h3>
        <p className="text-xs text-muted font-medium mb-6">Upload a resume to initialize the RAG engine.</p>
        
        <label className={`border-2 border-dashed rounded-[20px] p-8 flex flex-col items-center justify-center transition cursor-pointer text-center ${sessionId ? 'border-success/50 bg-success/5' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
          {uploading ? (
             <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></span>
          ) : sessionId ? (
            <CheckCircle2 size={36} className="text-success mb-3" />
          ) : (
            <UploadCloud size={36} className="text-muted mb-3" />
          )}
          <span className="font-semibold text-sm text-text">{sessionId ? 'Resume Loaded' : 'Upload PDF'}</span>
          <span className="text-xs text-muted font-medium mt-1">Max size 5MB</span>
          <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
        </label>
        
        {sessionId && (
          <div className="mt-6 p-4 bg-background border border-border rounded-xl flex items-start gap-3">
            <FileText className="text-primary mt-0.5" size={18} />
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-text truncate w-full">{sessionId}</p>
              <p className="text-xs text-success font-semibold mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full inline-block"></span> Vectorized & Ready</p>
            </div>
          </div>
        )}

        <div className="mt-auto">
           <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Suggested Prompts</h4>
           <div className="space-y-2">
             {["Summarize this candidate's experience.", "Does this candidate know AWS?", "What are their strongest backend skills?"].map(p => (
               <button key={p} onClick={() => {setInput(p);}} disabled={!sessionId} className="w-full text-left px-4 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold text-text hover:border-primary transition disabled:opacity-50">
                 {p}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-[24px] border border-border flex flex-col overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'ai' ? 'bg-primary/10 text-primary' : 'bg-primary text-white'}`}>
                {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-[20px] ${msg.role === 'ai' ? 'bg-background border border-border text-text rounded-tl-sm' : 'bg-primary text-white rounded-tr-sm shadow-soft'}`}>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Bot size={20} /></div>
              <div className="p-5 bg-background border border-border rounded-[20px] rounded-tl-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 bg-card border-t border-border">
          <div className="flex gap-3 relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={!sessionId}
              placeholder={sessionId ? "Ask anything about the candidate..." : "Upload a resume to start chatting"} 
              className="flex-1 bg-background border border-border rounded-xl px-5 py-3.5 pr-14 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button onClick={sendMessage} disabled={!sessionId || loading || !input.trim()} className="absolute right-2 top-2 bottom-2 aspect-square bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition shadow-sm">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
