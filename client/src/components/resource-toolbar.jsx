import { Search } from 'lucide-react';
import { Input, Select } from './ui/input';

export function ResourceToolbar({ search, onSearch, filters = [] }) {
  return (
    <div className="mb-4 grid gap-3 md:flex md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input className="pl-9" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search records..." />
      </div>
      {filters.map((filter) => (
        <Select key={filter.value} value={filter.selected} onChange={(event) => filter.onChange(event.target.value)} className="md:w-48">
          {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      ))}
    </div>
  );
}
