import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, FileText, CheckCircle2, AlertCircle, Briefcase, Users, MessageSquare } from 'lucide-react';
import api from '@/services/api';
import { jobService, JobResponse } from '@/services/jobService';
import { resumeService, CandidateMatchResponse } from '@/services/resumeService';

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
}

export default function ResumeChatbot() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [candidates, setCandidates] = useState<CandidateMatchResponse[]>([]);

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: 'Hello! I am your AI Recruiter Assistant. Please select a job and candidate from the sidebar context to begin chatting with their resume.' }
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [initializingChain, setInitializingChain] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Job openings on mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoadingJobs(true);
        const data = await jobService.getJobs();
        setJobs(data);

        // Check if redirect query params are present
        const queryJobId = searchParams.get('jobId');
        const queryCandidateId = searchParams.get('candidateId');

        if (queryJobId) {
          const parsedJobId = parseInt(queryJobId, 10);
          setSelectedJobId(parsedJobId);

          if (queryCandidateId) {
            const parsedCandidateId = parseInt(queryCandidateId, 10);
            setSelectedCandidateId(parsedCandidateId);
            // Trigger load & initialize session in the next effect hook
          }
        } else if (data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
        setError('Failed to fetch job openings.');
      } finally {
        setLoadingJobs(false);
      }
    };
    loadJobs();
  }, []);

  // 2. Fetch candidates whenever selectedJobId changes
  useEffect(() => {
    if (!selectedJobId) {
      setCandidates([]);
      return;
    }

    const loadCandidates = async () => {
      try {
        setLoadingCandidates(true);
        const data = await resumeService.getJobCandidates(selectedJobId);
        setCandidates(data);

        // Check if queryCandidateId is present and belongs to this job
        const queryCandidateId = searchParams.get('candidateId');
        if (queryCandidateId) {
          const parsedCandidateId = parseInt(queryCandidateId, 10);
          if (data.some(c => c.candidate_id === parsedCandidateId)) {
            setSelectedCandidateId(parsedCandidateId);
            handleInitializeSession(parsedCandidateId, data.find(c => c.candidate_id === parsedCandidateId)?.name || 'Candidate');
            // Clean search params so it doesn't auto-reset on navigation shifts
            setSearchParams({});
            return;
          }
        }

        // Reset chatbot state since job context changed manually
        setSelectedCandidateId(null);
        setSessionId(null);
        setMessages([
          { role: 'ai', content: 'Job opening changed. Please select a candidate from the dropdown list to chat with their resume.' }
        ]);
      } catch (err) {
        console.error('Failed to load candidates:', err);
        setError('Failed to fetch candidates for this position.');
      } finally {
        setLoadingCandidates(false);
      }
    };
    loadCandidates();
  }, [selectedJobId]);

  // Handle RAG Session vector initialization
  const handleInitializeSession = async (candidateId: number, candidateName: string) => {
    try {
      setInitializingChain(true);
      setError(null);
      setSessionId(null);
      setMessages([
        { role: 'ai', content: `Vectorizing and preparing the RAG engine for ${candidateName}'s resume...` }
      ]);

      const res = await resumeService.initializeChatSession(candidateId);
      setSessionId(res.session_id);
      setMessages([
        {
          role: 'ai',
          content: `Success! I have successfully loaded and vectorized the complete resume of ${res.candidate_name}.\n\nWhat would you like to know about their projects, technical skills, or employment history?`
        }
      ]);
    } catch (err: any) {
      console.error('Failed to initialize chat session:', err);
      setSessionId(null);
      setMessages([
        {
          role: 'ai',
          content: `Could not load this candidate's resume for chat. Please make sure the backend is active and the resume text has been parsed.`
        }
      ]);
      setError(err.response?.data?.detail || 'Failed to initialize AI Chat session.');
    } finally {
      setInitializingChain(false);
    }
  };

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedCandidateId(null);
      setSessionId(null);
      setMessages([{ role: 'ai', content: 'Select a candidate from the sidebar context to begin chatting.' }]);
      return;
    }

    const candidateId = parseInt(val, 10);
    setSelectedCandidateId(candidateId);

    const candidateName = candidates.find(c => c.candidate_id === candidateId)?.name || 'Candidate';
    handleInitializeSession(candidateId, candidateName);
  };

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedJobId(null);
      return;
    }
    setSelectedJobId(parseInt(val, 10));
  };

  // Send RAG chat message
  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setSendingMessage(true);

    // Build chat history matching LangChain expected structures
    // Map last 6 messages to keep context window light and fast
    const chatHistory = messages
      .slice(-6)
      .map(msg => ({
        sender: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content
      }));

    try {
      const response = await api.post('/chat/ask', {
        session_id: sessionId,
        question: userMsg,
        chat_history: chatHistory
      });

      setMessages(prev => [...prev, { role: 'ai', content: response.data.answer }]);
    } catch (err: any) {
      console.error('Failed to query AI RAG chatbot:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: err.response?.data?.detail || "I experienced an error retrieving information from the model. Please check your API key quota configurations."
        }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const activeCandidate = candidates.find(c => c.candidate_id === selectedCandidateId);

  return (
    <div className="flex min-h-[calc(100vh-160px)] gap-6">
      {/* Sidebar: Candidate Selector */}
      <div className="flex w-80 flex-col rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            <h3 className="text-lg font-black text-text">Chat Context</h3>
          </div>
          <p className="text-xs font-medium leading-5 text-muted">Select a job and candidate to initialize the RAG vector engine.</p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-danger/5 border border-danger/20 rounded-xl text-danger text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Job Dropdown Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Job Vacancy</label>
            <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-xl">
              <Briefcase size={14} className="text-muted" />
              <select
                value={selectedJobId || ''}
                onChange={handleJobChange}
                disabled={loadingJobs}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer text-text w-full"
              >
                {loadingJobs && <option>Loading jobs...</option>}
                {!loadingJobs && jobs.length === 0 && <option>No jobs created</option>}
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Candidate Dropdown Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Candidate Resume</label>
            <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-xl">
              <Users size={14} className="text-muted" />
              <select
                value={selectedCandidateId || ''}
                onChange={handleCandidateChange}
                disabled={loadingCandidates || !selectedJobId}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer text-text w-full"
              >
                {loadingCandidates && <option>Loading candidates...</option>}
                {!loadingCandidates && candidates.length === 0 && <option>No candidates found</option>}
                {!loadingCandidates && candidates.length > 0 && (
                  <>
                    <option value="">-- Select Candidate --</option>
                    {candidates.map(cand => (
                      <option key={cand.candidate_id} value={cand.candidate_id}>
                        {cand.name} ({Math.round(cand.ats_score)}% match)
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Vector Status Badge */}
        {selectedCandidateId && (
          <div className="p-4 bg-background border border-border rounded-xl flex items-start gap-3 mb-6">
            <FileText className="text-primary mt-0.5" size={18} />
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-text truncate w-full">{activeCandidate?.name || 'Selected Candidate'}</p>

              {initializingChain ? (
                <p className="text-xs text-primary font-semibold mt-1 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 bg-primary rounded-full inline-block animate-ping"></span>
                  Indexing resume...
                </p>
              ) : sessionId ? (
                <p className="text-xs text-success font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-success" />
                  RAG Vectorized & Ready
                </p>
              ) : (
                <p className="text-xs text-danger font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="text-danger" />
                  Context Offline
                </p>
              )}
            </div>
          </div>
        )}

        {/* Suggested Prompts */}
        <div className="mt-auto">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Suggested Prompts</h4>
          <div className="space-y-2">
            {[
              "Summarize this candidate's work experience.",
              "What are their strongest technical skills?",
              "Evaluate this candidate's fit for the role.",
              "Are there any resume gap concerns?"
            ].map(p => (
              <button
                key={p}
                onClick={() => setInput(p)}
                disabled={!sessionId || sendingMessage}
                className="w-full text-left px-4 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold text-text hover:border-primary hover:text-primary transition disabled:opacity-50 disabled:hover:border-border disabled:hover:text-text"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Layout Area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-soft">
        {/* Chat Messages Log */}
        <div className="flex-1 space-y-6 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(226,251,108,0.18),_transparent_30%)] p-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'ai' ? 'bg-primary/10 text-primary' : 'bg-primary text-white'}`}>
                {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={`max-w-[80%] rounded-[20px] p-4 ${msg.role === 'ai' ? 'rounded-tl-sm border border-border bg-background text-text' : 'rounded-tr-sm bg-primary text-white shadow-soft'}`}>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* AI Generation Loader */}
          {sendingMessage && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="p-5 bg-background border border-border rounded-[20px] rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Message Box */}
        <div className="border-t border-border bg-background/70 p-5">
          <div className="flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={!sessionId || sendingMessage}
              placeholder={
                initializingChain
                  ? "Indexing resume content... please wait..."
                  : sessionId
                    ? `Ask me anything about ${activeCandidate?.name || 'the candidate'}...`
                    : "Please select a candidate to begin chatting"
              }
              className="flex-1 rounded-2xl border border-border bg-card px-5 py-3.5 pr-14 text-sm font-medium text-text transition placeholder-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!sessionId || sendingMessage || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 transition shadow-sm"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
