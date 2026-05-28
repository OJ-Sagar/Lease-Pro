import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../middleware/error.js';
import { validate } from '../../middleware/validate.js';
import { applyTextSearch, pagination } from '../../lib/query.js';

export const customersRouter = Router();

const customerBody = z.object({
  body: z.object({
    full_name: z.string().min(2),
    phone: z.string().min(7),
    national_id: z.string().min(4),
    address: z.string().optional().nullable(),
    guarantor_name: z.string().optional().nullable(),
    guarantor_phone: z.string().optional().nullable(),
    guarantor_national_id: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    risk_status: z.enum(['low', 'medium', 'high', 'blocked']).default('low')
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

customersRouter.get('/', asyncHandler(async (req, res) => {
  const { from, to, page, pageSize } = pagination(req.query);
  let query = supabase
    .from('customer_performance')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  query = applyTextSearch(query, ['full_name', 'phone', 'national_id'], req.query.search);
  if (req.query.risk_status) query = query.eq('risk_status', req.query.risk_status);

  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ data, meta: { page, pageSize, total: count || 0 } });
}));

customersRouter.post('/', validate(customerBody), asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('customers').insert(req.validated.body).select().single();
  if (error) throw error;
  res.status(201).json({ data });
}));

customersRouter.get('/:id', asyncHandler(async (req, res) => {
  const { data: customer, error } = await supabase
    .from('customer_performance')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) throw new HttpError(404, 'Customer not found');

  const [leases, payments] = await Promise.all([
    supabase.from('lease_contracts_overview').select('*').eq('customer_id', req.params.id).order('created_at', { ascending: false }),
    supabase.from('payment_records').select('*').eq('customer_id', req.params.id).order('payment_date', { ascending: false })
  ]);

  if (leases.error) throw leases.error;
  if (payments.error) throw payments.error;

  const data = {
    ...customer,
    leases: leases.data,
    payment_history: payments.data
  };
  res.json({ data });
}));

customersRouter.put('/:id', validate(customerBody), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .update(req.validated.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) throw error;
  res.json({ data });
}));

customersRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);
  if (error) throw error;
  res.status(204).send();
}));
