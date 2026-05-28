import { AlertTriangle, Boxes, CircleDollarSign, Gauge, Users } from 'lucide-react';
import { createElement } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader } from '../components/ui/card';
import { DataTable } from '../components/data-table';
import { StatusBadge } from '../components/ui/status-badge';
import { useApiResource } from '../hooks/use-api-resource';
import { currency, percent } from '../lib/utils';

const colors = ['#2ec4b6', '#ffd166', '#ef476f', '#6ea8fe', '#a78bfa'];

export function Dashboard() {
  const { data, loading, error } = useApiResource('/analytics/dashboard');
  const metrics = data?.metrics || {};

  if (loading) return <p className="text-muted-foreground">Loading dashboard...</p>;
  if (error) return <p className="text-rose-200">{error}</p>;

  return (
    <div className="page-grid">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Executive Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Revenue, portfolio health, inventory utilization, and collection risk.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={CircleDollarSign} label="Total Revenue" value={currency(metrics.total_revenue)} />
        <Metric icon={Gauge} label="Outstanding" value={currency(metrics.outstanding_amount)} />
        <Metric icon={Users} label="Active Leases" value={metrics.active_leases || 0} />
        <Metric icon={AlertTriangle} label="Overdue Customers" value={metrics.overdue_customers || 0} />
        <Metric icon={Boxes} label="Inventory Utilization" value={percent(metrics.inventory_utilization)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Monthly Revenue Trend" description="Payment collection across the last 12 months" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenue}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2ec4b6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#2ec4b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="month_key" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,.12)' }} />
                <Area dataKey="revenue" stroke="#2ec4b6" fill="url(#revenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Payment Status Distribution" description="Contracts by portfolio status" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.paymentDistribution} dataKey="count" nameKey="status" innerRadius={58} outerRadius={92}>
                  {data.paymentDistribution?.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,.12)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader title="Product Category Leasing Trends" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryTrends}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,.12)' }} />
                <Bar dataKey="lease_count" fill="#ffd166" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Overdue Alerts" description="Highest-risk accounts requiring follow-up" />
          <DataTable
            rows={data.overdueAccounts || []}
            columns={[
              { key: 'customer_name', label: 'Customer' },
              { key: 'lease_number', label: 'Lease' },
              { key: 'days_overdue', label: 'Days' },
              { key: 'remaining_balance', label: 'Outstanding', render: (row) => currency(row.remaining_balance) },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-xl font-extrabold text-white">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary">{createElement(icon, { size: 21 })}</div>
      </div>
    </Card>
  );
}
