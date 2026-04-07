import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export interface SearchInputProps {
  /**
   * Fields to describe which columns are searched. Used only to construct the
   * default placeholder text when no explicit placeholder is provided.
   */
  searchFields?: string[];
  /**
   * Controlled search value. If omitted, the component manages its own value.
   */
  value?: string;
  /**
   * Handler called with the debounced search value.
   */
  onChange?: (value: string) => void;
  /**
   * Optional placeholder. If omitted, a translated default will be used.
   */
  placeholder?: string;
  /**
   * Optional CSS class names.
   */
  className?: string;
}

/**
 * Search input with a debounce to avoid firing requests on every keystroke. It
 * uses the `react-i18next` translation hook to generate default placeholder
 * text, but consumers can override it via the `placeholder` prop. Icons from
 * `lucide-react` are used for the search and clear controls.
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  searchFields = [],
  value = '',
  onChange,
  placeholder,
  className = '',
}) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = React.useState(value || '');
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  // Keep internal state in sync with external value prop
  React.useEffect(() => {
    if (value !== searchValue) {
      setSearchValue(value || '');
    }
  }, [value]);

  // Emit debounced value changes to parent
  React.useEffect(() => {
    onChange?.(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleClear = React.useCallback(() => {
    setSearchValue('');
    onChange?.('');
  }, [onChange]);

  const defaultPlaceholder = searchFields.length
    ? t('home.table.searchPlaceholder', { fields: searchFields.join(', ') })
    : t('home.table.search');

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={placeholder || defaultPlaceholder}
        className="pl-9 pr-9 h-9"
      />
      {searchValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 h-7 w-7 p-0"
          onClick={handleClear}
          aria-label={t('home.table.clearSearch')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};