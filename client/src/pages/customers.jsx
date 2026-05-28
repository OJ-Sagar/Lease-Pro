import { Link } from 'react-router-dom';
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

export function Customers() {
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const path = useMemo(() => `/customers?search=${encodeURIComponent(search)}&risk_status=${risk}`, [search, risk]);
  const { data, loading, error, reload } = useApiResource(path);

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  }

  async function saveCustomer(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFormError('');
    try {
      await api(editing ? `/customers/${editing.id}` : '/customers', {
        method: editing ? 'PUT' : 'POST',
        body: {
          full_name: form.get('full_name'),
          phone: form.get('phone'),
          national_id: form.get('national_id'),
          address: form.get('address') || null,
          guarantor_name: form.get('guarantor_name') || null,
          guarantor_phone: form.get('guarantor_phone') || null,
          guarantor_national_id: form.get('guarantor_national_id') || null,
          notes: form.get('notes') || null,
          risk_status: form.get('risk_status')
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

  async function deleteCustomer(id) {
    if (!window.confirm('Delete this customer record?')) return;
    await api(`/customers/${id}`, { method: 'DELETE' });
    await reload();
  }

  return (
    <div className="page-grid">
      <Header title="Customer Management" description="Customer records, guarantors, risk status, ledgers, and active contracts." />
      <Card>
        <CardHeader title="Customers" action={<Button size="sm" onClick={() => setModalOpen(true)}>New Customer</Button>} />
        <ResourceToolbar
          search={search}
          onSearch={setSearch}
          filters={[{
            selected: risk,
            onChange: setRisk,
            options: [
              { value: '', label: 'All risk levels' },
              { value: 'low', label: 'Low risk' },
              { value: 'medium', label: 'Medium risk' },
              { value: 'high', label: 'High risk' },
              { value: 'blocked', label: 'Blocked' }
            ]
          }]}
        />
        {loading ? <p className="text-muted-foreground">Loading customers...</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        <DataTable
          rows={data || []}
          columns={[
            { key: 'full_name', label: 'Name', render: (row) => <Link className="font-semibold text-white hover:text-primary" to={`/customers/${row.id}`}>{row.full_name}</Link> },
            { key: 'phone', label: 'Phone' },
            { key: 'national_id', label: 'CNIC / ID' },
            { key: 'risk_status', label: 'Risk', render: (row) => <StatusBadge value={row.risk_status} /> },
            { key: 'customer_rating', label: 'Rating', render: (row) => <span className="font-bold text-white">{row.customer_rating || '7.0'}/10</span> },
            { key: 'leasing_grade', label: 'Grade', render: (row) => <StatusBadge value={row.leasing_grade} /> },
            { key: 'active_leases', label: 'Active Leases' },
            { key: 'outstanding_balance', label: 'Outstanding', render: (row) => currency(row.outstanding_balance) },
            { key: 'actions', label: 'Actions', render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditing(row); setModalOpen(true); }}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => deleteCustomer(row.id)}>Delete</Button>
              </div>
            ) }
          ]}
        />
      </Card>
      <Modal title={editing ? 'Edit Customer' : 'New Customer'} description="Add a customer profile with guarantor and risk details." open={modalOpen} onClose={closeModal}>
        <form key={editing?.id || 'new'} onSubmit={saveCustomer} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Full Name" name="full_name" defaultValue={editing?.full_name || ''} required />
            <TextField label="Phone Number" name="phone" defaultValue={editing?.phone || ''} required />
            <TextField label="CNIC / National ID" name="national_id" defaultValue={editing?.national_id || ''} required />
            <SelectField label="Risk Status" name="risk_status" defaultValue={editing?.risk_status || 'low'}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="blocked">Blocked</option>
            </SelectField>
            <TextField label="Address" name="address" defaultValue={editing?.address || ''} />
            <TextField label="Guarantor Name" name="guarantor_name" defaultValue={editing?.guarantor_name || ''} />
            <TextField label="Guarantor Phone" name="guarantor_phone" defaultValue={editing?.guarantor_phone || ''} />
            <TextField label="Guarantor CNIC / ID" name="guarantor_national_id" defaultValue={editing?.guarantor_national_id || ''} />
            <TextField label="Notes" name="notes" defaultValue={editing?.notes || ''} />
          </div>
          <FormError message={formError} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Customer' : 'Save Customer'}</Button>
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
