import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface MultiSelectComboboxProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: boolean;
}

export function MultiSelectCombobox({
  options: initialOptions,
  value = [],
  onChange,
  placeholder = 'Select or type to add...',
  error
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [localOptions, setLocalOptions] = useState<string[]>(initialOptions);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const combined = Array.from(new Set([...initialOptions, ...localOptions]));
    setLocalOptions(combined);
  }, [initialOptions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If there's a leftover query when clicking away, auto add it
        if (query.trim()) {
          const newOpt = query.trim();
          if (!value.includes(newOpt)) {
            onChange([...value, newOpt]);
          }
          if (!localOptions.includes(newOpt)) {
            setLocalOptions(prev => [...prev, newOpt]);
          }
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, value, localOptions, onChange]);

  const filteredOptions = localOptions.filter(opt =>
    opt.toLowerCase().includes(query.toLowerCase()) && !value.includes(opt)
  );

  const exactMatch = localOptions.find(opt => opt.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (option: string) => {
    if (!value.includes(option)) {
      onChange([...value, option]);
    }
    setQuery('');
    inputRef.current?.focus();
  };

  const handleAdd = () => {
    const newOpt = query.trim();
    if (newOpt) {
      if (!value.includes(newOpt)) {
        onChange([...value, newOpt]);
      }
      if (!localOptions.includes(newOpt)) {
        setLocalOptions(prev => [...prev, newOpt]);
      }
    }
    setQuery('');
    inputRef.current?.focus();
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== option));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        handleAdd();
      } else if (filteredOptions.length > 0 && isOpen) {
        handleSelect(filteredOptions[0]);
      }
    } else if (e.key === 'Backspace' && !query && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`w-full min-h-[44px] px-3 py-2 bg-background border rounded-xl transition flex flex-wrap gap-2 items-center cursor-text ${
          error 
            ? 'border-danger focus-within:ring-2 focus-within:ring-danger/10' 
            : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
        }`}
        onClick={() => {
          inputRef.current?.focus();
          setIsOpen(true);
        }}
      >
        {value.map((val, idx) => (
          <span 
            key={idx}
            className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-bold"
          >
            {val}
            <button 
              type="button"
              onClick={(e) => handleRemove(val, e)} 
              className="text-primary hover:bg-primary/20 rounded-full p-0.5 transition"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-text min-w-[120px]"
        />
        
        <div className="text-muted pointer-events-none">
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
                    className="px-4 py-2 text-sm text-text hover:bg-background/80 font-medium cursor-pointer transition"
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-muted flex items-center justify-between">
                {query.trim() ? 'Press enter to add' : 'All available options selected.'}
              </div>
            )}
            
            {query.trim() !== '' && !exactMatch && !value.includes(query.trim()) && (
              <div 
                onClick={handleAdd}
                className="px-4 py-2 text-sm text-primary font-bold cursor-pointer bg-primary/5 hover:bg-primary/10 transition border-t border-border flex items-center gap-2"
              >
                <Plus size={14} /> Add "{query.trim()}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
