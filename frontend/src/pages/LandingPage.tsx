import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, BarChart, FileText, X, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', company: '', dateTime: '' });

  // Lock background scrolling when demo modal is open
  useEffect(() => {
    if (isDemoModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDemoModalOpen]);

  return (
    <div className="min-h-screen bg-background font-sans text-text selection:bg-primary selection:text-white overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold text-primary tracking-tight">
            <BrainCircuit size={32} /> HireSense AI
          </div>
          <div className="hidden md:flex gap-8 font-semibold text-sm text-muted">
            <a href="#features" className="hover:text-primary transition">Features</a>
            <a href="#solutions" className="hover:text-primary transition">ATS Scoring</a>
            <a href="#pricing" className="hover:text-primary transition">Enterprise</a>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="px-5 py-2.5 text-text font-bold text-sm hover:bg-border/50 rounded-xl transition">Log in</Link>
            <Link to="/app" className="px-5 py-2.5 bg-accent text-primary font-bold text-sm rounded-xl shadow-soft hover:bg-accent-hover transition hover:-translate-y-0.5">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-primary font-bold text-xs mb-6 border border-accent/40">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>
            HireSense AI 2.0 is Live
          </div>
          <h1 className="text-[64px] font-extrabold leading-[1.05] tracking-tight mb-6 text-text">
            Hire Smarter.<br />
            <span className="text-primary">
              Screen Candidates in Seconds.
            </span>
          </h1>
          <p className="text-lg text-muted mb-10 leading-relaxed max-w-lg font-medium">
            Enterprise-grade ATS scoring, semantic matching, and an AI recruitment assistant. Built for modern HR teams.
          </p>
          <div className="flex gap-4">
            <Link to="/app" className="flex items-center gap-2 px-8 py-4 bg-primary text-background text-base font-bold rounded-xl shadow-floating hover:shadow-lg hover:-translate-y-1 transition-all">
              Start Screening <ArrowRight size={20} />
            </Link>
            <button 
              onClick={() => {
                setIsDemoModalOpen(true);
                setIsSubmitted(false);
                setFormData({ fullName: '', email: '', company: '', dateTime: '' });
              }}
              className="px-8 py-4 bg-card border border-border text-primary text-base font-bold rounded-xl hover:bg-background transition-all shadow-sm cursor-pointer"
            >
              Book Demo
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="relative h-[550px] w-full rounded-3xl bg-primary p-8 shadow-floating flex flex-col gap-4 overflow-hidden"
        >
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="absolute top-8 left-8 right-8">
            <div className="bg-card rounded-2xl p-5 shadow-soft border border-border flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-lg">98</div>
                 <div>
                   <p className="font-bold text-text">Sarah Jenkins</p>
                   <p className="text-sm text-muted font-medium">Senior React Engineer</p>
                 </div>
               </div>
               <div className="px-3 py-1 bg-accent/20 text-primary rounded-lg text-xs font-bold uppercase tracking-wider">Top Match</div>
             </div>
           </motion.div>

          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute top-36 left-8 right-8">
            <div className="bg-card rounded-2xl p-6 shadow-soft border border-border w-full">
              <h3 className="font-bold mb-5 flex items-center gap-2 text-sm text-muted uppercase tracking-wider"><BarChart size={16} className="text-primary" /> AI Match Analysis</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-bold"><span className="text-text">Semantic Similarity</span><span className="text-primary">96%</span></div>
                  <div className="w-full bg-background rounded-full h-2.5 overflow-hidden"><div className="bg-primary h-full rounded-full w-[96%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-bold"><span className="text-text">Skill Overlap</span><span className="text-primary">88%</span></div>
                  <div className="w-full bg-background rounded-full h-2.5 overflow-hidden"><div className="bg-accent h-full rounded-full w-[88%]"></div></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }} className="absolute bottom-8 left-8 right-8">
            <div className="bg-card rounded-2xl p-5 shadow-soft border border-border flex gap-3 items-start">
              <div className="mt-1 bg-accent p-2 rounded-lg text-primary"><FileText size={20} /></div>
              <div>
                <p className="text-sm font-bold text-text mb-1">AI Assistant Summary</p>
                <p className="text-xs text-muted leading-relaxed font-medium">Candidate has exactly 5 years of React experience and perfectly matches the requirement for Next.js and Tailwind.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <section className="bg-card border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[{ v: "5M+", l: "Resumes Parsed" }, { v: "99%", l: "Extraction Accuracy" }, { v: "80%", l: "Screening Time Saved" }, { v: "2000+", l: "HR Teams Trust Us" }].map((s, i) => (
            <div key={i} className="text-center">
              <h4 className="text-4xl font-extrabold text-text mb-2 tracking-tight">{s.v}</h4>
              <p className="text-muted font-semibold text-sm uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">Core Capabilities</span>
          <h2 className="text-4xl font-black text-text tracking-tight">Supercharge Your HR Workflow</h2>
          <p className="text-muted max-w-lg mx-auto font-medium text-sm">State-of-the-art AI tooling engineered to accelerate sourcing, screening, and evaluations.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: BrainCircuit,
              title: "Conversational RAG Chatbot",
              desc: "Deep-dive into candidate profiles. Ask natural language questions about their work history, project scopes, and credentials."
            },
            {
              icon: BarChart,
              title: "Dynamic ATS Match Engine",
              desc: "Upload candidate resumes and match them against job requirements. Match scores re-calculate in real-time when job specifications change."
            },
            {
              icon: FileText,
              title: "Tailored Interview Guides",
              desc: "Automatically generate custom evaluation questions and guide templates focused on candidate resume gaps and missing skills."
            }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-card border border-border p-8 rounded-3xl hover:border-primary/40 hover:shadow-soft transition-all space-y-4 group"
            >
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <feat.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-text">{feat.title}</h3>
              <p className="text-muted text-sm leading-relaxed font-medium">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ATS Scoring Section */}
      <section id="solutions" className="py-24 bg-card border-y border-border px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <span className="text-xs font-bold bg-success/10 text-success px-3 py-1 rounded-full uppercase tracking-widest">ATS Core Metrics</span>
            <h2 className="text-4xl font-black text-text tracking-tight leading-tight">Advanced Semantic & Structural Alignment</h2>
            <p className="text-muted font-medium leading-relaxed">
              Our matching algorithm doesn't just look for simple keywords. It performs deep contextual analysis to grade candidates based on four distinct metrics:
            </p>
            
            <div className="space-y-4">
              {[
                { title: "Semantic Job Description Alignment", desc: "Measures overall context match and vocabulary proximity against your job details." },
                { title: "Required Skills Overlap", desc: "Analyzes matching keywords and related secondary credentials." },
                { title: "Experience Eligibility", desc: "Verifies aggregate years of active project experience." },
                { title: "Education Eligibility", desc: "Grades certifications and degree credentials against minimum requirements." }
              ].map((m, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{idx + 1}</div>
                  <div>
                    <h4 className="font-bold text-text text-sm">{m.title}</h4>
                    <p className="text-muted text-xs font-medium mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-background border border-border p-8 rounded-3xl space-y-6 shadow-soft"
          >
            <h3 className="font-bold text-text text-lg">Live Algorithm Scorecard</h3>
            <div className="space-y-5">
              {[
                { label: "Semantic JD Alignment", val: 92, color: "bg-primary" },
                { label: "Required Skills Overlap", val: 85, color: "bg-secondary" },
                { label: "Experience Eligibility", val: 100, color: "bg-success" },
                { label: "Education Eligibility", val: 75, color: "bg-warning" }
              ].map((bar, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text">{bar.label}</span>
                    <span className="text-muted">{bar.val}%</span>
                  </div>
                  <div className="w-full bg-card h-2 rounded-full overflow-hidden border border-border/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${bar.val}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                      className={`h-full rounded-full ${bar.color}`}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise/Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <span className="text-xs font-bold bg-warning/10 text-warning px-3 py-1 rounded-full uppercase tracking-widest">Enterprise Plans</span>
          <h2 className="text-4xl font-black text-text tracking-tight">Flexible Screening Packages</h2>
          <p className="text-muted max-w-lg mx-auto font-medium text-sm">Choose the tier that best fits your recruitment velocity and team size.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              tier: "Starter",
              price: "$49",
              features: ["Up to 3 active job postings", "100 resume uploads / month", "Standard keyword matching", "Email support"],
              accent: false,
              btnText: "Start Starter Trial"
            },
            {
              tier: "Professional",
              price: "$149",
              features: ["Unlimited active job postings", "1,000 resume uploads / month", "Full semantic RAG chat assistant", "AI Interview Guide generator", "Priority support"],
              accent: true,
              btnText: "Start Free Trial"
            },
            {
              tier: "Enterprise",
              price: "Custom",
              features: ["Custom volume resume uploads", "Dedicated private AI endpoint option", "API integration support", "Account manager & 99.9% uptime SLA"],
              accent: false,
              btnText: "Contact Enterprise Sales"
            }
          ].map((plan, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`border p-8 rounded-3xl flex flex-col justify-between space-y-6 transition-all ${
                plan.accent 
                  ? 'bg-primary text-background border-primary shadow-floating scale-105' 
                  : 'bg-card border-border hover:border-muted hover:shadow-soft text-text'
              }`}
            >
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md ${plan.accent ? 'bg-background/20 text-background' : 'bg-primary/10 text-primary'}`}>
                  {plan.tier}
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-xs font-semibold opacity-80">/month</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="text-xs font-medium flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.accent ? 'bg-background' : 'bg-primary'}`}></span>
                      <span className="opacity-90">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Link 
                to="/login" 
                className={`w-full py-3 rounded-xl text-center text-sm font-bold transition-all block ${
                  plan.accent 
                    ? 'bg-accent text-primary hover:bg-accent-hover shadow-soft' 
                    : 'bg-primary/5 text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {plan.btnText}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Booking Modal */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-text/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-floating relative">
            <button 
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted hover:text-text hover:bg-background rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {!isSubmitted ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSubmitted(true);
                }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-text">Book a Demo</h3>
                  <p className="text-xs text-muted font-medium mt-1">See how HireSense AI can modernize your hiring workflow.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Sarah Jenkins"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none text-sm font-semibold focus:border-primary transition text-text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Work Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@company.com"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none text-sm font-semibold focus:border-primary transition text-text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Company Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none text-sm font-semibold focus:border-primary transition text-text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Preferred Date & Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none text-sm font-semibold focus:border-primary transition text-text"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-hover shadow-soft transition cursor-pointer"
                >
                  Submit Demo Request
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4 animate-fade-in">
                <div className="w-14 h-14 bg-success/10 text-success flex items-center justify-center rounded-full mx-auto">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-text">Demo Requested!</h3>
                  <p className="text-xs text-muted font-semibold max-w-xs mx-auto leading-relaxed">
                    Thank you, <span className="text-text font-bold">{formData.fullName}</span>. We've sent a calendar confirmation invite for your demo at <span className="text-text font-bold">{formData.company}</span>.
                  </p>
                </div>
                <button 
                  onClick={() => setIsDemoModalOpen(false)}
                  className="px-6 py-2.5 bg-primary/5 text-primary text-sm font-bold rounded-xl hover:bg-primary hover:text-white transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
