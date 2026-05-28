import { useState } from 'react';
import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DataTable } from '../components/data-table';
import { StatusBadge } from '../components/ui/status-badge';
import { useApiResource } from '../hooks/use-api-resource';
import { currency } from '../lib/utils';
import { Modal } from '../components/ui/modal';
import { FormError, SelectField, TextField } from '../components/form-field';
import { api } from '../lib/api';

export function Payments() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useApiResource('/payments');
  const { data: leases } = useApiResource('/leases?pageSize=100&status=active');

  const leaseOptions = leases || [];

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  }

  async function savePayment(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFormError('');
    try {
      await api(editing ? `/payments/${editing.id}` : '/payments', {
        method: editing ? 'PUT' : 'POST',
        body: {
          lease_id: form.get('lease_id'),
          amount: Number(form.get('amount')),
          payment_date: form.get('payment_date'),
          payment_method: form.get('payment_method'),
          reference_number: form.get('reference_number') || null,
          notes: form.get('notes') || null
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

  async function deletePayment(id) {
    if (!window.confirm('Delete this payment record and recalculate the lease balance?')) return;
    await api(`/payments/${id}`, { method: 'DELETE' });
    await reload();
  }

  return (
    <div className="page-grid">
      <Header title="Payment Management" description="Installments, partial payments, missed payments, and payment references." />
      <div className="grid gap-4 md:grid-cols-4">
        <Summary label="Payment Capture" value="Real-time" />
        <Summary label="Partial Payments" value="Supported" />
        <Summary label="Auto Balances" value="Enabled" />
        <Summary label="Audit Trail" value="Recorded" />
      </div>
      <Card>
        <CardHeader title="Payment Records" action={<Button size="sm" onClick={() => setModalOpen(true)}>Record Payment</Button>} />
        {loading ? <p className="text-muted-foreground">Loading payments...</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        <DataTable
          rows={data || []}
          columns={[
            { key: 'payment_date', label: 'Date' },
            { key: 'lease_number', label: 'Lease' },
            { key: 'customer_name', label: 'Customer' },
            { key: 'amount', label: 'Amount', render: (row) => currency(row.amount) },
            { key: 'payment_method', label: 'Method', render: (row) => <StatusBadge value={row.payment_method} /> },
            { key: 'reference_number', label: 'Reference' },
            { key: 'actions', label: 'Actions', render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditing(row); setModalOpen(true); }}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => deletePayment(row.id)}>Delete</Button>
              </div>
            ) }
          ]}
        />
      </Card>
      <Modal title={editing ? 'Edit Payment' : 'Record Payment'} description="Capture a full or partial installment against an active lease." open={modalOpen} onClose={closeModal}>
        <form key={editing?.id || 'new'} onSubmit={savePayment} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Active Lease" name="lease_id" required defaultValue={editing?.lease_id || ''}>
              <option value="" disabled>Select lease</option>
              {leaseOptions.map((lease) => (
                <option key={lease.id} value={lease.id}>
                  {lease.lease_number} · {lease.customer_name} · remaining {currency(lease.remaining_balance)}
                </option>
              ))}
              {editing?.lease_id && !leaseOptions.some((lease) => lease.id === editing.lease_id) ? (
                <option value={editing.lease_id}>{editing.lease_number} · {editing.customer_name}</option>
              ) : null}
            </SelectField>
            <TextField label="Amount" name="amount" type="number" min="1" step="1" defaultValue={editing?.amount || ''} required />
            <TextField label="Payment Date" name="payment_date" type="date" defaultValue={editing?.payment_date || ''} required />
            <SelectField label="Payment Method" name="payment_method" defaultValue={editing?.payment_method || 'cash'}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
              <option value="other">Other</option>
            </SelectField>
            <TextField label="Reference Number" name="reference_number" defaultValue={editing?.reference_number || ''} />
            <TextField label="Notes" name="notes" defaultValue={editing?.notes || ''} />
          </div>
          <FormError message={formError} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Payment' : 'Record Payment'}</Button>
          </div>
        </form>
      </Modal>
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
      <h1 className="text-2xl font-extrabold text-white">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
