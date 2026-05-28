import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/card';
import { DataTable } from '../components/data-table';
import { StatusBadge } from '../components/ui/status-badge';
import { useApiResource } from '../hooks/use-api-resource';
import { currency } from '../lib/utils';

export function CustomerHistory() {
  const { data, loading, error } = useApiResource('/customers?pageSize=100');

  return (
    <div className="page-grid">
      <Header
        title="Customer History"
        description="Payment behavior, late-payment history, on-time completion, ratings, and next-lease eligibility."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Preferred Customers" value={(data || []).filter((row) => row.leasing_grade === 'Preferred').length} />
        <Summary label="Watchlist Customers" value={(data || []).filter((row) => row.leasing_grade === 'Watchlist').length} />
        <Summary label="Late Payments" value={(data || []).reduce((sum, row) => sum + Number(row.late_payment_count || 0), 0)} />
        <Summary label="On-Time Payments" value={(data || []).reduce((sum, row) => sum + Number(row.on_time_payment_count || 0), 0)} />
      </div>
      <Card>
        <CardHeader title="Customer Performance Ledger" description="Ratings update automatically from leases, payment dates, and overdue status." />
        {loading ? <p className="text-muted-foreground">Loading customer history...</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        <DataTable
          rows={data || []}
          columns={[
            { key: 'full_name', label: 'Customer', render: (row) => <Link className="font-semibold text-white hover:text-primary" to={`/customers/${row.id}`}>{row.full_name}</Link> },
            { key: 'customer_rating', label: 'Rating', render: (row) => <span className="font-bold text-white">{row.customer_rating}/10</span> },
            { key: 'leasing_grade', label: 'Grade', render: (row) => <StatusBadge value={row.leasing_grade} /> },
            { key: 'total_leases', label: 'Total Leases' },
            { key: 'completed_on_time_leases', label: 'Completed On Time' },
            { key: 'on_time_payment_count', label: 'On-Time Pays' },
            { key: 'late_payment_count', label: 'Late Pays' },
            { key: 'overdue_active_leases', label: 'Overdue Leases' },
            { key: 'outstanding_balance', label: 'Outstanding', render: (row) => currency(row.outstanding_balance) }
          ]}
        />
      </Card>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-extrabold text-white">{value}</p>
    </Card>
  );
}

function Header({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
