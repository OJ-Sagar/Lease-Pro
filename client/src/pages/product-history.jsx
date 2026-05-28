import { Card, CardHeader } from '../components/ui/card';
import { DataTable } from '../components/data-table';
import { StatusBadge } from '../components/ui/status-badge';
import { useApiResource } from '../hooks/use-api-resource';
import { currency, titleize } from '../lib/utils';

export function ProductHistory() {
  const { data, loading, error } = useApiResource('/products?pageSize=100');

  return (
    <div className="page-grid">
      <Header
        title="Product History"
        description="Product leasing demand, collection totals, completed contracts, sales grade, and rating."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="High Demand" value={(data || []).filter((row) => row.sales_grade === 'High Demand').length} />
        <Summary label="Never Leased" value={(data || []).filter((row) => row.sales_grade === 'Unleased').length} />
        <Summary label="Total Product Leases" value={(data || []).reduce((sum, row) => sum + Number(row.total_leases || 0), 0)} />
        <Summary label="Collected" value={currency((data || []).reduce((sum, row) => sum + Number(row.total_collected || 0), 0))} />
      </div>
      <Card>
        <CardHeader title="Product Performance Ledger" description="Ratings update automatically from leasing volume, revenue, and product status." />
        {loading ? <p className="text-muted-foreground">Loading product history...</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        <DataTable
          rows={data || []}
          columns={[
            { key: 'product_name', label: 'Product', render: (row) => <span className="font-semibold text-white">{row.product_name}</span> },
            { key: 'brand', label: 'Brand' },
            { key: 'category', label: 'Category', render: (row) => titleize(row.category) },
            { key: 'serial_number', label: 'Serial' },
            { key: 'product_rating', label: 'Rating', render: (row) => <span className="font-bold text-white">{row.product_rating}/10</span> },
            { key: 'sales_grade', label: 'Sales Grade', render: (row) => <StatusBadge value={row.sales_grade} /> },
            { key: 'total_leases', label: 'Total Leases' },
            { key: 'completed_leases', label: 'Completed' },
            { key: 'total_collected', label: 'Collected', render: (row) => currency(row.total_collected) },
            { key: 'current_status', label: 'Status', render: (row) => <StatusBadge value={row.current_status} /> }
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
