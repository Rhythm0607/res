import api from './api';

export interface JobCreate {
  title: string;
  department: string;
  location: string;
  description: string;
  required_skills: string[];
  preferred_skills?: string[];
  experience_years: number;
  employment_type: string;
  salary_range: string;
  work_model: string;
}

export interface JobResponse extends JobCreate {
  id: number;
  created_at: string;
}

export const jobService = {
  getJobs: async (): Promise<JobResponse[]> => {
    const response = await api.get<JobResponse[]>('/jobs/');
    return response.data;
  },

  getJob: async (jobId: number): Promise<JobResponse> => {
    const response = await api.get<JobResponse>(`/jobs/${jobId}`);
    return response.data;
  },

  createJob: async (job: JobCreate): Promise<JobResponse> => {
    const response = await api.post<JobResponse>('/jobs/', job);
    return response.data;
  },

  updateJob: async (jobId: number, job: JobCreate): Promise<JobResponse> => {
    const response = await api.put<JobResponse>(`/jobs/${jobId}`, job);
    return response.data;
  },

  deleteJob: async (jobId: number): Promise<void> => {
    await api.delete(`/jobs/${jobId}`);
  },
};
