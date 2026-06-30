import api from './api';

export interface ResumeUploadResponse {
  candidate_id: number;
  name: string;
  email: string;
  status: string;
  ats_score: number;
  skills: string[];
}

export const resumeService = {
  /**
   * Upload a single resume file (PDF or DOCX) for a specific job.
   * Tracks progress via Axios onUploadProgress.
   */
  uploadResume: async (
    jobId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ResumeUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ResumeUploadResponse>(
      `/resumes/upload?job_id=${jobId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  },

  /**
   * Fetch candidates matched for a specific job, sorted by ATS score.
   */
  getJobCandidates: async (jobId: number): Promise<CandidateMatchResponse[]> => {
    const response = await api.get<CandidateMatchResponse[]>(`/resumes/candidates?job_id=${jobId}`);
    return response.data;
  },

  /**
   * Delete a candidate's resume and match results for a specific job.
   */
  deleteCandidate: async (jobId: number, candidateId: number): Promise<void> => {
    await api.delete(`/resumes/candidates/${candidateId}?job_id=${jobId}`);
  },

  /**
   * Initialize a RAG chatbot session for a candidate using their database resume text.
   */
  initializeChatSession: async (candidateId: number): Promise<{ session_id: string; status: string; candidate_name: string }> => {
    const response = await api.post<{ session_id: string; status: string; candidate_name: string }>(
      `/chat/initialize-candidate/${candidateId}`
    );
    return response.data;
  },

  /**
   * Fetch tailored interview questions and evaluation guides for a candidate.
   */
  getCandidateQuestions: async (candidateId: number, jobId: number): Promise<InterviewQuestion[]> => {
    const response = await api.get<InterviewQuestion[]>(`/resumes/candidates/${candidateId}/questions?job_id=${jobId}`);
    return response.data;
  }
};

export interface InterviewQuestion {
  id: number;
  category: 'Technical' | 'Behavioral';
  question: string;
  evaluation_guide: string;
}

export interface CandidateMatchResponse {
  candidate_id: number;
  name: string;
  email: string;
  extracted_skills: string[];
  experience_years: number;
  education: any;
  ats_score: number;
  skill_match_score: number;
  semantic_score: number;
  experience_match_score: number;
  education_match_score: number;
  missing_skills: string[];
  ai_summary: string;
  status: string;
  resume_text: string;
}

export default resumeService;
