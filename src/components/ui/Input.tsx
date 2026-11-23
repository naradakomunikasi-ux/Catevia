import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

interface FieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  id,
  label,
  required,
  hint,
  error,
  children,
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[13px] font-medium text-[#0D1B2A]">
      {label}
      {required && (
        <span className="text-[#B42318] ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="text-[12px] text-[#B42318] leading-snug">
        {error}
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="text-[12px] text-[#5B687A] leading-snug">
        {hint}
      </p>
    ) : null}
  </div>
);

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  hint,
  error,
  required,
  id,
  className = '',
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id || autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldWrapper id={fieldId} label={label} required={required} hint={hint} error={error}>
      <input
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full min-h-[40px] px-3 py-2 text-[14px] bg-white text-[#0D1B2A] placeholder:text-[#7D8A9C] rounded-[8px] border transition-colors ${
          error
            ? 'border-[#B42318] focus:border-[#B42318]'
            : 'border-[#CBD4E1] hover:border-[#94A3B8] focus:border-[#082340]'
        } ${className}`}
        {...rest}
      />
    </FieldWrapper>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  hint,
  error,
  required,
  id,
  className = '',
  rows = 3,
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id || autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldWrapper id={fieldId} label={label} required={required} hint={hint} error={error}>
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full px-3 py-2 text-[14px] bg-white text-[#0D1B2A] placeholder:text-[#7D8A9C] rounded-[8px] border transition-colors ${
          error
            ? 'border-[#B42318] focus:border-[#B42318]'
            : 'border-[#CBD4E1] hover:border-[#94A3B8] focus:border-[#082340]'
        } ${className}`}
        {...rest}
      />
    </FieldWrapper>
  );
};

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  hint,
  error,
  required,
  id,
  className = '',
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id || autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <FieldWrapper id={fieldId} label={label} required={required} hint={hint} error={error}>
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full min-h-[40px] pl-3 pr-9 py-2 text-[14px] bg-white text-[#0D1B2A] rounded-[8px] border appearance-none transition-colors cursor-pointer ${
            error
              ? 'border-[#B42318]'
              : 'border-[#CBD4E1] hover:border-[#94A3B8] focus:border-[#082340]'
          } ${className}`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="w-4 h-4 text-[#5B687A] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>
    </FieldWrapper>
  );
};

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  searchPlaceholder = 'Cari pilihan...',
  required,
  hint,
  error,
}) => {
  const fieldId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  }, [options, query]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <FieldWrapper id={fieldId} label={label} required={required} hint={hint} error={error}>
      <div className="relative" ref={containerRef}>
        <button
          id={fieldId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full min-h-[40px] px-3 py-2 text-left text-[14px] bg-white rounded-[8px] border flex items-center justify-between gap-2 transition-colors cursor-pointer ${
            error
              ? 'border-[#B42318]'
              : open
                ? 'border-[#082340]'
                : 'border-[#CBD4E1] hover:border-[#94A3B8]'
          }`}
        >
          <span className={selectedOption ? 'text-[#0D1B2A] truncate' : 'text-[#7D8A9C] truncate'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#5B687A] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div className="absolute z-40 mt-1.5 w-full bg-white border border-[#CBD4E1] rounded-[10px] shadow-[0_10px_24px_rgba(8,35,64,0.12)] overflow-hidden">
            <div className="p-2 border-b border-[#E2E7EF]">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-[#69778A] absolute left-2.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full min-h-[34px] pl-8 pr-3 py-1 text-[13px] bg-[#F8F9FB] text-[#0D1B2A] rounded-[6px] border border-[#E2E7EF] focus:border-[#082340] focus:bg-white"
                />
              </div>
            </div>
            <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2.5 text-[13px] text-[#69778A]">
                  Pilihan tidak ditemukan.
                </li>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <li key={opt.value} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setOpen(false);
                          setQuery('');
                        }}
                        className={`w-full px-3 py-2 text-left text-[13px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#EDF2F7] text-[#082340] font-medium'
                            : 'text-[#0D1B2A] hover:bg-[#F8F9FB]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate">{opt.label}</div>
                          {opt.sublabel && (
                            <div className="text-[12px] text-[#5B687A] truncate">{opt.sublabel}</div>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#082340] shrink-0" />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};
