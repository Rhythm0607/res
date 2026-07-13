import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, FileText, CheckCircle2, Calendar, ShieldAlert } from 'lucide-react';
import { jobService, DashboardStats } from '@/services/jobService';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await jobService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
        setError('Failed to fetch dashboard metrics from the database.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted text-sm font-semibold">Aggregating live recruitment metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 bg-danger/5 border border-danger/20 rounded-xl text-danger text-sm font-semibold flex items-center gap-2 max-w-lg mx-auto mt-10">
        <ShieldAlert size={18} />
        <span>{error || 'Could not load statistics.'}</span>
      </div>
    );
  }

  const statCards = [
    { label: 'Active Jobs', value: stats.active_jobs.toString(), icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Candidates', value: stats.total_candidates.toLocaleString(), icon: Users, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Resumes Analyzed', value: stats.resumes_analyzed.toLocaleString(), icon: FileText, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Highly Qualified (>=80%)', value: stats.high_matches.toString(), icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  ];

  const hasDistributionData = stats.job_distribution && stats.job_distribution.length > 0;
  const hasScoreTrendsData = stats.score_trends && stats.score_trends.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Overview</h1>
        <p className="text-muted font-medium text-sm mt-1">Your live recruitment metrics and database statistics.</p>
      </div>

      {/* Stats KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, i) => (
          <div key={i} className="bg-card p-6 rounded-[20px] border border-border shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
              <s.icon size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-3xl font-extrabold text-text truncate">{s.value}</p>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Applicants per Job Title */}
        <div className="bg-card p-6 rounded-[20px] border border-border shadow-sm flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-text">Applicant Volume by Vacancy</h3>
            <p className="text-xs text-muted font-medium mt-0.5">Distribution of candidate profiles across active postings.</p>
          </div>
          
          <div className="h-72 flex items-center justify-center">
            {hasDistributionData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.job_distribution}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 600}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(79, 70, 229, 0.05)'}} 
                    contentStyle={{borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'}} 
                  />
                  <Bar dataKey="applicants" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6">
                <Users size={32} className="text-muted/40 mx-auto mb-2" />
                <p className="text-xs text-muted font-bold">No applicant distribution data available.</p>
                <p className="text-[10px] text-muted font-medium mt-1">Create job vacancies and upload candidate resumes to populate charts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Average ATS Match score per job title */}
        <div className="bg-card p-6 rounded-[20px] border border-border shadow-sm flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-text">Average Candidate Quality</h3>
            <p className="text-xs text-muted font-medium mt-0.5">Average ATS score metrics calculated per active opening.</p>
          </div>
          
          <div className="h-72 flex items-center justify-center">
            {hasScoreTrendsData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.score_trends}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 600}} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'}} 
                  />
                  <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={4} dot={{r: 4, fill: '#10B981', strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6">
                <FileText size={32} className="text-muted/40 mx-auto mb-2" />
                <p className="text-xs text-muted font-bold">No candidate evaluation metrics available.</p>
                <p className="text-[10px] text-muted font-medium mt-1">Run ATS matching scores to view quality indexes per posting.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
