import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Briefcase, Users, ShieldAlert, X, Trash2, MessageSquare, AlertCircle, ChevronDown, ChevronUp, Bot, Mail, Copy, Check, RefreshCw } from 'lucide-react';
import { jobService, JobResponse } from '@/services/jobService';
import { resumeService, CandidateMatchResponse, InterviewQuestion, EmailDraftResponse } from '@/services/resumeService';

export default function CandidateRanking() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [candidates, setCandidates] = useState<CandidateMatchResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Candidate Detail Breakdown
  const [activeCandidate, setActiveCandidate] = useState<CandidateMatchResponse | null>(null);
  const [modalTab, setModalTab] = useState<'match' | 'profile' | 'text' | 'questions' | 'outreach'>('match');
  const [expandedCandidates, setExpandedCandidates] = useState<Record<number, boolean>>({});

  // Interview Questions state
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Email Outreach Draft state
  const [emailDraft, setEmailDraft] = useState<EmailDraftResponse | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Bulk Email Outreach states
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkEmailTargetMode, setBulkEmailTargetMode] = useState<'selected' | 'topN' | 'all'>('selected');
  const [bulkEmailTopNLimit, setBulkEmailTopNLimit] = useState<number | ''>(5);
  const [bulkSubject, setBulkSubject] = useState('Invitation to Interview: {job_title} role at HireSense');
  const [bulkBody, setBulkBody] = useState('Hi {candidate_name},\n\nWe were impressed by your background. We would like to invite you for an introductory interview for the {job_title} role.\n\nPlease let us know if you have any availability for a brief call next week.\n\nBest regards,\nRecruitment Team');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const toggleSkills = (candidateId: number) => {
    setExpandedCandidates(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId]
    }));
  };

  // Load tailored interview questions when Tab is selected
  useEffect(() => {
    if (modalTab === 'questions' && activeCandidate && selectedJobId) {
      const loadQuestions = async () => {
        try {
          setLoadingQuestions(true);
          setQuestionsError(null);
          setExpandedQuestionId(null);
          const data = await resumeService.getCandidateQuestions(activeCandidate.candidate_id, selectedJobId);
          setQuestions(data);
        } catch (err) {
          console.error('Failed to load questions:', err);
          setQuestionsError('Could not load AI interview questions. Please make sure the backend is active.');
        } finally {
          setLoadingQuestions(false);
        }
      };
      loadQuestions();
    }
  }, [modalTab, activeCandidate, selectedJobId]);

  // Load email draft when outreach tab is selected (or on explicit regenerate)
  const fetchEmailDraft = async (candidateId: number, jobId: number) => {
    try {
      setLoadingDraft(true);
      setDraftError(null);
      setCopied(false);
      const data = await resumeService.getEmailDraft(candidateId, jobId);
      setEmailDraft(data);
    } catch (err) {
      console.error('Failed to load email draft:', err);
      setDraftError('Could not generate email draft. Please make sure the backend is active.');
    } finally {
      setLoadingDraft(false);
    }
  };

  useEffect(() => {
    if (modalTab === 'outreach' && activeCandidate && selectedJobId && !emailDraft && !loadingDraft) {
      fetchEmailDraft(activeCandidate.candidate_id, selectedJobId);
    }
  }, [modalTab, activeCandidate, selectedJobId]);

  // Copy email text to clipboard
  const handleCopyEmail = () => {
    if (!emailDraft) return;
    const fullText = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Send email directly via backend SMTP
  const handleSendEmail = async () => {
    if (!emailDraft || !activeCandidate || !selectedJobId) return;
    try {
      setSendingEmail(true);
      setSendError(null);
      setSendSuccess(false);
      await resumeService.sendCandidateEmail(
        activeCandidate.candidate_id,
        selectedJobId,
        emailDraft.subject,
        emailDraft.body
      );
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      const errMsg = err.response?.data?.detail || 'Failed to dispatch email. Please check credentials.';
      setSendError(errMsg);
    } finally {
      setSendingEmail(false);
    }
  };

  // Toggle selection for a single candidate
  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidateIds(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // Toggle selection for all candidates in the list
  const toggleAllCandidatesSelection = () => {
    if (selectedCandidateIds.length === candidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidates.map(c => c.candidate_id));
    }
  };

  // Get final candidates list depending on target mode
  const getSelectedCandidatesForBulk = () => {
    const sorted = [...candidates].sort((a, b) => b.ats_score - a.ats_score);
    if (bulkEmailTargetMode === 'topN') {
      const limit = typeof bulkEmailTopNLimit === 'number' ? bulkEmailTopNLimit : 0;
      return sorted.slice(0, Math.max(0, limit));
    }
    if (bulkEmailTargetMode === 'all') return sorted;
    return candidates.filter(c => selectedCandidateIds.includes(c.candidate_id));
  };

  // Trigger bulk dispatches to API
  const handleSendBulkEmails = async () => {
    if (!selectedJobId) return;
    const targetCandidates = getSelectedCandidatesForBulk();
    const ids = targetCandidates.map(c => c.candidate_id);
    if (ids.length === 0) {
      setBulkError('No candidates selected for outreach.');
      return;
    }

    try {
      setSendingBulk(true);
      setBulkError(null);
      setBulkSuccess(null);
      
      const response = await resumeService.sendBulkEmails(selectedJobId, ids, bulkSubject, bulkBody);
      setBulkSuccess(`Dispatched ${response.total_sent} invitations successfully!`);
      setSelectedCandidateIds([]);
      setTimeout(() => {
        setBulkSuccess(null);
        setIsBulkModalOpen(false);
      }, 2500);
    } catch (err: any) {
      console.error('Failed to send bulk emails:', err);
      const errMsg = err.response?.data?.detail || 'Failed to dispatch bulk outreach dispatches. Please check settings.';
      setBulkError(errMsg);
    } finally {
      setSendingBulk(false);
    }
  };

  // Load Job Openings on mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoadingJobs(true);
        const data = await jobService.getJobs();
        setJobs(data);

        // Check if there is a jobId in query parameters
        const queryJobId = searchParams.get('jobId');
        if (queryJobId) {
          const parsedId = parseInt(queryJobId, 10);
          setSelectedJobId(parsedId);
        } else if (data.length > 0) {
          // Default to first job in list
          setSelectedJobId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
        setError('Failed to fetch job openings. Make sure backend is running.');
      } finally {
        setLoadingJobs(false);
      }
    };
    loadJobs();
  }, [searchParams]);

  // Load Candidates when selectedJobId changes
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
        setError(null);
      } catch (err: any) {
        console.error('Failed to load candidates:', err);
        setCandidates([]);
        setError(err.response?.data?.detail || 'Failed to fetch candidate matching data.');
      } finally {
        setLoadingCandidates(false);
      }
    };

    loadCandidates();
  }, [selectedJobId]);

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jobId = parseInt(e.target.value, 10);
    setSelectedJobId(jobId);
    setSearchParams({ jobId: jobId.toString() });
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    if (!selectedJobId) return;
    const confirmed = window.confirm("Are you sure you want to delete this candidate's resume and matching results? This will remove the file copy on disk and clean up database records.");
    if (!confirmed) return;

    try {
      await resumeService.deleteCandidate(selectedJobId, candidateId);
      setCandidates(prev => prev.filter(c => c.candidate_id !== candidateId));
      if (activeCandidate?.candidate_id === candidateId) {
        setActiveCandidate(null);
      }
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      alert("Failed to delete the resume candidate. Please try again.");
    }
  };

  const handleOpenModal = (candidate: CandidateMatchResponse, tab: 'match' | 'profile' | 'text' | 'questions' | 'outreach' = 'match') => {
    setActiveCandidate(candidate);
    setModalTab(tab);
    setEmailDraft(null);
    setDraftError(null);
    setCopied(false);
    setSendSuccess(false);
    setSendError(null);
    setSendingEmail(false);
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-border bg-card/90 p-7 shadow-[0_24px_80px_-35px_rgba(0,72,56,0.22)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <Star size={14} /> AI ranking hub
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-text">Candidate AI Ranking</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted">Compare, rank, and score applicants against job requirements automatically using semantic AI.</p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-4 py-2.5 shadow-sm">
            <Briefcase size={16} className="text-muted" />
            <select
              value={selectedJobId || ''}
              onChange={handleJobChange}
              disabled={loadingJobs}
              className="min-w-[220px] bg-transparent text-sm font-bold text-text outline-none"
            >
              {loadingJobs && <option>Loading jobs...</option>}
              {!loadingJobs && jobs.length === 0 && <option>No jobs created yet</option>}
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger/5 border border-danger/20 rounded-xl text-danger text-sm font-semibold flex items-center gap-2">
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {/* Selection Control Bar */}
      {!loadingCandidates && candidates.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={candidates.length > 0 && selectedCandidateIds.length === candidates.length}
              onChange={toggleAllCandidatesSelection}
              className="w-4.5 h-4.5 text-primary border-border rounded focus:ring-primary/50 cursor-pointer animate-none"
              id="select-all-candidates"
            />
            <label htmlFor="select-all-candidates" className="text-xs font-bold text-muted cursor-pointer select-none">
              {selectedCandidateIds.length === candidates.length ? 'Deselect All' : 'Select All Candidates'}
            </label>
            {selectedCandidateIds.length > 0 && (
              <span className="text-xs font-bold bg-[#7c3aed]/10 text-[#7c3aed] px-2.5 py-1 rounded-xl">
                {selectedCandidateIds.length} selected manually
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedCandidateIds.length > 0) {
                  setBulkEmailTargetMode('selected');
                } else {
                  setBulkEmailTargetMode('topN');
                }
                setBulkSuccess(null);
                setBulkError(null);
                setIsBulkModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white text-xs font-bold rounded-xl hover:bg-[#6d28d9] shadow-soft transition cursor-pointer"
            >
              <Mail size={13} />
              {selectedCandidateIds.length > 0
                ? `Bulk Invite (${selectedCandidateIds.length} Selected)`
                : 'Bulk Invite Matches'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loadingCandidates ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted text-sm font-semibold">Analyzing matches and fetching rankings...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-[28px] border border-border bg-card p-16 text-center shadow-soft">
          <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mx-auto mb-4">
            <Users size={28} />
          </div>
          <h3 className="text-lg font-bold text-text mb-1">No Candidates Uploaded</h3>
          <p className="text-muted text-sm max-w-sm mx-auto font-medium mb-6">
            There are no candidates uploaded for this job vacancy yet.
          </p>
          <a
            href="/app/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition shadow-soft"
          >
            Upload Resumes now
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((c, idx) => (
            <div
              key={c.candidate_id}
              onClick={() => handleOpenModal(c)}
              className="group relative flex cursor-pointer flex-col justify-between rounded-[24px] border border-border bg-card p-6 shadow-soft transition-all hover:border-primary/40 hover:shadow-[0_18px_60px_-28px_rgba(0,72,56,0.25)]"
            >
              {/* Highlight Rank 1 */}
              {idx === 0 && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-tr from-warning to-yellow-300 rounded-full flex items-center justify-center text-white shadow-md" title="Top Match Candidate">
                  <Star size={14} fill="currentColor" />
                </div>
              )}

              <div>
                {/* Header: Initial, Delete Icon & ATS Score */}
                 <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.includes(c.candidate_id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleCandidateSelection(c.candidate_id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary/50 cursor-pointer flex-shrink-0 mr-1"
                    />
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCandidate(c.candidate_id);
                      }}
                      className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Candidate"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/chat?candidateId=${c.candidate_id}&jobId=${selectedJobId}`);
                      }}
                      className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Chat with Candidate"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(c, 'outreach');
                      }}
                      className="p-2 text-muted hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-xl transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Draft Outreach Email"
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-success">{Math.round(c.ats_score)}%</div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest">ATS Score</div>
                  </div>
                </div>

                {/* Candidate Info */}
                <h3 className="font-bold text-lg text-text truncate">{c.name}</h3>
                <p className="text-xs text-muted font-semibold mb-3 truncate">{c.email}</p>

                <div className="text-xs text-text font-semibold flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-background border border-border rounded">
                    {c.experience_years} years exp
                  </span>
                  <span className="px-2 py-0.5 bg-background border border-border rounded truncate max-w-[150px]">
                    {c.education}
                  </span>
                </div>

                {/* Parsed Skills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {(expandedCandidates[c.candidate_id] ? c.extracted_skills : c.extracted_skills.slice(0, 4)).map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-background border border-border rounded-lg text-[10px] font-bold uppercase tracking-wide text-text"
                    >
                      {skill}
                    </span>
                  ))}
                  {c.extracted_skills.length > 4 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSkills(c.candidate_id);
                      }}
                      className="px-2.5 py-1 bg-background border border-border hover:border-primary hover:text-primary rounded-lg text-[10px] font-bold text-muted transition cursor-pointer"
                    >
                      {expandedCandidates[c.candidate_id] ? 'Show less' : `+${c.extracted_skills.length - 4} more`}
                    </button>
                  )}
                </div>
              </div>

              {/* View Breakdown Action Button */}
              <button
                onClick={() => handleOpenModal(c)}
                className="w-full py-2.5 bg-primary/5 text-primary font-bold rounded-xl text-sm group-hover:bg-primary group-hover:text-white transition"
              >
                View Match Analysis
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Match Details Modal */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setActiveCandidate(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-border bg-background/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text">{activeCandidate.name}</h3>
                <p className="text-xs text-muted mt-0.5">Matched for: <span className="font-bold text-text">{selectedJob?.title}</span></p>
              </div>
              <button
                onClick={() => setActiveCandidate(null)}
                className="p-2 text-muted hover:text-text hover:bg-background rounded-lg transition"
              >
                <X size={20} className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border bg-background/30 px-6">
              <button
                onClick={() => setModalTab('match')}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 uppercase tracking-wider transition ${modalTab === 'match'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text'
                  }`}
              >
                AI Match Score
              </button>
              <button
                onClick={() => setModalTab('profile')}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 uppercase tracking-wider transition ${modalTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text'
                  }`}
              >
                Parsed Profile
              </button>
              <button
                onClick={() => setModalTab('text')}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 uppercase tracking-wider transition ${modalTab === 'text'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text'
                  }`}
              >
                Raw Resume Text
              </button>
              <button
                onClick={() => setModalTab('questions')}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 uppercase tracking-wider transition ${modalTab === 'questions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text'
                  }`}
              >
                Interview Prep
              </button>
              <button
                onClick={() => setModalTab('outreach')}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 uppercase tracking-wider transition ${modalTab === 'outreach'
                    ? 'border-[#7c3aed] text-[#7c3aed]'
                    : 'border-transparent text-muted hover:text-text'
                  }`}
              >
                Draft Email
              </button>
            </div>

            {/* Content Body based on active tab */}
            {modalTab === 'match' && (
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Overall Score Circle Card */}
                <div className="bg-background border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-muted uppercase tracking-wider">ATS Score Rating</h4>
                    <p className="text-xs text-muted mt-1 max-w-sm font-medium">
                      This score is computed using semantic text matching, skills overlap, and years of experience.
                    </p>
                  </div>
                  <div className="w-20 h-20 rounded-full border border-success flex flex-col items-center justify-center bg-success/5 shadow-soft flex-shrink-0">
                    <span className="text-2xl font-black text-success">{Math.round(activeCandidate.ats_score)}%</span>
                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest">Match</span>
                  </div>
                </div>

                {/* Scoring Breakdown Bar Chart */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Scoring Metrics Breakdown</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Semantic Match */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-text">Semantic JD Alignment</span>
                        <span className="text-primary">{Math.round(activeCandidate.semantic_score)}%</span>
                      </div>
                      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${activeCandidate.semantic_score}%` }}></div>
                      </div>
                    </div>

                    {/* Skills Match */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-text">Required Skills Overlap</span>
                        <span className="text-primary">{Math.round(activeCandidate.skill_match_score)}%</span>
                      </div>
                      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${activeCandidate.skill_match_score}%` }}></div>
                      </div>
                    </div>

                    {/* Experience Match */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-text">Experience Requirement</span>
                        <span className="text-primary">{Math.round(activeCandidate.experience_match_score)}%</span>
                      </div>
                      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${activeCandidate.experience_match_score}%` }}></div>
                      </div>
                    </div>

                    {/* Education Match */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-text">Education Eligibility</span>
                        <span className="text-primary">{Math.round(activeCandidate.education_match_score)}%</span>
                      </div>
                      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${activeCandidate.education_match_score}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Skills Overlap Analysis</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-bold text-success block mb-1.5">Matching Extracted Skills:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeCandidate.extracted_skills.map(skill => (
                          <span key={skill} className="px-2.5 py-1 bg-success/5 border border-success/20 rounded-lg text-xs font-bold text-success capitalize">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {activeCandidate.missing_skills.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-danger block mb-1.5">Missing Required Skills:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeCandidate.missing_skills.map(skill => (
                            <span key={skill} className="px-2.5 py-1 bg-danger/5 border border-danger/20 rounded-lg text-xs font-bold text-danger capitalize">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Match Summary */}
                {activeCandidate.ai_summary && (
                  <div className="bg-background border border-border p-4 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider">AI Match Summary</h4>
                    <p className="text-sm font-medium text-text leading-relaxed">
                      {activeCandidate.ai_summary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {modalTab === 'profile' && (
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Contact Info Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background border border-border p-4 rounded-xl shadow-inner">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Email Address</span>
                    <span className="text-sm font-bold text-text">{activeCandidate.email}</span>
                  </div>
                  <div className="bg-background border border-border p-4 rounded-xl shadow-inner">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Years of Experience</span>
                    <span className="text-sm font-bold text-text">{activeCandidate.experience_years} years</span>
                  </div>
                </div>

                {/* Education Card */}
                <div className="bg-background border border-border p-4 rounded-xl shadow-inner">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Education / Highest Degree Summary</span>
                  <span className="text-sm font-bold text-text">{activeCandidate.education}</span>
                </div>

                {/* Full Extracted Skills list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">All Extracted Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCandidate.extracted_skills.length === 0 ? (
                      <span className="text-sm font-medium text-muted">No skills extracted from this resume.</span>
                    ) : (
                      activeCandidate.extracted_skills.map(skill => (
                        <span key={skill} className="px-2.5 py-1.5 bg-primary/5 border border-primary/20 rounded-lg text-xs font-semibold text-text capitalize">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'text' && (
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Raw Extracted Document Text</h4>
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded">Select & Copy Active</span>
                </div>
                <div className="bg-background border border-border p-4 rounded-xl max-h-[50vh] overflow-y-auto shadow-inner">
                  <pre className="text-xs text-text font-mono whitespace-pre-wrap leading-relaxed select-all selection:bg-primary/20">
                    {activeCandidate.resume_text || "No raw text extracted from this resume file."}
                  </pre>
                </div>
              </div>
            )}

            {modalTab === 'questions' && (
              <div className="p-6 overflow-y-auto space-y-6 max-h-[60vh]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl flex-shrink-0">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text">AI Tailored Questions</h4>
                    <p className="text-xs text-muted font-medium">Custom evaluation questions based on skills overlap and experience highlights.</p>
                  </div>
                </div>

                {loadingQuestions && (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-background border border-border p-5 rounded-2xl space-y-3">
                        <div className="h-4 bg-muted/20 w-1/3 rounded"></div>
                        <div className="h-6 bg-muted/20 w-3/4 rounded"></div>
                      </div>
                    ))}
                  </div>
                )}

                {questionsError && (
                  <div className="p-4 bg-danger/5 border border-danger/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-danger mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-bold text-danger">Error Generating Questions</p>
                      <p className="text-xs text-muted font-semibold mt-1">{questionsError}</p>
                    </div>
                  </div>
                )}

                {!loadingQuestions && !questionsError && (
                  <div className="space-y-4">
                    {questions.length === 0 ? (
                      <div className="text-center py-8 text-muted font-medium text-sm">
                        No tailored interview questions generated yet.
                      </div>
                    ) : (
                      questions.map((q) => {
                        const isExpanded = expandedQuestionId === q.id;
                        return (
                          <div
                            key={q.id}
                            className={`bg-background border rounded-2xl transition overflow-hidden ${isExpanded ? 'border-primary shadow-soft' : 'border-border hover:border-muted'
                              }`}
                          >
                            <div
                              onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                              className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                            >
                              <div className="space-y-2">
                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider block w-fit ${q.category === 'Technical'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-success/10 text-success'
                                  }`}>
                                  {q.category} Question
                                </span>
                                <p className="font-bold text-sm text-text leading-relaxed">{q.question}</p>
                              </div>
                              <div className="text-muted flex-shrink-0 mt-0.5">
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-5 pb-5 pt-3 border-t border-border bg-card/40">
                                <div className="flex items-start gap-2.5 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                  <ShieldAlert size={16} className="text-primary shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Recruiter Evaluation Guide</p>
                                    <p className="text-xs text-text font-medium leading-relaxed">{q.evaluation_guide}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Outreach Email Draft Tab */}
            {modalTab === 'outreach' && (
              <div className="flex flex-col h-[60vh] overflow-hidden">
                {/* Scrollable Content Region */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Loading skeleton */}
                  {loadingDraft && (
                    <div className="space-y-4 animate-pulse">
                      <div className="bg-background border border-border p-4 rounded-xl space-y-3">
                        <div className="h-3 bg-muted/20 w-1/4 rounded"></div>
                        <div className="h-5 bg-muted/20 w-3/4 rounded"></div>
                      </div>
                      <div className="bg-background border border-border p-4 rounded-xl space-y-3">
                        <div className="h-3 bg-muted/20 w-1/4 rounded"></div>
                        <div className="h-32 bg-muted/20 rounded"></div>
                      </div>
                      <div className="text-center text-xs font-semibold text-[#7c3aed] animate-pulse">✦ AI is crafting your personalized email...</div>
                    </div>
                  )}

                  {/* Error state */}
                  {draftError && !loadingDraft && (
                    <div className="p-4 bg-danger/5 border border-danger/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="text-danger mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-bold text-danger">Could Not Generate Draft</p>
                        <p className="text-xs text-muted font-semibold mt-1">{draftError}</p>
                        <button
                          onClick={() => {
                            if (activeCandidate && selectedJobId) {
                              fetchEmailDraft(activeCandidate.candidate_id, selectedJobId);
                            }
                          }}
                          className="mt-3 text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={12} /> Try Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email draft display */}
                  {emailDraft && !loadingDraft && !draftError && (
                    <>
                      {/* Subject line */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Subject Line</label>
                        <div className="bg-background border border-border px-3 py-2.5 rounded-xl">
                          <p className="text-sm font-bold text-text">{emailDraft.subject}</p>
                        </div>
                      </div>

                      {/* Email body */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Email Body</label>
                        <div className="bg-background border border-border rounded-xl overflow-hidden">
                          <textarea
                            readOnly
                            value={emailDraft.body}
                            rows={10}
                            className="w-full px-3 py-2.5 text-sm text-text font-medium leading-relaxed resize-none bg-transparent outline-none select-all"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Fixed Action Footer (always visible at the bottom, compact padding) */}
                {emailDraft && !loadingDraft && !draftError && (
                  <div className="p-4 border-t border-border bg-card flex flex-col gap-2.5 shrink-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Copy to clipboard */}
                      <button
                        onClick={handleCopyEmail}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
                          copied
                            ? 'bg-success/10 text-success border border-success/30'
                            : 'bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 hover:bg-[#7c3aed]/20'
                        }`}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>

                      {/* Open in mail client */}
                      <a
                        href={`mailto:${activeCandidate?.email}?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl transition shadow-sm cursor-pointer"
                      >
                        <Mail size={14} />
                        Open in Mail Client
                      </a>

                      {/* Send Directly from App */}
                      <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
                          sendSuccess
                            ? 'bg-success text-white'
                            : 'bg-primary text-white hover:bg-primary-hover disabled:opacity-50'
                        }`}
                      >
                        {sendingEmail ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : sendSuccess ? (
                          <Check size={14} />
                        ) : (
                          <Mail size={14} />
                        )}
                        {sendingEmail ? 'Sending...' : sendSuccess ? 'Sent Directly!' : 'Send Directly'}
                      </button>
                    </div>

                    {sendError && (
                      <p className="text-[11px] font-semibold text-danger">{sendError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="p-6 border-t border-border bg-background/50 flex justify-end">
              <button
                onClick={() => setActiveCandidate(null)}
                className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-md transition"
              >
                Close Match Analysis
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Email Outreach Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-border bg-card p-0 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#7c3aed]/10 text-[#7c3aed] rounded-2xl">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text">Bulk Outreach Invitation</h3>
                  <p className="text-xs text-muted font-medium">Send interview invites to multiple candidates using customizable templates.</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-2 hover:bg-background rounded-xl transition text-muted hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Target Selector Options */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Recipient Selection</label>
                  <select
                    value={bulkEmailTargetMode}
                    onChange={(e: any) => setBulkEmailTargetMode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm font-bold text-text outline-none focus:border-primary"
                  >
                    <option value="selected" disabled={selectedCandidateIds.length === 0}>
                      Currently Selected Candidates ({selectedCandidateIds.length})
                    </option>
                    <option value="topN">Top N Candidates (by AI rank)</option>
                    <option value="all">All Matched Candidates ({candidates.length})</option>
                  </select>
                </div>

                {/* Top N input field */}
                {bulkEmailTargetMode === 'topN' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Specify N (Count)</label>
                    <input
                      type="number"
                      min={1}
                      max={candidates.length}
                      value={bulkEmailTopNLimit}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setBulkEmailTopNLimit('');
                        } else {
                          const parsed = parseInt(val, 10);
                          setBulkEmailTopNLimit(isNaN(parsed) ? 1 : Math.max(1, parsed));
                        }
                      }}
                      className="w-full max-w-[120px] px-3.5 py-2 border border-border rounded-xl bg-background text-sm font-bold text-text outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Target candidates visual list tags */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Target Recipient List ({getSelectedCandidatesForBulk().length})
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-background border border-border rounded-xl max-h-24 overflow-y-auto">
                  {getSelectedCandidatesForBulk().length === 0 ? (
                    <p className="text-xs text-muted font-semibold">No candidates fall under this selection filter.</p>
                  ) : (
                    getSelectedCandidatesForBulk().map(c => (
                      <span
                        key={c.candidate_id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/25 rounded-lg animate-none"
                      >
                        {c.name}
                        {bulkEmailTargetMode === 'selected' && (
                          <button
                            onClick={() => toggleCandidateSelection(c.candidate_id)}
                            className="hover:text-danger ml-1 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Subject Template */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Subject Template</label>
                <input
                  type="text"
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm font-bold text-text outline-none focus:border-primary"
                  placeholder="Subject template..."
                />
              </div>

              {/* Body Template */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Body Template</label>
                <textarea
                  value={bulkBody}
                  onChange={(e) => setBulkBody(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-sm font-medium leading-relaxed text-text outline-none focus:border-primary"
                  placeholder="Email body template..."
                />
              </div>

              {/* Placeholder Cheat Sheet */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-2xl">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                  ✦ Dynamic Placeholders Cheat Sheet:
                </h4>
                <p className="text-[11px] text-muted font-medium mt-1">
                  You can use variables in the templates that will be replaced per recipient:
                </p>
                <div className="flex gap-4 mt-2">
                  <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {`{candidate_name}`}
                  </code>
                  <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {`{job_title}`}
                  </code>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-border bg-background/50 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-5 py-2.5 border border-border text-muted hover:text-text font-bold text-sm rounded-xl hover:bg-background transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulkEmails}
                  disabled={sendingBulk || getSelectedCandidatesForBulk().length === 0}
                  className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {sendingBulk ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Mail size={15} />
                  )}
                  {sendingBulk ? 'Sending Invitations...' : 'Send Bulk Invites'}
                </button>
              </div>

              {bulkError && (
                <p className="text-xs font-bold text-danger text-right mt-1.5">{bulkError}</p>
              )}
              {bulkSuccess && (
                <p className="text-xs font-bold text-success text-right mt-1.5">{bulkSuccess}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
