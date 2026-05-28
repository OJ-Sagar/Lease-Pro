import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ customers: [], products: [], leases: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults({ customers: [], products: [], leases: [] });
        return;
      }
      const response = await api(`/search?q=${encodeURIComponent(query)}`);
      setResults(response);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function go(path) {
    onClose();
    navigate(path);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass mx-auto mt-10 max-w-2xl rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the leasing operation..." />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close search"><X size={18} /></Button>
        </div>
        <div className="mt-4 grid gap-4">
          <SearchGroup title="Customers" items={results.customers} render={(item) => (
            <button className="w-full rounded-md px-3 py-2 text-left hover:bg-white/10" onClick={() => go(`/customers/${item.id}`)}>
              <span className="font-semibold text-white">{item.full_name}</span>
              <span className="ml-2 text-sm text-muted-foreground">{item.phone} · {item.national_id}</span>
            </button>
          )} />
          <SearchGroup title="Products" items={results.products} render={(item) => (
            <button className="w-full rounded-md px-3 py-2 text-left hover:bg-white/10" onClick={() => go('/inventory')}>
              <span className="font-semibold text-white">{item.product_name}</span>
              <span className="ml-2 text-sm text-muted-foreground">{item.serial_number}</span>
            </button>
          )} />
          <SearchGroup title="Leases" items={results.leases} render={(item) => (
            <button className="w-full rounded-md px-3 py-2 text-left hover:bg-white/10" onClick={() => go('/leases')}>
              <span className="font-semibold text-white">{item.lease_number}</span>
              <span className="ml-2 text-sm text-muted-foreground">{item.customer_name}</span>
            </button>
          )} />
        </div>
      </div>
    </div>
  );
}

function SearchGroup({ title, items, render }) {
  return (
    <section>
      <h3 className="mb-1 px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {items.length ? items.map((item) => <div key={item.id}>{render(item)}</div>) : <p className="px-3 py-2 text-sm text-muted-foreground">No matches</p>}
    </section>
  );
}
