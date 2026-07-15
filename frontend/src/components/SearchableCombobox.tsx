import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SearchableComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

export function SearchableCombobox({
  options: initialOptions,
  value,
  onChange,
  placeholder = 'Select or type to add...',
  error
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [localOptions, setLocalOptions] = useState<string[]>(initialOptions);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync initial options if they change, keeping locally added ones
  useEffect(() => {
    const combined = Array.from(new Set([...initialOptions, ...localOptions]));
    setLocalOptions(combined);
  }, [initialOptions]);

  // Update query when value changes from outside (e.g., reset)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If clicking away and query isn't empty but doesn't exactly match the value,
        // we can optionally set the value to the query. For now, let's keep the query as the value
        if (query && query !== value) {
          onChange(query);
          if (!localOptions.includes(query)) {
            setLocalOptions(prev => [...prev, query]);
          }
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, value, localOptions, onChange]);

  const filteredOptions = localOptions.filter(opt =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  const exactMatch = localOptions.find(opt => opt.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (option: string) => {
    setQuery(option);
    onChange(option);
    setIsOpen(false);
  };

  const handleAdd = () => {
    const newOpt = query.trim();
    if (newOpt && !exactMatch) {
      setLocalOptions(prev => [...prev, newOpt]);
    }
    onChange(newOpt);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value); // Sync to form state immediately
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none text-sm font-semibold transition ${
            error 
              ? 'border-danger focus:ring-2 focus:ring-danger/10' 
              : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-soft max-h-60 overflow-y-auto"
          >
            {filteredOptions.length > 0 ? (
              <ul className="py-1">
                {filteredOptions.map((opt, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    className={`px-4 py-2 text-sm cursor-pointer transition flex items-center justify-between ${
                      value === opt 
                        ? 'bg-primary/10 text-primary font-bold' 
                        : 'text-text hover:bg-background/80 font-medium'
                    }`}
                  >
                    {opt}
                    {value === opt && <Check size={14} />}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-muted">No exact match found.</div>
            )}
            
            {query.trim() !== '' && !exactMatch && (
              <div 
                onClick={handleAdd}
                className="px-4 py-2 text-sm text-primary font-bold cursor-pointer bg-primary/5 hover:bg-primary/10 transition border-t border-border flex items-center gap-2"
              >
                <Plus size={14} /> Add "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
