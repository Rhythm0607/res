import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Briefcase, MapPin, Search, Plus, Trash2, X, 
  DollarSign, ArrowUpDown, Filter, Edit2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { jobService, JobResponse, JobCreate } from '@/services/jobService';

// Validation Schema
const jobFormSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters'),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  required_skills_raw: z.string().min(1, 'At least one required skill is required (comma-separated)'),
  preferred_skills_raw: z.string().optional(),
  experience_years: z.coerce.number().min(0, 'Experience years must be 0 or more'),
  employment_type: z.string().min(1, 'Employment type is required'),
  salary_range: z.string().min(1, 'Salary range is required'),
  work_model: z.string().min(1, 'Work model is required'),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function JobManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<JobResponse | null>(null);
  
  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedModel, setSelectedModel] = useState('All Work Models');
  const [sortBy, setSortBy] = useState<'title' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal open is controlled by the URL query parameter `create=true`
  const isCreateModalOpen = searchParams.get('create') === 'true';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      department: '',
      location: '',
      description: '',
      required_skills_raw: '',
      preferred_skills_raw: '',
      experience_years: 2,
      employment_type: 'Full-time',
      salary_range: '',
      work_model: 'Remote',
    }
  });

  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getJobs();
      setJobs(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch jobs. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openCreateModal = () => {
    setEditingJob(null);
    setSearchParams({ create: 'true' });
    reset({
      title: '',
      department: '',
      location: '',
      description: '',
      required_skills_raw: '',
      preferred_skills_raw: '',
      experience_years: 2,
      employment_type: 'Full-time',
      salary_range: '',
      work_model: 'Remote',
    });
  };

  const closeCreateModal = () => {
    setSearchParams({});
    setEditingJob(null);
    reset();
  };

  const handleEdit = (job: JobResponse) => {
    setEditingJob(job);
    setSearchParams({ create: 'true' });
    reset({
      title: job.title,
      department: job.department,
      location: job.location,
      description: job.description,
      required_skills_raw: job.required_skills.join(', '),
      preferred_skills_raw: job.preferred_skills ? job.preferred_skills.join(', ') : '',
      experience_years: job.experience_years,
      employment_type: job.employment_type,
      salary_range: job.salary_range,
      work_model: job.work_model,
    });
  };

  // Submit Job
  const onSubmit = async (values: JobFormValues) => {
    try {
      const required_skills = values.required_skills_raw
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const preferred_skills = values.preferred_skills_raw
        ? values.preferred_skills_raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

      const jobPayload: JobCreate = {
        title: values.title,
        department: values.department,
        location: values.location,
        description: values.description,
        required_skills,
        preferred_skills,
        experience_years: values.experience_years,
        employment_type: values.employment_type,
        salary_range: values.salary_range,
        work_model: values.work_model,
      };

      if (editingJob) {
        await jobService.updateJob(editingJob.id, jobPayload);
      } else {
        await jobService.createJob(jobPayload);
      }
      closeCreateModal();
      fetchJobs();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to ${editingJob ? 'update' : 'create'} job. Please check details and try again.`);
    }
  };

  // Delete Job
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job listing? All match data will be deleted as well.')) return;
    try {
      await jobService.deleteJob(id);
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert('Failed to delete job.');
    }
  };

  // Departments List for filter dropdown
  const departments = ['All Departments', ...Array.from(new Set(jobs.map(j => j.department)))];
  const workModels = ['All Work Models', 'Remote', 'Hybrid', 'Onsite'];

  // Filtered & Sorted Jobs
  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = selectedDept === 'All Departments' || job.department === selectedDept;
      const matchesModel = selectedModel === 'All Work Models' || job.work_model === selectedModel;
      
      return matchesSearch && matchesDept && matchesModel;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      } else {
        // Date sort
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

  const toggleSort = (type: 'title' | 'date') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Job Openings</h1>
          <p className="text-muted font-medium text-sm mt-1">Add, update, and manage job descriptions and recruitments.</p>
        </div>
        <div>
          <button 
            onClick={openCreateModal}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all"
          >
            <Plus size={18} /> Create Job Post
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by title, description or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium" 
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-2 rounded-xl">
            <Filter size={16} className="text-muted" />
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none cursor-pointer text-text"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-2 rounded-xl">
            <Briefcase size={16} className="text-muted" />
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none cursor-pointer text-text"
            >
              {workModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => toggleSort('date')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition ${
              sortBy === 'date' ? 'bg-primary/5 border-primary/25 text-primary' : 'bg-background border-border text-muted hover:text-text'
            }`}
          >
            <ArrowUpDown size={14} /> Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Main Table/Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted text-sm font-semibold">Loading job listings...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-danger/5 border border-danger/25 rounded-2xl text-center">
          <p className="text-danger font-semibold">{error}</p>
          <button 
            onClick={fetchJobs}
            className="mt-4 px-4 py-2 bg-danger text-white text-sm font-bold rounded-xl hover:bg-danger/95 transition"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="border border-border bg-card rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mx-auto mb-4">
            <Briefcase size={28} />
          </div>
          <h3 className="text-lg font-bold text-text mb-1">No Jobs Found</h3>
          <p className="text-muted text-sm max-w-sm mx-auto font-medium">
            {jobs.length === 0 
              ? 'Get started by creating your very first job vacancy listing.' 
              : 'Try adjusting your filters or search query to find matching jobs.'}
          </p>
          {jobs.length === 0 && (
            <button 
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/95 transition shadow-soft"
            >
              <Plus size={16} /> Add First Job
            </button>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/40 border-b border-border">
                  <th className="p-4 pl-6 font-semibold text-sm text-muted">Job Title & Info</th>
                  <th className="p-4 font-semibold text-sm text-muted">Work Model</th>
                  <th className="p-4 font-semibold text-sm text-muted">Experience</th>
                  <th className="p-4 font-semibold text-sm text-muted">Salary Range</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-background/25 transition group">
                    <td className="p-4 pl-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mt-0.5 group-hover:scale-105 transition-transform">
                          <Briefcase size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-text text-base leading-tight">{job.title}</p>
                          <div className="text-xs text-muted font-semibold mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>{job.department}</span>
                            <span className="text-border">•</span>
                            <span>{job.employment_type}</span>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-0.5"><MapPin size={12}/>{job.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide inline-block ${
                        job.work_model === 'Remote' ? 'bg-success/10 text-success' : 
                        job.work_model === 'Hybrid' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                      }`}>
                        {job.work_model}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-semibold text-text">
                      {job.experience_years === 0 ? 'Entry Level' : `${job.experience_years}+ years`}
                    </td>
                    <td className="p-4 text-sm font-semibold text-text flex items-center gap-1 mt-4">
                      <DollarSign size={14} className="text-muted" /> {job.salary_range}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(job)}
                          className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition"
                          title="Edit Job"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(job.id)}
                          className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition"
                          title="Delete Job"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Panel for Create Job Form */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateModal}
              className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
            />

            {/* Sliding Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
                <div>
                  <h3 className="text-lg font-bold text-text">{editingJob ? 'Edit Job Listing' : 'Create Job Listing'}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {editingJob ? 'Update job details for your active listing.' : 'Specify job details to start screening applicants.'}
                  </p>
                </div>
                <button 
                  onClick={closeCreateModal}
                  className="p-2 text-muted hover:text-text hover:bg-background rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Form Container */}
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Job Title */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Job Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Senior Full Stack Developer"
                    {...register('title')}
                    className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
                      errors.title ? 'border-danger focus:ring-2 focus:ring-danger/10' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
                    }`}
                  />
                  {errors.title && <p className="text-danger text-xs mt-1.5 font-medium">{errors.title.message}</p>}
                </div>

                {/* Grid for Dept and Employment Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Department *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Engineering"
                      {...register('department')}
                      className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
                        errors.department ? 'border-danger' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.department && <p className="text-danger text-xs mt-1.5 font-medium">{errors.department.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Employment Type *</label>
                    <select 
                      {...register('employment_type')}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none text-sm font-semibold text-text cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                {/* Grid for Location & Work Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Location *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. San Francisco, CA or Remote"
                      {...register('location')}
                      className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
                        errors.location ? 'border-danger' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.location && <p className="text-danger text-xs mt-1.5 font-medium">{errors.location.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Work Model *</label>
                    <select 
                      {...register('work_model')}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none text-sm font-semibold text-text cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </div>
                </div>

                {/* Grid for Experience & Salary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Required Experience (Years) *</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 3"
                      {...register('experience_years')}
                      className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
                        errors.experience_years ? 'border-danger' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.experience_years && <p className="text-danger text-xs mt-1.5 font-medium">{errors.experience_years.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Salary Range *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. $120K - $150K"
                      {...register('salary_range')}
                      className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
                        errors.salary_range ? 'border-danger' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.salary_range && <p className="text-danger text-xs mt-1.5 font-medium">{errors.salary_range.message}</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Job Description *</label>
                  <textarea 
                    rows={5}
                    placeholder="Provide a detailed description of the role, responsibilities, and team..."
                    {...register('description')}
                    className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition resize-none ${
                      errors.description ? 'border-danger' : 'border-border focus:border-primary'
                    }`}
                  />
                  {errors.description && <p className="text-danger text-xs mt-1.5 font-medium">{errors.description.message}</p>}
                </div>

                {/* Skills - Required */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Required Skills * (comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                    {...register('required_skills_raw')}
                    className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
                      errors.required_skills_raw ? 'border-danger' : 'border-border focus:border-primary'
                    }`}
                  />
                  <p className="text-[11px] text-muted font-medium mt-1">Separate skills with commas (e.g., Python, Docker, AWS)</p>
                  {errors.required_skills_raw && <p className="text-danger text-xs mt-1.5 font-medium">{errors.required_skills_raw.message}</p>}
                </div>

                {/* Skills - Preferred */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Preferred Skills (comma-separated, optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. AWS, Kubernetes, GraphQL"
                    {...register('preferred_skills_raw')}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  />
                  <p className="text-[11px] text-muted font-medium mt-1">Optional secondary skills that are nice to have</p>
                </div>
              </form>

              {/* Sticky Footer */}
              <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-background/50">
                <button 
                  type="button"
                  onClick={closeCreateModal}
                  className="px-5 py-2.5 border border-border text-text text-sm font-semibold rounded-xl hover:bg-background transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/25 disabled:opacity-55 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingJob ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    editingJob ? 'Save Changes' : 'Publish Position'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
