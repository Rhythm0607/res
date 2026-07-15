import { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, User, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchService, SearchResponse } from '../services/searchService';
import { AnimatePresence, motion } from 'framer-motion';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 0) {
        setIsLoading(true);
        try {
          const data = await searchService.globalSearch(query);
          setResults(data);
          setIsOpen(true);
        } catch (error) {
          console.error("Failed to search", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      // Navigate to a dedicated search page or first result
      // For now, if we press enter, we can just close the dropdown or do something custom.
      // E.g., go to Jobs page with query param
      navigate(`/app/jobs?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const handleResultClick = (item: any, type: string) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'job') {
      navigate(`/app/jobs?id=${item.id}`);
    } else {
      navigate(`/app/candidates?id=${item.id}`);
    }
  };

  const hasResults = results && (results.jobs.length > 0 || results.candidates.length > 0);

  return (
    <div className="relative w-96" ref={wrapperRef}>
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2"
        size={17}
        style={{ color: '#6B7A77' }}
      />
      <input
        type="text"
        placeholder="Search across HireSense..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (query) setIsOpen(true) }}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
        style={{
          backgroundColor: '#EBEDE8',
          border: '1.5px solid #D1D7D0',
          color: '#333F3C',
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = '#004838';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,72,56,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#D1D7D0';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      
      {query && (
        <button 
          onClick={() => { setQuery(''); setIsOpen(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
        >
          <X size={16} />
        </button>
      )}

      <AnimatePresence>
        {isOpen && query.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-96 flex flex-col"
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-6 text-muted">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-sm text-muted">
                No results found for "{query}"
              </div>
            ) : (
              <div className="overflow-y-auto py-2">
                {results?.jobs.length ? (
                  <div className="mb-2">
                    <div className="px-4 py-1.5 text-xs font-bold text-muted uppercase tracking-wider bg-background/50">
                      Jobs
                    </div>
                    {results.jobs.map(job => (
                      <div 
                        key={`job-${job.id}`}
                        onClick={() => handleResultClick(job, 'job')}
                        className="px-4 py-3 hover:bg-background/80 cursor-pointer transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Briefcase size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text truncate">{job.title}</p>
                          <p className="text-xs text-muted truncate">{job.department} • {job.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {results?.candidates.length ? (
                  <div>
                    <div className="px-4 py-1.5 text-xs font-bold text-muted uppercase tracking-wider bg-background/50">
                      Candidates
                    </div>
                    {results.candidates.map(candidate => (
                      <div 
                        key={`cand-${candidate.id}`}
                        onClick={() => handleResultClick(candidate, 'candidate')}
                        className="px-4 py-3 hover:bg-background/80 cursor-pointer transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center flex-shrink-0">
                          <User size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text truncate">{candidate.name}</p>
                          <p className="text-xs text-muted truncate">{candidate.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
            <div className="p-3 bg-background/50 border-t border-border text-center">
              <span className="text-[11px] font-bold text-muted">Press Enter to view all results</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
