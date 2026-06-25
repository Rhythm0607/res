import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, FileText, CheckCircle2, Calendar } from 'lucide-react';

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Overview</h1>
        <p className="text-muted font-medium text-sm mt-1">Your recruitment pipeline at a glance.</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-card p-6 rounded-[20px] border border-border shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} ${s.color}`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-text">{s.value}</p>
              <p className="text-sm font-semibold text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-[20px] border border-border shadow-sm">
          <h3 className="font-bold text-lg mb-6">Applicant Volume</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'}} />
                <Bar dataKey="applicants" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[20px] border border-border shadow-sm">
          <h3 className="font-bold text-lg mb-6">Hiring Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'}} />
                <Line type="monotone" dataKey="hired" stroke="#10B981" strokeWidth={4} dot={{r: 4, fill: '#10B981', strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
