import { useParams } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/card';
import { DataTable } from '../components/data-table';
import { StatusBadge } from '../components/ui/status-badge';
import { useApiResource } from '../hooks/use-api-resource';
import { currency } from '../lib/utils';

export function CustomerProfile() {
  const { id } = useParams();
  const { data, loading, error } = useApiResource(`/customers/${id}`);

  if (loading) return <p className="text-muted-foreground">Loading customer profile...</p>;
  if (error) return <p className="text-rose-200">{error}</p>;

  return (
    <div className="page-grid">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{data.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.phone} · {data.national_id}</p>
        </div>
        <StatusBadge value={data.risk_status} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Summary label="Customer Rating" value={`${data.customer_rating || '7.0'}/10`} />
        <Summary label="Leasing Grade" value={data.leasing_grade || 'Standard'} />
        <Summary label="Outstanding" value={currency(data.outstanding_balance)} />
        <Summary label="Lifetime Paid" value={currency(data.lifetime_paid)} />
        <Summary label="On-Time Payments" value={data.on_time_payment_count || 0} />
        <Summary label="Late Payments" value={data.late_payment_count || 0} />
        <Summary label="Active Leases" value={data.active_leases} />
        <Summary label="Completed On Time" value={data.completed_on_time_leases || 0} />
      </div>
      <Card>
        <CardHeader title="Profile Details" />
        <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <p><span className="font-semibold text-white">Address:</span> {data.address || 'Not provided'}</p>
          <p><span className="font-semibold text-white">Guarantor:</span> {data.guarantor_name || 'Not provided'} {data.guarantor_phone ? `· ${data.guarantor_phone}` : ''}</p>
          <p className="md:col-span-2"><span className="font-semibold text-white">Notes:</span> {data.notes || 'No notes'}</p>
        </div>
      </Card>
      <Card>
        <CardHeader title="Lease Contracts" />
        <DataTable
          rows={data.leases || []}
          columns={[
            { key: 'lease_number', label: 'Lease ID' },
            { key: 'product_name', label: 'Product' },
            { key: 'monthly_installment', label: 'Installment', render: (row) => currency(row.monthly_installment) },
            { key: 'remaining_balance', label: 'Remaining', render: (row) => currency(row.remaining_balance) },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }
          ]}
        />
      </Card>
      <Card>
        <CardHeader title="Payment History" />
        <DataTable
          rows={data.payment_history || []}
          columns={[
            { key: 'payment_date', label: 'Date' },
            { key: 'lease_number', label: 'Lease' },
            { key: 'amount', label: 'Amount', render: (row) => currency(row.amount) },
            { key: 'payment_method', label: 'Method' },
            { key: 'reference_number', label: 'Reference' }
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
