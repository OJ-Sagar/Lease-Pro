import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../../config/supabase.js';
import { asyncHandler } from '../../middleware/error.js';
import { validate } from '../../middleware/validate.js';
import { pagination } from '../../lib/query.js';

export const paymentsRouter = Router();

const paymentBody = z.object({
  body: z.object({
    lease_id: z.string().uuid(),
    amount: z.number().positive(),
    payment_date: z.string(),
    payment_method: z.enum(['cash', 'bank_transfer', 'card', 'easypaisa', 'jazzcash', 'other']).default('cash'),
    reference_number: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

paymentsRouter.get('/', asyncHandler(async (req, res) => {
  const { from, to, page, pageSize } = pagination(req.query);
  let query = supabase.from('payment_records').select('*', { count: 'exact' }).order('payment_date', { ascending: false }).range(from, to);
  if (req.query.lease_id) query = query.eq('lease_id', req.query.lease_id);
  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ data, meta: { page, pageSize, total: count || 0 } });
}));

paymentsRouter.post('/', validate(paymentBody), asyncHandler(async (req, res) => {
  const { data, error } = await supabase.rpc('record_lease_payment', { payload: req.validated.body, actor_id: req.user?.id || null });
  if (error) throw error;
  res.status(201).json({ data });
}));

paymentsRouter.put('/:id', validate(paymentBody), asyncHandler(async (req, res) => {
  const { data: current, error: currentError } = await supabase.from('payments').select('lease_id').eq('id', req.params.id).single();
  if (currentError) throw currentError;

  const { data: lease, error: leaseError } = await supabase.from('leases').select('customer_id').eq('id', req.validated.body.lease_id).single();
  if (leaseError) throw leaseError;

  const { data, error } = await supabase
    .from('payments')
    .update({ ...req.validated.body, customer_id: lease.customer_id })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) throw error;

  await reconcileLeaseBalance(current.lease_id);
  if (current.lease_id !== req.validated.body.lease_id) await reconcileLeaseBalance(req.validated.body.lease_id);
  res.json({ data });
}));

paymentsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { data: payment, error: paymentError } = await supabase.from('payments').select('lease_id').eq('id', req.params.id).single();
  if (paymentError) throw paymentError;

  const { error } = await supabase.from('payments').delete().eq('id', req.params.id);
  if (error) throw error;

  await reconcileLeaseBalance(payment.lease_id);
  res.status(204).send();
}));

async function reconcileLeaseBalance(leaseId) {
  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .select('id, product_id, total_payable_amount, down_payment')
    .eq('id', leaseId)
    .single();
  if (leaseError) throw leaseError;

  const { data: payments, error: paymentsError } = await supabase.from('payments').select('amount').eq('lease_id', leaseId);
  if (paymentsError) throw paymentsError;

  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remaining = Math.max(Number(lease.total_payable_amount) - Number(lease.down_payment) - paid, 0);
  const status = remaining === 0 ? 'completed' : 'active';

  const { error: updateError } = await supabase.from('leases').update({ remaining_balance: remaining, status }).eq('id', leaseId);
  if (updateError) throw updateError;

  await supabase.from('products').update({ current_status: status === 'completed' ? 'returned' : 'leased' }).eq('id', lease.product_id);
}
