import { useMemo, useState } from 'react';
import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DataTable } from '../components/data-table';
import { ResourceToolbar } from '../components/resource-toolbar';
import { StatusBadge } from '../components/ui/status-badge';
import { useApiResource } from '../hooks/use-api-resource';
import { currency } from '../lib/utils';
import { Modal } from '../components/ui/modal';
import { FormError, SelectField, TextField } from '../components/form-field';
import { api } from '../lib/api';

export function Leases() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const path = useMemo(() => `/leases?search=${encodeURIComponent(search)}&status=${status}`, [search, status]);
  const { data, loading, error, reload } = useApiResource(path);
  const { data: customers } = useApiResource('/customers?pageSize=100');
  const { data: products } = useApiResource('/products?pageSize=100&status=available');

  const productOptions = useMemo(() => {
    const options = [...(products || [])];
    if (editing?.product_id && !options.some((product) => product.id === editing.product_id)) {
      options.unshift({
        id: editing.product_id,
        product_name: editing.product_name,
        serial_number: editing.product_serial_number
      });
    }
    return options;
  }, [products, editing]);

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  }

  async function saveLease(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFormError('');
    try {
      await api(editing ? `/leases/${editing.id}` : '/leases', {
        method: editing ? 'PUT' : 'POST',
        body: {
          customer_id: form.get('customer_id'),
          product_id: form.get('product_id'),
          lease_start_date: form.get('lease_start_date'),
          lease_end_date: form.get('lease_end_date'),
          monthly_installment: Number(form.get('monthly_installment')),
          total_payable_amount: Number(form.get('total_payable_amount')),
          down_payment: Number(form.get('down_payment') || 0),
          payment_due_day: Number(form.get('payment_due_day')),
          late_fee_type: form.get('late_fee_type'),
          late_fee_value: Number(form.get('late_fee_value') || 0),
          status: form.get('status') || 'active'
        }
      });
      closeModal();
      event.currentTarget.reset();
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteLease(id) {
    if (!window.confirm('Delete this lease and its payment records?')) return;
    await api(`/leases/${id}`, { method: 'DELETE' });
    await reload();
  }

  return (
    <div className="page-grid">
      <Header title="Lease Contracts" description="Active, completed, overdue, cancelled, and repossessed lease contracts." />
      <Card>
        <CardHeader title="Contracts" action={<Button size="sm" onClick={() => setModalOpen(true)}>Create Lease</Button>} />
        <ResourceToolbar
          search={search}
          onSearch={setSearch}
          filters={[{
            selected: status,
            onChange: setStatus,
            options: [
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'repossessed', label: 'Repossessed' }
            ]
          }]}
        />
        {loading ? <p className="text-muted-foreground">Loading leases...</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        <DataTable
          rows={data || []}
          columns={[
            { key: 'lease_number', label: 'Lease ID', render: (row) => <span className="font-semibold text-white">{row.lease_number}</span> },
            { key: 'customer_name', label: 'Customer' },
            { key: 'product_name', label: 'Product' },
            { key: 'monthly_installment', label: 'Monthly', render: (row) => currency(row.monthly_installment) },
            { key: 'remaining_balance', label: 'Remaining', render: (row) => currency(row.remaining_balance) },
            { key: 'payment_due_day', label: 'Due Day' },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'actions', label: 'Actions', render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditing(row); setModalOpen(true); }}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => deleteLease(row.id)}>Delete</Button>
              </div>
            ) }
          ]}
        />
      </Card>
      <Modal title={editing ? 'Edit Lease' : 'Create Lease'} description="Assign an available product to a customer and define the repayment terms." open={modalOpen} onClose={closeModal}>
        <form key={editing?.id || 'new'} onSubmit={saveLease} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Customer" name="customer_id" required defaultValue={editing?.customer_id || ''}>
              <option value="" disabled>Select customer</option>
              {(customers || []).map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name} · {customer.phone}</option>)}
            </SelectField>
            <SelectField label="Available Product" name="product_id" required defaultValue={editing?.product_id || ''}>
              <option value="" disabled>Select product</option>
              {productOptions.map((product) => <option key={product.id} value={product.id}>{product.product_name} · {product.serial_number}</option>)}
            </SelectField>
            <TextField label="Lease Start Date" name="lease_start_date" type="date" defaultValue={editing?.lease_start_date || ''} required />
            <TextField label="Lease End Date" name="lease_end_date" type="date" defaultValue={editing?.lease_end_date || ''} required />
            <TextField label="Monthly Installment" name="monthly_installment" type="number" min="1" step="1" defaultValue={editing?.monthly_installment || ''} required />
            <TextField label="Total Payable Amount" name="total_payable_amount" type="number" min="1" step="1" defaultValue={editing?.total_payable_amount || ''} required />
            <TextField label="Down Payment" name="down_payment" type="number" min="0" step="1" defaultValue={editing?.down_payment || 0} />
            <TextField label="Payment Due Day" name="payment_due_day" type="number" min="1" max="28" step="1" defaultValue={editing?.payment_due_day || ''} required />
            <SelectField label="Late Fee Type" name="late_fee_type" defaultValue={editing?.late_fee_type || 'fixed'}>
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
            </SelectField>
            <TextField label="Late Fee Value" name="late_fee_value" type="number" min="0" step="1" defaultValue={editing?.late_fee_value || 0} />
            <SelectField label="Status" name="status" defaultValue={editing?.status || 'active'}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
              <option value="repossessed">Repossessed</option>
            </SelectField>
          </div>
          <FormError message={formError} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Lease' : 'Create Lease'}</Button>
          </div>
        </form>
      </Modal>
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
