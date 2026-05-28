import { Phone, MessageCircle } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DataTable } from '../components/data-table';
import { StatusBadge } from '../components/ui/status-badge';
import { useApiResource } from '../hooks/use-api-resource';
import { currency } from '../lib/utils';
import { api } from '../lib/api';

export function Overdue() {
  const { data, loading, error, reload } = useApiResource('/analytics/dashboard');
  const rows = data?.overdueAccounts || [];

  async function updateLeaseStatus(id, status) {
    await api(`/leases/${id}/status`, { method: 'PATCH', body: { status } });
    await reload();
  }

  async function deleteOverdueLease(id) {
    if (!window.confirm('Delete this overdue lease and its payment records?')) return;
    await api(`/leases/${id}`, { method: 'DELETE' });
    await reload();
  }

  return (
    <div className="page-grid">
      <Header title="Overdue Alerts" description="Customers with late installments, outstanding balances, and fast contact actions." />
      <Card>
        <CardHeader title="Overdue Accounts" />
        {loading ? <p className="text-muted-foreground">Loading overdue accounts...</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        <DataTable
          rows={rows}
          columns={[
            { key: 'customer_name', label: 'Customer', render: (row) => <span className="font-semibold text-white">{row.customer_name}</span> },
            { key: 'customer_phone', label: 'Phone' },
            { key: 'lease_number', label: 'Lease' },
            { key: 'days_overdue', label: 'Days Overdue' },
            { key: 'remaining_balance', label: 'Outstanding', render: (row) => currency(row.remaining_balance) },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'actions', label: 'Actions', render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button as="a" size="icon" variant="secondary" aria-label="Call customer" onClick={() => window.location.href = `tel:${row.customer_phone}`}><Phone size={16} /></Button>
                <Button size="icon" variant="secondary" aria-label="Message customer" onClick={() => window.location.href = `sms:${row.customer_phone}`}><MessageCircle size={16} /></Button>
                <Button size="sm" variant="secondary" onClick={() => updateLeaseStatus(row.id, 'repossessed')}>Repossess</Button>
                <Button size="sm" variant="danger" onClick={() => deleteOverdueLease(row.id)}>Delete</Button>
              </div>
            ) }
          ]}
        />
      </Card>
    </div>
  );
}

function Header({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
