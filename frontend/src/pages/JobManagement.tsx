import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Briefcase, MapPin, Search, Plus, Trash2, X, Users,
  DollarSign, ArrowUpDown, Filter, Edit2, Upload,
  UploadCloud, FileText, CheckCircle, AlertCircle, Trash, Loader2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { jobService, JobResponse, JobCreate } from '@/services/jobService';
import { resumeService } from '@/services/resumeService';
import { SearchableCombobox } from '@/components/SearchableCombobox';
import { MultiSelectCombobox } from '@/components/MultiSelectCombobox';

// Default Options for Dropdowns
const JOB_TITLE_OPTIONS = ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist", "AI/ML Engineer", "DevOps Engineer", "QA Engineer", "Product Manager", "UI/UX Designer"];
const DEPT_OPTIONS = ["Engineering", "Product", "Design", "Marketing", "Sales", "Human Resources", "Finance", "Operations", "Customer Support"];
const LOCATION_OPTIONS = ["San Francisco, CA", "New York, NY", "Austin, TX", "London, UK", "Remote"];
const EMP_TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Temporary", "Remote", "Hybrid", "On-site"];
const WORK_MODEL_OPTIONS = ["Remote", "Hybrid", "On-site"];
const EXP_YEARS_OPTIONS = ["0", "1", "2", "3", "5", "8", "10"];
const SALARY_OPTIONS = ["$50K - $80K", "$80K - $120K", "$120K - $150K", "$150K+"];
const SKILLS_OPTIONS = ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java", "C++", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "REST APIs", "Machine Learning", "TensorFlow", "PyTorch", "Figma"];

