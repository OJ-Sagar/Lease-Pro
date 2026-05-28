import { useMemo, useState } from 'react';
import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DataTable } from '../components/data-table';
import { ResourceToolbar } from '../components/resource-toolbar';
import { StatusBadge } from '../components/ui/status-badge';
import { useApiResource } from '../hooks/use-api-resource';
import { currency, titleize } from '../lib/utils';
import { Modal } from '../components/ui/modal';
import { FormError, SelectField, TextField } from '../components/form-field';
import { api } from '../lib/api';

export function Inventory() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const path = useMemo(() => `/products?search=${encodeURIComponent(search)}&status=${status}`, [search, status]);
  const { data, loading, error, reload } = useApiResource(path);

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFormError('');
    try {
      await api(editing ? `/products/${editing.id}` : '/products', {
        method: editing ? 'PUT' : 'POST',
        body: {
          product_name: form.get('product_name'),
          brand: form.get('brand'),
          category: form.get('category'),
          serial_number: form.get('serial_number'),
          purchase_cost: Number(form.get('purchase_cost')),
          lease_price: Number(form.get('lease_price')),
          current_status: form.get('current_status'),
          product_condition: form.get('product_condition'),
          warranty_expiry: form.get('warranty_expiry') || null
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

  async function deleteProduct(id) {
    if (!window.confirm('Remove this product from inventory?')) return;
    await api(`/products/${id}`, { method: 'DELETE' });
    await reload();
  }

  return (
    <div className="page-grid">
      <Header title="Product Inventory" description="Track leased products, conditions, serials, costs, and availability." />
      <Card>
        <CardHeader title="Products" action={<Button size="sm" onClick={() => setModalOpen(true)}>Add Product</Button>} />
        <ResourceToolbar
          search={search}
          onSearch={setSearch}
          filters={[{
            selected: status,
            onChange: setStatus,
            options: [
              { value: '', label: 'All statuses' },
              { value: 'available', label: 'Available' },
              { value: 'leased', label: 'Leased' },
              { value: 'returned', label: 'Returned' },
              { value: 'under_repair', label: 'Under Repair' },
              { value: 'damaged', label: 'Damaged' }
            ]
          }]}
        />
        {loading ? <p className="text-muted-foreground">Loading inventory...</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        <DataTable
          rows={data || []}
          columns={[
            { key: 'product_name', label: 'Product', render: (row) => <span className="font-semibold text-white">{row.product_name}</span> },
            { key: 'brand', label: 'Brand' },
            { key: 'category', label: 'Category', render: (row) => titleize(row.category) },
            { key: 'serial_number', label: 'Serial' },
            { key: 'lease_price', label: 'Lease Price', render: (row) => currency(row.lease_price) },
            { key: 'product_rating', label: 'Rating', render: (row) => <span className="font-bold text-white">{row.product_rating || '4.0'}/10</span> },
            { key: 'sales_grade', label: 'Sales Grade', render: (row) => <StatusBadge value={row.sales_grade} /> },
            { key: 'current_status', label: 'Status', render: (row) => <StatusBadge value={row.current_status} /> },
            { key: 'product_condition', label: 'Condition', render: (row) => titleize(row.product_condition) },
            { key: 'actions', label: 'Actions', render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditing(row); setModalOpen(true); }}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => deleteProduct(row.id)}>Delete</Button>
              </div>
            ) }
          ]}
        />
      </Card>
      <Modal title={editing ? 'Edit Product' : 'Add Product'} description="Create an inventory item that can be assigned to a lease." open={modalOpen} onClose={closeModal}>
        <form key={editing?.id || 'new'} onSubmit={saveProduct} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Product Name" name="product_name" defaultValue={editing?.product_name || ''} required />
            <TextField label="Brand" name="brand" defaultValue={editing?.brand || ''} required />
            <SelectField label="Category" name="category" defaultValue={editing?.category || 'smartphone'}>
              <option value="smartphone">Smartphone</option>
              <option value="tv">TV</option>
              <option value="washing_machine">Washing Machine</option>
              <option value="refrigerator">Refrigerator</option>
              <option value="air_conditioner">Air Conditioner</option>
              <option value="other">Other</option>
            </SelectField>
            <TextField label="Serial Number" name="serial_number" defaultValue={editing?.serial_number || ''} required />
            <TextField label="Purchase Cost" name="purchase_cost" type="number" min="0" step="1" defaultValue={editing?.purchase_cost || ''} required />
            <TextField label="Lease Price" name="lease_price" type="number" min="0" step="1" defaultValue={editing?.lease_price || ''} required />
            <SelectField label="Status" name="current_status" defaultValue={editing?.current_status || 'available'}>
              <option value="available">Available</option>
              <option value="leased">Leased</option>
              <option value="returned">Returned</option>
              <option value="under_repair">Under Repair</option>
              <option value="damaged">Damaged</option>
            </SelectField>
            <SelectField label="Condition" name="product_condition" defaultValue={editing?.product_condition || 'good'}>
              <option value="new">New</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </SelectField>
            <TextField label="Warranty Expiry" name="warranty_expiry" type="date" defaultValue={editing?.warranty_expiry || ''} />
          </div>
          <FormError message={formError} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Product' : 'Save Product'}</Button>
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
