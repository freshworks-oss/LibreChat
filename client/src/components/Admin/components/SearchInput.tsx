import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@librechat/client';

type SearchInputProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
};

export default function SearchInput({
  onSearch,
  placeholder = 'Search…',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => onSearch(query), debounceMs);
    },
    [onSearch, debounceMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setValue(query);
    debouncedSearch(query);
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}
