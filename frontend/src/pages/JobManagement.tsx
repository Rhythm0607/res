import { MoreHorizontal, MapPin, Briefcase } from 'lucide-react';

const jobs = [
  { id: 1, title: 'Senior Backend Engineer', dept: 'Engineering', type: 'Full-time', loc: 'Remote', applicants: 145, status: 'Active' },
  { id: 2, title: 'Product Manager', dept: 'Product', type: 'Full-time', loc: 'New York, NY', applicants: 89, status: 'Active' },
  { id: 3, title: 'Frontend Developer (React)', dept: 'Engineering', type: 'Contract', loc: 'Remote', applicants: 230, status: 'Closed' },
  { id: 4, title: 'HR Business Partner', dept: 'Human Resources', type: 'Full-time', loc: 'London, UK', applicants: 45, status: 'Draft' },
];

export default function JobManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Jobs</h1>
          <p className="text-muted font-medium text-sm mt-1">Manage active listings and view applicants.</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-card border border-border rounded-xl px-4 py-2 font-medium text-sm outline-none">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Product</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-[20px] border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/50 border-b border-border">
              <th className="p-4 font-semibold text-sm text-muted">Job Title</th>
              <th className="p-4 font-semibold text-sm text-muted">Status</th>
              <th className="p-4 font-semibold text-sm text-muted">Applicants</th>
              <th className="p-4 font-semibold text-sm text-muted">Location</th>
              <th className="p-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-border hover:bg-background/50 transition">
                <td className="p-4">
                  <p className="font-bold text-text">{job.title}</p>
                  <p className="text-xs text-muted font-medium mt-1 flex items-center gap-1"><Briefcase size={12}/>{job.dept} • {job.type}</p>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    job.status === 'Active' ? 'bg-success/10 text-success' : job.status === 'Draft' ? 'bg-warning/10 text-warning' : 'bg-muted/10 text-muted'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="p-4 font-semibold text-text">{job.applicants}</td>
                <td className="p-4 text-sm font-medium text-muted flex items-center gap-1.5 mt-2"><MapPin size={14}/> {job.loc}</td>
                <td className="p-4 text-right">
                  <button className="p-2 text-muted hover:text-text hover:bg-border rounded-lg transition"><MoreHorizontal size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
