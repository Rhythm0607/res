import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Briefcase, Users, ShieldAlert, X, Trash2, MessageSquare } from 'lucide-react';
import { jobService, JobResponse } from '@/services/jobService';
import { resumeService, CandidateMatchResponse } from '@/services/resumeService';

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
  const [modalTab, setModalTab] = useState<'match' | 'profile' | 'text'>('match');

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

  const handleOpenModal = (candidate: CandidateMatchResponse) => {
    setActiveCandidate(candidate);
    setModalTab('match');
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Candidate AI Ranking
          </h1>
          <p className="text-muted font-medium text-sm mt-1">
            Compare, rank, and score applicants against job requirements automatically using semantic AI.
          </p>
        </div>

        {/* Job Selection Dropdown */}
        <div className="w-full md:w-auto flex items-center gap-3">
          <div className="flex-1 md:flex-initial flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-xl shadow-sm">
            <Briefcase size={16} className="text-muted" />
            <select
              value={selectedJobId || ''}
              onChange={handleJobChange}
              disabled={loadingJobs}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer text-text min-w-[200px]"
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

      {/* Main Content Area */}
      {loadingCandidates ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted text-sm font-semibold">Analyzing matches and fetching rankings...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="border border-border bg-card rounded-2xl p-16 text-center shadow-sm">
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
              className="relative bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
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
                  <div className="flex items-center gap-3">
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
                  {c.extracted_skills.slice(0, 4).map(skill => (
                    <span 
                      key={skill} 
                      className="px-2.5 py-1 bg-background border border-border rounded-lg text-[10px] font-bold uppercase tracking-wide text-text"
                    >
                      {skill}
                    </span>
                  ))}
                  {c.extracted_skills.length > 4 && (
                    <span className="px-2.5 py-1 bg-background border border-border rounded-lg text-[10px] font-bold text-muted">
                      +{c.extracted_skills.length - 4} more
                    </span>
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
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 uppercase tracking-wider transition ${
                  modalTab === 'match'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text'
                }`}
              >
                AI Match Score
              </button>
              <button
                onClick={() => setModalTab('profile')}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 uppercase tracking-wider transition ${
                  modalTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text'
                }`}
              >
                Parsed Profile
              </button>
              <button
                onClick={() => setModalTab('text')}
                className={`py-3.5 px-4 text-xs font-extrabold border-b-2 uppercase tracking-wider transition ${
                  modalTab === 'text'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text'
                }`}
              >
                Raw Resume Text
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
    </div>
  );
}
