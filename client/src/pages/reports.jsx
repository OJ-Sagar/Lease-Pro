import { Download } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { exportUrl } from '../lib/api';

const reports = [
  { type: 'revenue', title: 'Revenue Report', description: 'Monthly revenue totals and payment counts.' },
  { type: 'ledgers', title: 'Customer Ledgers', description: 'Outstanding balances, lifetime paid, and lease counts.' },
  { type: 'leases', title: 'Lease Summary', description: 'Contract status, due days, payment totals, and product assignments.' },
  { type: 'overdue', title: 'Overdue Report', description: 'Late accounts ordered by risk and days overdue.' }
];

export function Reports() {
  return (
    <div className="page-grid">
      <Header title="Reports & Exports" description="Owner-only exports for finance, collections, ledgers, and contract analysis." />
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.type}>
            <CardHeader title={report.title} description={report.description} />
            <div className="flex flex-wrap gap-3">
              <a href={exportUrl(`/reports/${report.type}/export.xlsx`)}><Button variant="secondary"><Download size={16} /> Excel</Button></a>
              <a href={exportUrl(`/reports/${report.type}/export.pdf`)}><Button variant="secondary"><Download size={16} /> PDF</Button></a>
            </div>
          </Card>
        ))}
      </div>
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