// Validation Schema
const jobFormSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters'),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  required_skills: z.array(z.string()).min(1, 'At least one required skill is required'),
  preferred_skills: z.array(z.string()).optional(),
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

  // Upload States
  const [uploadingJob, setUploadingJob] = useState<JobResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<{
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
  }[]>([]);

  const openUploadModal = (job: JobResponse) => {
    setUploadingJob(job);
    setUploadFiles([]);
    setDragActive(false);
  };

  const closeUploadModal = () => {
    setUploadingJob(null);
    setUploadFiles([]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  const handleFileSelection = (files: File[]) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const newFiles = files.map(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isValidType = validTypes.includes(file.type) || ['pdf', 'docx'].includes(fileExt || '');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      let status: 'pending' | 'error' = 'pending';
      let error = undefined;
      if (!isValidType) {
        status = 'error';
        error = 'Only PDF and DOCX files are supported.';
      } else if (!isValidSize) {
        status = 'error';
        error = 'File size exceeds 10MB limit.';
      }
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        progress: 0,
        status,
        error
      };
    });
    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const startUploads = async () => {
    if (!uploadingJob) return;
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending');
    for (const fileObj of filesToUpload) {
      setUploadFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading' } : f));
      try {
        await resumeService.uploadResume(
          uploadingJob.id,
          fileObj.file,
          (progress) => {
            setUploadFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress } : f));
          }
        );
        setUploadFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f));
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Upload failed.';
        setUploadFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', error: errorMsg } : f));
      }
    }
  };

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedModel, setSelectedModel] = useState('All Work Models');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedEmpType, setSelectedEmpType] = useState('All Employment Types');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal open is controlled by the URL query parameter `create=true`
  const isCreateModalOpen = searchParams.get('create') === 'true';

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      department: '',
      location: '',
      description: '',
      required_skills: [],
      preferred_skills: [],
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
      required_skills: [],
      preferred_skills: [],
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
      required_skills: job.required_skills,
      preferred_skills: job.preferred_skills || [],
      experience_years: job.experience_years,
      employment_type: job.employment_type,
      salary_range: job.salary_range,
      work_model: job.work_model,
    });
  };

  // Submit Job
  const onSubmit = async (values: JobFormValues) => {
    try {
      const jobPayload: JobCreate = {
        title: values.title,
        department: values.department,
        location: values.location,
        description: values.description,
        required_skills: values.required_skills,
        preferred_skills: values.preferred_skills || [],
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
  const departments = [
    'All Departments',
    ...Array.from(
      new Set(
        jobs.map(j => {
          const dept = j.department.trim();
          return dept ? dept.charAt(0).toUpperCase() + dept.slice(1).toLowerCase() : '';
        }).filter(Boolean)
      )
    )
  ];
  const workModels = ['All Work Models', 'Remote', 'Hybrid', 'Onsite'];

  // Locations List for filter dropdown (case-insensitive Title Case)
  const locations = [
    'All Locations',
    ...Array.from(
      new Set(
        jobs.map(j => {
          const loc = j.location.trim();
          return loc ? loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase() : '';
        }).filter(Boolean)
      )
    )
  ];

  // Employment Types List for filter dropdown
  const employmentTypes = [
    'All Employment Types',
    ...Array.from(
      new Set(
        jobs.map(j => {
          const type = j.employment_type.trim();
          return type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : '';
        }).filter(Boolean)
      )
    )
  ];

  // Filtered & Sorted Jobs
  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'All Departments' || 
        job.department.trim().toLowerCase() === selectedDept.toLowerCase();
      const matchesModel = selectedModel === 'All Work Models' || job.work_model === selectedModel;
      
      const matchesLocation = selectedLocation === 'All Locations' ||
        job.location.trim().toLowerCase() === selectedLocation.toLowerCase();
        
      const matchesEmpType = selectedEmpType === 'All Employment Types' ||
        job.employment_type.trim().toLowerCase() === selectedEmpType.toLowerCase();

      return matchesSearch && matchesDept && matchesModel && matchesLocation && matchesEmpType;
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
      <div className="rounded-[32px] border border-border bg-card/90 p-7 shadow-[0_24px_80px_-35px_rgba(0,72,56,0.22)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <Briefcase size={14} /> Hiring workspace
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-text">Job Openings</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted">Add, update, and manage job descriptions and recruitments from one refined operating surface.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-hover"
          >
            <Plus size={18} /> Create Job Post
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-border bg-card p-4 shadow-soft md:flex-row md:items-center">
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

          {/* Action buttons (Filters & Sort) */}
          <div className="flex items-center gap-3">
            {/* Toggle Filters Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
                showFilters || (selectedDept !== 'All Departments' || selectedModel !== 'All Work Models' || selectedLocation !== 'All Locations' || selectedEmpType !== 'All Employment Types')
                  ? 'bg-primary/5 border-primary/25 text-primary' 
                  : 'bg-background border-border text-muted hover:text-text'
              }`}
            >
              <Filter size={16} />
              <span>Filters</span>
              {(selectedDept !== 'All Departments' || selectedModel !== 'All Work Models' || selectedLocation !== 'All Locations' || selectedEmpType !== 'All Employment Types') && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {(selectedDept !== 'All Departments' ? 1 : 0) +
                   (selectedModel !== 'All Work Models' ? 1 : 0) +
                   (selectedLocation !== 'All Locations' ? 1 : 0) +
                   (selectedEmpType !== 'All Employment Types' ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Sort Date Button */}
            <button
              onClick={() => toggleSort('date')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
                sortBy === 'date' ? 'bg-primary/5 border-primary/25 text-primary' : 'bg-background border-border text-muted hover:text-text'
              }`}
            >
              <ArrowUpDown size={14} /> 
              <span>Date</span>
              {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* Expandable Filter Grid panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border border-border bg-card p-5 rounded-[24px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shadow-soft overflow-hidden"
            >
              {/* Dropdown 1: Department */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Department</label>
                <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-2 rounded-xl">
                  <Filter size={14} className="text-muted" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none cursor-pointer text-text w-full"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropdown 2: Work Model */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Work Model</label>
                <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-2 rounded-xl">
                  <Briefcase size={14} className="text-muted" />
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none cursor-pointer text-text w-full"
                  >
                    {workModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropdown 3: Location */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Location</label>
                <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-2 rounded-xl">
                  <MapPin size={14} className="text-muted" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none cursor-pointer text-text w-full"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropdown 4: Employment Type */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Employment Type</label>
                  {(selectedDept !== 'All Departments' || selectedModel !== 'All Work Models' || selectedLocation !== 'All Locations' || selectedEmpType !== 'All Employment Types') && (
                    <button 
                      onClick={() => {
                        setSelectedDept('All Departments');
                        setSelectedModel('All Work Models');
                        setSelectedLocation('All Locations');
                        setSelectedEmpType('All Employment Types');
                      }}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-2 rounded-xl">
                  <Users size={14} className="text-muted" />
                  <select
                    value={selectedEmpType}
                    onChange={(e) => setSelectedEmpType(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none cursor-pointer text-text w-full"
                  >
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-soft">
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
                            <span>{job.department ? job.department.trim().charAt(0).toUpperCase() + job.department.trim().slice(1).toLowerCase() : ''}</span>
                            <span className="text-border">•</span>
                            <span>{job.employment_type ? job.employment_type.trim().charAt(0).toUpperCase() + job.employment_type.trim().slice(1).toLowerCase() : ''}</span>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-0.5"><MapPin size={12} />{job.location ? job.location.trim().charAt(0).toUpperCase() + job.location.trim().slice(1).toLowerCase() : ''}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide inline-block ${job.work_model === 'Remote' ? 'bg-success/10 text-success' :
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
                          onClick={() => openUploadModal(job)}
                          className="p-2 text-muted hover:text-success hover:bg-success/10 rounded-lg transition"
                          title="Upload Resumes"
                        >
                          <Upload size={16} />
                        </button>
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
      {createPortal(
        <AnimatePresence>
          {isCreateModalOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={closeCreateModal}
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              />

              {/* Sliding Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed right-0 top-0 h-screen w-full max-w-xl bg-card border-l border-border z-50 shadow-2xl flex flex-col"
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
                  <Controller
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <SearchableCombobox 
                        options={JOB_TITLE_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="e.g. Senior Full Stack Developer"
                        error={!!errors.title}
                      />
                    )}
                  />
                  {errors.title && <p className="text-danger text-xs mt-1.5 font-medium">{errors.title.message}</p>}
                </div>

                {/* Grid for Dept and Employment Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Department *</label>
                    <Controller
                      control={control}
                      name="department"
                      render={({ field }) => (
                        <SearchableCombobox 
                          options={DEPT_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. Engineering"
                          error={!!errors.department}
                        />
                      )}
                    />
                    {errors.department && <p className="text-danger text-xs mt-1.5 font-medium">{errors.department.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Employment Type *</label>
                    <Controller
                      control={control}
                      name="employment_type"
                      render={({ field }) => (
                        <SearchableCombobox 
                          options={EMP_TYPE_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. Full-time"
                          error={!!errors.employment_type}
                        />
                      )}
                    />
                    {errors.employment_type && <p className="text-danger text-xs mt-1.5 font-medium">{errors.employment_type.message}</p>}
                  </div>
                </div>

                {/* Grid for Location & Work Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Location *</label>
                    <Controller
                      control={control}
                      name="location"
                      render={({ field }) => (
                        <SearchableCombobox 
                          options={LOCATION_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. San Francisco, CA"
                          error={!!errors.location}
                        />
                      )}
                    />
                    {errors.location && <p className="text-danger text-xs mt-1.5 font-medium">{errors.location.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Work Model *</label>
                    <Controller
                      control={control}
                      name="work_model"
                      render={({ field }) => (
                        <SearchableCombobox 
                          options={WORK_MODEL_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. Remote"
                          error={!!errors.work_model}
                        />
                      )}
                    />
                    {errors.work_model && <p className="text-danger text-xs mt-1.5 font-medium">{errors.work_model.message}</p>}
                  </div>
                </div>

                {/* Grid for Experience & Salary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Required Experience (Years) *</label>
                    <Controller
                      control={control}
                      name="experience_years"
                      render={({ field }) => (
                        <SearchableCombobox 
                          options={EXP_YEARS_OPTIONS}
                          value={field.value?.toString() || ''}
                          onChange={(val) => field.onChange(val ? Number(val) : 0)}
                          placeholder="e.g. 3"
                          error={!!errors.experience_years}
                        />
                      )}
                    />
                    {errors.experience_years && <p className="text-danger text-xs mt-1.5 font-medium">{errors.experience_years.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Salary Range *</label>
                    <Controller
                      control={control}
                      name="salary_range"
                      render={({ field }) => (
                        <SearchableCombobox 
                          options={SALARY_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. $120K - $150K"
                          error={!!errors.salary_range}
                        />
                      )}
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
                    className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition resize-none ${errors.description ? 'border-danger' : 'border-border focus:border-primary'
                      }`}
                  />
                  {errors.description && <p className="text-danger text-xs mt-1.5 font-medium">{errors.description.message}</p>}
                </div>

                {/* Skills - Required */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Required Skills *</label>
                  <Controller
                    control={control}
                    name="required_skills"
                    render={({ field }) => (
                      <MultiSelectCombobox 
                        options={SKILLS_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="e.g. React, Node.js, TypeScript"
                        error={!!errors.required_skills}
                      />
                    )}
                  />
                  <p className="text-[11px] text-muted font-medium mt-1">Select or type to add required skills (e.g., Python, Docker, AWS)</p>
                  {errors.required_skills && <p className="text-danger text-xs mt-1.5 font-medium">{errors.required_skills.message}</p>}
                </div>

                {/* Skills - Preferred */}
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Preferred Skills (optional)</label>
                  <Controller
                    control={control}
                    name="preferred_skills"
                    render={({ field }) => (
                      <MultiSelectCombobox 
                        options={SKILLS_OPTIONS}
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="e.g. AWS, Kubernetes, GraphQL"
                        error={!!errors.preferred_skills}
                      />
                    )}
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
      </AnimatePresence>,
      document.body
    )}

      {/* Bulk Resume Upload Modal */}
      <AnimatePresence>
        {uploadingJob && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={closeUploadModal}
              className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="fixed inset-0 m-auto h-fit w-full max-w-xl bg-card border border-border rounded-2xl z-50 shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
                <div>
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <Upload size={20} className="text-primary" />
                    Upload Resumes
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Position: <span className="font-bold text-text">{uploadingJob.title}</span>
                  </p>
                </div>
                <button
                  onClick={closeUploadModal}
                  className="p-2 text-muted hover:text-text hover:bg-background rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Drag & Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${dragActive
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-border hover:border-primary/50 hover:bg-background/40'
                    }`}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-bold text-text mb-1">
                    Drag and drop your candidate resumes here
                  </p>
                  <p className="text-xs text-muted font-medium mb-3">
                    Supports PDF and DOCX files up to 10MB each
                  </p>
                  <span className="px-3 py-1.5 bg-background border border-border text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-sm hover:border-primary/30 transition">
                    Browse Files
                  </span>
                </div>

                {/* File List */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-wider">
                      <span>Resumes ({uploadFiles.length})</span>
                      <button
                        onClick={() => setUploadFiles([])}
                        className="text-danger hover:underline normal-case font-bold"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {uploadFiles.map((fileObj) => (
                        <div
                          key={fileObj.id}
                          className="p-3 bg-background border border-border rounded-xl flex items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg ${fileObj.status === 'success' ? 'bg-success/15 text-success' :
                                fileObj.status === 'error' ? 'bg-danger/15 text-danger' : 'bg-primary/10 text-primary'
                              }`}>
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-text truncate">{fileObj.file.name}</p>
                              <p className="text-xs text-muted font-semibold">
                                {(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>

                              {/* Progress bar */}
                              {fileObj.status === 'uploading' && (
                                <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className="bg-primary h-full rounded-full transition-all duration-300"
                                    style={{ width: `${fileObj.progress}%` }}
                                  />
                                </div>
                              )}

                              {fileObj.status === 'error' && (
                                <p className="text-[11px] text-danger font-medium mt-1 flex items-center gap-1">
                                  <AlertCircle size={12} /> {fileObj.error}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {fileObj.status === 'success' && (
                              <CheckCircle size={18} className="text-success flex-shrink-0" />
                            )}
                            {fileObj.status === 'uploading' && (
                              <Loader2 size={16} className="text-primary animate-spin flex-shrink-0" />
                            )}
                            {(fileObj.status === 'pending' || fileObj.status === 'error') && (
                              <button
                                onClick={() => removeFile(fileObj.id)}
                                className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border flex items-center justify-between bg-background/50">
                <a
                  href={`/app/candidates?jobId=${uploadingJob.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    closeUploadModal();
                    window.location.href = `/app/candidates?jobId=${uploadingJob.id}`;
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View candidates for this position →
                </a>

                <div className="flex items-center gap-3">
                  <button
                    onClick={closeUploadModal}
                    className="px-4 py-2 border border-border text-text text-xs font-bold rounded-lg hover:bg-background transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={startUploads}
                    disabled={uploadFiles.filter(f => f.status === 'pending').length === 0}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover shadow-md disabled:opacity-50 transition"
                  >
                    Start Upload
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
