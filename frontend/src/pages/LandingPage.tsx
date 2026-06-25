import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, BarChart, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
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
            <Link to="/login" className="px-5 py-2.5 text-text font-semibold text-sm hover:bg-border/50 rounded-xl transition">Log in</Link>
            <Link to="/app" className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-xl shadow-soft hover:bg-primary/90 transition hover:-translate-y-0.5">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-6 border border-primary/20">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>
            HireSense AI 2.0 is Live
          </div>
          <h1 className="text-[64px] font-extrabold leading-[1.05] tracking-tight mb-6 text-text">
            Hire Smarter.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Screen Candidates in Seconds.
            </span>
          </h1>
          <p className="text-lg text-muted mb-10 leading-relaxed max-w-lg font-medium">
            Enterprise-grade ATS scoring, semantic matching, and an AI recruitment assistant. Built for modern HR teams.
          </p>
          <div className="flex gap-4">
            <Link to="/app" className="flex items-center gap-2 px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl shadow-soft hover:shadow-lg hover:-translate-y-1 transition-all">
              Start Screening <ArrowRight size={20} />
            </Link>
            <button className="px-8 py-4 bg-card border border-border text-text text-base font-semibold rounded-xl hover:bg-background transition-all shadow-sm">
              Book Demo
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="relative h-[550px] w-full rounded-[32px] bg-hero-gradient p-8 shadow-glass border border-white/60 flex flex-col gap-4 overflow-hidden"
        >
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="absolute top-8 left-8 right-8">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-soft border border-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success font-bold text-lg border border-success/20">98</div>
                <div>
                  <p className="font-bold text-text">Sarah Jenkins</p>
                  <p className="text-sm text-muted font-medium">Senior React Engineer</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-success/10 text-success rounded-lg text-xs font-bold uppercase tracking-wider">Top Match</div>
            </div>
          </motion.div>

          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute top-36 left-8 right-8">
             <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-soft border border-white w-full">
              <h3 className="font-bold mb-5 flex items-center gap-2 text-sm text-muted uppercase tracking-wider"><BarChart size={16} className="text-primary"/> AI Match Analysis</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-semibold"><span className="text-text">Semantic Similarity</span><span className="text-success">96%</span></div>
                  <div className="w-full bg-background rounded-full h-2.5 overflow-hidden"><div className="bg-success h-full rounded-full w-[96%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5 font-semibold"><span className="text-text">Skill Overlap</span><span className="text-primary">88%</span></div>
                  <div className="w-full bg-background rounded-full h-2.5 overflow-hidden"><div className="bg-primary h-full rounded-full w-[88%]"></div></div>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }} className="absolute bottom-8 left-8 right-8">
             <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-soft border border-white flex gap-3 items-start">
               <div className="mt-1 bg-secondary/10 p-2 rounded-lg text-secondary"><FileText size={20}/></div>
               <div>
                 <p className="text-sm font-semibold text-text mb-1">AI Assistant Summary</p>
                 <p className="text-xs text-muted leading-relaxed font-medium">Candidate has exactly 5 years of React experience and perfectly matches the requirement for Next.js and Tailwind.</p>
               </div>
             </div>
          </motion.div>
        </motion.div>
      </main>
      
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[ { v: "5M+", l: "Resumes Parsed" }, { v: "99%", l: "Extraction Accuracy" }, { v: "80%", l: "Screening Time Saved" }, { v: "2000+", l: "HR Teams Trust Us" } ].map((s,i) => (
            <div key={i} className="text-center">
              <h4 className="text-4xl font-extrabold text-text mb-2 tracking-tight">{s.v}</h4>
              <p className="text-muted font-semibold text-sm uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
