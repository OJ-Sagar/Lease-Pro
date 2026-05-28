import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../middleware/error.js';
import { validate } from '../../middleware/validate.js';
import { applyTextSearch, pagination } from '../../lib/query.js';

export const leasesRouter = Router();

const leaseBody = z.object({
  body: z.object({
    customer_id: z.string().uuid(),
    product_id: z.string().uuid(),
    lease_start_date: z.string(),
    lease_end_date: z.string(),
    monthly_installment: z.number().positive(),
    total_payable_amount: z.number().positive(),
    down_payment: z.number().nonnegative().default(0),
    payment_due_day: z.number().int().min(1).max(28),
    late_fee_type: z.enum(['fixed', 'percentage']).default('fixed'),
    late_fee_value: z.number().nonnegative().default(0),
    status: z.enum(['active', 'completed', 'overdue', 'cancelled', 'repossessed']).default('active')
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

leasesRouter.get('/', asyncHandler(async (req, res) => {
  const { from, to, page, pageSize } = pagination(req.query);
  let query = supabase.from('lease_contracts_overview').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
  query = applyTextSearch(query, ['lease_number', 'customer_name', 'customer_phone', 'product_serial_number'], req.query.search);
  if (req.query.status) query = query.eq('status', req.query.status);
  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ data, meta: { page, pageSize, total: count || 0 } });
}));

leasesRouter.post('/', validate(leaseBody), asyncHandler(async (req, res) => {
  const remaining_balance = req.validated.body.total_payable_amount - req.validated.body.down_payment;
  const payload = { ...req.validated.body, remaining_balance };

  const { data, error } = await supabase.rpc('create_lease_contract', { payload });
  if (error) throw error;
  res.status(201).json({ data });
}));

leasesRouter.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('lease_contracts_overview').select('*').eq('id', req.params.id).single();
  if (error) throw new HttpError(404, 'Lease not found');
  res.json({ data });
}));

leasesRouter.put('/:id', validate(leaseBody), asyncHandler(async (req, res) => {
  const { data: current, error: currentError } = await supabase.from('leases').select('*').eq('id', req.params.id).single();
  if (currentError) throw new HttpError(404, 'Lease not found');

  const { data: payments, error: paymentsError } = await supabase.from('payments').select('amount').eq('lease_id', req.params.id);
  if (paymentsError) throw paymentsError;
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remainingBalance = Math.max(req.validated.body.total_payable_amount - req.validated.body.down_payment - paid, 0);
  const next = {
    ...req.validated.body,
    remaining_balance: remainingBalance,
    status: remainingBalance === 0 ? 'completed' : req.validated.body.status
  };

  if (current.product_id !== next.product_id) {
    const { data: product, error: productError } = await supabase.from('products').select('current_status').eq('id', next.product_id).single();
    if (productError) throw productError;
    if (!['available', 'returned'].includes(product.current_status)) throw new HttpError(409, 'New product is not available for leasing');
  }

  const { data, error } = await supabase.from('leases').update(next).eq('id', req.params.id).select().single();
  if (error) throw error;

  if (current.product_id !== next.product_id) {
    await supabase.from('products').update({ current_status: 'available' }).eq('id', current.product_id);
    await supabase.from('products').update({ current_status: 'leased' }).eq('id', next.product_id);
  }

  res.json({ data });
}));

leasesRouter.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'completed', 'overdue', 'cancelled', 'repossessed'].includes(status)) throw new HttpError(422, 'Invalid lease status');
  const { data, error } = await supabase.from('leases').update({ status }).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json({ data });
}));

leasesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { data: lease, error: leaseError } = await supabase.from('leases').select('product_id').eq('id', req.params.id).single();
  if (leaseError) throw new HttpError(404, 'Lease not found');

  const { error } = await supabase.from('leases').delete().eq('id', req.params.id);
  if (error) throw error;

  await supabase.from('products').update({ current_status: 'available' }).eq('id', lease.product_id);
  res.status(204).send();
}));
