import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, FileText, CheckCircle2, Calendar, Sparkles, TrendingUp } from 'lucide-react';

const data = [
  { name: 'Jan', applicants: 400, hired: 24 },
  { name: 'Feb', applicants: 300, hired: 18 },
  { name: 'Mar', applicants: 550, hired: 30 },
  { name: 'Apr', applicants: 450, hired: 22 },
  { name: 'May', applicants: 600, hired: 35 },
  { name: 'Jun', applicants: 800, hired: 45 },
];

export default function Dashboard() {
  const stats = [
    { label: 'Active Jobs', value: '24', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Candidates', value: '8,432', icon: Users, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Resumes Analyzed', value: '12.5k', icon: FileText, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Hired YTD', value: '148', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-border bg-card/90 p-7 shadow-[0_24px_80px_-35px_rgba(0,72,56,0.22)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <Sparkles size={14} /> Hiring pulse
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-text">Overview</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted">Your recruitment pipeline at a glance, with real-time momentum across interviews, evaluations, and offers.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-semibold text-primary">
            <TrendingUp size={16} /> +14% this month
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-4 rounded-[24px] border border-border bg-card p-6 shadow-soft">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${s.bg} ${s.color}`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-black text-text">{s.value}</p>
              <p className="text-sm font-semibold text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-text">Applicant volume</h3>
              <p className="text-sm text-muted">Pipeline growth by month.</p>
            </div>
            <span className="rounded-full bg-accent/70 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-primary">Live</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="applicants" fill="#004838" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-text">Hiring trend</h3>
              <p className="text-sm text-muted">Offers closed and interviews completed.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-primary">Momentum</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="hired" stroke="#004838" strokeWidth={4} dot={{ r: 4, fill: '#004838', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
