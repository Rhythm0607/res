import { useState } from 'react';
import {
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserPlus,
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'AI Matching', 'Workflow', 'Team', 'Profile'];

  const [skillsMatch, setSkillsMatch] = useState(88);
  const [experienceMatch, setExperienceMatch] = useState(76);
  const [cultureMatch, setCultureMatch] = useState(82);
  const [communicationMatch, setCommunicationMatch] = useState(74);

  const insights = [
    {
      title: 'Senior Platform Engineer',
      detail: 'The chatbot surfaced strong ownership signals and a polished systems design narrative.',
      tag: 'High confidence',
    },
    {
      title: 'Data Reliability Analyst',
      detail: 'Candidate language aligned well with observability and incident response terms.',
      tag: 'Needs review',
    },
    {
      title: 'Product Operations Lead',
      detail: 'Clear cross-functional leadership pattern with strong stakeholder communication cues.',
      tag: 'Strong fit',
    },
  ];

  const matchRows = [
    {
      name: 'Maya Chen',
      role: 'Senior Frontend Engineer',
      match: 94,
      status: 'Interviewing',
      tags: ['React', 'TypeScript', 'Design Systems'],
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Daniel Ortiz',
      role: 'Platform Reliability Lead',
      match: 91,
      status: 'Screening',
      tags: ['Go', 'Kubernetes', 'Observability'],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Rina Patel',
      role: 'Senior Data Scientist',
      match: 89,
      status: 'Shortlist',
      tags: ['Python', 'ML Ops', 'Analytics'],
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_24px_80px_-35px_rgba(0,72,56,0.22)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <Sparkles size={14} /> Live hiring pulse
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-text">Recruiting intelligence is trending up</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Your AI shortlist quality is improving weekly, and the recruiter workflow is reducing manual review time.
              </p>
            </div>
            <div className="rounded-2xl border border-accent/60 bg-accent/70 px-3 py-2 text-sm font-black text-primary">
              +14.8% this month
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Qualified leads', value: '128', detail: 'Across 9 active roles' },
              { label: 'Avg. review time', value: '18m', detail: 'Faster than last week' },
              { label: 'Interview rate', value: '63%', detail: 'Healthy pipeline flow' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-semibold text-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-text">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-text">AI Matching Threshold</h3>
              <p className="text-sm text-muted">Tune how aggressively the platform ranks talent.</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {[
              { label: 'Core Skills', value: skillsMatch, setValue: setSkillsMatch },
              { label: 'Experience', value: experienceMatch, setValue: setExperienceMatch },
              { label: 'Culture Fit', value: cultureMatch, setValue: setCultureMatch },
              { label: 'Communication', value: communicationMatch, setValue: setCommunicationMatch },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                  <span className="text-text">{item.label}</span>
                  <span className="text-primary">{item.value}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={item.value}
                  onChange={(e) => item.setValue(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-background accent-primary"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <MessageSquareText size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-text">Chatbot Insights</h3>
              <p className="text-sm text-muted">Recent AI-driven candidate review summaries.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {insights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-text">{item.title}</p>
                  <span className="rounded-full bg-accent/70 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <BriefcaseBusiness size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-text">Workflow Snapshot</h3>
              <p className="text-sm text-muted">Upcoming stages and hiring momentum.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { title: 'Open roles', value: '9', caption: '4 new today' },
              { title: 'Offer stage', value: '3', caption: '1 pending sign-off' },
              { title: 'Need review', value: '12', caption: 'Auto-ranked by AI' },
              { title: 'Team coverage', value: '98%', caption: 'All key positions filled' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-semibold text-muted">{item.title}</p>
                <p className="mt-2 text-2xl font-black text-text">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-muted">{item.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border bg-background/70 px-6 py-5">
          <div>
            <h3 className="text-lg font-black text-text">Active Candidate-Job Matches</h3>
            <p className="text-sm text-muted">Dense hiring signals across your live requisitions.</p>
          </div>
          <button className="rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-text transition hover:bg-background">
            Export shortlist
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background/70 text-[11px] font-black uppercase tracking-[0.24em] text-muted">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Resume</th>
                <th className="px-6 py-4">AI Match %</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Skill Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matchRows.map((row) => (
                <tr key={row.name} className="bg-card transition hover:bg-background/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={row.avatar} alt={row.name} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-text">{row.name}</p>
                        <p className="text-xs text-muted">Matched today</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-text">{row.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileText size={18} />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-primary">{row.match}%</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-accent/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {row.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAIMatchingTab = () => (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2.5">
          <div className="rounded-2xl bg-primary/10 p-2 text-primary">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h3 className="text-lg font-black text-text">Matching configuration</h3>
            <p className="text-sm text-muted">Adjust scoring thresholds per hiring signal.</p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {[
            { label: 'Core Skills', value: skillsMatch, setValue: setSkillsMatch },
            { label: 'Experience', value: experienceMatch, setValue: setExperienceMatch },
            { label: 'Culture Fit', value: cultureMatch, setValue: setCultureMatch },
            { label: 'Communication', value: communicationMatch, setValue: setCommunicationMatch },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                <span className="text-text">{item.label}</span>
                <span className="text-primary">{item.value}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={item.value}
                onChange={(e) => item.setValue(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-background accent-primary"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2.5">
          <div className="rounded-2xl bg-primary/10 p-2 text-primary">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h3 className="text-lg font-black text-text">Top-ranked candidates</h3>
            <p className="text-sm text-muted">The latest AI-ranked shortlist for your open roles.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {[
            { name: 'Nadia Flores', score: 96, note: 'Strong systems and leadership' },
            { name: 'Toby Green', score: 91, note: 'Excellent collaboration and product thinking' },
            { name: 'Ava Singh', score: 84, note: 'Reliable execution and strong ownership' },
          ].map((candidate) => (
            <div key={candidate.name} className="flex items-center justify-between rounded-2xl border border-border bg-background/70 p-4">
              <div>
                <p className="font-semibold text-text">{candidate.name}</p>
                <p className="mt-1 text-sm text-muted">{candidate.note}</p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                {candidate.score}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkflowTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-[28px] border border-border bg-card p-5 shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black text-text">Workflow orchestration</h3>
          <p className="text-sm text-muted">Coordinate high-signal handoffs across the sourcing pipeline.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-primary-hover">
          <Plus size={16} /> Create workflow stage
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {['Applied', 'Screening', 'Interviewing', 'Offer'].map((phase, index) => (
          <div key={phase} className="rounded-[24px] border border-border bg-card p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h4 className="font-black text-text">{phase}</h4>
              <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-muted">{index + 2} items</span>
            </div>
            <div className="space-y-3">
              {[1, 2].map((card) => (
                <div key={`${phase}-${card}`} className="rounded-2xl border border-border bg-background/70 p-3">
                  <p className="font-semibold text-text">Candidate {card}</p>
                  <p className="mt-1 text-xs text-muted">Updated 2h ago</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeamTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-[28px] border border-border bg-card p-5 shadow-soft md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input type="text" placeholder="Search team members..." className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-primary-hover">
          <UserPlus size={16} /> Invite team member
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-background/70 text-[11px] font-black uppercase tracking-[0.24em] text-muted">
            <tr>
              <th className="px-6 py-4">Team member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Coverage</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { name: 'Sarah Jenkins', role: 'Hiring Lead', coverage: 'Engineering + Product', status: 'Active' },
              { name: 'Mark Davis', role: 'Recruiter', coverage: 'Data & Operations', status: 'Active' },
              { name: 'Lena Smith', role: 'People Partner', coverage: 'Executive search', status: 'Pending' },
            ].map((member) => (
              <tr key={member.name} className="bg-card transition hover:bg-background/70">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/150?u=${member.name}`} alt={member.name} className="h-9 w-9 rounded-full object-cover" />
                    <span className="font-semibold text-text">{member.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-text">{member.role}</td>
                <td className="px-6 py-4 text-muted">{member.coverage}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${member.status === 'Active' ? 'bg-accent/70 text-primary' : 'bg-background text-muted'}`}>
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-border bg-background">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" alt="Tanvi" className="h-full w-full object-cover" />
        </div>
        <div className="mt-6 text-center">
          <h3 className="text-xl font-black text-text">Tanvi Sheth</h3>
          <p className="mt-1 text-sm text-muted">Senior Technical Recruiter</p>
        </div>
        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-background/80">
          <Upload size={16} /> Upload photo
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <h3 className="text-lg font-black text-text">Recruiting profile</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Full name</label>
              <input type="text" defaultValue="Tanvi Sheth" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Role</label>
              <input type="text" defaultValue="Senior Technical Recruiter" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Email</label>
              <input type="email" defaultValue="tanvi@hiresense.ai" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Phone</label>
              <input type="tel" defaultValue="+1 (555) 123-4567" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={16} className="text-primary" />
              <h4 className="font-black text-text">Preferences</h4>
            </div>
            <div className="mt-4 space-y-3">
              <select className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Comfortable layout</option>
                <option>Compact layout</option>
              </select>
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <h4 className="font-black text-text">Alerts</h4>
            </div>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-semibold text-text">
                <span>Candidate match alerts</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-semibold text-text">
                <span>Weekly hiring recap</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <div className="rounded-[32px] border border-border/70 bg-card/90 p-8 shadow-[0_24px_80px_-35px_rgba(0,72,56,0.22)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <Sparkles size={14} /> Hiring operations center
            </p>
            <h2 className="text-3xl font-black tracking-tight text-text">Recruiter Settings</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted">
              Tune your matching intelligence, review chatbot recommendations, and keep the hiring pipeline aligned with your team’s process.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3">
            <div className="rounded-full bg-accent p-2 text-primary">
              <BrainCircuit size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Match confidence</p>
              <p className="text-lg font-black text-text">92.4%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeTab === tab ? 'bg-primary text-background shadow-soft' : 'text-muted hover:bg-background hover:text-text'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>{activeTab === 'Overview' && renderOverviewTab()}</div>
      <div>{activeTab === 'AI Matching' && renderAIMatchingTab()}</div>
      <div>{activeTab === 'Workflow' && renderWorkflowTab()}</div>
      <div>{activeTab === 'Team' && renderTeamTab()}</div>
      <div>{activeTab === 'Profile' && renderProfileTab()}</div>
    </div>
  );
}
