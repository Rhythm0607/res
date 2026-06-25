import { Search, Filter, Star, CheckCircle } from 'lucide-react';

const candidates = [
  { id: 1, name: 'Alex Johnson', role: 'Senior Backend Engineer', score: 98, skills: ['Python', 'FastAPI', 'Docker', 'AWS'], exp: 6 },
  { id: 2, name: 'Sarah Williams', role: 'Senior Backend Engineer', score: 92, skills: ['Python', 'Django', 'PostgreSQL', 'Redis'], exp: 5 },
  { id: 3, name: 'Michael Chen', role: 'Senior Backend Engineer', score: 85, skills: ['Node.js', 'Express', 'MongoDB', 'AWS'], exp: 4 },
];

export default function CandidateRanking() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Candidate AI Ranking</h1>
          <p className="text-muted font-medium text-sm mt-1">Sorted by ATS Semantic Match Score.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl font-medium text-sm hover:bg-background transition">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {candidates.map((c, i) => (
          <div key={c.id} className="relative bg-card rounded-[20px] p-6 border border-border shadow-sm hover:shadow-soft transition-all group">
            {i === 0 && <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-tr from-warning to-yellow-300 rounded-full flex items-center justify-center text-white shadow-md"><Star size={14} fill="currentColor" /></div>}
            
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                 {c.name.charAt(0)}
               </div>
               <div className="text-center">
                 <div className="text-2xl font-black text-success">{c.score}%</div>
                 <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Match</div>
               </div>
            </div>
            
            <h3 className="font-bold text-lg text-text truncate">{c.name}</h3>
            <p className="text-sm font-medium text-muted mb-4">{c.role} • {c.exp} yrs exp.</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {c.skills.map(s => <span key={s} className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs font-semibold text-text">{s}</span>)}
            </div>
            
            <button className="w-full py-2.5 bg-primary/5 text-primary font-semibold rounded-xl text-sm group-hover:bg-primary group-hover:text-white transition">
              View Full Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
